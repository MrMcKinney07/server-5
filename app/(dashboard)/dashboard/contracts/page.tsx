"use client"

import { useState } from "react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SubmitContractDialog } from "@/components/contracts/submit-contract-dialog"
import { ContractsList } from "@/components/contracts/contracts-list"
import { FileSignature, Plus, FileText, Clock, CheckCircle2, AlertTriangle } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ContractsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "active" | "closed" | "cancelled">("all")

  const { data, error, mutate } = useSWR("/api/contracts", fetcher)
  const contracts: any[] = data?.contracts ?? []

  const filtered = filter === "all" ? contracts : contracts.filter((c) => c.status === filter)

  const stats = {
    total: contracts.length,
    active: contracts.filter((c) => c.status === "active").length,
    closed: contracts.filter((c) => c.status === "closed").length,
    atRisk: contracts.filter((c) => c.risk_status === "red" && c.status === "active").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <FileSignature className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Executed Contracts</h1>
            <p className="text-sm text-slate-400">Track document compliance across all your transactions</p>
          </div>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold flex items-center gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Submit Contract
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl font-semibold text-cyan-400">{stats.active}</p>
        </div>
        <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wider">Closed</span>
          </div>
          <p className="text-2xl font-semibold text-emerald-400">{stats.closed}</p>
        </div>
        <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wider">At Risk</span>
          </div>
          <p className="text-2xl font-semibold text-rose-400">{stats.atRisk}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(["all", "active", "closed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-lg border capitalize transition-all",
              filter === f
                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                : "border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {error ? (
        <div className="text-center py-12 text-slate-500 border border-white/[0.06] rounded-xl">
          Failed to load contracts.
        </div>
      ) : !data ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : (
        <ContractsList
          contracts={filtered}
          onAddContract={() => setDialogOpen(true)}
        />
      )}

      <SubmitContractDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
