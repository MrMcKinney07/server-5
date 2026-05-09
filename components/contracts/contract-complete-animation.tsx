"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface ContractCompleteAnimationProps {
  onDismiss: () => void
}

export function ContractCompleteAnimation({ onDismiss }: ContractCompleteAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      color: string
      size: number
      gravity: number
      decay: number
      alpha: number
    }[] = []

    const colors = [
      "#22d3ee", "#10b981", "#f59e0b", "#f43f5e",
      "#8b5cf6", "#ffffff", "#06b6d4", "#34d399",
    ]

    function burst(x: number, y: number, count: number) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() * Math.PI * 2)
        const speed = Math.random() * 12 + 2
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 6 + 2,
          gravity: 0.25,
          decay: 0.97,
          alpha: 1,
        })
      }
    }

    // Initial burst from multiple points
    const w = canvas.width
    const h = canvas.height
    burst(w * 0.3, h * 0.4, 80)
    burst(w * 0.7, h * 0.35, 80)
    burst(w * 0.5, h * 0.5, 100)
    setTimeout(() => burst(w * 0.2, h * 0.3, 60), 300)
    setTimeout(() => burst(w * 0.8, h * 0.3, 60), 500)
    setTimeout(() => burst(w * 0.5, h * 0.2, 80), 700)

    let rafId: number
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity
        p.vx *= p.decay
        p.vy *= p.decay
        p.alpha *= 0.985

        ctx!.globalAlpha = p.alpha
        ctx!.fillStyle = p.color
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fill()

        if (p.alpha < 0.02) particles.splice(i, 1)
      }
      ctx!.globalAlpha = 1
      if (particles.length > 0) {
        rafId = requestAnimationFrame(draw)
      }
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [])

  function handleDismiss() {
    onDismiss()
    router.push("/dashboard/contracts")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-white mb-2">
          Great job! Your hard earned cash is on the way.
        </h2>
        <p className="text-slate-400 text-sm mb-8">
          All required documents are complete. This contract is fully compliant.
        </p>

        <Button
          onClick={handleDismiss}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8"
        >
          Back to Contracts
        </Button>
      </div>
    </div>
  )
}
