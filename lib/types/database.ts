// Database types for McKinney One CRM

export type AgentRole = "agent" | "broker"
export type AgentSegment = "new" | "seasoned"

export interface Agent {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  role: AgentRole
  segment: AgentSegment
  tier: number
  is_active: boolean
  created_at: string
  team_id?: string | null
  exp?: number
}

export type ContactType = "buyer" | "seller" | "both" | "investor" | "referral" | "other"

export interface Contact {
  id: string
  agent_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  contact_type: ContactType
  source: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "nurturing"
  | "active"
  | "under_contract"
  | "closed_won"
  | "closed_lost"
export type LeadType = "buyer" | "seller" | "both" | "investor" | "renter"

export interface Lead {
  id: string
  agent_id: string
  contact_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  source: string
  status: LeadStatus
  lead_type: LeadType
  notes: string | null
  property_interest: string | null
  budget_min: number | null
  budget_max: number | null
  timeline: string | null
  next_follow_up: string | null
  last_contacted_at: string | null
  created_at: string
  updated_at: string
}

export type ActivityType = "call" | "email" | "text" | "meeting" | "showing" | "note" | "task" | "follow_up"

export interface Activity {
  id: string
  agent_id: string
  contact_id: string | null
  lead_id: string | null
  activity_type: ActivityType
  subject: string | null
  description: string | null
  completed: boolean
  due_at: string | null
  completed_at: string | null
  created_at: string
}

export interface MissionTemplate {
  id: string
  title: string
  description: string | null
  points: number
  category: "prospecting" | "follow_up" | "learning" | "marketing" | "general"
  requires_photo: boolean
  is_active: boolean
  created_at: string
}

export interface AgentMission {
  id: string
  agent_id: string
  template_id: string
  mission_date: string
  status: "pending" | "in_progress" | "completed" | "skipped"
  photo_url: string | null
  notes: string | null
  completed_at: string | null
  points_earned: number
  created_at: string
}

export interface AgentMissionWithTemplate extends AgentMission {
  template?: MissionTemplate
}

export type TransactionType = "buy" | "sell" | "dual" | "lease"
export type TransactionStatus = "pending" | "under_contract" | "closed" | "cancelled" | "fell_through"

export interface Transaction {
  id: string
  agent_id: string
  contact_id: string | null
  lead_id: string | null
  property_address: string
  transaction_type: TransactionType
  status: TransactionStatus
  sale_price: number | null
  commission_rate: number
  gross_commission: number | null
  agent_split: number | null
  agent_commission: number | null
  broker_commission: number | null
  closing_date: string | null
  contract_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CommissionPlan {
  id: string
  name: string
  description: string | null
  split_percentage: number
  cap_amount: number | null
  monthly_fee: number
  transaction_fee: number
  is_default: boolean
  is_active: boolean
  created_at: string
}

export interface AgentCommissionPlan {
  id: string
  agent_id: string
  plan_id: string
  effective_date: string
  cap_progress: number
  ytd_gci: number
  created_at: string
}

export interface AgentCommissionPlanWithDetails extends AgentCommissionPlan {
  plan?: CommissionPlan
  agent?: Agent
}

// Extended types with relations
export interface LeadWithContact extends Lead {
  contact?: Contact | null
}

export interface ContactWithRelations extends Contact {
  leads?: Lead[]
  activities?: Activity[]
}

export interface TransactionWithRelations extends Transaction {
  contact?: Contact | null
  lead?: Lead | null
  agent?: Agent
}

export type LeadSource = "realtor" | "upnest" | "opcity" | "fb_ads" | "manual" | "referral" | "website" | "other"

export interface Property {
  id: string
  mls_id: string | null
  address: string
  city: string
  state: string
  zip: string
  price: number
  beds: number
  baths: number
  sqft: number
  status: PropertyStatus
  thumbnail_url: string | null
  description: string | null
  created_at: string
}

export interface SavedSearch {
  id: string
  agent_id: string | null
  contact_id: string | null
  name: string
  query: PropertySearchQuery
  created_at: string
}

export interface FavoriteProperty {
  id: string
  contact_id: string
  property_id: string
  saved_by_agent_id: string | null
  created_at: string
}

export type PropertyStatus = "active" | "pending" | "sold"

export interface PropertySearchQuery {
  location?: string
  city?: string
  zip?: string
  minPrice?: number
  maxPrice?: number
  minBeds?: number
  maxBeds?: number
  minBaths?: number
  maxBaths?: number
  minSqft?: number
  maxSqft?: number
  status?: PropertyStatus
}

// Extended types with relations
export interface FavoritePropertyWithDetails extends FavoriteProperty {
  property?: Property
}

export interface DealFinancials {
  id: string
  transaction_id: string
  agent_id: string
  sale_price: number | null
  commission_rate: number
  gross_commission: number
  split_percent: number
  agent_share: number
  broker_share: number
  transaction_fee: number
  e_and_o_fee: number
  tech_fee: number
  other_fees: number
  fee_notes: string | null
  net_agent_amount: number
  ytd_gci_before: number
  applied_to_cap: number
  closed_date: string | null
  created_at: string
  updated_at: string
}

export interface DealFinancialsWithRelations extends DealFinancials {
  transaction?: Transaction
  agent?: Agent
}

export interface AgentAnnualSummary {
  id: string
  agent_id: string
  year: number
  total_gci: number
  total_agent_earnings: number
  total_broker_share: number
  total_fees_paid: number
  cap_amount: number | null
  amount_toward_cap: number
  cap_reached_date: string | null
  is_capped: boolean
  total_deals: number
  total_volume: number
  updated_at: string
}

export interface AgentAnnualSummaryWithAgent extends AgentAnnualSummary {
  agent?: Agent
}

// Recruiting & Pod Structure types
export interface Team {
  id: string
  name: string
  leader_agent_id: string | null
  description: string | null
  created_at: string
}

export interface TeamWithLeader extends Team {
  leader?: Agent | null
  members?: Agent[]
}

export type RecruitStatus = "prospecting" | "contacted" | "meeting" | "offer" | "signed" | "lost"

export interface Recruit {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  current_brokerage: string | null
  status: RecruitStatus
  sponsor_agent_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RecruitWithSponsor extends Recruit {
  sponsor_agent?: Agent | null
}

// Knowledge Base types
export type ArticleCategory = "lead_handling" | "listings" | "transactions" | "open_house" | "training" | "general"

export interface KnowledgeArticle {
  id: string
  title: string
  slug: string
  content: string
  category: ArticleCategory
  related_mission_template_id: string | null
  related_transaction_stage: string | null
  is_published: boolean
  created_by_agent_id: string | null
  created_at: string
  updated_at: string
}

export interface KnowledgeArticleWithRelations extends KnowledgeArticle {
  created_by_agent?: Agent | null
  related_mission_template?: MissionTemplate | null
}

// Gamification types
export type BadgeType =
  | "mission_streak_7"
  | "mission_streak_30"
  | "lead_slayer"
  | "follow_up_king"
  | "first_close"
  | "top_producer"
  | "response_time_champion"
  | "recruitment_star"

export interface Badge {
  id: string
  type: BadgeType
  name: string
  description: string
  icon_url: string | null
  xp_reward: number
  created_at: string
}

export interface AgentBadge {
  id: string
  agent_id: string
  badge_id: string
  earned_at: string
}

export interface AgentBadgeWithDetails extends AgentBadge {
  badge?: Badge
  agent?: Agent
}

export interface AgentXP {
  id: string
  agent_id: string
  total_xp: number
  level: number
  raffle_tickets: number
  updated_at: string
}

export interface Competition {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  metric: string // e.g., "missions_completed", "leads_closed", "response_time"
  prize_description: string | null
  is_active: boolean
  created_at: string
}

export interface CompetitionEntry {
  id: string
  competition_id: string
  agent_id: string
  score: number
  rank: number | null
  updated_at: string
}

export interface CompetitionEntryWithDetails extends CompetitionEntry {
  competition?: Competition
  agent?: Agent
}
