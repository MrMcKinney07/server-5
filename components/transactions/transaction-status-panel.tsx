"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Transaction, TransactionStatus } from "@/lib/types/database"

interface TransactionStatusPanelProps {
  transaction: Transaction
  isAdmin: boolean
}

const statusOptions: { value: TransactionStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending_broker_review", label: "Pending Broker Review" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
]

const statusColors: Record<TransactionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  in_progress: "secondary",
  pending_broker_review: "outline",
  closed: "default",
  cancelled: "destructive",
}

export function TransactionStatusPanel({ transaction, isAdmin }: TransactionStatusPanelProps) {
  const router = useRouter()
  const [status, setStatus] = useState(transaction.status)
  const [brokerNotes, setBrokerNotes] = useState(transaction.broker_notes || "")
  const [saving, setSaving] = useState(false)

  const handleUpdate = async () => {
    setSaving(true)
    const supabase = createBrowserClient()

    const updates: Partial<Transaction> = { status }
    if (isAdmin) {
      updates.broker_notes = brokerNotes
    }

    const { error } = await supabase.from("transactions").update(updates).eq("id", transaction.id)

    setSaving(false)

    if (!error) {
      router.refresh()
    }
  }

  const hasChanges = status !== transaction.status || (isAdmin && brokerNotes !== (transaction.broker_notes || ""))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={status} onValueChange={(v) => setStatus(v as TransactionStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            <p>Last updated: {new Date(transaction.updated_at).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Broker Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Add notes for this transaction..."
              value={brokerNotes}
              onChange={(e) => setBrokerNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {hasChanges && (
        <Button onClick={handleUpdate} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{transaction.agent_id}</p>
        </CardContent>
      </Card>
    </div>
  )
}
