import { createServiceClient } from "@/lib/supabase/server"

export type DocumentHistoryAction = "uploaded" | "approved" | "rejected" | "revoked"

export type DocumentHistoryEntry = {
  contractId: string
  documentKey?: string | null
  documentName?: string | null
  docType?: "required" | "deal_specific"
  action: DocumentHistoryAction
  fileUrl?: string | null
  fileName?: string | null
  actorId?: string | null
  actorName?: string | null
  reason?: string | null
}

// Append-only audit log. Failures are logged but never block the main request.
export async function recordDocumentHistory(entry: DocumentHistoryEntry) {
  try {
    const service = createServiceClient()
    const { error } = await service.from("contract_document_history").insert({
      contract_id: entry.contractId,
      document_key: entry.documentKey ?? null,
      document_name: entry.documentName ?? null,
      doc_type: entry.docType ?? "required",
      action: entry.action,
      file_url: entry.fileUrl ?? null,
      file_name: entry.fileName ?? null,
      actor_id: entry.actorId ?? null,
      actor_name: entry.actorName ?? null,
      reason: entry.reason || null,
    })
    if (error) console.error("Failed to record document history:", error.message)
  } catch (err) {
    console.error("Failed to record document history:", err)
  }
}
