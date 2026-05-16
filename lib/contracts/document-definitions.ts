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

  // ── Listing Side (Seller) Broker File ────────────────────────
  {
    key: "signed_listing_agreement",
    name: "Signed Listing Agreement",
    description: "Must include a definite expiration date, price, terms, and commission rate.",
    category: "Listing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },
  {
    key: "brokerage_relationship_disclosure",
    name: "Brokerage Relationship Disclosure",
    description: "Required for Single Agent or No Brokerage relationships before or at the time of listing.",
    category: "Listing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },
  {
    key: "sellers_property_disclosure",
    name: "Seller's Property Disclosure",
    description: "Signed by the seller to disclose material defects.",
    category: "Listing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },
  {
    key: "listing_lead_based_paint",
    name: "Lead-Based Paint Disclosure",
    description: "Mandatory for homes built before 1978.",
    category: "Listing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },
  {
    key: "hoa_condo_disclosures",
    name: "HOA / Condo Disclosures",
    description: "Includes the 2025 Milestone Inspection and Structural Integrity Reserve Study for condos if applicable.",
    category: "Listing Documents",
    isRequired: false,
    isConditional: false,
    transactionTypes: ["listing"],
  },
  {
    key: "flood_disclosure",
    name: "Flood Disclosure",
    description: "As of 2026, sellers must provide specific written flood disclosures before finalizing a contract.",
    category: "Listing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },
  {
    key: "hoa_cdd_information",
    name: "HOA / CDD Information Disclosure",
    description: "Restrictions, mandatory memberships, and fees must be disclosed per Florida Statute 720.401.",
    category: "Listing Documents",
    isRequired: false,
    isConditional: false,
    transactionTypes: ["listing"],
  },
  {
    key: "radon_gas_disclosure",
    name: "Radon Gas Disclosure",
    description: "A specific written notification regarding radon gas must be provided to the buyer.",
    category: "Listing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },
  {
    key: "copy_of_deed",
    name: "Copy of the Deed",
    description: "Proves the seller has the legal right to list and sell the property.",
    category: "Listing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },

  // ── Party ID (Listing) ───────────────────────────────────────
  {
    key: "seller_id",
    name: "Seller Government ID",
    description: "Driver's License, Passport, or State ID. Required for title and compliance.",
    category: "Party Identification",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
  },

  // ── Buyer Side Broker File ───────────────────────────────────
  {
    key: "buyer_brokerage_agreement",
    name: "Buyer Brokerage Agreement",
    description: "Per 2024 NAR settlement, a written agreement is required before touring properties.",
    category: "Buyer Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer"],
  },
  {
    key: "purchase_sale_agreement",
    name: "Purchase & Sale Agreement",
    description: "A copy of the fully executed contract (e.g., FAR/BAR \"As-Is\").",
    category: "Buyer Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer"],
  },
  {
    key: "proof_of_funds_preapproval",
    name: "Proof of Funds or Pre-Approval",
    description: "Verifies the buyer's ability to close.",
    category: "Buyer Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer"],
  },
  {
    key: "escrow_deposit_receipt",
    name: "Escrow Deposit Receipt",
    description: "Proof of the earnest money deposit held by the broker or title company.",
    category: "Buyer Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer"],
  },
  // ── Party ID (Buyer) ─────────────────────────────────────────
  {
    key: "buyer_id",
    name: "Buyer Government ID",
    description: "Driver's License, Passport, or State ID. Required for compliance.",
    category: "Party Identification",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer"],
  },

  // ── Closing Documents (Buyer & Listing) ─────────────────────
  {
    key: "closing_fully_executed_alta",
    name: "Fully Executed ALTA Settlement Statement",
    description: "The signed ALTA/HUD closing statement showing all debits, credits, and final figures for both parties.",
    category: "Closing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "closing_addendum",
    name: "Any Addendum",
    description: "All addenda to the purchase contract (repairs, extensions, concessions, etc.) fully executed by all parties.",
    category: "Closing Documents",
    isRequired: false,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "closing_earnest_money_receipt",
    name: "Earnest Money Receipt",
    description: "Official receipt confirming the earnest money deposit was received and applied at closing.",
    category: "Closing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "closing_completed_deed",
    name: "Completed Deed",
    description: "The recorded deed transferring title from seller to buyer, stamped and confirmed by the county.",
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
    description: "Defines the referral payout structure.",
    category: "Referral Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["referral"],
  },
  {
    key: "referral_party_id",
    name: "Referring Party Government ID",
    description: "Driver's License, Passport, or State ID.",
    category: "Party Identification",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["referral"],
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
