import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { TransactionsTable } from "@/components/transactions/transactions-table"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import type { Transaction, Contact } from "@/lib/types/database"

export default async function TransactionsPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  let query = supabase
    .from("transactions")
    .select("*, contact:contacts(*), agent:agents(Name, Email)")
    .order("created_at", { ascending: false })

  if (agent.role !== "admin") {
    query = query.eq("agent_id", agent.id)
  }

  const { data: transactions } = await query

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email")
    .eq("agent_id", agent.id)
    .order("last_name")

  const { data: leads } = await supabase
    .from("leads")
    .select("id, first_name, last_name")
    .eq("agent_id", agent.id)
    .order("last_name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {agent.role === "admin" ? "All transactions" : "Your transactions"}
          </p>
        </div>
        <AddTransactionDialog agentId={agent.id} contacts={contacts || []} leads={leads || []} />
      </div>

      <TransactionsTable
        transactions={
          (transactions as (Transaction & {
            contact: Contact
            agent: { Name: string; Email: string }
          })[]) || []
        }
        isAdmin={agent.role === "admin"}
      />
    </div>
  )
}
