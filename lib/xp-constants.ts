export const PRESTIGE_TIERS = {
  1: {
    name: "Bronze",
    min: 0,
    max: 999,
    icon: "/images/3c16b4fb-dbe6-4656-a916.jpeg",
    color: "from-amber-700 to-amber-900",
  },
  2: {
    name: "Silver",
    min: 1000,
    max: 4999,
    icon: "/images/f2bb9722-b820-4840-9c40.jpeg",
    color: "from-slate-300 to-slate-500",
  },
  3: {
    name: "Gold",
    min: 5000,
    max: 9999,
    icon: "/images/819b9862-0cd7-4d17-8f1b.jpeg",
    color: "from-amber-400 to-yellow-600",
  },
  4: {
    name: "Platinum",
    min: 10000,
    max: 24999, // Updated max to 24,999 since Diamond starts at 25k
    icon: "/images/f2bb9722-b820-4840-9c40.jpeg",
    color: "from-slate-400 to-slate-600",
  },
  5: {
    name: "Diamond",
    min: 25000, // Updated min to 25,000 as requested
    max: Number.POSITIVE_INFINITY,
    icon: "/images/04e7c452-75ef-424e-9c71.jpeg",
    color: "from-cyan-400 to-blue-600",
  },
} as const

export function getPrestigeTier(lifetimeXP: number): number {
  if (lifetimeXP >= 25000) return 5 // Updated to 25,000 for Diamond tier
  if (lifetimeXP >= 10000) return 4
  if (lifetimeXP >= 5000) return 3
  if (lifetimeXP >= 1000) return 2
  return 1
}

export function getPrestigeTierInfo(tier: number) {
  return PRESTIGE_TIERS[tier as keyof typeof PRESTIGE_TIERS] || PRESTIGE_TIERS[1]
}

export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 1000) + 1
}

export function getXPForNextLevel(currentXP: number): number {
  const currentLevel = getLevelFromXP(currentXP)
  return currentLevel * 1000
}

export function getXPProgressInLevel(currentXP: number): {
  current: number
  needed: number
  percentage: number
} {
  const level = getLevelFromXP(currentXP)
  const xpForCurrentLevel = (level - 1) * 1000
  const xpForNextLevel = level * 1000
  const current = currentXP - xpForCurrentLevel
  const needed = xpForNextLevel - xpForCurrentLevel

  return {
    current,
    needed,
    percentage: (current / needed) * 100,
  }
}
