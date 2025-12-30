"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AddTransactionDialogProps {
  agentId: string
  contacts: { id: string; first_name: string; last_name: string; email: string }[]
  leads: { id: string; first_name: string; last_name: string }[]
}

export function AddTransactionDialog({ agentId, contacts, leads }: AddTransactionDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    contact_id: "",
    lead_id: "",
    transaction_type: "listing",
    property_address: "",
    sale_price: "",
    commission_rate: "3",
    contract_date: new Date().toISOString().split("T")[0],
    closing_date: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          agent_id: agentId,
          sale_price: Number.parseFloat(formData.sale_price) || 0,
          commission_rate: Number.parseFloat(formData.commission_rate) || 0,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create transaction")
      }

      toast.success("Transaction created successfully")

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error creating transaction:", error)
      toast.error("Failed to create transaction")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Transaction</DialogTitle>
          <DialogDescription>Add a new transaction to track commissions and closings</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_id">Contact *</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, contact_id: value }))}
                required
              >
                <SelectTrigger id="contact_id">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_id">Related Lead (Optional)</Label>
              <Select
                value={formData.lead_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, lead_id: value }))}
              >
                <SelectTrigger id="lead_id">
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.first_name} {lead.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_type">Transaction Type *</Label>
              <Select
                value={formData.transaction_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, transaction_type: value }))}
                required
              >
                <SelectTrigger id="transaction_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="listing">Listing</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="dual">Dual Agency</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_address">Property Address *</Label>
              <Input
                id="property_address"
                value={formData.property_address}
                onChange={(e) => setFormData((prev) => ({ ...prev, property_address: e.target.value }))}
                placeholder="123 Main St, City, State 12345"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale_price">Sale Price *</Label>
              <Input
                id="sale_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.sale_price}
                onChange={(e) => setFormData((prev) => ({ ...prev, sale_price: e.target.value }))}
                placeholder="500000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_rate">Commission Rate (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.commission_rate}
                onChange={(e) => setFormData((prev) => ({ ...prev, commission_rate: e.target.value }))}
                placeholder="3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_date">Contract Date *</Label>
              <Input
                id="contract_date"
                type="date"
                value={formData.contract_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, contract_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closing_date">Expected Closing Date</Label>
              <Input
                id="closing_date"
                type="date"
                value={formData.closing_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, closing_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional transaction details..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
