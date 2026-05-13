"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Rocket } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/auth/launching")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex overflow-hidden">
      {/* LEFT SIDE - Artsy Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 overflow-hidden">
        {/* Animated fluid background effects */}
        <div className="absolute inset-0">
          {/* Fluid golden wave from bottom */}
          <div className="absolute bottom-0 left-0 w-full h-3/4 bg-gradient-to-t from-amber-500/30 via-orange-400/20 to-transparent opacity-60">
            <div className="absolute inset-0 animate-[pulse_4s_ease-in-out_infinite]">
              <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
                <path d="M0,400 Q300,200 600,350 T1200,300 L1200,800 L0,800 Z" fill="url(#wave1)" opacity="0.3">
                  <animate
                    attributeName="d"
                    dur="10s"
                    repeatCount="indefinite"
                    values="M0,400 Q300,200 600,350 T1200,300 L1200,800 L0,800 Z;
                            M0,350 Q300,250 800,450 T1200,350 L1200,800 L0,800 Z;
                            M0,400 Q300,200 600,350 T1200,300 L1200,800 L0,800 Z"
                  />
                </path>
                <path d="M0,500 Q400,300 800,450 T1200,400 L1200,800 L0,800 Z" fill="url(#wave2)" opacity="0.2">
                  <animate
                    attributeName="d"
                    dur="15s"
                    repeatCount="indefinite"
                    values="M0,500 Q400,300 800,450 T1200,400 L1200,800 L0,800 Z;
                            M0,450 Q400,350 800,500 T1200,450 L1200,800 L0,800 Z;
                            M0,500 Q400,300 800,450 T1200,400 L1200,800 L0,800 Z"
                  />
                </path>
                <defs>
                  <linearGradient id="wave1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#fb923c" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="wave2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Blue ethereal light from top */}
          <div
            className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-blue-400/20 via-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s", animationDuration: "6s" }}
          />

          {/* Floating particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-amber-400/40 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${15 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>

          {/* Geometric grid overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(251,191,36,0.3)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Content - Centered artistic composition */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 xl:p-16 w-full">
          {/* Logo with dramatic glow */}
          <div className="relative mb-12">
            <div className="absolute inset-0 scale-[2.5] bg-gradient-to-b from-amber-400/40 via-orange-500/30 to-transparent blur-3xl rounded-full animate-pulse" />
            <Image
              src="/images/m1-crm-logo-bottom-left.png"
              alt="M1 CRM"
              width={180}
              height={180}
              className="relative drop-shadow-[0_0_60px_rgba(251,191,36,0.8)] animate-[float_6s_ease-in-out_infinite]"
              priority
            />
          </div>

          {/* Artsy typography */}
          <div className="text-center max-w-2xl space-y-6">
            <h1 className="text-6xl xl:text-7xl font-bold leading-tight">
              <span className="block text-white/90 mb-2">Your mission</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 animate-shimmer">
                awaits
              </span>
            </h1>
            <p className="text-xl text-slate-300/80 font-light tracking-wide leading-relaxed">
              The intelligent CRM built for real estate professionals who demand more
            </p>

            {/* Professional feature highlights */}
            <div className="grid grid-cols-2 gap-4 pt-4 text-left">
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <h3 className="text-amber-400 font-semibold text-sm mb-1">Smart Automation</h3>
                <p className="text-slate-400 text-xs">AI-powered drip campaigns that convert</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <h3 className="text-amber-400 font-semibold text-sm mb-1">Lead Intelligence</h3>
                <p className="text-slate-400 text-xs">Real-time insights on every prospect</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <h3 className="text-amber-400 font-semibold text-sm mb-1">Daily Missions</h3>
                <p className="text-slate-400 text-xs">Gamified goals that drive results</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <h3 className="text-amber-400 font-semibold text-sm mb-1">Team Performance</h3>
                <p className="text-slate-400 text-xs">Leaderboards and prestige rewards</p>
              </div>
            </div>

            {/* Abstract decorative elements */}
            <div className="flex items-center justify-center gap-4 pt-6">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
              <div className="w-2 h-2 rounded-full bg-amber-400/60 animate-pulse" />
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
            </div>
          </div>
        </div>

        {/* CSS animations */}
        <style jsx>{`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0px) translateX(0px);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-30px) translateX(10px);
              opacity: 0.6;
            }
          }
          @keyframes shimmer {
            0%,
            100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          .animate-shimmer {
            background-size: 200% auto;
            animation: shimmer 3s ease-in-out infinite;
          }
          .animate-float {
            animation: float linear infinite;
          }
        `}</style>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-4 lg:p-8 relative overflow-hidden">
        {/* Ambient background effects for mobile/right side */}
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-amber-400/15 via-orange-400/8 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-blue-500/15 via-cyan-400/8 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Main content container */}
        <div className="relative z-10 w-full max-w-md flex flex-col">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="relative mb-2">
              <div className="absolute inset-0 scale-150 bg-gradient-to-b from-amber-400/25 via-orange-500/15 to-transparent blur-2xl rounded-full" />
              <Image
                src="/images/m1-crm-logo-bottom-left.png"
                alt="M1 CRM"
                width={100}
                height={100}
                className="relative drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome Back</h1>
            <p className="text-slate-600 text-sm text-center">Sign in to your command center</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-600">Sign in to your command center</p>
          </div>

          {/* Login form card */}
          <div className="w-full bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200 p-8 shadow-xl shadow-gray-200/50">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@mckinneyone.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-gray-50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-gray-50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl transition-all"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all duration-300 hover:shadow-blue-900/30 hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Launching...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Rocket className="w-4 h-4" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-gray-200 text-center">
              <p className="text-sm text-slate-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/sign-up"
                  className="font-medium text-amber-600 hover:text-amber-500 transition-colors"
                >
                  Request Access
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            McKinney Realty Co. &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
