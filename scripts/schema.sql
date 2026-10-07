-- ============================================================
-- Authoritative schema for the public schema.
-- Generated from the live database via scripts/dump-schema.js.
-- Do not hand-edit column definitions here to 'fix' the app;
-- change the database, then regenerate this file.
-- ============================================================

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

create table if not exists public.activities (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null,
  contact_id uuid,
  lead_id uuid,
  activity_type text not null,
  subject text,
  description text,
  completed boolean default false,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.agent_commission_plans (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null,
  plan_id uuid not null,
  effective_date date default CURRENT_DATE,
  cap_progress numeric(12,2) default 0,
  ytd_gci numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table if not exists public.agent_missions (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null,
  template_id uuid not null,
  mission_date date not null default CURRENT_DATE,
  status text default 'pending'::text,
  photo_url text,
  notes text,
  completed_at timestamptz,
  points_earned integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.agent_notifications (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null,
  type text not null default 'appointment'::text,
  title text not null,
  message text not null,
  link text,
  read boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid not null default gen_random_uuid(),
  created_at timestamptz default now(),
  "Name" text,
  "Email" text,
  "Phone" text,
  "Role" text,
  contract_date date,
  exp integer default 0,
  lifetime_xp_bank integer default 0,
  exp_season integer default 0,
  exp_bank integer default 0,
  season_id text default to_char(now(), 'YYYY-MM'::text),
  last_season_reset timestamptz default now(),
  prestige_tier integer default 1,
  prestige_icon_url text,
  lifetime_xp integer default 0,
  profile_picture_url text,
  is_active boolean default true,
  last_sign_in_at timestamptz,
  disabled_at timestamptz,
  disabled_by uuid,
  notes text,
  license_number text,
  license_expiry date,
  start_date date,
  team_id uuid,
  address text,
  city text,
  state text,
  zip text,
  emergency_contact_name text,
  emergency_contact_phone text,
  bio text,
  commission_plan_id uuid,
  login_streak integer default 0,
  last_login_date date,
  longest_streak integer default 0,
  marketing_threshold numeric(10,2) default 0,
  transaction_fee numeric(10,2) default 0,
  commission_split numeric(5,2) default 0.70,
  must_change_password boolean not null default false,
  appointment_link text
);

create table if not exists public.campaign_enrollments (
  id uuid not null default gen_random_uuid(),
  contact_id uuid not null,
  campaign_id uuid not null,
  status text not null default 'active'::text,
  current_step integer default 0,
  next_run_at timestamptz,
  is_paused boolean default false,
  created_at timestamptz default now(),
  step_attempts integer not null default 0
);

create table if not exists public.campaign_logs (
  id uuid not null default gen_random_uuid(),
  lead_id uuid,
  campaign_id uuid,
  step_id uuid,
  event text not null,
  info jsonb,
  created_at timestamptz default now()
);

create table if not exists public.campaign_runs (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid,
  run_name text not null,
  scheduled_for timestamptz,
  queued_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  status text default 'SCHEDULED'::text,
  total_recipients integer default 0,
  skipped integer default 0,
  sent integer default 0,
  delivered integer default 0,
  failed integer default 0,
  replies integer default 0,
  opt_outs integer default 0,
  clicks integer default 0,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.campaign_steps (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid not null,
  step_number integer not null,
  type text not null,
  subject text,
  body text,
  delay_hours integer not null default 24,
  criteria jsonb,
  ai_personalize boolean default false,
  created_at timestamptz default now(),
  schedule_type text default 'delay'::text,
  schedule_day_of_week integer,
  schedule_day_of_month integer,
  schedule_time time without time zone default '10:00:00'::time without time zone,
  email_html text,
  attachments jsonb default '[]'::jsonb,
  links jsonb default '[]'::jsonb
);

create table if not exists public.campaign_template_steps (
  id uuid not null default gen_random_uuid(),
  template_id uuid not null,
  step_number integer not null,
  type text not null default 'EMAIL'::text,
  subject text,
  body text not null,
  delay_hours integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.campaign_templates (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'general'::text,
  channel text not null default 'EMAIL'::text,
  type text not null default 'SEQUENCE'::text,
  tags text[] default '{}'::text[],
  is_active boolean default true,
  step_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.campaigns (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  type text default 'BROADCAST'::text,
  channel text default 'EMAIL'::text,
  audience_filter jsonb default '{}'::jsonb,
  send_time_local time without time zone default '10:30:00'::time without time zone,
  quiet_hours_start time without time zone default '09:00:00'::time without time zone,
  quiet_hours_end time without time zone default '19:00:00'::time without time zone,
  throttle_per_minute integer default 30,
  stop_on_reply boolean default true,
  dedupe_window_days integer default 365,
  send_days text[] default ARRAY['monday'::text, 'tuesday'::text, 'wednesday'::text, 'thursday'::text, 'friday'::text],
  send_time_end time without time zone default '18:00:00'::time without time zone,
  timezone text default 'America/Chicago'::text
);

create table if not exists public.commission_plans (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text,
  split_percentage numeric(5,4) default 0.70,
  cap_amount numeric(12,2) default 25000,
  monthly_fee numeric(8,2) default 0,
  transaction_fee numeric(8,2) default 495,
  is_default boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.contacts (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  contact_type text default 'buyer'::text,
  source text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  do_not_contact boolean default false,
  unsubscribed_at timestamptz,
  sms_opted_out boolean default false,
  email_opted_out boolean default false,
  timezone text default 'America/Chicago'::text
);

create table if not exists public.contract_deal_specific_docs (
  id uuid not null default gen_random_uuid(),
  contract_id uuid not null,
  document_name text not null,
  file_url text,
  file_name text,
  status text not null default 'not_uploaded'::text,
  uploaded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_documents (
  id uuid not null default gen_random_uuid(),
  contract_id uuid not null,
  document_key text not null,
  document_name text not null,
  category text not null,
  status text not null default 'not_uploaded'::text,
  file_url text,
  file_name text,
  uploaded_at timestamptz,
  is_required boolean not null default true,
  is_conditional boolean not null default false,
  condition_field text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contract_notifications (
  id uuid not null default gen_random_uuid(),
  recipient_id uuid not null,
  contract_id uuid not null,
  document_key text not null,
  document_name text not null,
  agent_name text not null,
  property_address text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_mission_items (
  id uuid not null default gen_random_uuid(),
  daily_set_id uuid not null,
  mission_template_id uuid not null,
  status text not null default 'assigned'::text,
  completed_at timestamptz,
  notes text,
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists public.daily_mission_sets (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  mission_date date not null,
  created_at timestamptz default now()
);

create table if not exists public.drip_campaigns (
  id uuid not null default gen_random_uuid(),
  name varchar(255) not null,
  description text,
  trigger_type varchar(50) default 'manual'::character varying,
  is_active boolean default true,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.drip_enrollments (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid not null,
  lead_id uuid not null,
  agent_id uuid,
  status varchar(20) default 'active'::character varying,
  current_step integer default 0,
  next_run_at timestamptz,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.drip_logs (
  id uuid not null default gen_random_uuid(),
  enrollment_id uuid not null,
  step_id uuid not null,
  status varchar(20) default 'sent'::character varying,
  error_message text,
  sent_at timestamptz default now()
);

create table if not exists public.drip_steps (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid not null,
  step_order integer not null,
  step_type varchar(20) not null,
  delay_days integer default 0,
  delay_hours integer default 0,
  subject varchar(255),
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.executed_contracts (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null,
  transaction_type text not null,
  property_address text not null,
  client_name text not null,
  contract_date date not null default CURRENT_DATE,
  expected_closing_date date,
  status text not null default 'active'::text,
  risk_status text not null default 'green'::text,
  has_hoa boolean not null default false,
  has_cdd boolean not null default false,
  notes text,
  progress_percent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payment_status text,
  sale_price numeric,
  commission_type text,
  commission_value numeric,
  is_referral boolean not null default false,
  referral_agent_name text,
  referral_fee numeric
);

create table if not exists public.knowledge_articles (
  id uuid not null default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null default 'general'::text,
  created_by uuid,
  related_mission_template_id uuid,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  file_url text,
  file_name text,
  file_type text,
  marketing_fund_threshold numeric
);

create table if not exists public.lead_campaign_enrollments (
  id uuid not null default gen_random_uuid(),
  lead_id uuid not null,
  campaign_id uuid not null,
  current_step integer default 0,
  status text default 'active'::text,
  next_run_at timestamptz,
  created_at timestamptz default now(),
  step_attempts integer not null default 0
);

create table if not exists public.lead_property_views (
  id uuid not null default gen_random_uuid(),
  lead_id uuid not null,
  property_id text not null,
  metadata jsonb,
  viewed_at timestamptz default now()
);

create table if not exists public.leads (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null,
  contact_id uuid,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  source text default 'manual'::text,
  status text default 'new'::text,
  lead_type text default 'buyer'::text,
  notes text,
  property_interest text,
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  timeline text,
  next_follow_up timestamptz,
  last_contacted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  failed_claim_attempts integer default 0,
  tags text[] not null default '{}'::text[]
);

create table if not exists public.listing_matches (
  id uuid not null default gen_random_uuid(),
  contact_id uuid,
  listing_id text not null,
  matched_at timestamptz default now(),
  match_score integer default 0,
  match_reasons jsonb default '{}'::jsonb,
  sent_in_run_id uuid
);

create table if not exists public.marketing_files (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null,
  pathname text not null,
  filename text not null,
  template_name text not null,
  category text not null default 'general'::text,
  content_type text,
  size bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.message_events (
  id uuid not null default gen_random_uuid(),
  message_job_id uuid,
  event_type text not null,
  event_at timestamptz default now(),
  payload jsonb default '{}'::jsonb
);

create table if not exists public.message_jobs (
  id uuid not null default gen_random_uuid(),
  run_id uuid,
  campaign_id uuid,
  step_id uuid,
  contact_id uuid,
  lead_id uuid,
  channel text not null,
  planned_send_at timestamptz,
  queued_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  status text default 'PENDING'::text,
  skip_reason text,
  failure_reason text,
  provider_code text,
  provider_message_id text,
  final_message_text text,
  final_email_subject text,
  final_email_body text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.message_packs (
  id uuid not null default gen_random_uuid(),
  name text not null,
  category text default 'general'::text,
  channel text not null,
  subject text,
  body text not null,
  is_active boolean default true,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.message_templates (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null,
  name text not null,
  type text not null,
  category text not null default ''::text,
  subject text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mission_templates (
  id uuid not null default gen_random_uuid(),
  title text not null,
  description text,
  points integer default 10,
  category text default 'general'::text,
  requires_photo boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  xp_reward integer default 5,
  active_days int4[] default '{1,2,3,4,5,6}'::integer[],
  min_days_active integer not null default 0
);

create table if not exists public.monthly_agent_stats (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null,
  month_year text not null,
  missions_completed integer default 0,
  total_xp_earned integer default 0,
  rank integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mortgage_rates (
  id bigint not null,
  rate_date date not null,
  label text not null,
  rate numeric(6,3) not null,
  rate_str text not null,
  change numeric(6,3) not null default 0,
  change_str text not null default '0.00%'::text,
  direction text not null default 'flat'::text,
  low52 numeric(6,3) not null default 0,
  high52 numeric(6,3) not null default 0,
  source text not null default 'MND'::text,
  fetched_at timestamptz not null default now()
);

create table if not exists public.office_settings (
  id uuid not null default gen_random_uuid(),
  key text not null,
  value jsonb not null default 'true'::jsonb,
  updated_at timestamptz default now(),
  updated_by uuid
);

create table if not exists public.preference_profiles (
  id uuid not null default gen_random_uuid(),
  contact_id uuid,
  lead_id uuid,
  intent_type text default 'BUY'::text,
  target_areas text[] default '{}'::text[],
  price_min numeric,
  price_max numeric,
  beds_min integer,
  baths_min numeric,
  sqft_min integer,
  property_types text[] default '{}'::text[],
  must_haves text[] default '{}'::text[],
  nice_to_haves text[] default '{}'::text[],
  dealbreakers text[] default '{}'::text[],
  timeframe text,
  financing text,
  notes_summary text,
  confidence_score integer default 0,
  last_updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.print_orders (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null,
  template_id uuid not null,
  customization jsonb not null default '{}'::jsonb,
  quantity integer not null default 0,
  total_price numeric(10,2) not null default 0,
  fourover_order_id text,
  status text default 'pending'::text,
  shipping_address jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.print_templates (
  id uuid not null default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  preview_url text not null,
  template_file_url text not null,
  price numeric(10,2) not null default 0,
  quantity_options jsonb not null default '[]'::jsonb,
  fourover_product_uuid text,
  fourover_runsize_uuid text,
  fourover_turnaround_uuid text,
  fourover_colorspec_uuid text,
  customizable_layers jsonb not null default '[]'::jsonb,
  is_active boolean default true,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.prize_redemptions (
  id uuid not null default gen_random_uuid(),
  prize_id uuid not null,
  agent_id uuid not null,
  redeemed_at timestamptz default now(),
  status text default 'pending'::text,
  notes text
);

create table if not exists public.properties (
  id uuid not null default gen_random_uuid(),
  agent_id uuid,
  mls_id text,
  address text not null,
  city text not null,
  state text default 'TX'::text,
  zip text,
  price numeric(12,2),
  beds integer,
  baths numeric(3,1),
  sqft integer,
  lot_size numeric(10,2),
  year_built integer,
  property_type text default 'single_family'::text,
  status text default 'active'::text,
  description text,
  photos text[],
  features text[],
  listed_date date default CURRENT_DATE,
  sold_date date,
  sold_price numeric(12,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.property_view_sessions (
  id uuid not null default gen_random_uuid(),
  property_view_id uuid not null,
  lead_id uuid not null,
  saved_property_id uuid not null,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds integer,
  user_agent text,
  created_at timestamptz default now()
);

create table if not exists public.property_views (
  id uuid not null default gen_random_uuid(),
  lead_id uuid not null,
  saved_property_id uuid not null,
  view_count integer default 0,
  last_viewed_at timestamptz,
  created_at timestamptz default now(),
  total_duration_seconds integer default 0,
  average_duration_seconds integer,
  last_session_duration_seconds integer
);

create table if not exists public.recommended_videos (
  id uuid not null default gen_random_uuid(),
  title text not null,
  youtube_url text not null,
  description text,
  category text default 'general'::text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  created_by uuid
);

create table if not exists public.rewards_prizes (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text,
  xp_cost integer not null,
  image_url text,
  category text default 'general'::text,
  quantity_available integer,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saved_properties (
  id uuid not null default gen_random_uuid(),
  lead_id uuid not null,
  listing_id text,
  mls_number text,
  address text not null,
  city text,
  state text,
  zip text,
  price numeric,
  beds integer,
  baths numeric,
  photo_url text,
  idx_url text not null,
  date_added timestamptz default now(),
  agent_id uuid not null
);

create table if not exists public.saved_searches (
  id uuid not null default gen_random_uuid(),
  agent_id uuid,
  contact_id uuid,
  name text not null,
  query jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.store_orders (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  item_id uuid,
  item_name text not null,
  cost integer not null,
  created_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb
);

create table if not exists public.transactions (
  id uuid not null default gen_random_uuid(),
  agent_id uuid not null,
  contact_id uuid,
  lead_id uuid,
  property_address text not null,
  transaction_type text default 'buy'::text,
  status text default 'pending'::text,
  sale_price numeric(12,2),
  commission_rate numeric(5,4) default 0.03,
  gross_commission numeric(12,2),
  agent_split numeric(5,4),
  agent_commission numeric(12,2),
  broker_commission numeric(12,2),
  closing_date date,
  contract_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.xp_events (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  amount integer not null,
  reason text not null,
  type text not null,
  created_at timestamptz default now(),
  season_id text
);

create table if not exists public.xp_ledger (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  amount integer not null,
  kind text not null,
  ref_id uuid,
  note text,
  created_at timestamptz default now(),
  season_id text,
  source text
);

create table if not exists public.xp_transactions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  source text not null,
  source_id uuid not null,
  season_delta integer default 0,
  bank_delta integer default 0,
  lifetime_delta integer default 0,
  created_at timestamptz default now()
);

-- Constraints (primary keys, unique, check, foreign keys)
alter table activities add constraint activities_pkey PRIMARY KEY (id);
alter table activities add constraint activities_activity_type_check CHECK ((activity_type = ANY (ARRAY['call'::text, 'email'::text, 'text'::text, 'meeting'::text, 'showing'::text, 'note'::text, 'task'::text, 'follow_up'::text])));
alter table activities add constraint activities_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table activities add constraint activities_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table activities add constraint activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table activities add constraint fk_activities_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table activities add constraint fk_activities_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
alter table activities add constraint fk_activities_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table agent_commission_plans add constraint agent_commission_plans_pkey PRIMARY KEY (id);
alter table agent_commission_plans add constraint agent_commission_plans_agent_id_key UNIQUE (agent_id);
alter table agent_commission_plans add constraint agent_commission_plans_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table agent_commission_plans add constraint agent_commission_plans_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES commission_plans(id) ON DELETE CASCADE;
alter table agent_commission_plans add constraint fk_agent_commission_plans_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table agent_commission_plans add constraint fk_agent_commission_plans_plan FOREIGN KEY (plan_id) REFERENCES commission_plans(id) ON DELETE CASCADE;
alter table agent_missions add constraint agent_missions_pkey PRIMARY KEY (id);
alter table agent_missions add constraint agent_missions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'skipped'::text])));
alter table agent_missions add constraint agent_missions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table agent_missions add constraint agent_missions_template_id_fkey FOREIGN KEY (template_id) REFERENCES mission_templates(id) ON DELETE CASCADE;
alter table agent_missions add constraint fk_agent_missions_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table agent_missions add constraint fk_agent_missions_template FOREIGN KEY (template_id) REFERENCES mission_templates(id) ON DELETE SET NULL;
alter table agent_notifications add constraint agent_notifications_pkey PRIMARY KEY (id);
alter table agent_notifications add constraint agent_notifications_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table agents add constraint agents_pkey PRIMARY KEY (id);
alter table agents add constraint agents_exp_bank_check CHECK ((exp_bank >= 0));
alter table agents add constraint agents_exp_season_check CHECK ((exp_season >= 0));
alter table agents add constraint agents_lifetime_xp_bank_check CHECK ((lifetime_xp_bank >= 0));
alter table agents add constraint agents_lifetime_xp_check CHECK ((lifetime_xp >= 0));
alter table agents add constraint agents_prestige_tier_check CHECK (((prestige_tier >= 1) AND (prestige_tier <= 5)));
alter table agents add constraint agents_commission_plan_id_fkey FOREIGN KEY (commission_plan_id) REFERENCES commission_plans(id);
alter table agents add constraint agents_disabled_by_fkey FOREIGN KEY (disabled_by) REFERENCES agents(id);
alter table campaign_enrollments add constraint campaign_enrollments_pkey PRIMARY KEY (id);
alter table campaign_enrollments add constraint campaign_enrollments_contact_id_campaign_id_key UNIQUE (contact_id, campaign_id);
alter table campaign_enrollments add constraint campaign_enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'failed'::text])));
alter table campaign_enrollments add constraint campaign_enrollments_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
alter table campaign_enrollments add constraint campaign_enrollments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table campaign_logs add constraint campaign_logs_pkey PRIMARY KEY (id);
alter table campaign_logs add constraint campaign_logs_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
alter table campaign_logs add constraint campaign_logs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
alter table campaign_logs add constraint campaign_logs_step_id_fkey FOREIGN KEY (step_id) REFERENCES campaign_steps(id) ON DELETE SET NULL;
alter table campaign_logs add constraint fk_campaign_logs_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
alter table campaign_logs add constraint fk_campaign_logs_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table campaign_logs add constraint fk_campaign_logs_step FOREIGN KEY (step_id) REFERENCES campaign_steps(id) ON DELETE SET NULL;
alter table campaign_runs add constraint campaign_runs_pkey PRIMARY KEY (id);
alter table campaign_runs add constraint campaign_runs_status_check CHECK ((status = ANY (ARRAY['SCHEDULED'::text, 'QUEUED'::text, 'SENDING'::text, 'COMPLETE'::text, 'PARTIAL'::text, 'PAUSED'::text, 'CANCELED'::text])));
alter table campaign_runs add constraint campaign_runs_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
alter table campaign_runs add constraint campaign_runs_created_by_fkey FOREIGN KEY (created_by) REFERENCES agents(id) ON DELETE SET NULL;
alter table campaign_steps add constraint campaign_steps_pkey PRIMARY KEY (id);
alter table campaign_steps add constraint campaign_steps_schedule_day_of_month_check CHECK (((schedule_day_of_month >= 1) AND (schedule_day_of_month <= 31)));
alter table campaign_steps add constraint campaign_steps_schedule_day_of_week_check CHECK (((schedule_day_of_week >= 0) AND (schedule_day_of_week <= 6)));
alter table campaign_steps add constraint campaign_steps_schedule_type_check CHECK ((schedule_type = ANY (ARRAY['delay'::text, 'weekly'::text, 'monthly'::text])));
alter table campaign_steps add constraint campaign_steps_type_check CHECK ((type = ANY (ARRAY['email'::text, 'sms'::text, 'property_recommendation'::text])));
alter table campaign_steps add constraint campaign_steps_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
alter table campaign_steps add constraint fk_campaign_steps_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
alter table campaign_template_steps add constraint campaign_template_steps_pkey PRIMARY KEY (id);
alter table campaign_template_steps add constraint campaign_template_steps_template_id_fkey FOREIGN KEY (template_id) REFERENCES campaign_templates(id) ON DELETE CASCADE;
alter table campaign_templates add constraint campaign_templates_pkey PRIMARY KEY (id);
alter table campaigns add constraint campaigns_pkey PRIMARY KEY (id);
alter table campaigns add constraint campaigns_channel_check CHECK ((channel = ANY (ARRAY['SMS'::text, 'EMAIL'::text, 'BOTH'::text])));
alter table campaigns add constraint campaigns_type_check CHECK ((type = ANY (ARRAY['BROADCAST'::text, 'SEQUENCE'::text, 'HOLIDAY_AUTO'::text, 'LIFECYCLE_AUTO'::text, 'LISTING_MATCH_AUTO'::text])));
alter table campaigns add constraint campaigns_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table campaigns add constraint fk_campaigns_owner FOREIGN KEY (owner_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table commission_plans add constraint commission_plans_pkey PRIMARY KEY (id);
alter table contacts add constraint contacts_pkey PRIMARY KEY (id);
alter table contacts add constraint contacts_contact_type_check CHECK ((contact_type = ANY (ARRAY['buyer'::text, 'seller'::text, 'both'::text, 'investor'::text, 'referral'::text, 'other'::text])));
alter table contacts add constraint contacts_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table contacts add constraint fk_contacts_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table contract_deal_specific_docs add constraint contract_deal_specific_docs_pkey PRIMARY KEY (id);
alter table contract_deal_specific_docs add constraint contract_deal_specific_docs_status_check CHECK ((status = ANY (ARRAY['not_uploaded'::text, 'uploaded'::text, 'approved'::text])));
alter table contract_deal_specific_docs add constraint contract_deal_specific_docs_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES executed_contracts(id) ON DELETE CASCADE;
alter table contract_documents add constraint contract_documents_pkey PRIMARY KEY (id);
alter table contract_documents add constraint contract_documents_contract_id_document_key_key UNIQUE (contract_id, document_key);
alter table contract_documents add constraint contract_documents_status_check CHECK ((status = ANY (ARRAY['not_uploaded'::text, 'uploaded'::text, 'approved'::text])));
alter table contract_documents add constraint contract_documents_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES executed_contracts(id) ON DELETE CASCADE;
alter table contract_notifications add constraint contract_notifications_pkey PRIMARY KEY (id);
alter table contract_notifications add constraint contract_notifications_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES executed_contracts(id) ON DELETE CASCADE;
alter table contract_notifications add constraint contract_notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table daily_mission_items add constraint daily_mission_items_pkey PRIMARY KEY (id);
alter table daily_mission_items add constraint daily_mission_items_daily_set_id_mission_template_id_key UNIQUE (daily_set_id, mission_template_id);
alter table daily_mission_items add constraint daily_mission_items_status_check CHECK ((status = ANY (ARRAY['assigned'::text, 'completed'::text])));
alter table daily_mission_items add constraint daily_mission_items_daily_set_id_fkey FOREIGN KEY (daily_set_id) REFERENCES daily_mission_sets(id) ON DELETE CASCADE;
alter table daily_mission_items add constraint daily_mission_items_mission_template_id_fkey FOREIGN KEY (mission_template_id) REFERENCES mission_templates(id) ON DELETE CASCADE;
alter table daily_mission_sets add constraint daily_mission_sets_pkey PRIMARY KEY (id);
alter table daily_mission_sets add constraint daily_mission_sets_user_id_mission_date_key UNIQUE (user_id, mission_date);
alter table daily_mission_sets add constraint daily_mission_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table drip_campaigns add constraint drip_campaigns_pkey PRIMARY KEY (id);
alter table drip_campaigns add constraint drip_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES agents(id);
alter table drip_enrollments add constraint drip_enrollments_pkey PRIMARY KEY (id);
alter table drip_enrollments add constraint drip_enrollments_campaign_id_lead_id_key UNIQUE (campaign_id, lead_id);
alter table drip_enrollments add constraint drip_enrollments_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
alter table drip_enrollments add constraint drip_enrollments_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES drip_campaigns(id) ON DELETE CASCADE;
alter table drip_enrollments add constraint drip_enrollments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table drip_logs add constraint drip_logs_pkey PRIMARY KEY (id);
alter table drip_logs add constraint drip_logs_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES drip_enrollments(id) ON DELETE CASCADE;
alter table drip_logs add constraint drip_logs_step_id_fkey FOREIGN KEY (step_id) REFERENCES drip_steps(id) ON DELETE CASCADE;
alter table drip_steps add constraint drip_steps_pkey PRIMARY KEY (id);
alter table drip_steps add constraint drip_steps_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES drip_campaigns(id) ON DELETE CASCADE;
alter table executed_contracts add constraint executed_contracts_pkey PRIMARY KEY (id);
alter table executed_contracts add constraint executed_contracts_commission_type_check CHECK ((commission_type = ANY (ARRAY['percent'::text, 'dollar'::text])));
alter table executed_contracts add constraint executed_contracts_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'sent'::text])));
alter table executed_contracts add constraint executed_contracts_risk_status_check CHECK ((risk_status = ANY (ARRAY['green'::text, 'yellow'::text, 'red'::text])));
alter table executed_contracts add constraint executed_contracts_status_check CHECK ((status = ANY (ARRAY['active'::text, 'closed'::text, 'cancelled'::text])));
alter table executed_contracts add constraint executed_contracts_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['buyer'::text, 'listing'::text, 'referral'::text])));
alter table executed_contracts add constraint executed_contracts_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table knowledge_articles add constraint knowledge_articles_pkey PRIMARY KEY (id);
alter table knowledge_articles add constraint fk_knowledge_articles_created_by FOREIGN KEY (created_by) REFERENCES agents(id) ON DELETE SET NULL;
alter table knowledge_articles add constraint fk_knowledge_articles_mission_template FOREIGN KEY (related_mission_template_id) REFERENCES mission_templates(id) ON DELETE SET NULL;
alter table knowledge_articles add constraint knowledge_articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES agents(id) ON DELETE SET NULL;
alter table knowledge_articles add constraint knowledge_articles_related_mission_template_id_fkey FOREIGN KEY (related_mission_template_id) REFERENCES mission_templates(id) ON DELETE SET NULL;
alter table lead_campaign_enrollments add constraint lead_campaign_enrollments_pkey PRIMARY KEY (id);
alter table lead_campaign_enrollments add constraint lead_campaign_enrollments_lead_id_campaign_id_key UNIQUE (lead_id, campaign_id);
alter table lead_campaign_enrollments add constraint lead_campaign_enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text])));
alter table lead_campaign_enrollments add constraint lead_campaign_enrollments_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
alter table lead_campaign_enrollments add constraint lead_campaign_enrollments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table lead_property_views add constraint lead_property_views_pkey PRIMARY KEY (id);
alter table lead_property_views add constraint fk_lead_property_views_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table lead_property_views add constraint lead_property_views_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table leads add constraint leads_pkey PRIMARY KEY (id);
alter table leads add constraint leads_lead_type_check CHECK ((lead_type = ANY (ARRAY['buyer'::text, 'seller'::text, 'both'::text, 'investor'::text, 'renter'::text])));
alter table leads add constraint leads_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'nurturing'::text, 'active'::text, 'under_contract'::text, 'closed_won'::text, 'closed_lost'::text])));
alter table leads add constraint fk_leads_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;
alter table leads add constraint fk_leads_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
alter table leads add constraint leads_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table listing_matches add constraint listing_matches_pkey PRIMARY KEY (id);
alter table listing_matches add constraint listing_matches_contact_id_listing_id_key UNIQUE (contact_id, listing_id);
alter table listing_matches add constraint listing_matches_match_score_check CHECK (((match_score >= 0) AND (match_score <= 100)));
alter table listing_matches add constraint listing_matches_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table listing_matches add constraint listing_matches_sent_in_run_id_fkey FOREIGN KEY (sent_in_run_id) REFERENCES campaign_runs(id) ON DELETE SET NULL;
alter table marketing_files add constraint marketing_files_pkey PRIMARY KEY (id);
alter table marketing_files add constraint marketing_files_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table message_events add constraint message_events_pkey PRIMARY KEY (id);
alter table message_events add constraint message_events_event_type_check CHECK ((event_type = ANY (ARRAY['CREATED'::text, 'QUEUED'::text, 'SENT'::text, 'DELIVERED'::text, 'FAILED'::text, 'REPLIED'::text, 'OPTED_OUT'::text, 'CLICKED'::text])));
alter table message_events add constraint message_events_message_job_id_fkey FOREIGN KEY (message_job_id) REFERENCES message_jobs(id) ON DELETE CASCADE;
alter table message_jobs add constraint message_jobs_pkey PRIMARY KEY (id);
alter table message_jobs add constraint message_jobs_channel_check CHECK ((channel = ANY (ARRAY['SMS'::text, 'EMAIL'::text])));
alter table message_jobs add constraint message_jobs_skip_reason_check CHECK ((skip_reason = ANY (ARRAY['DNC'::text, 'unsubscribed'::text, 'invalid'::text, 'missing_channel'::text, 'quiet_hours'::text, 'dedupe'::text, 'manual_exclude'::text])));
alter table message_jobs add constraint message_jobs_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'SKIPPED'::text, 'SENT'::text, 'DELIVERED'::text, 'FAILED'::text, 'CANCELED'::text])));
alter table message_jobs add constraint message_jobs_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
alter table message_jobs add constraint message_jobs_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table message_jobs add constraint message_jobs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
alter table message_jobs add constraint message_jobs_run_id_fkey FOREIGN KEY (run_id) REFERENCES campaign_runs(id) ON DELETE CASCADE;
alter table message_jobs add constraint message_jobs_step_id_fkey FOREIGN KEY (step_id) REFERENCES campaign_steps(id) ON DELETE SET NULL;
alter table message_packs add constraint message_packs_pkey PRIMARY KEY (id);
alter table message_packs add constraint message_packs_channel_check CHECK ((channel = ANY (ARRAY['SMS'::text, 'EMAIL'::text, 'BOTH'::text])));
alter table message_packs add constraint message_packs_created_by_fkey FOREIGN KEY (created_by) REFERENCES agents(id) ON DELETE SET NULL;
alter table message_templates add constraint message_templates_pkey PRIMARY KEY (id);
alter table message_templates add constraint message_templates_type_check CHECK ((type = ANY (ARRAY['email'::text, 'sms'::text])));
alter table message_templates add constraint message_templates_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table mission_templates add constraint mission_templates_pkey PRIMARY KEY (id);
alter table mission_templates add constraint mission_templates_category_check CHECK ((category = ANY (ARRAY['prospecting'::text, 'follow_up'::text, 'learning'::text, 'marketing'::text, 'general'::text])));
alter table monthly_agent_stats add constraint monthly_agent_stats_pkey PRIMARY KEY (id);
alter table monthly_agent_stats add constraint monthly_agent_stats_agent_id_month_year_key UNIQUE (agent_id, month_year);
alter table monthly_agent_stats add constraint monthly_agent_stats_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table mortgage_rates add constraint mortgage_rates_pkey PRIMARY KEY (id);
alter table mortgage_rates add constraint mortgage_rates_rate_date_label_key UNIQUE (rate_date, label);
alter table mortgage_rates add constraint mortgage_rates_direction_check CHECK ((direction = ANY (ARRAY['up'::text, 'down'::text, 'flat'::text])));
alter table office_settings add constraint office_settings_pkey PRIMARY KEY (id);
alter table office_settings add constraint office_settings_key_key UNIQUE (key);
alter table office_settings add constraint office_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES agents(id);
alter table preference_profiles add constraint preference_profiles_pkey PRIMARY KEY (id);
alter table preference_profiles add constraint preference_profiles_confidence_score_check CHECK (((confidence_score >= 0) AND (confidence_score <= 100)));
alter table preference_profiles add constraint preference_profiles_intent_type_check CHECK ((intent_type = ANY (ARRAY['BUY'::text, 'SELL'::text, 'INVEST'::text, 'RENT'::text])));
alter table preference_profiles add constraint preference_profiles_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table preference_profiles add constraint preference_profiles_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
alter table print_orders add constraint print_orders_pkey PRIMARY KEY (id);
alter table print_orders add constraint print_orders_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
alter table print_orders add constraint print_orders_template_id_fkey FOREIGN KEY (template_id) REFERENCES print_templates(id);
alter table print_templates add constraint print_templates_pkey PRIMARY KEY (id);
alter table print_templates add constraint print_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES agents(id);
alter table prize_redemptions add constraint prize_redemptions_pkey PRIMARY KEY (id);
alter table prize_redemptions add constraint fk_prize_redemptions_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table prize_redemptions add constraint fk_prize_redemptions_prize FOREIGN KEY (prize_id) REFERENCES rewards_prizes(id) ON DELETE CASCADE;
alter table prize_redemptions add constraint prize_redemptions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table prize_redemptions add constraint prize_redemptions_prize_id_fkey FOREIGN KEY (prize_id) REFERENCES rewards_prizes(id) ON DELETE CASCADE;
alter table properties add constraint properties_pkey PRIMARY KEY (id);
alter table properties add constraint properties_status_check CHECK ((status = ANY (ARRAY['active'::text, 'pending'::text, 'sold'::text, 'expired'::text, 'withdrawn'::text])));
alter table properties add constraint fk_properties_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;
alter table properties add constraint properties_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;
alter table property_view_sessions add constraint property_view_sessions_pkey PRIMARY KEY (id);
alter table property_view_sessions add constraint fk_property_view_sessions_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table property_view_sessions add constraint fk_property_view_sessions_property_view FOREIGN KEY (property_view_id) REFERENCES property_views(id) ON DELETE CASCADE;
alter table property_view_sessions add constraint fk_property_view_sessions_saved_property FOREIGN KEY (saved_property_id) REFERENCES saved_properties(id) ON DELETE CASCADE;
alter table property_view_sessions add constraint property_view_sessions_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table property_view_sessions add constraint property_view_sessions_property_view_id_fkey FOREIGN KEY (property_view_id) REFERENCES property_views(id) ON DELETE CASCADE;
alter table property_view_sessions add constraint property_view_sessions_saved_property_id_fkey FOREIGN KEY (saved_property_id) REFERENCES saved_properties(id) ON DELETE CASCADE;
alter table property_views add constraint property_views_pkey PRIMARY KEY (id);
alter table property_views add constraint property_views_lead_id_saved_property_id_key UNIQUE (lead_id, saved_property_id);
alter table property_views add constraint fk_property_views_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table property_views add constraint fk_property_views_saved_property FOREIGN KEY (saved_property_id) REFERENCES saved_properties(id) ON DELETE CASCADE;
alter table property_views add constraint property_views_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table property_views add constraint property_views_saved_property_id_fkey FOREIGN KEY (saved_property_id) REFERENCES saved_properties(id) ON DELETE CASCADE;
alter table recommended_videos add constraint recommended_videos_pkey PRIMARY KEY (id);
alter table recommended_videos add constraint recommended_videos_created_by_fkey FOREIGN KEY (created_by) REFERENCES agents(id) ON DELETE SET NULL;
alter table rewards_prizes add constraint rewards_prizes_pkey PRIMARY KEY (id);
alter table saved_properties add constraint saved_properties_pkey PRIMARY KEY (id);
alter table saved_properties add constraint fk_saved_properties_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table saved_properties add constraint fk_saved_properties_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table saved_properties add constraint saved_properties_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table saved_properties add constraint saved_properties_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table saved_searches add constraint saved_searches_pkey PRIMARY KEY (id);
alter table saved_searches add constraint saved_searches_owner_check CHECK ((((agent_id IS NOT NULL) AND (contact_id IS NULL)) OR ((agent_id IS NULL) AND (contact_id IS NOT NULL))));
alter table saved_searches add constraint fk_saved_searches_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table saved_searches add constraint fk_saved_searches_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table saved_searches add constraint saved_searches_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table saved_searches add constraint saved_searches_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table store_orders add constraint store_orders_pkey PRIMARY KEY (id);
alter table store_orders add constraint store_orders_cost_check CHECK ((cost > 0));
alter table store_orders add constraint store_orders_item_id_fkey FOREIGN KEY (item_id) REFERENCES rewards_prizes(id) ON DELETE SET NULL;
alter table store_orders add constraint store_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table transactions add constraint transactions_pkey PRIMARY KEY (id);
alter table transactions add constraint transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'under_contract'::text, 'closed'::text, 'cancelled'::text, 'fell_through'::text])));
alter table transactions add constraint transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['buy'::text, 'sell'::text, 'dual'::text, 'lease'::text])));
alter table transactions add constraint fk_transactions_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;
alter table transactions add constraint fk_transactions_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
alter table transactions add constraint fk_transactions_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
alter table transactions add constraint transactions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table transactions add constraint transactions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
alter table transactions add constraint transactions_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
alter table xp_events add constraint xp_events_pkey PRIMARY KEY (id);
alter table xp_events add constraint xp_events_amount_check CHECK ((amount > 0));
alter table xp_events add constraint xp_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table xp_ledger add constraint xp_ledger_pkey PRIMARY KEY (id);
alter table xp_ledger add constraint xp_ledger_kind_check CHECK ((kind = ANY (ARRAY['EARN'::text, 'REDEEM'::text, 'ADJUST'::text])));
alter table xp_ledger add constraint xp_ledger_user_id_fkey FOREIGN KEY (user_id) REFERENCES agents(id) ON DELETE CASCADE;
alter table xp_transactions add constraint xp_transactions_pkey PRIMARY KEY (id);
alter table xp_transactions add constraint xp_transactions_user_id_source_source_id_key UNIQUE (user_id, source, source_id);
alter table xp_transactions add constraint xp_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES agents(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_activities_agent_id ON public.activities USING btree (agent_id);
CREATE INDEX idx_activities_contact_id ON public.activities USING btree (contact_id);
CREATE INDEX idx_activities_lead_id ON public.activities USING btree (lead_id);
CREATE INDEX idx_agent_commission_plans_agent_id ON public.agent_commission_plans USING btree (agent_id);
CREATE INDEX idx_agent_commission_plans_plan_id ON public.agent_commission_plans USING btree (plan_id);
CREATE INDEX idx_agent_missions_agent_date ON public.agent_missions USING btree (agent_id, mission_date);
CREATE INDEX idx_agent_missions_agent_id ON public.agent_missions USING btree (agent_id);
CREATE INDEX idx_agent_missions_template_id ON public.agent_missions USING btree (template_id);
CREATE INDEX agent_notifications_agent_id_idx ON public.agent_notifications USING btree (agent_id, created_at DESC);
CREATE INDEX idx_agents_commission_plan ON public.agents USING btree (commission_plan_id);
CREATE INDEX idx_agents_is_active ON public.agents USING btree (is_active);
CREATE INDEX idx_agents_last_sign_in ON public.agents USING btree (last_sign_in_at DESC);
CREATE INDEX idx_agents_team_id ON public.agents USING btree (team_id);
CREATE INDEX idx_campaign_enrollments_campaign ON public.campaign_enrollments USING btree (campaign_id);
CREATE INDEX idx_campaign_enrollments_contact ON public.campaign_enrollments USING btree (contact_id);
CREATE INDEX idx_campaign_enrollments_next_run ON public.campaign_enrollments USING btree (next_run_at) WHERE (status = 'active'::text);
CREATE INDEX idx_campaign_logs_campaign ON public.campaign_logs USING btree (campaign_id);
CREATE INDEX idx_campaign_logs_campaign_id ON public.campaign_logs USING btree (campaign_id);
CREATE INDEX idx_campaign_logs_lead_id ON public.campaign_logs USING btree (lead_id);
CREATE INDEX idx_campaign_runs_campaign_id ON public.campaign_runs USING btree (campaign_id);
CREATE INDEX idx_campaign_runs_status ON public.campaign_runs USING btree (status);
CREATE INDEX idx_campaign_steps_campaign ON public.campaign_steps USING btree (campaign_id);
CREATE INDEX idx_campaign_steps_campaign_id ON public.campaign_steps USING btree (campaign_id);
CREATE INDEX idx_campaigns_owner_id ON public.campaigns USING btree (owner_id);
CREATE INDEX idx_contacts_agent_id ON public.contacts USING btree (agent_id);
CREATE INDEX idx_contract_notifications_recipient ON public.contract_notifications USING btree (recipient_id, read, created_at DESC);
CREATE INDEX idx_daily_mission_items_set ON public.daily_mission_items USING btree (daily_set_id);
CREATE INDEX idx_daily_mission_items_status ON public.daily_mission_items USING btree (daily_set_id, status);
CREATE INDEX idx_daily_mission_sets_user_date ON public.daily_mission_sets USING btree (user_id, mission_date DESC);
CREATE INDEX idx_drip_enrollments_campaign ON public.drip_enrollments USING btree (campaign_id);
CREATE INDEX idx_drip_enrollments_lead ON public.drip_enrollments USING btree (lead_id);
CREATE INDEX idx_drip_enrollments_next_run ON public.drip_enrollments USING btree (next_run_at) WHERE ((status)::text = 'active'::text);
CREATE INDEX idx_drip_logs_enrollment ON public.drip_logs USING btree (enrollment_id);
CREATE INDEX idx_drip_steps_campaign ON public.drip_steps USING btree (campaign_id);
CREATE INDEX idx_enrollments_campaign ON public.lead_campaign_enrollments USING btree (campaign_id);
CREATE INDEX idx_enrollments_lead ON public.lead_campaign_enrollments USING btree (lead_id);
CREATE INDEX idx_enrollments_next_run ON public.lead_campaign_enrollments USING btree (next_run_at) WHERE (status = 'active'::text);
CREATE INDEX idx_lead_campaign_enrollments_campaign_id ON public.lead_campaign_enrollments USING btree (campaign_id);
CREATE INDEX idx_lead_campaign_enrollments_lead_id ON public.lead_campaign_enrollments USING btree (lead_id);
CREATE INDEX idx_lead_property_views_lead_id ON public.lead_property_views USING btree (lead_id);
CREATE INDEX idx_property_views_lead ON public.lead_property_views USING btree (lead_id);
CREATE INDEX idx_leads_agent_id ON public.leads USING btree (agent_id);
CREATE INDEX idx_leads_contact_id ON public.leads USING btree (contact_id);
CREATE INDEX idx_leads_failed_claim_attempts ON public.leads USING btree (failed_claim_attempts);
CREATE INDEX idx_leads_next_follow_up ON public.leads USING btree (next_follow_up);
CREATE INDEX idx_leads_status ON public.leads USING btree (status);
CREATE INDEX idx_listing_matches_contact_id ON public.listing_matches USING btree (contact_id);
CREATE INDEX idx_marketing_files_agent_id ON public.marketing_files USING btree (agent_id);
CREATE INDEX idx_marketing_files_category ON public.marketing_files USING btree (category);
CREATE INDEX idx_message_events_job_id ON public.message_events USING btree (message_job_id);
CREATE INDEX idx_message_jobs_contact_id ON public.message_jobs USING btree (contact_id);
CREATE INDEX idx_message_jobs_run_id ON public.message_jobs USING btree (run_id);
CREATE INDEX idx_message_jobs_status ON public.message_jobs USING btree (status);
CREATE INDEX message_templates_agent_id_idx ON public.message_templates USING btree (agent_id);
CREATE INDEX idx_monthly_agent_stats_agent ON public.monthly_agent_stats USING btree (agent_id);
CREATE INDEX idx_monthly_agent_stats_month ON public.monthly_agent_stats USING btree (month_year DESC);
CREATE INDEX idx_monthly_agent_stats_rank ON public.monthly_agent_stats USING btree (month_year, rank);
CREATE INDEX mortgage_rates_date_idx ON public.mortgage_rates USING btree (rate_date DESC);
CREATE INDEX idx_preference_profiles_contact_id ON public.preference_profiles USING btree (contact_id);
CREATE INDEX idx_prize_redemptions_agent_id ON public.prize_redemptions USING btree (agent_id);
CREATE INDEX idx_prize_redemptions_prize_id ON public.prize_redemptions USING btree (prize_id);
CREATE INDEX idx_redemptions_agent ON public.prize_redemptions USING btree (agent_id);
CREATE INDEX idx_redemptions_prize ON public.prize_redemptions USING btree (prize_id);
CREATE INDEX idx_properties_agent_id ON public.properties USING btree (agent_id);
CREATE INDEX idx_properties_city ON public.properties USING btree (city);
CREATE INDEX idx_properties_price ON public.properties USING btree (price);
CREATE INDEX idx_properties_status ON public.properties USING btree (status);
CREATE INDEX idx_properties_zip ON public.properties USING btree (zip);
CREATE INDEX idx_view_sessions_lead ON public.property_view_sessions USING btree (lead_id);
CREATE INDEX idx_view_sessions_property_view ON public.property_view_sessions USING btree (property_view_id);
CREATE INDEX idx_view_sessions_started ON public.property_view_sessions USING btree (started_at DESC);
CREATE INDEX idx_property_views_saved_property ON public.property_views USING btree (saved_property_id);
CREATE INDEX idx_prizes_active ON public.rewards_prizes USING btree (is_active);
CREATE INDEX idx_prizes_category ON public.rewards_prizes USING btree (category);
CREATE INDEX idx_saved_properties_agent ON public.saved_properties USING btree (agent_id);
CREATE INDEX idx_saved_properties_agent_id ON public.saved_properties USING btree (agent_id);
CREATE INDEX idx_saved_properties_lead ON public.saved_properties USING btree (lead_id);
CREATE INDEX idx_saved_properties_lead_id ON public.saved_properties USING btree (lead_id);
CREATE INDEX idx_saved_searches_agent_id ON public.saved_searches USING btree (agent_id);
CREATE INDEX idx_saved_searches_contact_id ON public.saved_searches USING btree (contact_id);
CREATE INDEX idx_store_orders_item ON public.store_orders USING btree (item_id);
CREATE INDEX idx_store_orders_user ON public.store_orders USING btree (user_id, created_at DESC);
CREATE INDEX idx_transactions_agent_id ON public.transactions USING btree (agent_id);
CREATE INDEX idx_transactions_contact_id ON public.transactions USING btree (contact_id);
CREATE INDEX idx_transactions_lead_id ON public.transactions USING btree (lead_id);
CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);
CREATE INDEX idx_xp_events_user_created ON public.xp_events USING btree (user_id, created_at DESC);
CREATE INDEX idx_xp_ledger_user_created ON public.xp_ledger USING btree (user_id, created_at DESC);
CREATE INDEX idx_xp_transactions_source ON public.xp_transactions USING btree (source, source_id);
CREATE INDEX idx_xp_transactions_user ON public.xp_transactions USING btree (user_id, created_at DESC);

