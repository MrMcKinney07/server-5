"use client"

import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPrestigeTierInfo } from "@/lib/xp-constants"

interface UserBadgeNameProps {
  name: string
  email?: string
  avatarUrl?: string | null
  prestigeTier: number
  showName?: boolean
  size?: "sm" | "md" | "lg"
}

export function UserBadgeName({
  name,
  email,
  avatarUrl,
  prestigeTier,
  showName = true,
  size = "md",
}: UserBadgeNameProps) {
  const tierInfo = getPrestigeTierInfo(prestigeTier)

  const sizeClasses = {
    sm: { avatar: "h-8 w-8", badge: "h-5 w-5", text: "text-sm" },
    md: { avatar: "h-10 w-10", badge: "h-6 w-6", text: "text-base" },
    lg: { avatar: "h-12 w-12", badge: "h-8 w-8", text: "text-lg" },
  }

  const classes = sizeClasses[size]

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Avatar className={classes.avatar}>
          <AvatarImage src={avatarUrl || undefined} alt={name} />
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div
          className={`absolute -bottom-1 -right-1 ${classes.badge} rounded-full bg-slate-900 p-0.5 ring-2 ring-slate-800`}
        >
          <Image
            src={tierInfo.icon || "/placeholder.svg"}
            alt={tierInfo.name}
            width={32}
            height={32}
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
