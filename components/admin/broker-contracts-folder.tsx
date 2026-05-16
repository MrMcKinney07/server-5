"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BrokerAddContractDialog } from "@/components/admin/broker-add-contract-dialog"
import {
  ChevronRight,
  FolderOpen,
  Folder,
  FileText,
  CheckCircle2,
  Clock,
  Circle,
  AlertTriangle,
  Home,
  Users,
  Loader2,
  X,
  DollarSign,
  Mail,
  Plus,
  Upload,
  ExternalLink,
} from "lucide-react"
import { useRef } from "react"
import { toast } from "sonner"

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) return null
  const ct = res.headers.get("content-type") ?? ""
  if (!ct.includes("application/json")) return null
  return res.json()
}

type DocStatus = "not_uploaded" | "uploaded" | "approved"

interface ContractDoc {
  id: string
  document_key: string
  document_name: string
  category: string
  status: DocStatus
  file_url: string | null
  file_name: string | null
  is_required: boolean
  uploaded_at: string | null
}

interface Contract {
  id: string
  transaction_type: string
  property_address: string
  client_name: string
  status: string
  risk_status: string
  progress_percent: number
  payment_status: "pending" | "sent" | null
  contract_date: string
  expected_closing_date: string | null
  contract_documents: ContractDoc[]
  contract_deal_specific_docs: any[]
}

interface AgentGroup {
  agent: { id: string; Name: string; Email: string }
  contracts: Contract[]
}

const STATUS_BADGE: Record<DocStatus, { label: string; className: string; icon: React.ReactNode }> = {
  not_uploaded: {
    label: "Not uploaded",
    className: "text-slate-500 bg-white/5 border-white/10",
    icon: <Circle className="h-3 w-3" />,
  },
  uploaded: {
    label: "Pending Review",
    className: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: "Approved",
    className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
}

const RISK_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  green: { label: "On Track", className: "text-emerald-400", icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> },
  yellow: { label: "Attention", className: "text-amber-400", icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> },
  red: { label: "At Risk", className: "text-rose-400", icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> },
}

const TYPE_COLORS: Record<string, string> = {
  buyer: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  listing: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  referral: "text-amber-400 bg-amber-400/10 border-amber-400/20",
}

