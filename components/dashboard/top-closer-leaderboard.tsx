"use client"

import Image from "next/image"
import { Trophy, TrendingUp, DollarSign, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Closer {
  agentId: string
  name: string
  profilePicture: string | null
  closedCount: number
  closedVolume: number
  isCurrentUser: boolean
}

interface TopCloserLeaderboardProps {
  closers: Closer[]
  currentUserId: string
  quarter: number
  year: number
}

function formatVolume(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

function getQuarterEnd(quarter: number, year: number) {
  // Q1=Mar31, Q2=Jun30, Q3=Sep30, Q4=Dec31
  const month = quarter * 3 // 3, 6, 9, 12
  return new Date(year, month, 0) // last day of the quarter's last month
}

function daysUntilReset(quarter: number, year: number) {
  const end = getQuarterEnd(quarter, year)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"]
const MEDAL_COLORS = [
  "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "text-slate-300 bg-slate-300/10 border-slate-300/30",
  "text-amber-600 bg-amber-600/10 border-amber-600/30",
]

function AgentAvatar({ name, profilePicture, size = "md" }: { name: string; profilePicture: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: 32, md: 40, lg: 56 }
  const px = sizeMap[size]
  const textSize = size === "lg" ? "text-lg" : size === "md" ? "text-sm" : "text-xs"
  const initial = name?.charAt(0)?.toUpperCase() || "?"

  if (profilePicture) {
    return (
      <div
        className="rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10"
        style={{ width: px, height: px }}
      >
        <Image
          src={profilePicture}
          alt={name}
          width={px}
          height={px}
          unoptimized
          className="object-cover w-full h-full"
        />
      </div>
    )
  }

  return (
    <div
      className={`rounded-full flex-shrink-0 flex items-center justify-center font-bold bg-slate-700 text-slate-300 border-2 border-white/10 ${textSize}`}
      style={{ width: px, height: px }}
    >
      {initial}
    </div>
  )
}

export function TopCloserLeaderboard({ closers, currentUserId, quarter, year }: TopCloserLeaderboardProps) {
  const daysLeft = daysUntilReset(quarter, year)
  const quarterLabel = QUARTER_LABELS[quarter - 1] ?? `Q${quarter}`
  const podium = closers.slice(0, 3)
  const rest = closers.slice(3)

  return (
    <Card className="bg-slate-900 border-slate-700 text-white overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-700/60">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-amber-400" />
            Top Closers
            <Badge className="bg-amber-400/10 text-amber-400 border border-amber-400/30 font-semibold">
              {quarterLabel} {year}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <RefreshCw className="h-3.5 w-3.5" />
            {daysLeft > 0 ? (
              <span>Resets in <span className="text-white font-semibold">{daysLeft} days</span></span>
            ) : (
              <span className="text-amber-400 font-semibold">Resetting now</span>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">Ranked by closed deals this quarter. Scores reset each new quarter.</p>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {closers.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Trophy className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No closed deals recorded yet this quarter.</p>
            <p className="text-xs mt-1">Be the first to close!</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {podium.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {/* 2nd place first, 1st in center, 3rd last for podium look */}
                {[1, 0, 2].map((i) => {
                  const closer = podium[i]
                  if (!closer) return <div key={i} />
                  const rank = i + 1
                  const isYou = closer.isCurrentUser
                  return (
                    <div
                      key={closer.agentId}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                        rank === 1
                          ? "bg-amber-400/5 border-amber-400/25 scale-105 origin-bottom"
                          : "bg-slate-800/60 border-slate-700/50"
                      }`}
                    >
                      <div className="relative">
                        <AgentAvatar name={closer.name} profilePicture={closer.profilePicture} size={rank === 1 ? "lg" : "md"} />
                        <span
                          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border ${MEDAL_COLORS[i] || "text-white bg-slate-700 border-slate-600"}`}
                        >
                          {rank}
                        </span>
                      </div>
                      <div className="text-center min-w-0 w-full">
                        <p className={`text-xs font-semibold truncate ${isYou ? "text-cyan-400" : "text-white"}`}>
                          {isYou ? "YOU" : closer.name.split(" ")[0]}
                        </p>
                        <p className="text-lg font-bold text-amber-400">{closer.closedCount}</p>
                        <p className="text-xs text-slate-400">closes</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatVolume(closer.closedVolume)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Ranked list — 4th+ */}
            {rest.length > 0 && (
              <div className="space-y-1.5">
                {rest.map((closer, i) => {
                  const rank = i + 4
                  const isYou = closer.isCurrentUser
                  return (
                    <div
                      key={closer.agentId}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                        isYou ? "bg-cyan-500/10 border border-cyan-500/25" : "bg-slate-800/40 border border-slate-700/30"
                      }`}
                    >
                      <span className="w-5 text-center text-xs text-slate-500 font-medium">{rank}</span>
                      <AgentAvatar name={closer.name} profilePicture={closer.profilePicture} size="sm" />
                      <p className={`flex-1 text-sm font-medium truncate ${isYou ? "text-cyan-400" : "text-slate-200"}`}>
                        {isYou ? `${closer.name} (You)` : closer.name}
                      </p>
                      <div className="flex items-center gap-3 text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <TrendingUp className="h-3 w-3" />
                          <span className="font-semibold text-white">{closer.closedCount}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatVolume(closer.closedVolume)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
