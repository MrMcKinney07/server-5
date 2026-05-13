import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Transaction, Contact, Property } from "@/lib/types/database"

interface TransactionsTableProps {
  transactions: (Transaction & {
    contact: Contact
    property: Property | null
    agent: { full_name: string; email: string }
  })[]
  isAdmin: boolean
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  in_progress: "secondary",
  pending_broker_review: "outline",
  closed: "default",
  cancelled: "destructive",
}

const statusLabels: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  pending_broker_review: "Pending Review",
  closed: "Closed",
  cancelled: "Cancelled",
}

export function TransactionsTable({ transactions, isAdmin }: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No transactions yet.</p>
        <p className="text-sm text-muted-foreground mt-1">Start a transaction from a lead or contact page.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Property</TableHead>
            {isAdmin && <TableHead>Agent</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <Link href={`/dashboard/transactions/${transaction.id}`} className="font-medium hover:underline">
                  #{transaction.id.slice(0, 8)}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/contacts/${transaction.contact_id}`} className="hover:underline">
                  {transaction.contact.full_name}
                </Link>
              </TableCell>
              <TableCell>
                {transaction.property ? (
                  <Link href={`/dashboard/properties/${transaction.property_id}`} className="hover:underline">
                    {transaction.property.address}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              {isAdmin && <TableCell>{transaction.agent.full_name}</TableCell>}
              <TableCell>
                <Badge variant={statusColors[transaction.status]}>{statusLabels[transaction.status]}</Badge>
              </TableCell>
              <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
