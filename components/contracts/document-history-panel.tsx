"use client"

import { useState } from "react"
import useSWR from "swr"
import { ChevronRight, History, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DocumentViewerDialog } from "@/components/contracts/document-viewer-dialog"

type HistoryRow = {
  id: string
  document_name: string | null
  doc_type: string
  action: "uploaded" | "approved" | "rejected" | "revoked"
  file_url: string | null
  file_name: string | null
  actor_name: string | null
  reason: string | null
  created_at: string
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to load history")
    return r.json()
  })

const ACTION_STYLES: Record<HistoryRow["action"], { label: string; className: string }> = {
  uploaded: { label: "Uploaded", className: "text-cyan-400" },
  approved: { label: "Approved", className: "text-emerald-400" },
  rejected: { label: "Denied", className: "text-red-400" },
  revoked: { label: "Approval revoked", className: "text-amber-400" },
}

export function DocumentHistoryPanel({ contractId }: { contractId: string }) {
  const [open, setOpen] = useState(false)
  const [viewing, setViewing] = useState<{ url: string; title: string; fileName: string | null } | null>(null)
  const { data, error, isLoading } = useSWR<HistoryRow[]>(
    open ? `/api/contracts/${contractId}/history` : null,
    fetcher,
  )

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.04]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
      >
        <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
        <History className="h-3 w-3" />
        Upload History
      </button>

      {open && (
        <div className="mt-2">
          {isLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              <span className="sr-only">Loading history</span>
            </div>
          ) : error ? (
            <p className="text-xs text-red-400 py-2">Could not load history.</p>
          ) : !data || data.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-3">No upload history yet.</p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {data.map((row) => {
                const style = ACTION_STYLES[row.action] ?? { label: row.action, className: "text-slate-400" }
                return (
                  <li key={row.id} className="flex items-start justify-between gap-3 rounded-md bg-white/[0.02] px-3 py-2">
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <p className="text-sm text-slate-200 truncate">
                        <span className={cn("font-medium", style.className)}>{style.label}</span>
                        {" · "}
                        {row.document_name ?? "Document"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(row.created_at).toLocaleString()}
                        {row.actor_name ? ` · ${row.actor_name}` : ""}
                        {row.file_name ? ` · ${row.file_name}` : ""}
                      </p>
                      {row.reason && <p className="text-xs text-slate-400">Reason: {row.reason}</p>}
                    </div>
                    {row.file_url && (
                      <button
                        type="button"
                        onClick={() => setViewing({ url: row.file_url!, title: row.document_name ?? "Document", fileName: row.file_name })}
                        className="shrink-0 text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        View
                      </button>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}

      {viewing && (
        <DocumentViewerDialog
          open={!!viewing}
          onOpenChange={(o) => !o && setViewing(null)}
          title={viewing.title}
          fileUrl={viewing.url}
          fileName={viewing.fileName}
        />
      )}
    </div>
  )
}
