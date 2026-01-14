"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface Team {
  id: string
  name: string
}

interface CommissionPlan {
  id: string
  name: string
  split_percentage: number
}

export function CreateAgentDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [commissionPlans, setCommissionPlans] = useState<CommissionPlan[]>([])
  const [formData, setFormData] = useState({
    // Basic Info
    fullName: "",
    email: "",
    phone: "",
    role: "agent",
    password: "",
    // License Info
    licenseNumber: "",
    licenseExpiry: "",
    startDate: new Date().toISOString().split("T")[0],
    // Assignment
    teamId: "",
    commissionPlanId: "",
    // Address
    address: "",
    city: "",
    state: "",
    zip: "",
    // Emergency Contact
    emergencyContactName: "",
    emergencyContactPhone: "",
    // Bio
    bio: "",
  })

  useEffect(() => {
    if (open) {
      fetchTeamsAndPlans()
    }
  }, [open])

  const fetchTeamsAndPlans = async () => {
    const supabase = createClient()

    const [teamsRes, plansRes] = await Promise.all([
      supabase.from("teams").select("id, name").order("name"),
      supabase.from("commission_plans").select("id, name, split_percentage").eq("is_active", true).order("name"),
    ])

    if (teamsRes.data) setTeams(teamsRes.data)
    if (plansRes.data) setCommissionPlans(plansRes.data)
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/agents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create agent")
      }

      const result = await response.json()
      toast.success(`Agent account created for ${formData.fullName}`, {
        description: "Welcome email sent with login credentials",
      })

      setOpen(false)
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        role: "agent",
        password: "",
        licenseNumber: "",
        licenseExpiry: "",
        startDate: new Date().toISOString().split("T")[0],
        teamId: "",
        commissionPlanId: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        bio: "",
      })
      router.refresh()
    } catch (error) {
      console.error("Error creating agent:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create agent account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Create Agent Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">Create New Agent Account</DialogTitle>
          <DialogDescription>
            Create a new agent account and send them their login credentials via email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="license">License</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-900 dark:text-slate-100">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-900 dark:text-slate-100">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="agent@mckinneyone.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-900 dark:text-slate-100">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-900 dark:text-slate-100">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="text-slate-900 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="broker">Broker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-900 dark:text-slate-100">
                  Temporary Password <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    placeholder="Generate or enter password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="text-slate-900 dark:text-slate-100"
                  />
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This password will be sent to the agent via email. They should change it after first login.
                </p>
              </div>
            </TabsContent>

            {/* License Info Tab */}
            <TabsContent value="license" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber" className="text-slate-900 dark:text-slate-100">
                    License Number
                  </Label>
                  <Input
                    id="licenseNumber"
                    placeholder="RE-123456"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseExpiry" className="text-slate-900 dark:text-slate-100">
                    License Expiry Date
                  </Label>
                  <Input
                    id="licenseExpiry"
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                    className="text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-slate-900 dark:text-slate-100">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="text-slate-900 dark:text-slate-100"
                />
                <p className="text-xs text-muted-foreground">The date the agent joined or will join the brokerage.</p>
              </div>
            </TabsContent>

            {/* Assignment Tab */}
            <TabsContent value="assignment" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="teamId" className="text-slate-900 dark:text-slate-100">
                  Assign to Team
                </Label>
                <Select value={formData.teamId} onValueChange={(value) => setFormData({ ...formData, teamId: value })}>
                  <SelectTrigger className="text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Select a team (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionPlanId" className="text-slate-900 dark:text-slate-100">
                  Commission Plan
                </Label>
                <Select
                  value={formData.commissionPlanId}
                  onValueChange={(value) => setFormData({ ...formData, commissionPlanId: value })}
                >
                  <SelectTrigger className="text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Select a commission plan (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Use Default Plan</SelectItem>
                    {commissionPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} ({plan.split_percentage}% split)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  If not selected, the default commission plan will be applied.
                </p>
              </div>
            </TabsContent>

            {/* Additional Info Tab */}
            <TabsContent value="additional" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Address</Label>
                <Input
                  placeholder="Street Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="text-slate-900 dark:text-slate-100"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="text-slate-900 dark:text-slate-100"
                  />
                  <Input
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="text-slate-900 dark:text-slate-100"
                  />
                  <Input
                    placeholder="ZIP"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Emergency Contact</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Contact Name"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="text-slate-900 dark:text-slate-100"
                  />
                  <Input
                    placeholder="Contact Phone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-slate-900 dark:text-slate-100">
                  Bio / Notes
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Agent biography or internal notes..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="text-slate-900 dark:text-slate-100"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create & Send Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
