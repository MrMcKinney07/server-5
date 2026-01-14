"use client"

import { useState } from "react"
import { Trophy, Flame, TrendingUp, Zap, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

const PRESTIGE_TIERS = [
  {
    name: "Bronze",
    minLevel: 1,
    maxLevel: 1,
    logo: "/images/3c16b4fb-dbe6-4656-a916.jpeg",
  },
  {
    name: "Silver",
    minLevel: 2,
    maxLevel: 5,
    logo: "/images/f2bb9722-b820-4840-9c40.jpeg",
  },
  {
    name: "Gold",
    minLevel: 6,
    maxLevel: 10,
    logo: "/images/819b9862-0cd7-4d17-8f1b.jpeg",
  },
  {
    name: "Platinum",
    minLevel: 11,
    maxLevel: 15,
    logo: "/images/f2bb9722-b820-4840-9c40.jpeg",
  },
  {
    name: "Diamond",
    minLevel: 16,
    maxLevel: 999,
    logo: "/images/04e7c452-75ef-424e-9c71.jpeg",
  },
]

const RANK_FRAMES = {
  1: "/images/rank-frames/rank-1.png", // Golden with white diamonds and wings
  2: "/images/rank-frames/rank-2.png", // Bronze with red rubies and wings
  3: "/images/rank-frames/rank-3.png", // Silver with blue sapphires and wings
  4: "/images/rank-frames/rank-4.png", // Dark gunmetal with subtle wings
  5: "/images/rank-frames/rank-5.png", // Warm gold with M1 logos
}

function getPrestigeTier(level: number) {
  return PRESTIGE_TIERS.find((tier) => level >= tier.minLevel && level <= tier.maxLevel) || PRESTIGE_TIERS[0]
}

interface LeaderboardEntry {
  id: string
  name: string
  points: number
  level?: number
  profilePicture?: string | null
  isCurrentUser?: boolean
}

interface OfficeLeaderboardHeroProps {
  leaderboard: LeaderboardEntry[]
  currentUserId: string
  currentUserRank: number
  currentUserPoints: number
}

export function OfficeLeaderboardHero({
  leaderboard,
  currentUserId,
  currentUserRank,
  currentUserPoints,
}: OfficeLeaderboardHeroProps) {
  const [showAll, setShowAll] = useState(false)

  if (leaderboard.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 mb-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 rounded-full mb-3">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">Office Leaderboard</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-1">This Month's Top Performers</h2>
            <p className="text-slate-400">Complete missions to climb the ranks</p>
          </div>
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">Complete missions to appear on the leaderboard</p>
          </div>
        </div>
      </div>
    )
  }

  const top5 = leaderboard.slice(0, 5)
  const rest = showAll ? leaderboard.slice(5) : leaderboard.slice(5, 10)
  const hasMoreThan10 = leaderboard.length > 10

  const first = top5[0] || null
  const second = top5[1] || null
  const third = top5[2] || null
  const fourth = top5[3] || null
  const fifth = top5[4] || null

  const renderPodiumEntry = (entry: LeaderboardEntry | null, actualRank: number) => {
    if (!entry) {
      return (
        <div className="flex flex-col items-center opacity-30">
          <div className="w-12 h-12 rounded-xl bg-slate-700/30 flex items-center justify-center mb-2">
            <Trophy className="h-5 w-5 text-slate-600" />
          </div>
          <p className="text-slate-600 text-xs">Waiting...</p>
        </div>
      )
    }

    const isFirst = actualRank === 1
    const isCurrentUser = entry.id === currentUserId
    const tier = getPrestigeTier(entry.level || 1)

    const containerSize = 80
    const profileSize = containerSize * 0.38

    const rankColors: { [key: number]: string } = {
      1: "bg-amber-500 text-white",
      2: "bg-slate-400 text-white",
      3: "bg-orange-600 text-white",
      4: "bg-slate-600 text-white",
      5: "bg-slate-700 text-white",
    }

    return (
      <div key={entry.id} className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm mb-1 ${rankColors[actualRank] || "bg-slate-700 text-white"}`}
        >
          {actualRank}
        </div>

        <div className="relative mb-1">
          <Image
            src={tier.logo || "/placeholder.svg"}
            alt={tier.name}
            width={20}
            height={20}
            className="rounded-full"
          />
        </div>

        <div className="relative mb-2 group">
          <div
            className="relative flex items-center justify-center"
            style={{
              width: containerSize,
              height: containerSize,
            }}
          >
            <div
              className="absolute rounded-full overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center"
              style={{
                width: profileSize,
                height: profileSize,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              {entry.profilePicture ? (
                <Image
                  src={entry.profilePicture || "/placeholder.svg"}
                  alt={entry.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-white font-bold" style={{ fontSize: profileSize * 0.45 }}>
                  {entry.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {isCurrentUser && (
              <div
                className="absolute rounded-full ring-4 ring-cyan-400"
                style={{
                  width: profileSize + 8,
                  height: profileSize + 8,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}

            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={RANK_FRAMES[actualRank as keyof typeof RANK_FRAMES] || "/placeholder.svg"}
                alt={`Rank ${actualRank} frame`}
                fill
                className="object-contain pointer-events-none z-20"
              />
            </div>
          </div>

          {isFirst && (
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-amber-500/50 z-30">
              <Zap className="h-2.5 w-2.5 text-white fill-white" />
            </div>
          )}
        </div>

        <p
          className={`font-semibold text-center max-w-[70px] truncate text-xs ${
            isCurrentUser ? "text-cyan-400" : "text-white"
          }`}
        >
          {entry.name}
          {isCurrentUser && " (You)"}
        </p>

        <div
          className={`flex items-center gap-1 mt-0.5 ${
            isFirst
              ? "text-amber-300"
              : actualRank === 2
                ? "text-slate-300"
                : actualRank === 3
                  ? "text-orange-400"
                  : "text-slate-400"
          }`}
        >
          <Flame className="h-3 w-3" />
          <span className="font-bold text-xs">{entry.points}</span>
          <span className="text-[10px] opacity-70">pts</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 mb-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-amber-500/5 to-transparent rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 rounded-full mb-3">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-medium">Office Leaderboard</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">This Month's Top Performers</h2>
          <p className="text-slate-400 text-sm">Complete missions to climb the ranks</p>
        </div>

        <div className="flex justify-center items-end gap-4 mb-6">
          {renderPodiumEntry(first, 1)}
          {renderPodiumEntry(second, 2)}
          {renderPodiumEntry(third, 3)}
          {renderPodiumEntry(fourth, 4)}
          {renderPodiumEntry(fifth, 5)}
        </div>

        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
            {rest.map((entry, index) => {
              const rank = index + 6
              const isCurrentUser = entry.id === currentUserId
              const tier = getPrestigeTier(entry.level || 1)
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${
                    isCurrentUser ? "bg-cyan-500/20 border border-cyan-500/30" : "bg-white/5 border border-white/10"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                    {rank}
                  </div>
                  <Image
                    src={tier.logo || "/placeholder.svg"}
                    alt={tier.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isCurrentUser ? "text-cyan-300" : "text-white"}`}>
                      {entry.name}
                      {isCurrentUser && " (You)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Flame className="h-3.5 w-3.5" />
                    <span className="font-semibold">{entry.points} pts</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {(hasMoreThan10 || leaderboard.length > 5) && (
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show All ({leaderboard.length} agents)
                </>
              )}
            </Button>
          </div>
        )}

        {currentUserRank > 10 && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-cyan-500/20 border border-cyan-500/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-cyan-500/30 flex items-center justify-center text-lg font-bold text-cyan-300">
                {currentUserRank}
              </div>
              <div className="text-left">
                <p className="text-cyan-300 font-medium">Your Rank</p>
                <div className="flex items-center gap-1 text-slate-400">
                  <Flame className="h-3.5 w-3.5" />
                  <span className="font-semibold">{currentUserPoints} pts</span>
                </div>
              </div>
              <TrendingUp className="h-5 w-5 text-cyan-400 ml-2" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
