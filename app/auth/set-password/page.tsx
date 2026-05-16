"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, User, Phone, MapPin, CheckCircle2, Eye, EyeOff } from "lucide-react"

export default function SetPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"password" | "contact">("password")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Password step
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Contact step
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")

  const passwordStrength = (() => {
    if (password.length === 0) return null
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "w-1/4" }
    if (score === 2) return { label: "Fair", color: "bg-amber-500", width: "w-2/4" }
    if (score === 3) return { label: "Good", color: "bg-blue-500", width: "w-3/4" }
    return { label: "Strong", color: "bg-emerald-500", width: "w-full" }
  })()

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }
    setIsLoading(false)
    setStep("contact")
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address, city, state, zip, must_change_password: false }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save profile")
      }
      router.push("/auth/launching")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipContact = async () => {
    setIsLoading(true)
    try {
      await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ must_change_password: false }),
      })
    } catch {
      // best effort — don't block navigation
    }
    router.push("/auth/launching")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/m1-crm-logo-bottom-left.png"
            alt="M1 CRM"
            width={72}
            height={72}
            className="drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]"
          />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${step === "password" ? "text-cyan-400" : "text-emerald-400"}`}>
            {step === "contact" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-cyan-400" />
              </div>
            )}
            New Password
          </div>
          <div className="w-12 h-px bg-slate-700" />
          <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${step === "contact" ? "text-cyan-400" : "text-slate-600"}`}>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${step === "contact" ? "border-cyan-400" : "border-slate-700"}`}>
              {step === "contact" && <div className="h-2 w-2 rounded-full bg-cyan-400" />}
            </div>
            Contact Info
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {step === "password" ? (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <KeyRound className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-white">Set Your Password</h1>
                    <p className="text-sm text-slate-400">Choose a secure password for your account</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      className="bg-slate-800/60 border-white/[0.08] text-white placeholder:text-slate-500 pr-10 focus:border-cyan-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {passwordStrength && (
                    <div className="space-y-1">
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`} />
                      </div>
                      <p className="text-xs text-slate-400">
                        Strength: <span className={`font-medium ${passwordStrength.color.replace("bg-", "text-")}`}>{passwordStrength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                      className="bg-slate-800/60 border-white/[0.08] text-white placeholder:text-slate-500 pr-10 focus:border-cyan-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 font-semibold"
                >
                  {isLoading ? "Saving..." : "Set Password & Continue"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-white">Your Contact Info</h1>
                    <p className="text-sm text-slate-400">You can update this anytime in Settings</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Full Name
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="bg-slate-800/60 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone Number
                  </Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="bg-slate-800/60 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Address
                  </Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address"
                    className="bg-slate-800/60 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-amber-500/50"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="bg-slate-800/60 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-amber-500/50"
                    />
                    <Input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      maxLength={2}
                      className="bg-slate-800/60 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-amber-500/50 uppercase"
                    />
                    <Input
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="ZIP"
                      className="bg-slate-800/60 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/20 font-semibold"
                >
                  {isLoading ? "Saving..." : "Save & Enter Dashboard"}
                </Button>

                <button
                  type="button"
                  onClick={handleSkipContact}
                  disabled={isLoading}
                  className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors py-1"
                >
                  Skip for now
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          McKinney Realty Co. &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
