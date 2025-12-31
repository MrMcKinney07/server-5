import { requireAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { PrestigeDashboard } from "@/components/prestige/prestige-dashboard"
import { PrizesShowcase } from "@/components/rewards/prizes-showcase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Gift } from "lucide-react"

export default async function PrestigePage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  const seasonXP = agent.exp_season || 0
  const bankXP = agent.exp_bank || 0
  const totalXP = seasonXP + bankXP

  const currentSeason = new Date().toISOString().slice(0, 7) // YYYY-MM format

  const { data: recentEvents } = await supabase
    .from("xp_events")
    .select("*")
    .eq("user_id", agent.id)
    .eq("season_id", currentSeason)
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: recentLedger } = await supabase
    .from("xp_ledger")
    .select("*")
    .eq("user_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Prestige & Rewards</h1>
        <p className="text-slate-400 mt-1">Track your performance, earn XP, and redeem amazing prizes</p>
      </div>

      <Tabs defaultValue="prestige" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger
            value="prestige"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Prestige System
          </TabsTrigger>
          <TabsTrigger
            value="prizes"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
          >
            <Gift className="h-4 w-4 mr-2" />
            Prize Shop
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prestige" className="space-y-6">
          <PrestigeDashboard
            agent={agent}
            seasonXP={seasonXP}
            bankXP={bankXP}
            prestigeTier={agent.prestige_tier || 1}
            prestigeIconUrl={agent.prestige_icon_url}
            recentEvents={recentEvents || []}
            recentLedger={recentLedger || []}
          />
        </TabsContent>

        <TabsContent value="prizes" className="space-y-6">
          <PrizesShowcase totalXP={totalXP} seasonXP={seasonXP} bankXP={bankXP} agentId={agent.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
