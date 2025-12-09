"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import type { Agent } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AgentProfileFormProps {
  agent: Agent
}

export function AgentProfileForm({ agent }: AgentProfileFormProps) {
  const [fullName, setFullName] = useState(agent.full_name || "")
  const [phone, setPhone] = useState(agent.phone || "")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const supabase = createBrowserClient()
    const { error } = await supabase
      .from("agents")
      .update({
        Name: fullName,
        Phone: phone || null,
      })
      .eq("id", agent.id)

    if (error) {
      setMessage({ type: "error", text: "Failed to update profile. Please try again." })
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" })
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>
      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{message.text}</p>
      )}
      <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}
