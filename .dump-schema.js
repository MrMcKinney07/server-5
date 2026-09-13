const { Client } = require("/tmp/pgtool/node_modules/pg")
const fs = require("fs")

const conn = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
if (!conn) {
  console.error("No POSTGRES_URL_NON_POOLING / POSTGRES_URL in env")
  process.exit(1)
}

function ident(name) {
  return /^[a-z_][a-z0-9_]*$/.test(name) ? name : '"' + name.replace(/"/g, '""') + '"'
}

;(async () => {
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
  await client.connect()

  const { rows: tables } = await client.query(
    `select table_name from information_schema.tables
     where table_schema='public' and table_type='BASE TABLE'
     order by table_name`
  )

  const out = []
  out.push("-- ============================================================")
  out.push("-- Authoritative schema for the public schema.")
  out.push("-- Generated from the live database via scripts/dump-schema.js.")
  out.push("-- Do not hand-edit column definitions here to 'fix' the app;")
  out.push("-- change the database, then regenerate this file.")
  out.push("-- ============================================================")
  out.push("")

  // Extensions the schema relies on (gen_random_uuid, uuid_generate_v4, etc.)
  const { rows: exts } = await client.query(
    `select extname from pg_extension
     where extname in ('pgcrypto','uuid-ossp') order by extname`
  )
  if (exts.length) {
    out.push("-- Extensions")
    for (const e of exts) out.push(`create extension if not exists ${ident(e.extname)};`)
    out.push("")
  }

  for (const { table_name } of tables) {
    const { rows: cols } = await client.query(
      `select column_name, data_type, udt_name, character_maximum_length,
              numeric_precision, numeric_scale, is_nullable, column_default
       from information_schema.columns
       where table_schema='public' and table_name=$1
       order by ordinal_position`,
      [table_name]
    )

    const colLines = cols.map((c) => {
      let type
      if (c.data_type === "ARRAY") type = c.udt_name.replace(/^_/, "") + "[]"
      else if (c.data_type === "USER-DEFINED") type = c.udt_name
      else if (c.data_type === "character varying" && c.character_maximum_length)
        type = `varchar(${c.character_maximum_length})`
      else if (c.data_type === "numeric" && c.numeric_precision)
        type = `numeric(${c.numeric_precision},${c.numeric_scale || 0})`
      else if (c.data_type === "timestamp with time zone") type = "timestamptz"
      else if (c.data_type === "timestamp without time zone") type = "timestamp"
      else type = c.data_type
      let line = `  ${ident(c.column_name)} ${type}`
      if (c.is_nullable === "NO") line += " not null"
      if (c.column_default) line += ` default ${c.column_default}`
      return line
    })

    out.push(`create table if not exists public.${ident(table_name)} (`)
    out.push(colLines.join(",\n"))
    out.push(");")
    out.push("")
  }

  const { rows: cons } = await client.query(
    `select conrelid::regclass::text as tbl, conname,
            pg_get_constraintdef(oid) as def, contype
     from pg_constraint
     where connamespace = 'public'::regnamespace
     order by conrelid::regclass::text,
              case contype when 'p' then 0 when 'u' then 1 when 'c' then 2 when 'f' then 3 else 4 end,
              conname`
  )
  out.push("-- Constraints (primary keys, unique, check, foreign keys)")
  for (const c of cons) out.push(`alter table ${c.tbl} add constraint ${ident(c.conname)} ${c.def};`)
  out.push("")

  const { rows: idx } = await client.query(
    `select indexdef from pg_indexes
     where schemaname='public'
       and indexname not in (select conname from pg_constraint where connamespace='public'::regnamespace)
     order by tablename, indexname`
  )
  out.push("-- Indexes")
  for (const i of idx) out.push(i.indexdef + ";")
  out.push("")

  const { rows: rls } = await client.query(
    `select c.relname as tbl from pg_class c join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and c.relkind='r' and c.relrowsecurity order by c.relname`
  )
  out.push("-- Row Level Security")
  for (const r of rls) out.push(`alter table public.${ident(r.tbl)} enable row level security;`)
  out.push("")

  const { rows: pols } = await client.query(
    `select tablename, policyname, cmd, permissive, roles, qual, with_check
     from pg_policies where schemaname='public' order by tablename, policyname`
  )
  out.push("-- Policies")
  for (const p of pols) {
    const cmd = p.cmd && p.cmd !== "ALL" ? ` for ${p.cmd.toLowerCase()}` : " for all"
    const perm = p.permissive === "PERMISSIVE" ? "" : " as restrictive"
    const roles = Array.isArray(p.roles) ? p.roles.join(", ") : p.roles
    let line = `create policy ${ident(p.policyname)} on public.${ident(p.tablename)}${perm}${cmd}`
    if (roles) line += ` to ${roles}`
    if (p.qual) line += ` using (${p.qual})`
    if (p.with_check) line += ` with check (${p.with_check})`
    out.push(line + ";")
  }
  out.push("")

  const { rows: fns } = await client.query(
    `select pg_get_functiondef(p.oid) as def
     from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.prokind='f'
       and p.proname in ('increment_agent_exp','is_admin_or_broker','update_executed_contracts_updated_at')
     order by p.proname`
  )
  out.push("-- Functions")
  for (const f of fns) out.push(f.def + ";")
  out.push("")

  const { rows: trgs } = await client.query(
    `select pg_get_triggerdef(t.oid) as def
     from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and not t.tgisinternal
     order by c.relname, t.tgname`
  )
  out.push("-- Triggers")
  for (const t of trgs) out.push(t.def + ";")
  out.push("")

  fs.writeFileSync("/vercel/share/v0-project/.schema-dump-output.sql", out.join("\n"))
  console.log("Tables:", tables.length, "Constraints:", cons.length, "Indexes:", idx.length, "Policies:", pols.length, "Functions:", fns.length, "Triggers:", trgs.length)
  console.log("Bytes:", fs.statSync("/vercel/share/v0-project/.schema-dump-output.sql").size)
  await client.end()
})().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
