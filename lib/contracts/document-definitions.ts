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

  // ── Required for ALL transaction types ───────────────────────
  {
    key: "alta_closing_docs",
    name: "ALTA / Closing Docs",
    description: "Fully executed ALTA settlement statement and all closing documents.",
    category: "Required Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "buyer_broker_listing_agreement",
    name: "Buyer Broker / Listing Agreement",
    description: "Signed buyer brokerage agreement (buyer side) or signed listing agreement (listing side).",
    category: "Required Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "earnest_money_deposit_receipt",
    name: "Earnest Money Deposit Receipt",
    description: "Receipt confirming the earnest money deposit was received by the broker or title company.",
    category: "Required Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "flood_disclosure",
    name: "Flood Disclosure",
    description: "Written flood disclosure required before finalizing the contract.",
    category: "Required Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "hoa_condo_disclosure",
    name: "HOA / Condo Disclosure",
    description: "HOA and/or condo association disclosures including fees, restrictions, and reserve studies if applicable.",
    category: "Required Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "signed_ff",
    name: "Signed FF",
    description: "Signed Form F / Fact Sheet completed and signed by all required parties.",
    category: "Required Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "property_disclosure_signed",
    name: "Property Disclosure Signed",
    description: "Seller's property disclosure signed by all parties acknowledging known material defects.",
    category: "Required Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },
  {
    key: "client_id",
    name: "Client ID",
    description: "Government-issued photo ID (Driver's License, Passport, or State ID) for all parties.",
    category: "Required Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },

  {
    key: "addenda_other_docs",
    name: "Addenda / Other Docs",
    description: "Any addenda, amendments, or supplemental documents related to the transaction.",
    category: "Required Documents",
    isRequired: false,
    isConditional: false,
    transactionTypes: ["buyer", "listing"],
  },

  // ── Listing-only ─────────────────────────────────────────────
  {
    key: "data_entry_form_signed",
    name: "Data Entry Form Signed",
    description: "Completed and signed data entry form required for listing submissions.",
    category: "Listing Documents",
    isRequired: true,
    isConditional: false,
    transactionTypes: ["listing"],
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
