// Database types for McKinney One CRM

export type AgentRole = "agent" | "admin"
export type AgentSegment = "new" | "seasoned"

export interface Agent {
  id: string
  full_name: string | null
  email: string
  role: AgentRole
  segment: AgentSegment
  tier: number
  is_active: boolean
  created_at: string
}

export type LeadSource = "realtor" | "upnest" | "opcity" | "fb_ads" | "manual" | "referral" | "website" | "other"
export type LeadStatus =
  | "new"
  | "assigned"
  | "unclaimed_expired"
  | "claimed"
  | "contacted"
  | "nurture"
  | "closed"
  | "lost"

export interface Contact {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  primary_agent_id: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  contact_id: string
  source: LeadSource
  assigned_agent_id: string | null
  status: LeadStatus
  created_at: string
  assigned_at: string | null
  claim_expires_at: string | null
  claimed_at: string | null
  notes: string | null
  raw_payload: Record<string, unknown> | null
  failed_claim_attempts: number
}

export type ActivityType = "note" | "call" | "text" | "email" | "status_change" | "mission" | "assignment" | "other"

export interface Activity {
  id: string
  contact_id: string
  lead_id: string | null
  agent_id: string
  type: ActivityType
  description: string
  created_at: string
}

// Extended types with relations
export interface LeadWithContact extends Lead {
  contact: Contact
  assigned_agent?: Agent | null
}

export interface ContactWithRelations extends Contact {
  primary_agent?: Agent | null
  leads?: Lead[]
  activities?: Activity[]
}

export interface ActivityWithRelations extends Activity {
  agent?: Agent
  lead?: Lead
}

export type MissionSegment = "new" | "seasoned" | "all"
export type MissionSetSegment = "new" | "seasoned" | "custom"

export interface MissionTemplate {
  id: string
  title: string
  description: string | null
  segment: MissionSegment
  is_active: boolean
  created_at: string
}

export interface MissionSet {
  id: string
  name: string
  segment: MissionSetSegment
  description: string | null
  created_at: string
}

export interface MissionSetItem {
  id: string
  mission_set_id: string
  mission_template_id: string
  weight: number
}

export interface AgentDailyMission {
  id: string
  agent_id: string
  date: string
  mission1_template_id: string
  mission2_template_id: string
  mission3_template_id: string
  mission1_completed: boolean
  mission2_completed: boolean
  mission3_completed: boolean
  released_at: string | null
  created_at: string
}

export interface MonthlyAgentStats {
  id: number
  agent_id: string
  year: number
  month: number
  total_points: number
  rank: number | null
  updated_at: string
}

export interface LeadAssignState {
  id: number
  year: number
  month: number
  last_rank_assigned: number
  updated_at: string
}

// Extended types with relations
export interface MissionSetWithItems extends MissionSet {
  items?: (MissionSetItem & { mission_template?: MissionTemplate })[]
}

export interface AgentDailyMissionWithTemplates extends AgentDailyMission {
  mission1_template?: MissionTemplate
  mission2_template?: MissionTemplate
  mission3_template?: MissionTemplate
  agent?: Agent
}

export type CampaignStepActionType = "email" | "sms" | "task"

export interface Campaign {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_by_agent_id: string | null
  created_at: string
}

export interface CampaignStep {
  id: string
  campaign_id: string
  step_number: number
  delay_minutes: number
  action_type: CampaignStepActionType
  subject: string | null
  body: string
  created_at: string
}

export interface CampaignEnrollment {
  id: string
  campaign_id: string
  contact_id: string
  lead_id: string | null
  agent_id: string
  enrolled_at: string
  is_paused: boolean
  completed_at: string | null
  last_step_executed: number
  created_at: string
}

// Extended types with relations
export interface CampaignWithSteps extends Campaign {
  steps?: CampaignStep[]
  created_by_agent?: Agent | null
}

export interface CampaignEnrollmentWithRelations extends CampaignEnrollment {
  campaign?: Campaign
  contact?: Contact
  agent?: Agent
}

export type PropertyStatus = "active" | "pending" | "sold"

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

export type TransactionStatus = "new" | "in_progress" | "pending_broker_review" | "closed" | "cancelled"
export type TransactionActivityType =
  | "note"
  | "call"
  | "text"
  | "email"
  | "status_change"
  | "mission"
  | "assignment"
  | "transaction_created"
  | "other"

export interface Transaction {
  id: string
  lead_id: string | null
  contact_id: string
  property_id: string | null
  agent_id: string
  status: TransactionStatus
  external_system: string | null
  external_id: string | null
  broker_notes: string | null
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface TransactionWithRelations extends Transaction {
  lead?: Lead | null
  contact?: Contact
  property?: Property | null
  agent?: Agent
}

// Commission & Financials types
export interface CommissionPlan {
  id: string
  name: string
  description: string | null
  default_split_percent: number
  annual_cap: number | null
  transaction_fee: number
  e_and_o_fee: number
  tech_fee: number
  is_default: boolean
  is_active: boolean
  created_at: string
}

export interface AgentCommissionPlan {
  id: string
  agent_id: string
  commission_plan_id: string | null
  override_split_percent: number | null
  override_annual_cap: number | null
  override_transaction_fee: number | null
  effective_date: string
  created_at: string
}

export interface AgentCommissionPlanWithDetails extends AgentCommissionPlan {
  commission_plan?: CommissionPlan | null
  agent?: Agent
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