-- Row Level Security
alter table public.activities enable row level security;
alter table public.agent_commission_plans enable row level security;
alter table public.agent_missions enable row level security;
alter table public.agent_notifications enable row level security;
alter table public.agents enable row level security;
alter table public.campaign_enrollments enable row level security;
alter table public.campaign_logs enable row level security;
alter table public.campaign_runs enable row level security;
alter table public.campaign_steps enable row level security;
alter table public.campaign_template_steps enable row level security;
alter table public.campaign_templates enable row level security;
alter table public.campaigns enable row level security;
alter table public.commission_plans enable row level security;
alter table public.contacts enable row level security;
alter table public.contract_deal_specific_docs enable row level security;
alter table public.contract_documents enable row level security;
alter table public.contract_notifications enable row level security;
alter table public.daily_mission_items enable row level security;
alter table public.daily_mission_sets enable row level security;
alter table public.drip_campaigns enable row level security;
alter table public.drip_enrollments enable row level security;
alter table public.drip_logs enable row level security;
alter table public.drip_steps enable row level security;
alter table public.executed_contracts enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.lead_campaign_enrollments enable row level security;
alter table public.lead_property_views enable row level security;
alter table public.leads enable row level security;
alter table public.listing_matches enable row level security;
alter table public.marketing_files enable row level security;
alter table public.message_events enable row level security;
alter table public.message_jobs enable row level security;
alter table public.message_packs enable row level security;
alter table public.message_templates enable row level security;
alter table public.mission_templates enable row level security;
alter table public.monthly_agent_stats enable row level security;
alter table public.office_settings enable row level security;
alter table public.preference_profiles enable row level security;
alter table public.print_orders enable row level security;
alter table public.print_templates enable row level security;
alter table public.prize_redemptions enable row level security;
alter table public.properties enable row level security;
alter table public.property_view_sessions enable row level security;
alter table public.property_views enable row level security;
alter table public.recommended_videos enable row level security;
alter table public.rewards_prizes enable row level security;
alter table public.saved_properties enable row level security;
alter table public.saved_searches enable row level security;
alter table public.store_orders enable row level security;
alter table public.xp_events enable row level security;
alter table public.xp_ledger enable row level security;
alter table public.xp_transactions enable row level security;

