"use client"

import Image from "next/image"
import { getPrestigeTierInfo } from "@/lib/xp-constants"

interface UserBadgeNameProps {
  name: string
  email?: string
  avatarUrl?: string | null
  prestigeTier: number
  showName?: boolean
  size?: "sm" | "md" | "lg"
}

export function UserBadgeName({ name, email, prestigeTier, showName = true, size = "md" }: UserBadgeNameProps) {
  const tierInfo = getPrestigeTierInfo(prestigeTier)

  const sizeClasses = {
    sm: { logo: "h-8 w-8", text: "text-sm" },
    md: { logo: "h-10 w-10", text: "text-base" },
    lg: { logo: "h-12 w-12", text: "text-lg" },
  }

  const classes = sizeClasses[size]

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`${classes.logo} rounded-full bg-gradient-to-br from-slate-800 to-slate-900 p-1 ring-2 ring-slate-700 shadow-lg`}
        >
          <Image
            src={tierInfo.icon || "/placeholder.svg"}
            alt={tierInfo.name}
            width={48}
            height={48}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </div>
      {showName && (
        <div className="flex flex-col">
          <span className={`font-semibold text-white ${classes.text}`}>{name}</span>
          {email && <span className="text-xs text-slate-400">{email}</span>}
        </div>
      )}
    </div>
  )
}
