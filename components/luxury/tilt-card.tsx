"use client"

import { useRef } from "react"
import type { ReactNode } from "react"

export function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    card.style.transform = `rotateX(${y * -10}deg) rotateY(${x * 12}deg) scale3d(1.02, 1.02, 1.02)`
  }

  const handleLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
  }

  return (
    <div className="mrc-tilt-wrap">
      <div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className={`mrc-tilt-card ${className}`}
      >
        <div className="mrc-tilt-inner h-full">{children}</div>
      </div>
    </div>
  )
}