-- Policies
create policy "Agents can delete own activities" on public.activities for delete to {public} using ((auth.uid() = agent_id));
create policy "Agents can insert own activities" on public.activities for insert to {public} with check ((auth.uid() = agent_id));
create policy "Agents can update own activities" on public.activities for update to {public} using ((auth.uid() = agent_id));
create policy "Agents can view own activities" on public.activities for select to {public} using ((auth.uid() = agent_id));
create policy "Agents can view own plan" on public.agent_commission_plans for select to {public} using ((auth.uid() = agent_id));
create policy "Brokers can manage agent plans" on public.agent_commission_plans for all to {authenticated} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Agents can update own missions" on public.agent_missions for update to {public} using ((auth.uid() = agent_id));
create policy "Agents can view own missions" on public.agent_missions for select to {public} using ((auth.uid() = agent_id));
create policy "Brokers can insert missions" on public.agent_missions for insert to {authenticated} with check ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Brokers can view all missions" on public.agent_missions for select to {authenticated} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "agents can read own notifications" on public.agent_notifications for select to {public} using ((agent_id = auth.uid()));
create policy "agents can update own notifications" on public.agent_notifications for update to {public} using ((agent_id = auth.uid()));
create policy "service role can insert notifications" on public.agent_notifications for insert to {public} with check (true);
create policy "Admins and brokers can delete agents" on public.agents for delete to {public} using (is_admin_or_broker());
create policy "Admins and brokers can read all agents" on public.agents for select to {public} using (((auth.uid() = id) OR is_admin_or_broker()));
create policy "Admins and brokers can update all agents" on public.agents for update to {public} using (is_admin_or_broker());
create policy "Users can insert own agent record" on public.agents for insert to {public} with check ((auth.uid() = id));
create policy "Users can read own agent record" on public.agents for select to {public} using ((auth.uid() = id));
create policy "Users can update own agent record" on public.agents for update to {public} using ((auth.uid() = id));
create policy "Delete enrollments for own contacts" on public.campaign_enrollments for delete to {public} using ((EXISTS ( SELECT 1
   FROM contacts
  WHERE ((contacts.id = campaign_enrollments.contact_id) AND (contacts.agent_id = auth.uid())))));
