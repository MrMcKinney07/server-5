"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Users } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface CommissionPlan {
  id: string
  name: string
  description: string | null
  split_percentage: number
  marketing_fund_threshold: number | null
  monthly_fee: number
  transaction_fee: number
  is_default: boolean
  is_active: boolean
  created_at: string
}

interface Agent {
  id: string
  Name: string
  Email: string
}

interface AgentPlan {
  id: string
  agent_id: string
  plan_id: string
  effective_date: string
  cap_progress: number
  ytd_gci: number
  plan?: CommissionPlan
  agent?: Agent
}

interface CommissionPlansManagerProps {
  commissionPlans: CommissionPlan[]
  agents: Agent[]
  agentPlans: AgentPlan[]
}

export function CommissionPlansManager({ commissionPlans, agents, agentPlans }: CommissionPlansManagerProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [isCreating, setIsCreating] = useState(false)
  const [editingPlan, setEditingPlan] = useState<CommissionPlan | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)

  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    split_percentage: "70",
    marketing_fund_threshold: "20000",
    monthly_fee: "0",
    transaction_fee: "499",
    is_default: false,
    is_active: true,
  })

  const [assignForm, setAssignForm] = useState({
    agent_id: "",
    plan_id: "",
    effective_date: new Date().toISOString().split("T")[0],
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleCreatePlan = async () => {
    setIsCreating(true)
    try {
      const { error } = await supabase.from("commission_plans").insert({
        name: planForm.name,
        description: planForm.description || null,
        split_percentage: Number.parseFloat(planForm.split_percentage),
        marketing_fund_threshold: Number.parseFloat(planForm.marketing_fund_threshold),
        monthly_fee: Number.parseFloat(planForm.monthly_fee),
        transaction_fee: Number.parseFloat(planForm.transaction_fee),
        is_default: planForm.is_default,
        is_active: planForm.is_active,
      })

      if (error) throw error

      toast.success("Commission plan created successfully")
      setPlanForm({
        name: "",
        description: "",
        split_percentage: "70",
        marketing_fund_threshold: "20000",
        monthly_fee: "0",
        transaction_fee: "499",
        is_default: false,
        is_active: true,
      })
      router.refresh()
    } catch (error) {
      console.error("Error creating plan:", error)
      toast.error("Failed to create commission plan")
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdatePlan = async () => {
    if (!editingPlan) return
    setIsCreating(true)
    try {
      const { error } = await supabase
        .from("commission_plans")
        .update({
          name: planForm.name,
          description: planForm.description || null,
          split_percentage: Number.parseFloat(planForm.split_percentage),
          marketing_fund_threshold: Number.parseFloat(planForm.marketing_fund_threshold),
          monthly_fee: Number.parseFloat(planForm.monthly_fee),
          transaction_fee: Number.parseFloat(planForm.transaction_fee),
          is_active: planForm.is_active,
        })
        .eq("id", editingPlan.id)

      if (error) throw error

      toast.success("Commission plan updated successfully")
      setEditingPlan(null)
      router.refresh()
    } catch (error) {
      console.error("Error updating plan:", error)
      toast.error("Failed to update commission plan")
    } finally {
      setIsCreating(false)
    }
  }

  const handleAssignPlan = async () => {
    setIsAssigning(true)
    try {
      const { error } = await supabase.from("agent_commission_plans").insert({
        agent_id: assignForm.agent_id,
        plan_id: assignForm.plan_id,
        effective_date: assignForm.effective_date,
        cap_progress: 0,
        ytd_gci: 0,
      })

      if (error) throw error

      toast.success("Plan assigned to agent successfully")
      setAssignForm({
        agent_id: "",
        plan_id: "",
        effective_date: new Date().toISOString().split("T")[0],
      })
      router.refresh()
    } catch (error) {
      console.error("Error assigning plan:", error)
      toast.error("Failed to assign plan")
    } finally {
      setIsAssigning(false)
    }
  }

  const startEdit = (plan: CommissionPlan) => {
    setPlanForm({
      name: plan.name,
      description: plan.description || "",
      split_percentage: plan.split_percentage.toString(),
      marketing_fund_threshold: (plan.marketing_fund_threshold || 0).toString(),
      monthly_fee: plan.monthly_fee.toString(),
      transaction_fee: plan.transaction_fee.toString(),
      is_default: plan.is_default,
      is_active: plan.is_active,
    })
    setEditingPlan(plan)
    setIsCreating(true)
  }

  return (
    <Tabs defaultValue="plans">
      <TabsList>
        <TabsTrigger value="plans">Commission Plans</TabsTrigger>
        <TabsTrigger value="assignments">Agent Assignments</TabsTrigger>
      </TabsList>

      <TabsContent value="plans" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Commission Plans</CardTitle>
                <CardDescription>Create and manage commission split structures</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingPlan ? "Edit" : "Create"} Commission Plan</DialogTitle>
                    <DialogDescription>Define the commission split structure and fees for agents</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="split">Agent Split %</Label>
                        <Select
                          value={planForm.split_percentage}
                          onValueChange={(value) => setPlanForm({ ...planForm, split_percentage: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select split" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="70">70% / 30% (Agent / Company)</SelectItem>
                            <SelectItem value="80">80% / 20% (Agent / Company)</SelectItem>
                            <SelectItem value="85">85% / 15% (Agent / Company)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Agent receives this percentage, company receives the rest
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe this commission plan..."
                        value={planForm.description}
                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label htmlFor="cap">Marketing Fund Threshold ($)</Label>
                        <Input
                          id="cap"
                          type="number"
                          min="0"
                          placeholder="20000"
                          value={planForm.marketing_fund_threshold}
                          onChange={(e) => setPlanForm({ ...planForm, marketing_fund_threshold: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Amount agent contributes to company marketing fund (default: $20,000)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="monthly">Monthly Fee ($)</Label>
                        <Input
                          id="monthly"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={planForm.monthly_fee}
                          onChange={(e) => setPlanForm({ ...planForm, monthly_fee: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="transactionFee">Transaction Fee ($)</Label>
                        <Input
                          id="transactionFee"
                          type="number"
                          min="0"
                          placeholder="499"
                          value={planForm.transaction_fee}
                          onChange={(e) => setPlanForm({ ...planForm, transaction_fee: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="default"
                          checked={planForm.is_default}
                          onCheckedChange={(checked) => setPlanForm({ ...planForm, is_default: checked })}
                        />
                        <Label htmlFor="default">Set as default plan</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="active"
                          checked={planForm.is_active}
                          onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
                        />
                        <Label htmlFor="active">Active</Label>
                      </div>
                    </div>

                    <Button
                      onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}
                      disabled={isCreating || !planForm.split_percentage}
                      className="w-full"
                    >
                      {editingPlan ? "Update Plan" : "Create Plan"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Split %</TableHead>
                  <TableHead>Marketing Fund</TableHead>
                  <TableHead>Monthly Fee</TableHead>
                  <TableHead>Transaction Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      {plan.split_percentage.toFixed(0)}%
                      {plan.is_default && (
                        <Badge variant="secondary" className="ml-2">
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.marketing_fund_threshold ? formatCurrency(plan.marketing_fund_threshold) : "None"}
                    </TableCell>
                    <TableCell>{formatCurrency(plan.monthly_fee)}</TableCell>
                    <TableCell>{formatCurrency(plan.transaction_fee)}</TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(plan)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Commission Plan</DialogTitle>
                            <DialogDescription>Update the commission split structure and fees</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="edit-split">Agent Split %</Label>
                                <Select
                                  value={planForm.split_percentage}
                                  onValueChange={(value) => setPlanForm({ ...planForm, split_percentage: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select split" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="70">70% / 30% (Agent / Company)</SelectItem>
                                    <SelectItem value="80">80% / 20% (Agent / Company)</SelectItem>
                                    <SelectItem value="85">85% / 15% (Agent / Company)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Agent receives this percentage, company receives the rest
                                </p>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={planForm.description}
                                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                              />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                              <div>
                                <Label htmlFor="edit-cap">Marketing Fund Threshold ($)</Label>
                                <Input
                                  id="edit-cap"
                                  type="number"
                                  value={planForm.marketing_fund_threshold}
                                  onChange={(e) =>
                                    setPlanForm({ ...planForm, marketing_fund_threshold: e.target.value })
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Amount agent contributes to company marketing fund (default: $20,000)
                                </p>
                              </div>
                              <div>
                                <Label htmlFor="edit-monthly">Monthly Fee ($)</Label>
                                <Input
                                  id="edit-monthly"
                                  type="number"
                                  value={planForm.monthly_fee}
                                  onChange={(e) => setPlanForm({ ...planForm, monthly_fee: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-transactionFee">Transaction Fee ($)</Label>
                                <Input
                                  id="edit-transactionFee"
                                  type="number"
                                  value={planForm.transaction_fee}
                                  onChange={(e) => setPlanForm({ ...planForm, transaction_fee: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="edit-default"
                                  checked={planForm.is_default}
                                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_default: checked })}
                                />
                                <Label htmlFor="edit-default">Set as default plan</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="edit-active"
                                  checked={planForm.is_active}
                                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
                                />
                                <Label htmlFor="edit-active">Active</Label>
                              </div>
                            </div>

                            <Button onClick={handleUpdatePlan} disabled={isCreating} className="w-full">
                              Update Plan
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="assignments" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Agent Plan Assignments</CardTitle>
                <CardDescription>Assign commission plans to agents</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Users className="mr-2 h-4 w-4" />
                    Assign Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Commission Plan</DialogTitle>
                    <DialogDescription>Assign a commission plan to an agent</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="agent">Agent</Label>
                      <Select
                        value={assignForm.agent_id}
                        onValueChange={(v) => setAssignForm({ ...assignForm, agent_id: v })}
                      >
                        <SelectTrigger id="agent">
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.Name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="plan">Commission Plan</Label>
                      <Select
                        value={assignForm.plan_id}
                        onValueChange={(v) => setAssignForm({ ...assignForm, plan_id: v })}
                      >
                        <SelectTrigger id="plan">
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {commissionPlans
                            .filter((p) => p.is_active)
                            .map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} ({plan.split_percentage.toFixed(0)}%)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="effective">Effective Date</Label>
                      <Input
                        id="effective"
                        type="date"
                        value={assignForm.effective_date}
                        onChange={(e) => setAssignForm({ ...assignForm, effective_date: e.target.value })}
                      />
                    </div>

                    <Button
                      onClick={handleAssignPlan}
                      disabled={isAssigning || !assignForm.agent_id || !assignForm.plan_id}
                      className="w-full"
                    >
                      Assign Plan
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Split %</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>YTD GCI</TableHead>
                  <TableHead>Cap Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentPlans.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.agent?.Name}</TableCell>
                    <TableCell>{assignment.plan ? `${assignment.plan.split_percentage.toFixed(0)}%` : "N/A"}</TableCell>
                    <TableCell>{new Date(assignment.effective_date).toLocaleDateString()}</TableCell>
                    <TableCell>{formatCurrency(assignment.ytd_gci)}</TableCell>
                    <TableCell>
                      {assignment.plan?.marketing_fund_threshold ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-emerald-500"
                                style={{
                                  width: `${Math.min((assignment.cap_progress / assignment.plan.marketing_fund_threshold) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(assignment.cap_progress)} /{" "}
                            {formatCurrency(assignment.plan.marketing_fund_threshold)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No cap</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