function DocApprovalRow({ doc, contractId }: { doc: ContractDoc; contractId: string }) {
  const [loading, setLoading] = useState(false)
  const badge = STATUS_BADGE[doc.status]

  async function handle(action: "approved" | "not_uploaded") {
    setLoading(true)
    try {
      await fetch(`/api/broker/contracts/${contractId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ document_key: doc.document_key, action }),
      })
      // Revalidate broker contracts
      mutate("/api/broker/contracts")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all",
      doc.status === "approved" ? "border-emerald-500/10 bg-emerald-500/[0.03]" :
      doc.status === "uploaded" ? "border-amber-500/15 bg-amber-500/[0.04]" :
      "border-white/[0.05] bg-white/[0.02]"
    )}>
      <div className="shrink-0">{badge.icon}</div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", doc.status === "approved" ? "text-slate-400 line-through" : "text-white")}>
          {doc.document_name}
        </p>
        {doc.file_name && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{doc.file_name}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1", badge.className)}>
          {badge.icon}
          {badge.label}
        </span>

        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        ) : (
          <>
            {(doc.status === "uploaded" || (!doc.is_required && doc.status === "not_uploaded")) && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => handle("approved")}
                  className="h-6 px-2 text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  onClick={() => handle("not_uploaded")}
                  className="h-6 px-2 text-[11px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                >
                  <X className="h-3 w-3 mr-1" />
                  {doc.status === "uploaded" ? "Reject" : "Deny"}
                </Button>
              </div>
            )}
            {doc.status === "approved" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handle("not_uploaded")}
                className="h-6 px-2 text-[11px] text-slate-500 hover:text-rose-400"
              >
                Revoke
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CheckSentButton({ contractId, onSuccess }: { contractId: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleCheckSent() {
    setLoading(true)
    try {
      const res = await fetch(`/api/broker/contracts/${contractId}/check-sent`, { method: "POST", credentials: "include" })
      if (res.ok) {
        setDone(true)
        onSuccess()
        mutate("/api/broker/contracts")
        // Invalidate earnings for any agentId
        mutate((key: unknown) => typeof key === "string" && key.startsWith("/api/agent/earnings"), undefined, { revalidate: true })
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="text-[11px] text-cyan-400 flex items-center gap-1 shrink-0">
        <Mail className="h-3 w-3" /> Sent
      </span>
    )
  }

  return (
    <Button
      size="sm"
      onClick={handleCheckSent}
      disabled={loading}
      className="h-7 px-3 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 gap-1.5 shrink-0"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
      Check Sent
    </Button>
  )
}

function TransactionFolder({ contract }: { contract: Contract }) {
  const [open, setOpen] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(contract.payment_status)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch(`/api/broker/contracts/${contract.id}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Upload failed")
      }
      toast.success(`${file.name} uploaded successfully`)
      mutate("/api/broker/contracts")
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }
  const pendingCount = contract.contract_documents.filter((d) => d.status === "uploaded").length
  const risk = RISK_CONFIG[contract.risk_status] ?? RISK_CONFIG.green

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
      >
        <ChevronRight className={cn("h-4 w-4 text-slate-500 shrink-0 transition-transform", open && "rotate-90")} />
        {open ? (
          <FolderOpen className="h-4 w-4 text-cyan-400 shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-cyan-400/70 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white truncate">{contract.property_address}</span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border capitalize", TYPE_COLORS[contract.transaction_type])}>
              {contract.transaction_type}
            </span>
            {pendingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                {pendingCount} pending
              </span>
            )}
            {paymentStatus === "pending" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                <DollarSign className="h-2.5 w-2.5" />
                Pay Requested
              </span>
            )}
            {paymentStatus === "sent" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 flex items-center gap-1">
                <Mail className="h-2.5 w-2.5" />
                Check Sent
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="h-3 w-3" />
              {contract.client_name}
            </div>
            <div className={cn("flex items-center gap-1 text-xs", risk.className)}>
              {risk.icon}
              {risk.label}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 font-semibold">{contract.progress_percent}%</p>
            <div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  contract.progress_percent === 100 ? "bg-emerald-500" :
                  contract.progress_percent >= 50 ? "bg-amber-500" : "bg-cyan-500"
                )}
                style={{ width: `${contract.progress_percent}%` }}
              />
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.04] px-4 pb-4 pt-3 space-y-2">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
            <span>Document Progress</span>
            <span className="text-white font-medium">{contract.progress_percent}%</span>
          </div>
          <Progress value={contract.progress_percent} className="h-1.5 mb-4 bg-white/10" />

          {/* Pay requested banner + Check Sent button */}
          {paymentStatus === "pending" && (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-400">Payment Requested</p>
                  <p className="text-[11px] text-slate-500">Agent is awaiting disbursement.</p>
                </div>
              </div>
              <CheckSentButton contractId={contract.id} onSuccess={() => setPaymentStatus("sent")} />
            </div>
          )}

          {paymentStatus === "sent" && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.05] mb-3">
              <Mail className="h-4 w-4 text-cyan-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-cyan-400">Check Sent</p>
                <p className="text-[11px] text-slate-500">Agent has been notified their check is on the way.</p>
              </div>
            </div>
          )}

          {contract.contract_documents.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No documents on this contract yet.</p>
          ) : (
            <div className="space-y-1.5">
              {contract.contract_documents.map((doc) => (
                <DocApprovalRow key={doc.document_key} doc={doc} contractId={contract.id} />
              ))}
            </div>
          )}

          {/* Additional files section */}
          <div className="mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Additional Files</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                {uploading ? "Uploading..." : "Upload File"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {contract.contract_deal_specific_docs.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-3">No additional files uploaded yet.</p>
            ) : (
              <div className="space-y-1.5">
                {contract.contract_deal_specific_docs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/[0.05] bg-white/[0.02]">
                    <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="text-sm text-slate-300 truncate flex-1">{doc.document_name}</span>
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-cyan-400 hover:text-cyan-300 transition-colors"
                        title="Open file"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AgentFolder({ group }: { group: AgentGroup }) {
  const [open, setOpen] = useState(false)
  const totalPending = group.contracts.reduce(
    (sum, c) => sum + c.contract_documents.filter((d) => d.status === "uploaded").length,
    0
  )
  const activeContracts = group.contracts.filter((c) => c.status === "active").length

  return (
    <div className="border border-white/[0.08] rounded-xl overflow-hidden">
      {/* Agent folder header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors text-left"
      >
        <ChevronRight className={cn("h-4 w-4 text-slate-500 shrink-0 transition-transform", open && "rotate-90")} />
        {open ? (
          <FolderOpen className="h-5 w-5 text-violet-400 shrink-0" />
        ) : (
          <Folder className="h-5 w-5 text-violet-400/70 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{group.agent.Name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{group.agent.Email}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
            {group.contracts.length} transaction{group.contracts.length !== 1 ? "s" : ""}
          </span>
          {totalPending > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 font-medium">
              {totalPending} to review
            </span>
          )}
          {activeContracts > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              {activeContracts} active
            </span>
          )}
        </div>
      </button>

      {/* Transaction folders inside agent folder */}
      {open && (
        <div className="border-t border-white/[0.04] px-4 pb-4 pt-3 space-y-2">
          {group.contracts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No contracts submitted yet.</p>
          ) : (
            group.contracts.map((contract) => (
              <TransactionFolder key={contract.id} contract={contract} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface BrokerContractsFolderProps {
  agents?: { id: string; Name: string; Email: string }[]
}

export function BrokerContractsFolder({ agents = [] }: BrokerContractsFolderProps) {
  const { data, isLoading } = useSWR("/api/broker/contracts", fetcher, { revalidateOnFocus: true })
  const [addOpen, setAddOpen] = useState(false)

  const groups: AgentGroup[] = data?.grouped ?? []
  const total = data?.total ?? 0
  const totalPending = groups.reduce(
    (sum, g) => sum + g.contracts.reduce(
      (s, c) => s + c.contract_documents.filter((d) => d.status === "uploaded").length, 0
    ), 0
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary bar + Add button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 px-1">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Home className="h-4 w-4 text-slate-500" />
            <span className="text-white font-medium">{total}</span> total contracts
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className={cn("font-medium", totalPending > 0 ? "text-amber-400" : "text-slate-400")}>
              {totalPending}
            </span>
            <span className="text-slate-500">awaiting review</span>
          </div>
        </div>

        {agents.length > 0 && (
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Contract
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 border border-white/[0.06] rounded-xl bg-white/[0.02]">
          <Folder className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No contracts submitted yet</p>
          <p className="text-sm text-slate-500 mt-1">Agent contracts will appear here once submitted.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <AgentFolder key={group.agent.id} group={group} />
          ))}
        </div>
      )}

      <BrokerAddContractDialog
        agents={agents}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  )
}