create policy "Insert enrollments for own contacts" on public.campaign_enrollments for insert to {public} with check ((EXISTS ( SELECT 1
   FROM contacts
  WHERE ((contacts.id = campaign_enrollments.contact_id) AND (contacts.agent_id = auth.uid())))));
create policy "Update enrollments for own contacts" on public.campaign_enrollments for update to {public} using ((EXISTS ( SELECT 1
   FROM contacts
  WHERE ((contacts.id = campaign_enrollments.contact_id) AND (contacts.agent_id = auth.uid())))));
create policy "View enrollments for own contacts" on public.campaign_enrollments for select to {public} using ((EXISTS ( SELECT 1
   FROM contacts
  WHERE ((contacts.id = campaign_enrollments.contact_id) AND (contacts.agent_id = auth.uid())))));
create policy "Insert logs" on public.campaign_logs for insert to {public} with check (true);
create policy "View logs for own campaigns" on public.campaign_logs for select to {public} using ((EXISTS ( SELECT 1
   FROM campaigns
  WHERE ((campaigns.id = campaign_logs.campaign_id) AND (campaigns.owner_id = auth.uid())))));
create policy "Agents can insert campaign runs" on public.campaign_runs for insert to {public} with check ((created_by = auth.uid()));
create policy "Agents can update own campaign runs" on public.campaign_runs for update to {public} using (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text))))));
create policy "Agents can view own campaign runs" on public.campaign_runs for select to {public} using (((campaign_id IN ( SELECT campaigns.id
   FROM campaigns
  WHERE (campaigns.owner_id = auth.uid()))) OR (created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text))))));
