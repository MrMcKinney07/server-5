"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, User, Mail, Building } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Agent, RecruitWithSponsor, RecruitStatus } from "@/lib/types/database"

interface RecruitingPipelineProps {
  recruits: RecruitWithSponsor[]
  agents: Agent[]
}

const stages: { status: RecruitStatus; label: string; color: string }[] = [
  { status: "prospecting", label: "Prospecting", color: "bg-slate-500" },
  { status: "contacted", label: "Contacted", color: "bg-blue-500" },
  { status: "meeting", label: "Meeting", color: "bg-yellow-500" },
  { status: "offer", label: "Offer", color: "bg-purple-500" },
  { status: "signed", label: "Signed", color: "bg-green-500" },
]

export function RecruitingPipeline({ recruits, agents }: RecruitingPipelineProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddRecruit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const { error } = await supabase.from("recruits").insert({
      full_name: formData.get("full_name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      current_brokerage: (formData.get("current_brokerage") as string) || null,
      sponsor_agent_id: (formData.get("sponsor_agent_id") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })

    setIsLoading(false)
    if (!error) {
      setIsAddOpen(false)
      router.refresh()
    }
  }

  const handleStatusChange = async (recruitId: string, newStatus: RecruitStatus) => {
    await supabase
      .from("recruits")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", recruitId)
    router.refresh()
  }

  const getRecruitsByStatus = (status: RecruitStatus) => recruits.filter((r) => r.status === status)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Recruit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Recruit</DialogTitle>
              <DialogDescription>Add a prospective agent to the pipeline</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddRecruit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" name="full_name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="current_brokerage">Current Brokerage</Label>
                  <Input id="current_brokerage" name="current_brokerage" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sponsor_agent_id">Sponsor Agent</Label>
                  <Select name="sponsor_agent_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Select sponsor" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Recruit"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban-style pipeline */}
      <div className="grid grid-cols-5 gap-4">
        {stages.map((stage) => (
          <div key={stage.status} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stage.color}`} />
              <h3 className="font-medium text-sm">{stage.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {getRecruitsByStatus(stage.status).length}
              </Badge>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {getRecruitsByStatus(stage.status).map((recruit) => (
                <Card key={recruit.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{recruit.full_name}</span>
                    </div>
                    {recruit.current_brokerage && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building className="h-3 w-3" />
                        {recruit.current_brokerage}
                      </div>
                    )}
                    {recruit.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {recruit.email}
                      </div>
                    )}
                    {recruit.sponsor_agent && (
                      <div className="text-xs text-muted-foreground">Sponsor: {recruit.sponsor_agent.full_name}</div>
                    )}
                    <Select
                      value={recruit.status}
                      onValueChange={(v) => handleStatusChange(recruit.id, v as RecruitStatus)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((s) => (
                          <SelectItem key={s.status} value={s.status}>
                            {s.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
