"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, Calendar, Star, Zap, Clock, ShoppingBag } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const PRESTIGE_TIERS = [
  {
    name: "Bronze",
    minXP: 0,
    maxXP: 999,
    color: "from-amber-700 to-amber-900",
    textColor: "text-amber-600",
    logo: "/images/3c16b4fb-dbe6-4656-a916.jpeg",
  },
  {
    name: "Silver",
    minXP: 1000,
    maxXP: 4999,
    color: "from-slate-400 to-slate-600",
    textColor: "text-slate-400",
    logo: "/images/f2bb9722-b820-4840-9c40.jpeg",
  },
  {
    name: "Gold",
    minXP: 5000,
    maxXP: 9999,
    color: "from-amber-400 to-amber-600",
    textColor: "text-amber-400",
    logo: "/images/819b9862-0cd7-4d17-8f1b.jpeg",
  },
  {
    name: "Platinum",
    minXP: 10000,
    maxXP: 24999,
    color: "from-slate-300 to-blue-400",
    textColor: "text-blue-300",
    logo: "/images/f2bb9722-b820-4840-9c40.jpeg",
  },
  {
    name: "Diamond",
    minXP: 25000,
    maxXP: 999999,
    color: "from-blue-400 to-purple-500",
    textColor: "text-blue-400",
    logo: "/images/04e7c452-75ef-424e-9c71.jpeg",
  },
]

function getTierFromXP(xp: number) {
  return PRESTIGE_TIERS.find((tier) => xp >= tier.minXP && xp <= tier.maxXP) || PRESTIGE_TIERS[0]
}

interface PrestigeDashboardProps {
  agent: any
  seasonXP: number
  lifetimeXP: number
  bankXP: number
  prestigeTier: number
  prestigeIconUrl?: string | null
  recentEvents: any[]
  recentLedger?: any[]
}

export function PrestigeDashboard({
  agent,
  seasonXP,
  lifetimeXP,
  bankXP,
  prestigeTier,
  prestigeIconUrl,
  recentEvents,
  recentLedger,
}: PrestigeDashboardProps) {
  const currentTier = getTierFromXP(lifetimeXP)
  const nextTierIndex = PRESTIGE_TIERS.findIndex((t) => t.name === currentTier.name) + 1
  const nextTier = PRESTIGE_TIERS[nextTierIndex]

  // Calculate progress to next tier
  const xpInCurrentTier = lifetimeXP - currentTier.minXP
  const tierRange = currentTier.maxXP - currentTier.minXP + 1
  const progressPercent = Math.min((xpInCurrentTier / tierRange) * 100, 100)

  // Calculate days until season reset
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      {/* Hero Card */}
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
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {agent?.first_name || agent?.FirstName || "Agent"}'s Prestige
            </h1>
            <p className="text-slate-400">{lifetimeXP.toLocaleString()} lifetime XP earned</p>
            {nextTier && (
              <p className="text-sm text-slate-500 mt-2">
                {(nextTier.minXP - lifetimeXP).toLocaleString()} XP until {nextTier.name} tier
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Cards - Now 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Season XP Card */}
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
                Leaderboard
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">{seasonXP.toLocaleString()}</div>
              <p className="text-xs text-slate-400">
                Resets in {daysUntilReset} day{daysUntilReset !== 1 ? "s" : ""} (1st of month)
              </p>
            </div>
          </div>
        </Card>

        {/* Lifetime XP Card */}
        <Card className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/20 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <span className="text-sm font-medium text-slate-300">Lifetime XP</span>
              </div>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                Prestige
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">{lifetimeXP.toLocaleString()}</div>
              <p className="text-xs text-slate-400">Never resets - determines your tier</p>
            </div>
          </div>
        </Card>

        {/* Spendable XP Card */}
        <Card className="bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 border-emerald-500/20 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <ShoppingBag className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-slate-300">Spendable XP</span>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                Rewards
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">{bankXP.toLocaleString()}</div>
              <p className="text-xs text-slate-400">Available to spend on prizes</p>
            </div>
            <Link href="/dashboard/rewards">
              <Button size="sm" className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Rewards
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Tier Progression */}
      <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-700/50">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-amber-400" />
            Prestige Tier Progression
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {PRESTIGE_TIERS.map((tier) => {
              const isCurrentTier = tier.name === currentTier.name
              const isUnlocked = lifetimeXP >= tier.minXP
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
                  <span className="text-xs text-slate-500">{tier.minXP.toLocaleString()}+ XP</span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Progress Bar */}
      <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-700/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400" />
                Progress to Next Tier
              </h2>
              <p className="text-sm text-slate-400 mt-1">Based on lifetime XP earned</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${currentTier.textColor}`}>{currentTier.name}</div>
              {nextTier && (
                <div className="text-xs text-slate-400">
                  {(nextTier.minXP - lifetimeXP).toLocaleString()} XP to {nextTier.name}
                </div>
              )}
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
              <span>
                {currentTier.name} ({currentTier.minXP.toLocaleString()} XP)
              </span>
              <span>{lifetimeXP.toLocaleString()} XP</span>
              {nextTier && (
                <span>
                  {nextTier.name} ({nextTier.minXP.toLocaleString()} XP)
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* XP History */}
      <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-700/50">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-cyan-400" />
            Recent XP Activity
          </h2>

          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No XP events yet</div>
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
          </div>
        </div>
      </Card>

      {/* Ledger History */}
      {recentLedger && (
        <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-700/50">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-cyan-400" />
              Recent Ledger Activity
            </h2>

            <div className="space-y-3">
              {recentLedger.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No ledger events yet</div>
              ) : (
                recentLedger.map((ledger) => (
                  <div
                    key={ledger.id}
                    className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <Star className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{ledger.reason}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(ledger.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-cyan-400">
                        {ledger.amount > 0 ? `+${ledger.amount.toLocaleString()}` : `${ledger.amount.toLocaleString()}`}
                      </div>
                      <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                        {ledger.type}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