create policy "Delete steps for own campaigns" on public.campaign_steps for delete to {public} using ((EXISTS ( SELECT 1
   FROM campaigns
  WHERE ((campaigns.id = campaign_steps.campaign_id) AND (campaigns.owner_id = auth.uid())))));
create policy "Insert steps for own campaigns" on public.campaign_steps for insert to {public} with check ((EXISTS ( SELECT 1
   FROM campaigns
  WHERE ((campaigns.id = campaign_steps.campaign_id) AND (campaigns.owner_id = auth.uid())))));
create policy "Update steps for own campaigns" on public.campaign_steps for update to {public} using ((EXISTS ( SELECT 1
   FROM campaigns
  WHERE ((campaigns.id = campaign_steps.campaign_id) AND (campaigns.owner_id = auth.uid())))));
create policy "View steps for own campaigns" on public.campaign_steps for select to {public} using ((EXISTS ( SELECT 1
   FROM campaigns
  WHERE ((campaigns.id = campaign_steps.campaign_id) AND (campaigns.owner_id = auth.uid())))));
create policy "Anyone can view template steps" on public.campaign_template_steps for select to {public} using ((EXISTS ( SELECT 1
   FROM campaign_templates
  WHERE ((campaign_templates.id = campaign_template_steps.template_id) AND (campaign_templates.is_active = true)))));
