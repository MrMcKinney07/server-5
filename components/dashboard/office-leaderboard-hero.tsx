import { Trophy, Crown, Medal, Award, Flame, TrendingUp } from "lucide-react"
import Image from "next/image"

const PRESTIGE_TIERS = [
  {
    name: "Bronze",
    minLevel: 1,
    maxLevel: 9,
    logo: "/images/3c16b4fb-dbe6-4656-a916.jpeg",
  },
  {
    name: "Silver",
    minLevel: 10,
    maxLevel: 24,
    logo: "/images/f2bb9722-b820-4840-9c40.jpeg",
  },
  {
    name: "Gold",
    minLevel: 25,
    maxLevel: 49,
    logo: "/images/819b9862-0cd7-4d17-8f1b.jpeg",
  },
  {
    name: "Platinum",
    minLevel: 50,
    maxLevel: 99,
    logo: "/images/f2bb9722-b820-4840-9c40.jpeg",
  },
  {
    name: "Diamond",
    minLevel: 100,
    maxLevel: 999,
    logo: "/images/04e7c452-75ef-424e-9c71.jpeg",
  },
]

function getPrestigeTier(level: number) {
  return PRESTIGE_TIERS.find((tier) => level >= tier.minLevel && level <= tier.maxLevel) || PRESTIGE_TIERS[0]
}

interface LeaderboardEntry {
  id: string
  name: string
  points: number
  level?: number
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
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3, 10)

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 mb-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-amber-500/5 to-transparent rounded-full" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 rounded-full mb-3">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-medium">Office Leaderboard</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">This Month's Top Performers</h2>
          <p className="text-slate-400">Complete missions to climb the ranks</p>
        </div>

        {/* Podium - Top 3 */}
        {top3.length >= 3 ? (
          <div className="flex items-end justify-center gap-4 mb-8">
            {podiumOrder.map((entry, displayIndex) => {
              const actualRank = displayIndex === 0 ? 2 : displayIndex === 1 ? 1 : 3
              const isFirst = actualRank === 1
              const isCurrentUser = entry.id === currentUserId
              const tier = getPrestigeTier(entry.level || 1)

              return (
                <div
                  key={entry.id}
                  className={`flex flex-col items-center ${isFirst ? "order-2" : displayIndex === 0 ? "order-1" : "order-3"}`}
                >
                  <div className="relative mb-1">
                    <Image
                      src={tier.logo || "/placeholder.svg"}
                      alt={tier.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>

                  {/* Avatar/Rank Circle */}
                  <div
                    className={`relative mb-2 ${
                      isFirst
                        ? "w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30"
                        : actualRank === 2
                          ? "w-20 h-20 bg-gradient-to-br from-slate-300 to-slate-500 shadow-lg shadow-slate-400/20"
                          : "w-18 h-18 bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg shadow-amber-700/20"
                    } rounded-full flex items-center justify-center ${isCurrentUser ? "ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-900" : ""}`}
                    style={{
                      width: isFirst ? 96 : actualRank === 2 ? 80 : 72,
                      height: isFirst ? 96 : actualRank === 2 ? 80 : 72,
                    }}
                  >
                    {isFirst ? (
                      <Crown className="h-10 w-10 text-white" />
                    ) : actualRank === 2 ? (
                      <Medal className="h-8 w-8 text-white" />
                    ) : (
                      <Award className="h-7 w-7 text-white" />
                    )}
                    {/* Rank badge */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isFirst
                          ? "bg-amber-300 text-amber-900"
                          : actualRank === 2
                            ? "bg-slate-200 text-slate-700"
                            : "bg-amber-700 text-white"
                      }`}
                    >
                      {actualRank}
                    </div>
                  </div>

                  {/* Name */}
                  <p
                    className={`font-semibold text-center max-w-[100px] truncate ${
                      isCurrentUser ? "text-cyan-300" : "text-white"
                    } ${isFirst ? "text-lg" : "text-base"}`}
                  >
                    {entry.name}
                    {isCurrentUser && " (You)"}
                  </p>

                  {/* Points */}
                  <div
                    className={`flex items-center gap-1 mt-1 ${
                      isFirst ? "text-amber-300" : actualRank === 2 ? "text-slate-300" : "text-amber-400"
                    }`}
                  >
                    <Flame className="h-4 w-4" />
                    <span className="font-bold">{entry.points}</span>
                    <span className="text-xs opacity-70">pts</span>
                  </div>

                  {/* Podium base */}
                  <div
                    className={`mt-3 rounded-t-lg ${
                      isFirst
                        ? "w-28 h-20 bg-gradient-to-b from-amber-500/40 to-amber-600/20"
                        : actualRank === 2
                          ? "w-24 h-14 bg-gradient-to-b from-slate-400/40 to-slate-500/20"
                          : "w-22 h-10 bg-gradient-to-b from-amber-700/40 to-amber-800/20"
                    }`}
                    style={{
                      width: isFirst ? 112 : actualRank === 2 ? 96 : 88,
                      height: isFirst ? 80 : actualRank === 2 ? 56 : 40,
                    }}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">Complete missions to appear on the leaderboard</p>
          </div>
        )}

        {/* Rest of leaderboard (4-10) */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
            {rest.map((entry, index) => {
              const rank = index + 4
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
                    <span className="font-semibold">{entry.points}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Current user's rank if not in top 10 */}
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
