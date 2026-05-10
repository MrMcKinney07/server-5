import { createClient } from "@/lib/supabase/server"
import { getCurrentAgent } from "@/lib/auth"
import { notFound } from "next/navigation"
import { ContractDetailClient } from "@/components/contracts/contract-detail-client"

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const agent = await getCurrentAgent()
  if (!agent) notFound()

  const { data: contract, error } = await supabase
    .from("executed_contracts")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !contract) notFound()

  const { data: documents } = await supabase
    .from("contract_documents")
    .select("*")
    .eq("contract_id", id)
    .order("category")

  const { data: dealDocs } = await supabase
    .from("contract_deal_specific_docs")
    .select("*")
    .eq("contract_id", id)
    .order("created_at")

  return (
    <ContractDetailClient
      contract={contract}
      documents={documents ?? []}
      dealDocs={dealDocs ?? []}
      isAdmin={agent.Role === "admin" || agent.Role === "broker"}
    />
  )
}
