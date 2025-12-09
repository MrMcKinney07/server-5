import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { CreateTransactionDialog } from "@/components/transactions/create-transaction-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  under_contract: "bg-blue-100 text-blue-800 border-blue-200",
  inspection: "bg-purple-100 text-purple-800 border-purple-200",
  appraisal: "bg-cyan-100 text-cyan-800 border-cyan-200",
  closing: "bg-emerald-100 text-emerald-800 border-emerald-200",
  closed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
}

export default async function TransactionsPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  // Fetch transactions - agents see their own, brokers see all
  let query = supabase.from("transactions").select("*").order("created_at", { ascending: false })

  if (agent.role !== "broker") {
    query = query.eq("agent_id", agent.id)
  }

  const { data: transactions } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {agent.role === "broker" ? "All transactions" : "Your transactions"}
          </p>
        </div>
        <CreateTransactionDialog agentId={agent.id} />
      </div>

      {transactions && transactions.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sale Price</TableHead>
                <TableHead className="text-right">GCI</TableHead>
                <TableHead>Contract Date</TableHead>
                <TableHead>Closing Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/transactions/${transaction.id}`}
                      className="font-medium hover:underline text-blue-600"
                    >
                      {transaction.property_address}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{transaction.transaction_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[transaction.status] || ""}>
                      {transaction.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.sale_price ? `$${transaction.sale_price.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.gross_commission ? `$${transaction.gross_commission.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>
                    {transaction.contract_date ? new Date(transaction.contract_date).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    {transaction.closing_date ? new Date(transaction.closing_date).toLocaleDateString() : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No transactions yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Create a transaction to track your deals.</p>
        </div>
      )}
    </div>
  )
}
