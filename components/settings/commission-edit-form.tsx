"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

interface CommissionPlan {
  id: string
  name: string
  split_percentage: number
  marketing_fund_threshold: number | null
  transaction_fee: number
  monthly_fee: number
  is_default: boolean
}

interface AgentPlan {
  id: string
  agent_id: string
  plan_id: string
  cap_progress: number
  ytd_gci: number
  plan?: CommissionPlan
}

interface CommissionEditFormProps {
  agentId: string
  currentPlan: CommissionPlan | null
  agentPlan: AgentPlan | null
  allPlans: CommissionPlan[]
  isBroker: boolean
}

export function CommissionEditForm({
  agentId,
  currentPlan,
  agentPlan,
  allPlans,
  isBroker,
}: CommissionEditFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [selectedPlanId, setSelectedPlanId] = useState(agentPlan?.plan_id || currentPlan?.id || "")
  const [customSplit, setCustomSplit] = useState(
    currentPlan?.split_percentage ? String(Math.round(currentPlan.split_percentage * (currentPlan.split_percentage <= 1 ? 100 : 1))) : "70"
  )
  const [customThreshold, setCustomThreshold] = useState(
    currentPlan?.marketing_fund_threshold?.toString() || "20000"
  )
  const [customTransactionFee, setCustomTransactionFee] = useState(
    currentPlan?.transaction_fee?.toString() || "499"
  )
  const [useCustom, setUseCustom] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (useCustom) {
        // Create or update a custom plan for this agent
        const customPlanName = `Custom Plan - Agent ${agentId.slice(0, 8)}`
        
        // Check if custom plan exists
        const { data: existingPlan } = await supabase
          .from("commission_plans")
          .select("id")
          .eq("name", customPlanName)
          .maybeSingle()

        let planId: string

        if (existingPlan) {
          // Update existing custom plan
          await supabase
            .from("commission_plans")
            .update({
              split_percentage: parseFloat(customSplit),
              marketing_fund_threshold: parseFloat(customThreshold),
              transaction_fee: parseFloat(customTransactionFee),
            })
            .eq("id", existingPlan.id)
          planId = existingPlan.id
        } else {
          // Create new custom plan
          const { data: newPlan, error: planError } = await supabase
            .from("commission_plans")
            .insert({
              name: customPlanName,
              description: "Custom commission plan",
              split_percentage: parseFloat(customSplit),
              marketing_fund_threshold: parseFloat(customThreshold),
              transaction_fee: parseFloat(customTransactionFee),
              monthly_fee: 0,
              is_default: false,
              is_active: true,
            })
            .select()
            .single()

          if (planError) throw planError
          planId = newPlan.id
        }

        // Assign plan to agent
        if (agentPlan) {
          await supabase
            .from("agent_commission_plans")
            .update({ plan_id: planId })
            .eq("id", agentPlan.id)
        } else {
          await supabase.from("agent_commission_plans").insert({
            agent_id: agentId,
            plan_id: planId,
            effective_date: new Date().toISOString().split("T")[0],
            cap_progress: 0,
            ytd_gci: 0,
          })
        }
      } else {
        // Assign existing plan
        if (agentPlan) {
          await supabase
            .from("agent_commission_plans")
            .update({ plan_id: selectedPlanId })
            .eq("id", agentPlan.id)
        } else {
          await supabase.from("agent_commission_plans").insert({
            agent_id: agentId,
            plan_id: selectedPlanId,
            effective_date: new Date().toISOString().split("T")[0],
            cap_progress: 0,
            ytd_gci: 0,
          })
        }
      }

      toast.success("Commission plan updated successfully")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating commission:", error)
      toast.error("Failed to update commission plan")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isBroker) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Commission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Commission Plan</DialogTitle>
          <DialogDescription>
            Assign an existing plan or create custom commission settings for this agent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label>Plan Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!useCustom ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCustom(false)}
              >
                Use Existing Plan
              </Button>
              <Button
                type="button"
                variant={useCustom ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCustom(true)}
              >
                Custom Settings
              </Button>
            </div>
          </div>

          {!useCustom ? (
            <div className="space-y-2">
              <Label>Select Commission Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {allPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.split_percentage}% Split
                      {plan.is_default && " (Default)"}
                      {plan.marketing_fund_threshold
                        ? ` - $${plan.marketing_fund_threshold.toLocaleString()} threshold`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Agent Split %</Label>
                <Select value={customSplit} onValueChange={setCustomSplit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60% / 40% (Agent / Company)</SelectItem>
                    <SelectItem value="65">65% / 35% (Agent / Company)</SelectItem>
                    <SelectItem value="70">70% / 30% (Agent / Company)</SelectItem>
                    <SelectItem value="75">75% / 25% (Agent / Company)</SelectItem>
                    <SelectItem value="80">80% / 20% (Agent / Company)</SelectItem>
                    <SelectItem value="85">85% / 15% (Agent / Company)</SelectItem>
                    <SelectItem value="90">90% / 10% (Agent / Company)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Marketing Fund Threshold ($)</Label>
                <Input
                  type="number"
                  min="0"
                  value={customThreshold}
                  onChange={(e) => setCustomThreshold(e.target.value)}
                  placeholder="20000"
                />
                <p className="text-xs text-muted-foreground">
                  Amount agent contributes to company marketing fund
                </p>
              </div>

              <div className="space-y-2">
                <Label>Transaction Fee ($)</Label>
                <Input
                  type="number"
                  min="0"
                  value={customTransactionFee}
                  onChange={(e) => setCustomTransactionFee(e.target.value)}
                  placeholder="499"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
