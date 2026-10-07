import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { sendEmail } from "@/lib/email/send-email"
import { NextResponse } from "next/server"

type Action = "approved" | "rejected" | "not_uploaded"

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

// Broker-only: approve, reject (request re-upload), or revoke a document
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const broker = await requireAdmin()
  if (!broker) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: contractId } = await params
  const body = await req.json()
  const document_key: string = body.document_key
  const action: Action = body.action
  const reason: string = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : ""

  if (!document_key || !["approved", "rejected", "not_uploaded"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const update =
    action === "approved"
      ? { status: "approved", uploaded_at: new Date().toISOString() }
      : action === "rejected"
        ? { status: "not_uploaded", uploaded_at: null, file_url: null, file_name: null }
        : { status: "not_uploaded", uploaded_at: null }

  const { data, error } = await supabase
    .from("contract_documents")
    .update(update)
    .eq("contract_id", contractId)
    .eq("document_key", document_key)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalculate progress — only count required docs
  const { data: allDocs } = await supabase
    .from("contract_documents")
    .select("status, is_required")
    .eq("contract_id", contractId)

  const requiredDocs = allDocs?.filter((d) => d.is_required) ?? []
  const total = requiredDocs.length
  const approved = requiredDocs.filter((d) => d.status === "approved").length
  const progress = total > 0 ? Math.round((approved / total) * 100) : 0

  await supabase
    .from("executed_contracts")
    .update({ progress_percent: progress })
    .eq("id", contractId)

  let emailSent: boolean | null = null
  if (action === "rejected") {
    emailSent = await notifyAgentOfRejection(contractId, data.document_name ?? document_key, reason)
  }

  return NextResponse.json({ ...data, progress, emailSent })
}

async function notifyAgentOfRejection(contractId: string, documentName: string, reason: string) {
  const service = createServiceClient()
  const { data: contract } = await service
    .from("executed_contracts")
    .select("agent_id, property_address, client_name")
    .eq("id", contractId)
    .single()
  if (!contract?.agent_id) return false

  const { data: agent } = await service
    .from("agents")
    .select("Name, Email")
    .eq("id", contract.agent_id)
    .single()
  if (!agent?.Email) return false

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
  const contractUrl = `${appUrl}/dashboard/contracts/${contractId}`
  const property = contract.property_address || contract.client_name || "your transaction"
  const firstName = (agent.Name ?? "").split(" ")[0] || "there"

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>The broker reviewed <strong>${escapeHtml(documentName)}</strong> for <strong>${escapeHtml(property)}</strong> and it needs to be re-uploaded.</p>
      ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
      <p>Please upload a corrected copy so it can be approved.</p>
      ${appUrl ? `<p><a href="${contractUrl}" style="display:inline-block;padding:10px 16px;background:#0e7490;color:#fff;text-decoration:none;border-radius:6px">Open contract</a></p>` : ""}
      <p>Thanks,<br/>McKinney Realty Co</p>
    </div>`

  return sendEmail({
    to: agent.Email,
    subject: `Re-upload needed: ${documentName} — ${property}`,
    html,
  })
}
