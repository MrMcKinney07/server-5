"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DocumentChecklist } from "@/components/contracts/document-checklist"
import { ContractCompleteAnimation } from "@/components/contracts/contract-complete-animation"
import {
  ArrowLeft,
  Home,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  Mail,
  Loader2,
} from "lucide-react"
import { getProgressLabel } from "@/lib/contracts/document-definitions"

interface Contract {
  id: string
  transaction_type: string
  property_address: string
  client_name: string
  contract_date: string
  expected_closing_date: string | null
  status: string
  risk_status: string
  has_hoa: boolean
  has_cdd: boolean
  notes: string | null
  progress_percent: number
  payment_status: "pending" | "sent" | null
  created_at: string
}

interface ContractDetailClientProps {
  contract: Contract
  documents: any[]
  dealDocs: any[]
  isAdmin: boolean
}

const TYPE_COLORS: Record<string, string> = {
  buyer: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  listing: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  referral: "text-amber-400 bg-amber-400/10 border-amber-400/20",
}

const RISK_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  green: {
    label: "On Track",
    color: "text-emerald-400",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  },
  yellow: {
    label: "Attention Needed",
    color: "text-amber-400",
    icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  },
  red: {
    label: "At Risk",
    color: "text-rose-400",
    icon: <AlertTriangle className="h-4 w-4 text-rose-400" />,
  },
}

const PROGRESS_COLORS = [
  { min: 0, max: 0, bar: "bg-slate-600" },
  { min: 1, max: 49, bar: "bg-cyan-500" },
  { min: 50, max: 99, bar: "bg-amber-500" },
  { min: 100, max: 100, bar: "bg-emerald-500" },
]

function getProgressBarColor(percent: number) {
  return PROGRESS_COLORS.find((p) => percent >= p.min && percent <= p.max)?.bar ?? "bg-cyan-500"
}

export function ContractDetailClient({ contract, documents, dealDocs, isAdmin }: ContractDetailClientProps) {
  const [progress, setProgress] = useState(contract.progress_percent)
  const [showComplete, setShowComplete] = useState(false)

  const risk = RISK_CONFIG[contract.risk_status] ?? RISK_CONFIG.green
  const progressLabel = getProgressLabel(progress)

  function handleProgressUpdate(newProgress: number) {
    setProgress(newProgress)
  }

  function handleComplete() {
    if (progress === 100) {
      setShowComplete(true)
    }
  }

  return (
    <div className="space-y-6">
      {showComplete && <ContractCompleteAnimation onDismiss={() => setShowComplete(false)} />}

      {/* Back link */}
      <div>
        <Link
          href="/dashboard/contracts"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contracts
        </Link>
      </div>

      {/* Contract header */}
      <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border capitalize", TYPE_COLORS[contract.transaction_type])}>
                {contract.transaction_type}
              </span>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border capitalize", contract.status === "active" ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" : "text-slate-400 bg-slate-400/10 border-slate-400/20")}>
                {contract.status}
              </span>
              {contract.has_hoa && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">HOA</span>
              )}
              {contract.has_cdd && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">CDD</span>
              )}
            </div>

            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <Home className="h-5 w-5 text-slate-500 shrink-0" />
              {contract.property_address}
            </h1>

            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <Users className="h-4 w-4 text-slate-500" />
              {contract.client_name}
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className={cn("flex items-center gap-1.5 justify-end text-sm", risk.color)}>
              {risk.icon}
              {risk.label}
            </div>
            {contract.expected_closing_date && (
              <div className="flex items-center gap-1.5 text-sm text-slate-400 justify-end">
                <Calendar className="h-3.5 w-3.5" />
                Closing {new Date(contract.expected_closing_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 justify-end">
              <Clock className="h-3.5 w-3.5" />
              Contract date: {new Date(contract.contract_date).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 pt-4 border-t border-white/[0.04]">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Document Compliance</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                progress === 100
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  : progress >= 50
                  ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                  : "text-slate-400 bg-white/5 border border-white/10"
              )}>
                {progressLabel}
              </span>
              <span className="text-white font-semibold">{progress}%</span>
            </div>
          </div>
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={cn("absolute left-0 top-0 h-full rounded-full transition-all duration-500", getProgressBarColor(progress))}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {contract.notes && (
          <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300">{contract.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Request Pay — only shown when all docs are approved */}
      {progress === 100 && !showComplete && (
        <div className="border border-emerald-500/20 rounded-xl bg-emerald-500/[0.04] p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-emerald-400">All Documents Approved</p>
            <p className="text-xs text-slate-400 mt-0.5">Your file is fully compliant. You can now request payment.</p>
          </div>
          <Button
            onClick={() => setShowComplete(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 shrink-0"
          >
            <DollarSign className="h-4 w-4" />
            Request Pay
          </Button>
        </div>
      )}

      {/* Document checklist */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Document Checklist</h2>
        <DocumentChecklist
          contractId={contract.id}
          documents={documents}
          dealDocs={dealDocs}
          hasHoa={contract.has_hoa}
          hasCdd={contract.has_cdd}
          onProgressUpdate={handleProgressUpdate}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
