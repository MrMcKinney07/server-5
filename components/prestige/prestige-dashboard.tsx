"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, Coins, Calendar, ArrowRight, Star, Zap, Clock } from "lucide-react"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

const PRESTIGE_TIERS = [
  {
    name: "Bronze",
    minLevel: 1,
    maxLevel: 9,
    color: "from-amber-700 to-amber-900",
    textColor: "text-amber-600",
    logo: "/images/3c16b4fb-dbe6-4656-a916.jpeg",
  },
  {
    name: "Silver",
    minLevel: 10,
    maxLevel: 24,
    color: "from-slate-400 to-slate-600",
    textColor: "text-slate-400",
    logo: "/images/f2bb9722-b820-4840-9c40.jpeg",
  },
  {
    name: "Gold",
    minLevel: 25,
    maxLevel: 49,
    color: "from-amber-400 to-amber-600",
    textColor: "text-amber-400",
    logo: "/images/819b9862-0cd7-4d17-8f1b.jpeg",
  },
  {
    name: "Platinum",
    minLevel: 50,
    maxLevel: 99,
    color: "from-slate-300 to-blue-400",
    textColor: "text-blue-300",
    logo: "/images/f2bb9722-b820-4840-9c40.jpeg",
  },
  {
    name: "Diamond",
    minLevel: 100,
    maxLevel: 999,
    color: "from-blue-400 to-purple-500",
    textColor: "text-blue-400",
    logo: "/images/04e7c452-75ef-424e-9c71.jpeg",
  },
]

function getPrestigeTier(level: number) {
  return PRESTIGE_TIERS.find((tier) => level >= tier.minLevel && level <= tier.maxLevel) || PRESTIGE_TIERS[0]
}

interface PrestigeDashboardProps {
  agent: any
  seasonXP: number
  bankXP: number
  prestigeTier: number
  prestigeIconUrl?: string | null
  recentEvents: any[]
  recentLedger: any[]
}

