"use client"

import { useState } from "react"
import { mutate } from "swr"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"
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

interface Agent {
  id: string
  Name: string
  Email: string
}

interface BrokerAddContractDialogProps {
  agents: Agent[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const defaultForm = {
  agent_id: "",
  transaction_type: "buyer",
  property_address: "",
  client_name: "",
  contract_date: new Date().toISOString().split("T")[0],
  expected_closing_date: "",
  sale_price: "",
  commission_type: "percent" as "percent" | "dollar",
  commission_value: "",
  notes: "",
  is_referral: false,
  referral_agent_name: "",
  referral_fee: "",
}

export function BrokerAddContractDialog({ agents, open, onOpenChange }: BrokerAddContractDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(defaultForm)

  function resetForm() {
    setForm({ ...defaultForm, contract_date: new Date().toISOString().split("T")[0] })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.agent_id) {
      toast.error("Please select an agent")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/broker/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          is_referral: form.is_referral,
          referral_agent_name: form.is_referral ? form.referral_agent_name : null,
          referral_fee: form.is_referral && form.referral_fee ? parseFloat(form.referral_fee) : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to add contract")
      }
      toast.success("Contract added successfully")
      mutate("/api/broker/contracts")
      resetForm()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to add contract")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm() }}>
      <DialogContent className="dark max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-cyan-400" />
            Add Contract for Agent
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Manually create a contract on behalf of an agent. A document checklist will be generated automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Agent selector */}
          <div className="space-y-2">
            <Label className="text-slate-300">Agent *</Label>
            <Select
              value={form.agent_id}
              onValueChange={(v) => setForm((p) => ({ ...p, agent_id: v }))}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select an agent..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10 text-white">
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="font-medium">{a.Name}</span>
                    <span className="text-slate-400 ml-2 text-xs">{a.Email}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction type */}
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

          {/* Client name */}
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

          {/* Property address */}
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

          {/* Sale price */}
          <div className="space-y-2">
            <Label className="text-slate-300">Sale Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <Input
                type="number"
                min="0"
                step="1000"
                value={form.sale_price}
                onChange={(e) => setForm((p) => ({ ...p, sale_price: e.target.value }))}
                placeholder="500000"
                className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Commission */}
          <div className="space-y-2">
            <Label className="text-slate-300">Commission</Label>
            <div className="flex gap-2">
              <div className="flex rounded-lg border border-white/10 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, commission_type: "percent" }))}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${form.commission_type === "percent" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, commission_type: "dollar" }))}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${form.commission_type === "dollar" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}
                >
                  $
                </button>
              </div>
              <div className="relative flex-1">
                {form.commission_type === "dollar" && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                )}
                <Input
                  type="number"
                  min="0"
                  step={form.commission_type === "percent" ? "0.1" : "100"}
                  value={form.commission_value}
                  onChange={(e) => setForm((p) => ({ ...p, commission_value: e.target.value }))}
                  placeholder={form.commission_type === "percent" ? "3.0" : "15000"}
                  className={`bg-white/5 border-white/10 text-white placeholder:text-slate-500 ${form.commission_type === "dollar" ? "pl-7" : ""}`}
                />
                {form.commission_type === "percent" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Contract Date *</Label>
              <Input
                required
                type="date"
                value={form.contract_date}
                onChange={(e) => setForm((p) => ({ ...p, contract_date: e.target.value }))}
                className="bg-white/5 border-white/10 text-white [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Expected Closing</Label>
              <Input
                type="date"
                value={form.expected_closing_date}
                onChange={(e) => setForm((p) => ({ ...p, expected_closing_date: e.target.value }))}
                className="bg-white/5 border-white/10 text-white [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Referral */}
          <div className="rounded-lg border border-white/10 p-4 space-y-3 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300 text-sm font-medium">Referral Fee Owed</Label>
                <p className="text-slate-500 text-xs mt-0.5">Is a referral fee payable on this contract?</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, is_referral: !p.is_referral }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.is_referral ? "bg-cyan-500" : "bg-white/10"}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${form.is_referral ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {form.is_referral && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Referring Agent / Company</Label>
                  <Input
                    value={form.referral_agent_name}
                    onChange={(e) => setForm((p) => ({ ...p, referral_agent_name: e.target.value }))}
                    placeholder="Agent or brokerage name"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Referral Fee ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={form.referral_fee}
                      onChange={(e) => setForm((p) => ({ ...p, referral_fee: e.target.value }))}
                      placeholder="0"
                      className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-slate-300">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any additional details..."
              rows={3}
              className="resize-none bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); resetForm() }}
              className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Contract
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