create policy "Brokers can manage template steps" on public.campaign_template_steps for all to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = ANY (ARRAY['broker'::text, 'admin'::text]))))));
create policy "Anyone can view active templates" on public.campaign_templates for select to {public} using ((is_active = true));
create policy "Brokers can manage campaign templates" on public.campaign_templates for all to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = ANY (ARRAY['broker'::text, 'admin'::text]))))));
create policy "Agents can delete own campaigns" on public.campaigns for delete to {public} using ((auth.uid() = owner_id));
create policy "Agents can insert own campaigns" on public.campaigns for insert to {public} with check ((auth.uid() = owner_id));
create policy "Agents can update own campaigns" on public.campaigns for update to {public} using ((auth.uid() = owner_id));
create policy "Agents can view own campaigns" on public.campaigns for select to {public} using ((auth.uid() = owner_id));
create policy "Brokers can view all campaigns" on public.campaigns for select to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Anyone can view plans" on public.commission_plans for select to {authenticated} using ((is_active = true));
create policy "Brokers can manage plans" on public.commission_plans for all to {authenticated} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Agents can delete own contacts" on public.contacts for delete to {public} using ((auth.uid() = agent_id));
create policy "Agents can insert own contacts" on public.contacts for insert to {public} with check ((auth.uid() = agent_id));
create policy "Agents can update own contacts" on public.contacts for update to {public} using ((auth.uid() = agent_id));
create policy "Agents can view own contacts" on public.contacts for select to {public} using ((auth.uid() = agent_id));
create policy agents_own_deal_specific_docs on public.contract_deal_specific_docs for all to {public} using ((EXISTS ( SELECT 1
   FROM executed_contracts ec
  WHERE ((ec.id = contract_deal_specific_docs.contract_id) AND ((ec.agent_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM agents
          WHERE ((agents.id = auth.uid()) AND (agents."Role" = ANY (ARRAY['admin'::text, 'broker'::text]))))))))));