export function PrestigeDashboard({
  agent,
  seasonXP,
  bankXP,
  prestigeTier,
  prestigeIconUrl,
  recentEvents,
  recentLedger,
}: PrestigeDashboardProps) {
  const [isCashingOut, setIsCashingOut] = useState(false)

  const level = Math.floor(bankXP / 1000) + 1
  const progressToNext = bankXP % 1000
  const progressPercent = (progressToNext / 1000) * 100

  const currentTier =
    PRESTIGE_TIERS.find((t) => t.minLevel <= prestigeTier && prestigeTier <= t.maxLevel) || PRESTIGE_TIERS[0]
  const nextTierIndex = PRESTIGE_TIERS.findIndex((t) => t.name === currentTier.name) + 1
  const nextTier = PRESTIGE_TIERS[nextTierIndex]

  const handleCashOut = async () => {
    if (seasonXP === 0) return

    setIsCashingOut(true)
    try {
      const response = await fetch("/api/prestige/cash-out", {
        method: "POST",
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Cash out failed:", error)
    } finally {
      setIsCashingOut(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br ${currentTier.color} opacity-20 rounded-full blur-3xl`}
          />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${currentTier.color} opacity-50 rounded-full blur-xl`}
            />
            <Image
              src={prestigeIconUrl || currentTier.logo || "/placeholder.svg"}
              alt={currentTier.name}
              width={140}
              height={140}
              className="relative rounded-full border-4 border-white/10"
            />
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Badge className={`bg-gradient-to-r ${currentTier.color} text-white border-0`}>
                {currentTier.name} Tier
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                Level {level}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {agent?.first_name || agent?.FirstName || "Agent"}'s Prestige
            </h1>
            <p className="text-slate-400">{bankXP.toLocaleString()} lifetime XP banked</p>
            {nextTier && (
              <p className="text-sm text-slate-500 mt-2">
                {(nextTier.minLevel * 1000 - bankXP).toLocaleString()} XP until {nextTier.name} tier
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-cyan-500/20 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                </div>
                <span className="text-sm font-medium text-slate-300">Season XP</span>
              </div>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                Current Season
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">{seasonXP.toLocaleString()}</div>
              <p className="text-xs text-slate-400">Resets on the 1st of each month</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/20 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Coins className="h-5 w-5 text-amber-400" />
                </div>
                <span className="text-sm font-medium text-slate-300">XP Bank</span>
              </div>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                Level {level}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">{bankXP.toLocaleString()}</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Progress to Level {level + 1}</span>
                  <span>
                    {progressToNext}/{1000}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Cash Out Card */}
        <Card className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-500/20 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <span className="text-sm font-medium text-slate-300">Cash Out</span>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Transfer your season XP to your permanent XP bank at month end.</p>
              <Button
                onClick={handleCashOut}
                disabled={seasonXP === 0 || isCashingOut}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
              >
                {isCashingOut ? (
                  <>Processing...</>
                ) : (
                  <>
                    Cash Out {seasonXP.toLocaleString()} XP
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-700/50">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-amber-400" />
            Prestige Tier Progression
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {PRESTIGE_TIERS.map((tier, index) => {
              const isCurrentTier = tier.name === currentTier.name
              const isUnlocked = prestigeTier >= tier.minLevel
              return (
                <div
                  key={tier.name}
                  className={`relative flex flex-col items-center p-4 rounded-xl border transition-all ${
                    isCurrentTier
                      ? "bg-gradient-to-br from-slate-800 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/20"
                      : isUnlocked
                        ? "bg-slate-800/50 border-slate-700/50"
                        : "bg-slate-900/50 border-slate-800/50 opacity-50"
                  }`}
                >
                  {isCurrentTier && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-500 rounded-full text-xs font-bold text-black">
                      CURRENT
                    </div>
                  )}
                  <div className="relative w-16 h-16 mb-2">
                    {isUnlocked ? (
                      <Image
                        src={tier.logo || "/placeholder.svg"}
                        alt={tier.name}
                        width={64}
                        height={64}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                        <span className="text-2xl">🔒</span>
                      </div>
                    )}
                  </div>
                  <span className={`font-bold ${isUnlocked ? tier.textColor : "text-slate-600"}`}>{tier.name}</span>
                  <span className="text-xs text-slate-500">Lvl {tier.minLevel}+</span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Level Progress Bar */}
      <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-700/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400" />
                Level Progress
              </h2>
              <p className="text-sm text-slate-400 mt-1">Level up by cashing out season XP</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${currentTier.textColor}`}>Level {level}</div>
              <div className="text-xs text-slate-400">{(1000 - progressToNext).toLocaleString()} XP to next level</div>
            </div>
          </div>

          <div className="relative">
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full bg-gradient-to-r ${currentTier.color} transition-all duration-500 relative`}
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>Level {level}</span>
              <span>{progressToNext.toLocaleString()} / 1,000 XP</span>
              <span>Level {level + 1}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-700/50">
        <div className="p-6">
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
              <TabsTrigger value="events">
                <Zap className="h-4 w-4 mr-2" />
                Season Events
              </TabsTrigger>
              <TabsTrigger value="ledger">
                <Coins className="h-4 w-4 mr-2" />
                Bank Transactions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-3 mt-4">
              {recentEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No XP events this season yet</div>
              ) : (
                recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <Star className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{event.reason}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-cyan-400">+{event.amount.toLocaleString()}</div>
                      <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="ledger" className="space-y-3 mt-4">
              {recentLedger.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No bank transactions yet</div>
              ) : (
                recentLedger.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          entry.kind === "EARN"
                            ? "bg-green-500/20"
                            : entry.kind === "REDEEM"
                              ? "bg-red-500/20"
                              : "bg-amber-500/20"
                        }`}
                      >
                        <Coins
                          className={`h-4 w-4 ${
                            entry.kind === "EARN"
                              ? "text-green-400"
                              : entry.kind === "REDEEM"
                                ? "text-red-400"
                                : "text-amber-400"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-white">{entry.note || "Transaction"}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          entry.kind === "EARN"
                            ? "text-green-400"
                            : entry.kind === "REDEEM"
                              ? "text-red-400"
                              : "text-amber-400"
                        }`}
                      >
                        {entry.amount > 0 ? "+" : ""}
                        {entry.amount.toLocaleString()}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          entry.kind === "EARN"
                            ? "border-green-500/30 text-green-400"
                            : entry.kind === "REDEEM"
                              ? "border-red-500/30 text-red-400"
                              : "border-amber-500/30 text-amber-400"
                        }`}
                      >
                        {entry.kind}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  )
}
