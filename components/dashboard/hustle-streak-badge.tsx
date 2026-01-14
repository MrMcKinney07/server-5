"use client"

import { useEffect, useState } from "react"
import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HustleStreakBadgeProps {
  initialStreak?: number
  className?: string
}

// Fire colors based on streak intensity
function getFireColor(streak: number) {
  if (streak >= 6) return "from-purple-500 via-pink-500 to-red-500" // Legendary fire
  if (streak >= 5) return "from-blue-400 via-cyan-400 to-teal-400" // Blue fire
  if (streak >= 4) return "from-orange-400 via-amber-500 to-yellow-400" // Hot fire
  if (streak >= 3) return "from-orange-500 via-orange-400 to-amber-400" // Normal fire
  return "from-slate-400 to-slate-500" // No streak (gray)
}

function getFireSize(streak: number) {
  if (streak >= 6) return "h-8 w-8"
  if (streak >= 5) return "h-7 w-7"
  if (streak >= 4) return "h-6 w-6"
  if (streak >= 3) return "h-5 w-5"
  return "h-4 w-4"
}

function getBonusXP(streak: number) {
  if (streak >= 6) return 20
  if (streak >= 5) return 15
  if (streak >= 4) return 10
  if (streak >= 3) return 5
  return 0
}

export function HustleStreakBadge({ initialStreak = 0, className }: HustleStreakBadgeProps) {
  const [streak, setStreak] = useState(initialStreak)
  const [bonusAwarded, setBonusAwarded] = useState(false)
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    // Track login on mount
    async function trackLogin() {
      setIsTracking(true)
      try {
        const res = await fetch("/api/streak/track", { method: "POST" })
        if (res.ok) {
          const data = await res.json()
          setStreak(data.streak)
          if (data.bonusXP > 0 && data.streakContinued && !data.alreadyTracked) {
            setBonusAwarded(true)
          }
        }
      } catch (error) {
        console.error("Error tracking streak:", error)
      } finally {
        setIsTracking(false)
      }
    }

    trackLogin()
  }, [])

  // Only show if streak is 3+ days
  if (streak < 3 && !isTracking) {
    return null
  }

  const bonusXP = getBonusXP(streak)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("relative flex items-center gap-1.5", className)}>
            {/* Animated fire icon */}
            <div className={cn("relative flex items-center justify-center", streak >= 3 && "animate-pulse")}>
              {/* Glow effect */}
              {streak >= 3 && (
                <div
                  className={cn(
                    "absolute inset-0 rounded-full blur-md opacity-50",
                    `bg-gradient-to-t ${getFireColor(streak)}`,
                  )}
                />
              )}

              {/* Fire icon */}
              <div className={cn("relative rounded-full p-1.5 bg-gradient-to-t", getFireColor(streak))}>
                <Flame
                  className={cn("text-white drop-shadow-lg", getFireSize(streak), streak >= 5 && "animate-bounce")}
                />
              </div>
            </div>

            {/* Streak count */}
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold text-white">{streak}</span>
              <span className="text-[10px] text-white/70">day{streak !== 1 ? "s" : ""}</span>
            </div>

            {/* Bonus XP indicator */}
            {bonusAwarded && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                +{bonusXP} XP
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-slate-900 border-slate-700">
          <div className="text-center">
            <p className="font-bold text-white">Hustle Streak: {streak} Days</p>
            {bonusXP > 0 ? (
              <p className="text-xs text-emerald-400">+{bonusXP} XP daily bonus!</p>
            ) : (
              <p className="text-xs text-slate-400">Log in 3 days in a row for bonus XP</p>
            )}
            <div className="mt-2 text-xs text-slate-400">
              <p>3 days: +5 XP | 4 days: +10 XP</p>
              <p>5 days: +15 XP | 6+ days: +20 XP</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
