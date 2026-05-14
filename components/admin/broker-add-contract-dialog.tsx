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

export function BrokerAddContractDialog({ agents, open, onOpenChange }: BrokerAddContractDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
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
  })

  function resetForm() {
    setForm({
      agent_id: "",
      transaction_type: "buyer",
      property_address: "",
      client_name: "",
      contract_date: new Date().toISOString().split("T")[0],
      expected_closing_date: "",
      sale_price: "",
      commission_type: "percent",
      commission_value: "",
      notes: "",
    })
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
        body: JSON.stringify(form),
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
                placeholder="500,000"
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
                  placeholder={form.commission_type === "percent" ? "3.0" : "15,000"}
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
