export type DocumentKey = string

export interface DocumentDefinition {
  key: DocumentKey
  name: string
  description: string
  category: string
  isRequired: boolean
  isConditional: boolean
  conditionField?: "has_hoa" | "has_cdd"
  transactionTypes: ("buyer" | "listing" | "referral" | "all")[]
}

export const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  // ── Buyer Core ──────────────────────────────────────────────
  {
    key: "purchase_agreement",
    name: "Purchase Agreement",
    description: "Signed contract between buyer and seller.",
    category: "Buyer Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer"],
  },
  {
    key: "buyer_representation_agreement",
    name: "Buyer Representation Agreement",
    description: "Confirms representation; includes agency disclosure.",
    category: "Buyer Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer"],
  },
  {
    key: "earnest_money_receipt",
    name: "Earnest Money Receipt",
    description: "Proof escrow deposit was submitted.",
    category: "Buyer Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer"],
  },
  {
    key: "lead_based_paint_disclosure",
    name: "Lead-Based Paint Disclosure",
    description: "Required for homes built before 1978.",
    category: "Buyer Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer"],
  },
  {
    key: "buyer_closing_disclosure",
    name: "Closing Disclosure",
    description: "Final financial settlement breakdown.",
    category: "Buyer Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer"],
  },

  // ── Listing Core ─────────────────────────────────────────────
  {
    key: "listing_agreement",
    name: "Listing Agreement",
    description: "Contract authorizing marketing and sale of the property.",
    category: "Listing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },
  {
    key: "property_disclosure",
    name: "Property Disclosure",
    description: "Seller disclosure of known property condition issues.",
    category: "Listing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },
  {
    key: "commission_agreement",
    name: "Commission Agreement",
    description: "Defines brokerage and agent compensation.",
    category: "Listing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },

  // ── Disclosures (Listing) ────────────────────────────────────
  {
    key: "flood_disclosure",
    name: "Flood Disclosure",
    description: "Required based on property location and flood zone status.",
    category: "Disclosures",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },
  {
    key: "hoa_disclosure",
    name: "HOA Disclosure",
    description: "Required when the property is part of an HOA.",
    category: "Disclosures",
    isRequired: false,
    isConditional: true,
    conditionField: "has_hoa",
    transactionTypes: ["listing", "buyer"],
  },
  {
    key: "cdd_disclosure",
    name: "CDD Disclosure",
    description: "Required when the property is part of a CDD.",
    category: "Disclosures",
    isRequired: false,
    isConditional: true,
    conditionField: "has_cdd",
    transactionTypes: ["listing", "buyer"],
  },

  // ── Closing / ALTA ───────────────────────────────────────────
  {
    key: "alta_settlement_statement",
    name: "ALTA Settlement Statement",
    description: "Final closing breakdown.",
    category: "Closing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "closing_disclosure",
    name: "Closing Disclosure",
    description: "Lender settlement summary.",
    category: "Closing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "deed",
    name: "Deed",
    description: "Ownership transfer document.",
    category: "Closing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "title_commitment",
    name: "Title Commitment",
    description: "Title insurance verification.",
    category: "Closing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "escrow_instructions",
    name: "Escrow Instructions",
    description: "Rules for handling of funds.",
    category: "Closing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "commission_disbursement_auth",
    name: "Commission Disbursement Authorization",
    description: "Agent payment breakdown.",
    category: "Closing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },

  // ── Referral ─────────────────────────────────────────────────
  {
    key: "referral_agreement",
    name: "Referral Agreement",
    description: "Broker/agent referral contract.",
    category: "Referral Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["referral"],
  },
  {
    key: "commission_split_agreement",
    name: "Commission Split Agreement",
    description: "Defines payout structure.",
    category: "Referral Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["referral"],
  },
  {
    key: "referral_acknowledgment",
    name: "Referral Acknowledgment",
    description: "Acceptance confirmation.",
    category: "Referral Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["referral"],
  },
  {
    key: "payment_tracking_record",
    name: "Payment Tracking Record",
    description: "Referral commission status.",
    category: "Referral Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["referral"],
  },

  // ── Party ID ─────────────────────────────────────────────────
  {
    key: "buyer_id",
    name: "Buyer Government ID",
    description: "Driver's License, Passport, or State ID. Required for compliance.",
    category: "Party Identification",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer"],
  },
  {
    key: "seller_id",
    name: "Seller Government ID",
    description: "Driver's License, Passport, or State ID. Required for title and compliance.",
    category: "Party Identification",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },

  // ── Other ────────────────────────────────────────────────────
  {
    key: "other_documents",
    name: "Other Documents",
    description: "Additional files not covered above (addendums, special instructions, unique paperwork).",
    category: "Other Documents",
    isRequired: false,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
]

export function getDocumentsForContract(
  transactionType: "buyer" | "listing" | "referral",
  hasHoa: boolean,
  hasCdd: boolean,
): DocumentDefinition[] {
  return DOCUMENT_DEFINITIONS.filter((doc) => {
    if (!doc.transactionTypes.includes(transactionType) && !doc.transactionTypes.includes("all")) return false
    if (doc.isConditional) {
      if (doc.conditionField === "has_hoa" && !hasHoa) return false
      if (doc.conditionField === "has_cdd" && !hasCdd) return false
    }
    return true
  })
}

export function calculateProgress(
  documents: { status: string; is_required: boolean; is_conditional: boolean; condition_field?: string | null }[],
  hasHoa: boolean,
  hasCdd: boolean,
): number {
  const applicable = documents.filter((doc) => {
    if (doc.is_conditional) {
      if (doc.condition_field === "has_hoa" && !hasHoa) return false
      if (doc.condition_field === "has_cdd" && !hasCdd) return false
    }
    return true
  })
  if (applicable.length === 0) return 0
  const completed = applicable.filter((d) => d.status === "approved").length
  return Math.round((completed / applicable.length) * 100)
}

export function getProgressLabel(percent: number): string {
  if (percent === 0) return "Not Started"
  if (percent < 50) return "In Progress"
  if (percent < 100) return "Nearly Complete"
  return "Fully Compliant"
}
