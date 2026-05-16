"use client"

import Image from "next/image"
import { Home, RefreshCw, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ListingAgent {
  agentId: string
  name: string
  profilePicture: string | null
  listingCount: number
  isCurrentUser: boolean
}

interface ListingLeaderboardProps {
  agents: ListingAgent[]
  currentUserId: string
  month: string
  year: number
}

const MEDAL_COLORS = [
  "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "text-slate-300 bg-slate-300/10 border-slate-300/30",
  "text-amber-600 bg-amber-600/10 border-amber-600/30",
]

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

function AgentAvatar({ name, profilePicture, size = "md" }: { name: string; profilePicture: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: 32, md: 40, lg: 56 }
  const px = sizeMap[size]
  const textSize = size === "lg" ? "text-lg" : size === "md" ? "text-sm" : "text-xs"
  const initial = name?.charAt(0)?.toUpperCase() || "?"

  if (profilePicture) {
    return (
      <div className="rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10" style={{ width: px, height: px }}>
        <Image src={profilePicture} alt={name} width={px} height={px} unoptimized className="object-cover w-full h-full" />
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

export function ListingLeaderboard({ agents, currentUserId, month, year }: ListingLeaderboardProps) {
  const monthIndex = parseInt(month, 10) - 1
  const monthLabel = MONTH_NAMES[monthIndex] ?? month

  // Days left in month
  const now = new Date()
  const endOfMonth = new Date(year, monthIndex + 1, 0)
  const daysLeft = Math.max(0, Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const podium = agents.slice(0, 3)
  const rest = agents.slice(3)

  return (
    <Card className="bg-slate-900 border-slate-700 text-white overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-700/60">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <Home className="h-5 w-5 text-emerald-400" />
            Listing Leaders
            <Badge className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 font-semibold">
              {monthLabel} {year}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <RefreshCw className="h-3.5 w-3.5" />
            {daysLeft > 0 ? (
              <span>Resets in <span className="text-white font-semibold">{daysLeft} days</span></span>
            ) : (
              <span className="text-emerald-400 font-semibold">Resetting now</span>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Ranked by listing agreements uploaded this month.
        </p>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {agents.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No listing agreements uploaded yet this month.</p>
            <p className="text-xs mt-1">Upload a listing agreement to get on the board!</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {podium.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[1, 0, 2].map((i) => {
                  const agent = podium[i]
                  if (!agent) return <div key={i} />
                  const rank = i + 1
                  const isYou = agent.isCurrentUser
                  return (
                    <div
                      key={agent.agentId}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                        rank === 1
                          ? "bg-emerald-400/5 border-emerald-400/25 scale-105 origin-bottom"
                          : "bg-slate-800/60 border-slate-700/50"
                      }`}
                    >
                      <div className="relative">
                        <AgentAvatar name={agent.name} profilePicture={agent.profilePicture} size={rank === 1 ? "lg" : "md"} />
                        <span
                          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border ${MEDAL_COLORS[i] || "text-white bg-slate-700 border-slate-600"}`}
                        >
                          {rank}
                        </span>
                      </div>
                      <div className="text-center min-w-0 w-full">
                        <p className={`text-xs font-semibold truncate ${isYou ? "text-cyan-400" : "text-white"}`}>
                          {isYou ? "YOU" : agent.name.split(" ")[0]}
                        </p>
                        <p className="text-lg font-bold text-emerald-400">{agent.listingCount}</p>
                        <p className="text-xs text-slate-400">{agent.listingCount === 1 ? "listing" : "listings"}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Ranked list — 4th+ */}
            {rest.length > 0 && (
              <div className="space-y-1.5">
                {rest.map((agent, i) => {
                  const rank = i + 4
                  const isYou = agent.isCurrentUser
                  return (
                    <div
                      key={agent.agentId}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                        isYou ? "bg-cyan-500/10 border border-cyan-500/25" : "bg-slate-800/40 border border-slate-700/30"
                      }`}
                    >
                      <span className="w-5 text-center text-xs text-slate-500 font-medium">{rank}</span>
                      <AgentAvatar name={agent.name} profilePicture={agent.profilePicture} size="sm" />
                      <p className={`flex-1 text-sm font-medium truncate ${isYou ? "text-cyan-400" : "text-slate-200"}`}>
                        {isYou ? `${agent.name} (You)` : agent.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
                        <Home className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-semibold text-white">{agent.listingCount}</span>
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
