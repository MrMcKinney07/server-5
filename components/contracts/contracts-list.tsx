"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Home, Users, ArrowUpRight, AlertTriangle, CheckCircle2, Clock, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Contract {
  id: string
  transaction_type: string
  property_address: string
  client_name: string
  contract_date: string
  expected_closing_date: string | null
  status: string
  risk_status: string
  progress_percent: number
  created_at: string
}

interface ContractsListProps {
  contracts: Contract[]
  onAddContract?: () => void
}

const typeColors: Record<string, string> = {
  buyer: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  listing: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  referral: "text-amber-400 bg-amber-400/10 border-amber-400/20",
}

const statusColors: Record<string, string> = {
  active: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  closed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  cancelled: "text-rose-400 bg-rose-400/10 border-rose-400/20",
}

const riskIcons: Record<string, React.ReactNode> = {
  green: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  yellow: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  red: <AlertTriangle className="h-4 w-4 text-rose-400" />,
}

const riskColors: Record<string, string> = {
  green: "text-emerald-400",
  yellow: "text-amber-400",
  red: "text-rose-400",
}

export function ContractsList({ contracts, onAddContract }: ContractsListProps) {
  if (contracts.length === 0) {
    return (
      <div className="text-center py-16 border border-white/[0.06] rounded-xl bg-white/[0.02]">
        <Home className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No contracts yet</p>
        <p className="text-sm text-slate-500 mt-1">Submit your first executed contract to get started.</p>
        {onAddContract && (
          <Button
            onClick={onAddContract}
            variant="outline"
            className="mt-4 border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.06]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit Contract
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {contracts.map((contract) => {
        const daysUntilClose = contract.expected_closing_date
          ? Math.ceil((new Date(contract.expected_closing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null

        return (
          <Link
            key={contract.id}
            href={`/dashboard/contracts/${contract.id}`}
            className="block group"
          >
            <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border capitalize", typeColors[contract.transaction_type])}>
                      {contract.transaction_type}
                    </span>
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border capitalize", statusColors[contract.status])}>
                      {contract.status}
                    </span>
                  </div>
                  <p className="font-medium text-white truncate">{contract.property_address}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-sm text-slate-400">{contract.client_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    {daysUntilClose !== null && contract.status === "active" && (
                      <div className={cn("flex items-center gap-1 text-xs", daysUntilClose < 14 ? "text-rose-400" : daysUntilClose < 30 ? "text-amber-400" : "text-slate-400")}>
                        <Clock className="h-3.5 w-3.5" />
                        {daysUntilClose > 0 ? `${daysUntilClose}d to close` : "Closing today"}
                      </div>
                    )}
                    <div className={cn("flex items-center gap-1 text-xs mt-1", riskColors[contract.risk_status])}>
                      {riskIcons[contract.risk_status]}
                      <span className="capitalize">{contract.risk_status} risk</span>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>Documents</span>
                  <span>{contract.progress_percent}% complete</span>
                </div>
                <Progress
                  value={contract.progress_percent}
                  className="h-1.5 bg-white/5"
                />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