create policy agents_own_contract_docs on public.contract_documents for all to {public} using ((EXISTS ( SELECT 1
   FROM executed_contracts ec
  WHERE ((ec.id = contract_documents.contract_id) AND ((ec.agent_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM agents
          WHERE ((agents.id = auth.uid()) AND (agents."Role" = ANY (ARRAY['admin'::text, 'broker'::text]))))))))));
create policy brokers_see_their_notifications on public.contract_notifications for all to {public} using ((recipient_id = auth.uid()));
create policy "Brokers can view all mission items" on public.daily_mission_items for select to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Users can insert own mission items" on public.daily_mission_items for insert to {public} with check ((EXISTS ( SELECT 1
   FROM daily_mission_sets
  WHERE ((daily_mission_sets.id = daily_mission_items.daily_set_id) AND (daily_mission_sets.user_id = auth.uid())))));
create policy "Users can update own mission items" on public.daily_mission_items for update to {public} using ((EXISTS ( SELECT 1
   FROM daily_mission_sets
  WHERE ((daily_mission_sets.id = daily_mission_items.daily_set_id) AND (daily_mission_sets.user_id = auth.uid())))));
create policy "Users can view own mission items" on public.daily_mission_items for select to {public} using ((EXISTS ( SELECT 1
   FROM daily_mission_sets
  WHERE ((daily_mission_sets.id = daily_mission_items.daily_set_id) AND (daily_mission_sets.user_id = auth.uid())))));
create policy "Brokers can view all mission sets" on public.daily_mission_sets for select to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Users can insert own mission sets" on public.daily_mission_sets for insert to {public} with check ((user_id = auth.uid()));
create policy "Users can update own mission sets" on public.daily_mission_sets for update to {public} using ((user_id = auth.uid()));
create policy "Users can view own mission sets" on public.daily_mission_sets for select to {public} using ((user_id = auth.uid()));
create policy "Agents can delete own drip campaigns" on public.drip_campaigns for delete to {public} using ((auth.uid() = created_by));
create policy "Agents can insert own drip campaigns" on public.drip_campaigns for insert to {public} with check ((auth.uid() = created_by));
create policy "Agents can update own drip campaigns" on public.drip_campaigns for update to {public} using ((auth.uid() = created_by));
create policy "Agents can view own drip campaigns" on public.drip_campaigns for select to {public} using ((auth.uid() = created_by));
create policy "Brokers can view all drip campaigns" on public.drip_campaigns for select to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Agents can delete own drip enrollments" on public.drip_enrollments for delete to {public} using ((auth.uid() = agent_id));
create policy "Agents can insert own drip enrollments" on public.drip_enrollments for insert to {public} with check ((auth.uid() = agent_id));
create policy "Agents can update own drip enrollments" on public.drip_enrollments for update to {public} using ((auth.uid() = agent_id));
create policy "Agents can view own drip enrollments" on public.drip_enrollments for select to {public} using ((auth.uid() = agent_id));
create policy "Brokers can view all drip enrollments" on public.drip_enrollments for select to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Agents can view own drip logs" on public.drip_logs for select to {public} using ((EXISTS ( SELECT 1
   FROM drip_enrollments
  WHERE ((drip_enrollments.id = drip_logs.enrollment_id) AND (drip_enrollments.agent_id = auth.uid())))));
create policy "Brokers can view all drip logs" on public.drip_logs for select to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "System can insert drip logs" on public.drip_logs for insert to {public} with check (true);
create policy "Brokers can view all drip steps" on public.drip_steps for select to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Delete steps for own campaigns" on public.drip_steps for delete to {public} using ((EXISTS ( SELECT 1
   FROM drip_campaigns
  WHERE ((drip_campaigns.id = drip_steps.campaign_id) AND (drip_campaigns.created_by = auth.uid())))));
create policy "Insert steps for own campaigns" on public.drip_steps for insert to {public} with check ((EXISTS ( SELECT 1
   FROM drip_campaigns
  WHERE ((drip_campaigns.id = drip_steps.campaign_id) AND (drip_campaigns.created_by = auth.uid())))));
create policy "Update steps for own campaigns" on public.drip_steps for update to {public} using ((EXISTS ( SELECT 1
   FROM drip_campaigns
  WHERE ((drip_campaigns.id = drip_steps.campaign_id) AND (drip_campaigns.created_by = auth.uid())))));
create policy "View steps for own campaigns" on public.drip_steps for select to {public} using ((EXISTS ( SELECT 1
   FROM drip_campaigns
  WHERE ((drip_campaigns.id = drip_steps.campaign_id) AND (drip_campaigns.created_by = auth.uid())))));
create policy agents_own_contracts on public.executed_contracts for all to {public} using (((agent_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = ANY (ARRAY['admin'::text, 'broker'::text])))))));
create policy "Anyone can view published articles" on public.knowledge_articles for select to {authenticated} using ((is_published = true));
create policy "Brokers can manage articles" on public.knowledge_articles for all to {authenticated} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Delete enrollments for own leads" on public.lead_campaign_enrollments for delete to {public} using ((EXISTS ( SELECT 1
   FROM leads
  WHERE ((leads.id = lead_campaign_enrollments.lead_id) AND (leads.agent_id = auth.uid())))));
create policy "Insert enrollments for own leads" on public.lead_campaign_enrollments for insert to {public} with check ((EXISTS ( SELECT 1
   FROM leads
  WHERE ((leads.id = lead_campaign_enrollments.lead_id) AND (leads.agent_id = auth.uid())))));
create policy "Update enrollments for own leads" on public.lead_campaign_enrollments for update to {public} using ((EXISTS ( SELECT 1
   FROM leads
  WHERE ((leads.id = lead_campaign_enrollments.lead_id) AND (leads.agent_id = auth.uid())))));
create policy "View enrollments for own leads" on public.lead_campaign_enrollments for select to {public} using ((EXISTS ( SELECT 1
   FROM leads
  WHERE ((leads.id = lead_campaign_enrollments.lead_id) AND (leads.agent_id = auth.uid())))));
create policy "Insert property views for own leads" on public.lead_property_views for insert to {public} with check ((EXISTS ( SELECT 1
   FROM leads
  WHERE ((leads.id = lead_property_views.lead_id) AND (leads.agent_id = auth.uid())))));
create policy "View property views for own leads" on public.lead_property_views for select to {public} using ((EXISTS ( SELECT 1
   FROM leads
  WHERE ((leads.id = lead_property_views.lead_id) AND (leads.agent_id = auth.uid())))));
create policy "Agents can delete own leads" on public.leads for delete to {public} using ((auth.uid() = agent_id));
create policy "Agents can insert own leads" on public.leads for insert to {public} with check ((auth.uid() = agent_id));
create policy "Agents can update own leads" on public.leads for update to {public} using ((auth.uid() = agent_id));
create policy "Agents can view own leads" on public.leads for select to {public} using ((auth.uid() = agent_id));
create policy "Admins and brokers can view all leads" on public.leads for select to {public} using (is_admin_or_broker());
create policy "Agents can view own listing matches" on public.listing_matches for select to {public} using ((contact_id IN ( SELECT contacts.id
   FROM contacts
  WHERE (contacts.agent_id = auth.uid()))));
