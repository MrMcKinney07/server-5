"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { Agent } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Camera, CheckCircle2, AlertCircle } from "lucide-react"

interface AgentProfileFormProps {
  agent: Agent
}

export function AgentProfileForm({ agent }: AgentProfileFormProps) {
  const [fullName, setFullName]               = useState(agent.Name || "")
  const [phone, setPhone]                     = useState(agent.Phone || "")
  const [address, setAddress]                 = useState((agent as any).address || "")
  const [city, setCity]                       = useState((agent as any).city || "")
  const [agentState, setAgentState]           = useState((agent as any).state || "")
  const [zip, setZip]                         = useState((agent as any).zip || "")
  const [bio, setBio]                         = useState((agent as any).bio || "")
  const [profilePicture, setProfilePicture]   = useState((agent as any).profile_picture_url || "")
  const [isLoading, setIsLoading]             = useState(false)
  const [isUploadingPicture, setIsUploadingPicture] = useState(false)
  const [message, setMessage]                 = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef                          = useRef<HTMLInputElement>(null)
  const router                                = useRouter()

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingPicture(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/profile-picture/upload", { method: "POST", body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Upload failed")
      setProfilePicture(data.url)
      setMessage({ type: "success", text: "Profile picture updated!" })
      router.refresh()
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to upload image" })
    } finally {
      setIsUploadingPicture(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    fullName,
          phone:   phone,
          address: address,
          city:    city,
          state:   agentState,
          zip:     zip,
          bio:     bio,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update profile")
      setMessage({ type: "success", text: "Profile updated successfully!" })
      router.refresh()
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update profile. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center space-y-3">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-blue-500/30 shadow-lg">
            {profilePicture ? (
              <Image src={profilePicture} alt={fullName} width={96} height={96} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold">
                {initials || "?"}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPicture}
            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-lg transition-colors disabled:opacity-50"
          >
            {isUploadingPicture ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" />
        <p className="text-xs text-muted-foreground">Click the camera icon to change photo</p>
      </div>

      {/* Name + Phone */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-sm">Full Name</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm">Phone</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label className="text-sm">Street Address</Label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5 col-span-1">
          <Label className="text-sm">City</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tampa" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">State</Label>
          <Input value={agentState} onChange={(e) => setAgentState(e.target.value)} placeholder="FL" maxLength={2} className="uppercase" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">ZIP</Label>
          <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="33601" />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label className="text-sm">Bio</Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short bio about yourself..."
          rows={3}
          className="resize-none"
        />
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === "success"
            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
            : "bg-red-500/10 text-red-600 border border-red-500/20"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}
