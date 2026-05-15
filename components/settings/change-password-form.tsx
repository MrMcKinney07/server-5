"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"

export function ChangePasswordForm() {
  const [password, setPassword]           = useState("")
  const [confirm, setConfirm]             = useState("")
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [isLoading, setIsLoading]         = useState(false)
  const [message, setMessage]             = useState<{ type: "success" | "error"; text: string } | null>(null)

  const passwordStrength = (() => {
    if (password.length === 0) return null
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    if (score <= 1) return { label: "Weak",   color: "bg-red-500",     text: "text-red-500",     width: "w-1/4" }
    if (score === 2) return { label: "Fair",   color: "bg-amber-500",   text: "text-amber-500",   width: "w-2/4" }
    if (score === 3) return { label: "Good",   color: "bg-blue-500",    text: "text-blue-500",    width: "w-3/4" }
    return               { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500", width: "w-full" }
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match" })
      return
    }
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" })
      return
    }
    setIsLoading(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Password updated successfully!" })
      setPassword("")
      setConfirm("")
    }
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm">New Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {passwordStrength && (
          <div className="space-y-1">
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`} />
            </div>
            <p className="text-xs text-muted-foreground">
              Strength: <span className={`font-medium ${passwordStrength.text}`}>{passwordStrength.label}</span>
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Confirm Password</Label>
        <div className="relative">
          <Input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter new password"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirm && password !== confirm && (
          <p className="text-xs text-red-500">Passwords do not match</p>
        )}
        {confirm && password === confirm && (
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Passwords match
          </p>
        )}
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === "success"
            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
            : "bg-red-500/10 text-red-600 border border-red-500/20"
        }`}>
          {message.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={isLoading} variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50">
        {isLoading ? "Updating..." : "Update Password"}
      </Button>
    </form>
  )
}
