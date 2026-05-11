"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"

interface Agent {
  id: string
  Name: string
}

interface AgentCommissionDialogProps {
  agent: Agent
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CommissionPlan {
  id: string
  name: string
  split_percentage: number
  marketing_fund_threshold: number
  monthly_fee: number
  transaction_fee: number
  is_default: boolean
  is_active: boolean
}

interface AgentPlan {
  id: string
  plan_id: string
  cap_progress: number
  ytd_gci: number
}

export function AgentCommissionDialog({
  agent,
  open,
  onOpenChange,
}: AgentCommissionDialogProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [plans, setPlans] = useState<CommissionPlan[]>([])
  const [agentPlan, setAgentPlan] = useState<AgentPlan | null>(null)
  const [currentPlan, setCurrentPlan] = useState<CommissionPlan | null>(null)
  const [useCustom, setUseCustom] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [customSplit, setCustomSplit] = useState("70")
  const [customThreshold, setCustomThreshold] = useState("20000")
  const [customTransactionFee, setCustomTransactionFee] = useState("499")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      // Fetch commission plans
      const { data: plansData } = await supabase
        .from("commission_plans")
        .select("*")
        .order("split_percentage", { ascending: false })
      setPlans(plansData || [])

      // Fetch agent's current plan
      const { data: planData } = await supabase
        .from("agent_commission_plans")
        .select("*")
        .eq("agent_id", agent.id)
        .maybeSingle()
      setAgentPlan(planData)

      if (planData && plansData) {
        const plan = plansData.find((p) => p.id === planData.plan_id)
        setCurrentPlan(plan || null)
        setSelectedPlanId(planData.plan_id)
      } else if (plansData && plansData.length > 0) {
        setCurrentPlan(plansData[0])
        setSelectedPlanId(plansData[0].id)
      }
    } catch (error) {
      console.error("Error loading commission data:", error)
      toast.error("Failed to load commission data")
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const action = useCustom ? "assign_custom_plan" : "assign_plan"
      const payload = useCustom
        ? {
            action,
            agent_id: agent.id,
            existing_agent_plan_id: agentPlan?.id || null,
            split_percentage: parseFloat(customSplit),
            marketing_fund_threshold: parseFloat(customThreshold),
            transaction_fee: parseFloat(customTransactionFee),
          }
        : {
            action,
            agent_id: agent.id,
            plan_id: selectedPlanId,
            existing_agent_plan_id: agentPlan?.id || null,
          }

      const res = await fetch("/api/admin/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || "Request failed")
      }

      toast.success(`Commission plan updated for ${agent.Name}`)
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      console.error("Error updating commission:", error)
      toast.error(error.message || "Failed to update commission plan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Commission - {agent.Name}</DialogTitle>
          <DialogDescription>
            Assign or customize a commission plan for this agent
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="preset"
          onValueChange={(value) => setUseCustom(value === "custom")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">Preset Plans</TabsTrigger>
            <TabsTrigger value="custom">Custom Plan</TabsTrigger>
          </TabsList>

          {/* Preset Plans Tab */}
          <TabsContent value="preset" className="space-y-4">
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {plans.length === 0 ? (
                <p className="text-muted-foreground text-sm">No commission plans available</p>
              ) : (
                plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all ${
                      selectedPlanId === plan.id
                        ? "border-emerald-500 bg-emerald-50 border-2"
                        : "hover:border-emerald-200"
                    }`}
                    onClick={() => {
                      setSelectedPlanId(plan.id)
                      setCurrentPlan(plan)
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{plan.name}</CardTitle>
                          {plan.is_default && (
                            <p className="text-xs text-amber-600 font-medium mt-1">Default Plan</p>
                          )}
                        </div>
                        {selectedPlanId === plan.id && (
                          <div className="h-5 w-5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Split:</span>
                        <span className="font-medium">
                          {plan.split_percentage <= 1
                            ? Math.round(plan.split_percentage * 100)
                            : Math.round(plan.split_percentage)}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Marketing Fund:</span>
                        <span className="font-medium">
                          ${Number(plan.marketing_fund_threshold).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction Fee:</span>
                        <span className="font-medium">${Number(plan.transaction_fee)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Custom Plan Tab */}
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="split">Agent Split %</Label>
                  <Input
                    id="split"
                    type="number"
                    min="0"
                    max="100"
                    value={customSplit}
                    onChange={(e) => setCustomSplit(e.target.value)}
                    placeholder="70"
                  />
                </div>
                <div>
                  <Label htmlFor="threshold">Marketing Fund Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="0"
                    value={customThreshold}
                    onChange={(e) => setCustomThreshold(e.target.value)}
                    placeholder="20000"
                  />
                </div>
                <div>
                  <Label htmlFor="fee">Transaction Fee</Label>
                  <Input
                    id="fee"
                    type="number"
                    min="0"
                    value={customTransactionFee}
                    onChange={(e) => setCustomTransactionFee(e.target.value)}
                    placeholder="499"
                  />
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Agent receives:</span> {customSplit}% of GCI
                  <br />
                  <span className="font-medium">Company receives:</span> {100 - Number(customSplit)}% of GCI
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
            {isLoading ? "Saving..." : "Assign Commission Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
