"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Rocket, Star, Sparkles, Trophy, Target, Zap } from "lucide-react"

export default function LaunchingPage() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Animate progress bar over 3 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 2
      })
    }, 60)

    // Redirect after 3 seconds
    const timeout = setTimeout(() => {
      router.push("/dashboard")
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Pulsing circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-600/10 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 animate-pulse delay-150" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 animate-pulse delay-300" />

        {/* Floating particles */}
        <div className="absolute top-20 left-20 animate-bounce delay-100">
          <Star className="w-6 h-6 text-yellow-400/60" />
        </div>
        <div className="absolute top-32 right-32 animate-bounce delay-200">
          <Sparkles className="w-8 h-8 text-cyan-400/60" />
        </div>
        <div className="absolute bottom-32 left-32 animate-bounce delay-300">
          <Trophy className="w-7 h-7 text-orange-400/60" />
        </div>
        <div className="absolute bottom-20 right-20 animate-bounce delay-500">
          <Target className="w-6 h-6 text-emerald-400/60" />
        </div>
        <div className="absolute top-1/4 right-1/4 animate-bounce delay-700">
          <Zap className="w-5 h-5 text-yellow-400/60" />
        </div>
        <div className="absolute bottom-1/4 left-1/4 animate-bounce delay-100">
          <Star className="w-4 h-4 text-cyan-400/60" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6">
        {/* Animated rocket */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/40 animate-pulse">
            <Rocket className="w-12 h-12 text-white animate-bounce" />
          </div>
          {/* Rocket trail effect */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-16 bg-gradient-to-b from-orange-500/60 via-orange-400/30 to-transparent blur-md animate-pulse" />
        </div>

        {/* Inspirational text */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">Get Ready</h1>
        <h2 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 mb-6 animate-pulse">
          For Greatness
        </h2>
        <p className="text-xl text-slate-400 mb-12 max-w-md mx-auto">Your mission awaits. Time to dominate.</p>

        {/* Progress bar */}
        <div className="w-64 mx-auto">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-3">Launching Command Center...</p>
        </div>
      </div>
    </div>
  )
}
