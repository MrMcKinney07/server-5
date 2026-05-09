"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface SubmitContractDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SubmitContractDialog({ open, onOpenChange, onSuccess }: SubmitContractDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    transaction_type: "buyer",
    property_address: "",
    client_name: "",
    contract_date: new Date().toISOString().split("T")[0],
    expected_closing_date: "",
    has_hoa: false,
    has_cdd: false,
    risk_status: "green",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to submit contract")
      const contract = await res.json()
      toast.success("Contract submitted successfully")
      onOpenChange(false)
      onSuccess?.()
      router.push(`/dashboard/contracts/${contract.id}`)
    } catch {
      toast.error("Failed to submit contract")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Submit Executed Contract</DialogTitle>
          <DialogDescription className="text-slate-400">
            Fill in the contract details. A document checklist will be generated automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Transaction Type *</Label>
              <Select
                value={form.transaction_type}
                onValueChange={(v) => setForm((p) => ({ ...p, transaction_type: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 text-white">
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="listing">Listing</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Risk Status</Label>
              <Select
                value={form.risk_status}
                onValueChange={(v) => setForm((p) => ({ ...p, risk_status: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 text-white">
                  <SelectItem value="green">Green — On Track</SelectItem>
                  <SelectItem value="yellow">Yellow — Attention Needed</SelectItem>
                  <SelectItem value="red">Red — At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Client Name *</Label>
            <Input
              required
              value={form.client_name}
              onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))}
              placeholder="John & Jane Smith"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Property Address *</Label>
            <Input
              required
              value={form.property_address}
              onChange={(e) => setForm((p) => ({ ...p, property_address: e.target.value }))}
              placeholder="123 Main St, City, FL 32801"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Contract Date *</Label>
              <Input
                required
                type="date"
                value={form.contract_date}
                onChange={(e) => setForm((p) => ({ ...p, contract_date: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Expected Closing Date</Label>
              <Input
                type="date"
                value={form.expected_closing_date}
                onChange={(e) => setForm((p) => ({ ...p, expected_closing_date: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="has_hoa"
                checked={form.has_hoa}
                onCheckedChange={(v) => setForm((p) => ({ ...p, has_hoa: !!v }))}
                className="border-white/20"
              />
              <Label htmlFor="has_hoa" className="text-slate-300 cursor-pointer">HOA</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="has_cdd"
                checked={form.has_cdd}
                onCheckedChange={(v) => setForm((p) => ({ ...p, has_cdd: !!v }))}
                className="border-white/20"
              />
              <Label htmlFor="has_cdd" className="text-slate-300 cursor-pointer">CDD</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any additional details..."
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Contract
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
