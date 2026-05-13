import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { TransactionDetails } from "@/components/transactions/transaction-details"
import { TransactionStatusPanel } from "@/components/transactions/transaction-status-panel"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Transaction, Contact, Property, Agent, Lead, Activity } from "@/lib/types/database"

interface TransactionPageProps {
  params: Promise<{ id: string }>
}

export default async function TransactionPage({ params }: TransactionPageProps) {
  const { id } = await params
  const agent = await requireAuth()
  const supabase = await createClient()

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*, contact:contacts(*), property:properties(*), agent:agents(*), lead:leads(*)")
    .eq("id", id)
    .single()

  if (!transaction) {
    notFound()
  }

  // Check access
  if (agent.role !== "admin" && transaction.agent_id !== agent.id) {
    notFound()
  }

  // Get activities related to the contact
  const { data: activities } = await supabase
    .from("activities")
    .select("*, agent:agents(full_name, email)")
    .eq("contact_id", transaction.contact_id)
    .order("created_at", { ascending: false })
    .limit(10)

  const typedTransaction = transaction as Transaction & {
    contact: Contact
    property: Property | null
    agent: Agent
    lead: Lead | null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/transactions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Transaction #{id.slice(0, 8)}</h1>
          <p className="text-sm text-muted-foreground">
            {typedTransaction.contact.full_name} • Created {new Date(typedTransaction.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TransactionDetails
            transaction={typedTransaction}
            activities={
              (activities as (Activity & {
                agent: { full_name: string; email: string }
              })[]) || []
            }
          />
        </div>
        <div className="lg:col-span-1">
          <TransactionStatusPanel transaction={typedTransaction} isAdmin={agent.role === "admin"} />
        </div>
      </div>
    </div>
  )
}
