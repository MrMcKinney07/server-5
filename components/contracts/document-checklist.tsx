"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Upload, Clock, Circle, Plus, X, Loader2, CheckCircle2 } from "lucide-react"

interface ContractDocument {
  id: string
  document_key: string
  document_name: string
  category: string
  status: "not_uploaded" | "uploaded" | "approved"
  file_url: string | null
  file_name: string | null
  is_required: boolean
  is_conditional: boolean
}

interface DealSpecificDoc {
  id: string
  document_name: string
  status: "not_uploaded" | "uploaded" | "approved"
  file_url: string | null
  file_name: string | null
}

interface DocumentChecklistProps {
  contractId: string
  documents: ContractDocument[]
  dealDocs: DealSpecificDoc[]
  hasHoa: boolean
  hasCdd: boolean
  onProgressUpdate: (progress: number) => void
  onComplete: () => void
}

const STATUS_ICONS = {
  not_uploaded: <Circle className="h-4 w-4 text-slate-500" />,
  uploaded: <Clock className="h-4 w-4 text-amber-400" />,
  approved: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
}

const STATUS_COLORS = {
  not_uploaded: "border-white/[0.06] bg-white/[0.02]",
  uploaded: "border-amber-500/20 bg-amber-500/5",
  approved: "border-emerald-500/20 bg-emerald-500/5",
}

const STATUS_LABELS = {
  not_uploaded: "Not uploaded",
  uploaded: "Pending broker review",
  approved: "Approved",
}

function DocRow({
  doc,
  contractId,
  onUpdate,
}: {
  doc: ContractDocument
  contractId: string
  onUpdate: (key: string, status: string, progress: number) => void
}) {
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      // Mark as uploaded (file_name stored, no actual cloud upload in this version)
      const res = await fetch(`/api/contracts/${contractId}/documents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_key: doc.document_key,
          status: "uploaded",
          file_name: file.name,
          file_url: null,
        }),
      })
      const data = await res.json()
      onUpdate(doc.document_key, "uploaded", data.progress ?? 0)
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", STATUS_COLORS[doc.status])}>
      <div className="shrink-0">{STATUS_ICONS[doc.status]}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-sm font-medium", doc.status === "approved" ? "text-slate-400 line-through" : "text-white")}>
            {doc.document_name}
          </span>
          {doc.is_required && doc.status !== "approved" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-white/10">Required</span>
          )}
          {doc.is_conditional && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Conditional</span>
          )}
        </div>
        {doc.file_name && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.file_name}</p>
        )}
        <p className="text-xs text-slate-600 mt-0.5">{STATUS_LABELS[doc.status]}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <>
            {doc.status === "not_uploaded" && (
              <>
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  className="h-7 px-2 text-xs border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload
                </Button>
              </>
            )}
            {doc.status === "uploaded" && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pending Review
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CategorySection({
  category,
  docs,
  contractId,
  onUpdate,
}: {
  category: string
  docs: ContractDocument[]
  contractId: string
  onUpdate: (key: string, status: string, progress: number) => void
}) {
  const [open, setOpen] = useState(true)
  const approvedCount = docs.filter((d) => d.status === "approved").length
  const uploadedCount = docs.filter((d) => d.status === "uploaded").length
  const submittedCount = approvedCount + uploadedCount
  const allApproved = approvedCount === docs.length && docs.length > 0

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">{category}</span>
          <span className="text-xs text-slate-500">{submittedCount}/{docs.length} submitted</span>
          {allApproved ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              All approved
            </span>
          ) : submittedCount === docs.length ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Pending review
            </span>
          ) : null}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-white/[0.04]">
          <div className="pt-3 space-y-2">
            {docs.map((doc) => (
              <DocRow key={doc.document_key} doc={doc} contractId={contractId} onUpdate={onUpdate} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function DocumentChecklist({
  contractId,
  documents: initialDocs,
  dealDocs: initialDealDocs,
  hasHoa,
  hasCdd,
  onProgressUpdate,
  onComplete,
}: DocumentChecklistProps) {
  const [documents, setDocuments] = useState(initialDocs)
  const [dealDocs, setDealDocs] = useState(initialDealDocs)
  const [newDocName, setNewDocName] = useState("")
  const [addingDeal, setAddingDeal] = useState(false)
  const [dealLoading, setDealLoading] = useState(false)
  const dealFileRef = useRef<HTMLInputElement>(null)

  function handleUpdate(key: string, status: string, progress: number) {
    setDocuments((prev) =>
      prev.map((d) => (d.document_key === key ? { ...d, status: status as ContractDocument["status"] } : d))
    )
    onProgressUpdate(progress)

    // Check if all docs are approved
    const updated = documents.map((d) =>
      d.document_key === key ? { ...d, status: status as ContractDocument["status"] } : d
    )
    if (updated.every((d) => d.status === "approved")) {
      onComplete()
    }
  }

  async function handleAddDealDoc() {
    if (!newDocName.trim()) return
    setDealLoading(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_name: newDocName.trim() }),
      })
      const data = await res.json()
      setDealDocs((prev) => [...prev, data])
      setNewDocName("")
      setAddingDeal(false)
    } finally {
      setDealLoading(false)
    }
  }

  // Group documents by category
  const grouped = documents.reduce<Record<string, ContractDocument[]>>((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = []
    acc[doc.category].push(doc)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Deal-Specific Documents */}
      <div className="border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">Deal-Specific Documents</span>
            <span className="text-xs text-slate-500">{dealDocs.length} added</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddingDeal(true)}
            className="h-7 px-2 text-xs border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        {(dealDocs.length > 0 || addingDeal) && (
          <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-2">
            {dealDocs.map((doc) => (
              <div key={doc.id} className={cn("flex items-center gap-3 p-3 rounded-lg border", STATUS_COLORS[doc.status])}>
                <div className="shrink-0">{STATUS_ICONS[doc.status]}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white">{doc.document_name}</span>
                  {doc.file_name && <p className="text-xs text-slate-500 mt-0.5">{doc.file_name}</p>}
                </div>
              </div>
            ))}

            {addingDeal && (
              <div className="flex items-center gap-2">
                <Input
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Document name (e.g. Inspection Report)"
                  onKeyDown={(e) => e.key === "Enter" && handleAddDealDoc()}
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 text-sm h-8"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleAddDealDoc}
                  disabled={dealLoading || !newDocName.trim()}
                  className="h-8 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 shrink-0"
                >
                  {dealLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setAddingDeal(false); setNewDocName("") }}
                  className="h-8 w-8 p-0 text-slate-500 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Standard document categories */}
      {Object.entries(grouped).map(([category, docs]) => (
        <CategorySection
          key={category}
          category={category}
          docs={docs}
          contractId={contractId}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  )
}