create policy "System can manage listing matches" on public.listing_matches for all to {public} using (true);
create policy "Agents can delete own files" on public.marketing_files for delete to {public} using ((auth.uid() = agent_id));
create policy "Agents can insert own files" on public.marketing_files for insert to {public} with check ((auth.uid() = agent_id));
create policy "Agents can update own files" on public.marketing_files for update to {public} using ((auth.uid() = agent_id));
create policy "Agents can view own files" on public.marketing_files for select to {public} using ((auth.uid() = agent_id));
create policy "Agents can view message events" on public.message_events for select to {public} using (((message_job_id IN ( SELECT message_jobs.id
   FROM message_jobs
  WHERE (message_jobs.campaign_id IN ( SELECT campaigns.id
           FROM campaigns
          WHERE (campaigns.owner_id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text))))));
create policy "System can manage message events" on public.message_events for all to {public} using (true);
create policy "Agents can view own message jobs" on public.message_jobs for select to {public} using (((campaign_id IN ( SELECT campaigns.id
   FROM campaigns
  WHERE (campaigns.owner_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text))))));
create policy "System can manage message jobs" on public.message_jobs for all to {public} using (true);
create policy "Anyone can view active message packs" on public.message_packs for select to {public} using ((is_active = true));
create policy "Brokers can manage message packs" on public.message_packs for all to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Agents can delete own templates" on public.message_templates for delete to {public} using ((auth.uid() = agent_id));
create policy "Agents can insert own templates" on public.message_templates for insert to {public} with check ((auth.uid() = agent_id));
create policy "Agents can update own templates" on public.message_templates for update to {public} using ((auth.uid() = agent_id));
create policy "Agents can view own templates" on public.message_templates for select to {public} using ((auth.uid() = agent_id));
create policy "Anyone can view active templates" on public.mission_templates for select to {authenticated} using ((is_active = true));
create policy "Brokers can delete templates" on public.mission_templates for delete to {authenticated} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Brokers can insert templates" on public.mission_templates for insert to {authenticated} with check ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Brokers can update templates" on public.mission_templates for update to {authenticated} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Admins and brokers can insert stats" on public.monthly_agent_stats for insert to {public} with check (is_admin_or_broker());
create policy "Admins and brokers can update stats" on public.monthly_agent_stats for update to {public} using (is_admin_or_broker());
create policy "Agents can view their own stats" on public.monthly_agent_stats for select to {public} using ((agent_id = auth.uid()));
create policy "All agents can view leaderboard rankings" on public.monthly_agent_stats for select to {public} using ((auth.role() = 'authenticated'::text));
create policy "Anyone can view all stats for rankings" on public.monthly_agent_stats for select to {public} using (true);
create policy "System can update stats" on public.monthly_agent_stats for update to {public} using (true);
create policy "System can upsert stats" on public.monthly_agent_stats for insert to {public} with check (true);
create policy "Users can view own stats" on public.monthly_agent_stats for select to {public} using ((agent_id = auth.uid()));
create policy "Anyone can view office settings" on public.office_settings for select to {public} using (true);
create policy "Brokers can manage office settings" on public.office_settings for all to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = ANY (ARRAY['broker'::text, 'admin'::text]))))));
create policy "Agents can manage own preference profiles" on public.preference_profiles for all to {public} using (((contact_id IN ( SELECT contacts.id
   FROM contacts
  WHERE (contacts.agent_id = auth.uid()))) OR (lead_id IN ( SELECT leads.id
   FROM leads
  WHERE (leads.agent_id = auth.uid())))));
create policy "Agents can view own preference profiles" on public.preference_profiles for select to {public} using (((contact_id IN ( SELECT contacts.id
   FROM contacts
  WHERE (contacts.agent_id = auth.uid()))) OR (lead_id IN ( SELECT leads.id
   FROM leads
  WHERE (leads.agent_id = auth.uid())))));
create policy "Admins can view all orders" on public.print_orders for all to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = ANY (ARRAY['admin'::text, 'broker'::text]))))));
create policy "Agents can insert own orders" on public.print_orders for insert to {public} with check ((agent_id = auth.uid()));
create policy "Agents can update own orders" on public.print_orders for update to {public} using ((agent_id = auth.uid()));
create policy "Agents can view own orders" on public.print_orders for select to {public} using ((agent_id = auth.uid()));
create policy "Admins can manage templates" on public.print_templates for all to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = ANY (ARRAY['admin'::text, 'broker'::text]))))));
create policy "Anyone can view active templates" on public.print_templates for select to {public} using ((is_active = true));
create policy "Agents can insert redemptions" on public.prize_redemptions for insert to {public} with check ((agent_id = auth.uid()));
create policy "Agents can view own redemptions" on public.prize_redemptions for select to {public} using ((agent_id = auth.uid()));
create policy "Brokers can update redemptions" on public.prize_redemptions for update to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Brokers can view all redemptions" on public.prize_redemptions for select to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Agents can insert properties" on public.properties for insert to {authenticated} with check ((auth.uid() = agent_id));
create policy "Agents can update own properties" on public.properties for update to {authenticated} using ((auth.uid() = agent_id));
create policy "Anyone can view active properties" on public.properties for select to {authenticated} using (((status = 'active'::text) OR (agent_id = auth.uid())));
create policy "Brokers can manage all properties" on public.properties for all to {authenticated} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Agents can view sessions for own leads" on public.property_view_sessions for select to {public} using ((EXISTS ( SELECT 1
   FROM leads
  WHERE ((leads.id = property_view_sessions.lead_id) AND (leads.agent_id = auth.uid())))));
create policy "Anyone can insert sessions" on public.property_view_sessions for insert to {public} with check (true);
create policy "Anyone can update sessions" on public.property_view_sessions for update to {public} using (true);
create policy "Agents can view property views for own leads" on public.property_views for select to {public} using ((EXISTS ( SELECT 1
   FROM leads
  WHERE ((leads.id = property_views.lead_id) AND (leads.agent_id = auth.uid())))));
create policy "Anyone can insert property views" on public.property_views for insert to {public} with check (true);
create policy "Anyone can update property views" on public.property_views for update to {public} using (true);
create policy "Agents can manage recommended videos" on public.recommended_videos for all to {authenticated} using (true);
create policy "Agents can view recommended videos" on public.recommended_videos for select to {authenticated} using (true);
create policy "Anyone can view active prizes" on public.rewards_prizes for select to {public} using ((is_active = true));
create policy "Brokers can manage prizes" on public.rewards_prizes for all to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Agents can delete own saved properties" on public.saved_properties for delete to {public} using ((agent_id = auth.uid()));
create policy "Agents can insert saved properties" on public.saved_properties for insert to {public} with check ((agent_id = auth.uid()));
create policy "Agents can update own saved properties" on public.saved_properties for update to {public} using ((agent_id = auth.uid()));
create policy "Agents can view own saved properties" on public.saved_properties for select to {public} using ((agent_id = auth.uid()));
create policy saved_searches_agent_delete on public.saved_searches for delete to {authenticated} using ((agent_id = auth.uid()));
create policy saved_searches_agent_insert on public.saved_searches for insert to {authenticated} with check ((agent_id = auth.uid()));
create policy saved_searches_agent_select on public.saved_searches for select to {authenticated} using ((agent_id = auth.uid()));
create policy "Brokers can view all orders" on public.store_orders for select to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "System can insert orders" on public.store_orders for insert to {public} with check (true);
create policy "Users can view own orders" on public.store_orders for select to {public} using ((user_id = auth.uid()));
create policy "Agents can insert own transactions" on public.transactions for insert to {public} with check ((auth.uid() = agent_id));
create policy "Agents can update own transactions" on public.transactions for update to {public} using ((auth.uid() = agent_id));
create policy "Agents can view own transactions" on public.transactions for select to {public} using ((auth.uid() = agent_id));
create policy "Brokers can view all transactions" on public.transactions for select to {authenticated} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Brokers can view all xp_events" on public.xp_events for select to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "System can insert xp_events" on public.xp_events for insert to {public} with check (true);
create policy "Users can view own xp_events" on public.xp_events for select to {public} using ((user_id = auth.uid()));
create policy "Brokers can insert xp_ledger" on public.xp_ledger for insert to {public} with check ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "Brokers can view all xp_ledger" on public.xp_ledger for select to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "System can insert xp_ledger" on public.xp_ledger for insert to {public} with check (true);
create policy "Users can view own xp_ledger" on public.xp_ledger for select to {public} using ((user_id = auth.uid()));
create policy "Brokers can view all xp transactions" on public.xp_transactions for select to {public} using ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = auth.uid()) AND (agents."Role" = 'broker'::text)))));
create policy "System can insert xp transactions" on public.xp_transactions for insert to {public} with check (true);
create policy "Users can view own xp transactions" on public.xp_transactions for select to {public} using ((user_id = auth.uid()));

-- Functions
CREATE OR REPLACE FUNCTION public.increment_agent_exp(agent_id uuid, exp_amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.agents
  SET exp = COALESCE(exp, 0) + exp_amount
  WHERE id = agent_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.is_admin_or_broker()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agents
    WHERE id = auth.uid()
    AND "Role" IN ('admin', 'broker')
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.update_executed_contracts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $function$
;

-- Triggers
CREATE TRIGGER trg_contract_documents_updated_at BEFORE UPDATE ON public.contract_documents FOR EACH ROW EXECUTE FUNCTION update_executed_contracts_updated_at();
CREATE TRIGGER trg_executed_contracts_updated_at BEFORE UPDATE ON public.executed_contracts FOR EACH ROW EXECUTE FUNCTION update_executed_contracts_updated_at();
