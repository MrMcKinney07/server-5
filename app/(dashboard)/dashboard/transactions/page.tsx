import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { TransactionsTable } from "@/components/transactions/transactions-table"
import type { Transaction, Contact, Property } from "@/lib/types/database"

export default async function TransactionsPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  // Fetch transactions - agents see their own, admins see all
  let query = supabase
    .from("transactions")
    .select("*, contact:contacts(*), property:properties(*), agent:agents(full_name, email)")
    .order("created_at", { ascending: false })

  if (agent.role !== "admin") {
    query = query.eq("agent_id", agent.id)
  }

  const { data: transactions } = await query

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          {agent.role === "admin" ? "All transactions" : "Your transactions"}
        </p>
      </div>

      <TransactionsTable
        transactions={
          (transactions as (Transaction & {
            contact: Contact
            property: Property | null
            agent: { full_name: string; email: string }
          })[]) || []
        }
        isAdmin={agent.role === "admin"}
      />
    </div>
  )
}
