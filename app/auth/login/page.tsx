"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Rocket, Shield, Target, Zap } from "lucide-react"

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
    <div className="flex min-h-screen w-full">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        {/* Geometric shapes */}
        <div className="absolute inset-0">
          {/* Large circle */}
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 blur-3xl" />
          {/* Triangle shape using clip-path */}
          <div
            className="absolute top-1/4 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/40 to-red-500/40"
            style={{ clipPath: "polygon(100% 0, 0% 100%, 100% 100%)" }}
          />
          {/* Small circles */}
          <div className="absolute bottom-32 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400/30 to-teal-500/30 blur-xl" />
          <div className="absolute top-40 right-32 w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400/40 to-orange-500/40 blur-lg" />
          {/* Diagonal lines */}
          <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
          <div className="absolute top-0 left-2/3 w-px h-full bg-gradient-to-b from-transparent via-orange-500/20 to-transparent" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-900 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">M1</span>
            </div>
            <h1 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-4">
              Command
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400">
                Center
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md leading-relaxed">
              Your mission control for real estate success. Track goals, manage leads, and dominate your market.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-slate-300">Daily missions to keep you on track</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-slate-300">Real-time performance analytics</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-slate-300">Secure & enterprise-ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">M1 Command Center</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 p-8 border border-slate-200 dark:border-slate-800">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to access your command center</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="agent@mckinneyone.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20"
                  />
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all duration-200"
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
                    <span className="flex items-center gap-2">
                      <Rocket className="w-4 h-4" />
                      Launch Command Center
                    </span>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/sign-up"
                  className="font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
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
