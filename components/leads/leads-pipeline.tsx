"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import type { Lead, LeadStatus } from "@/lib/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Calendar, GripVertical, ChevronRight, DollarSign } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface LeadsPipelineProps {
  leads: Lead[]
  agentId: string
}

const PIPELINE_STAGES: { status: LeadStatus; label: string; color: string; bgColor: string }[] = [
  { status: "new", label: "New", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  { status: "contacted", label: "Contacted", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200" },
  { status: "qualified", label: "Qualified", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
  { status: "active", label: "Showing", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
  {
    status: "under_contract",
    label: "Under Contract",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50 border-indigo-200",
  },
  { status: "closed_won", label: "Closed Won", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200" },
]

const typeColors: Record<string, string> = {
  buyer: "bg-blue-100 text-blue-700",
  seller: "bg-emerald-100 text-emerald-700",
  both: "bg-amber-100 text-amber-700",
  investor: "bg-purple-100 text-purple-700",
  renter: "bg-gray-100 text-gray-700",
}

export function LeadsPipeline({ leads, agentId }: LeadsPipelineProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const getLeadsByStatus = (status: LeadStatus) => {
    // Include nurturing leads in the qualified column
    if (status === "qualified") {
      return leads.filter((l) => l.status === "qualified" || l.status === "nurturing")
    }
    return leads.filter((l) => l.status === status)
  }

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault()
    setDragOverStage(status)
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent, newStatus: LeadStatus) => {
      e.preventDefault()
      setDragOverStage(null)

      if (!draggedLead || draggedLead.status === newStatus || isUpdating) return

      setIsUpdating(true)
      const supabase = createBrowserClient()

      // Update lead status
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", draggedLead.id)

      if (!error) {
        // Log activity for status change
        await supabase.from("activities").insert({
          agent_id: agentId,
          lead_id: draggedLead.id,
          activity_type: "note",
          subject: "Status Changed",
          description: `Lead moved from "${draggedLead.status.replace("_", " ")}" to "${newStatus.replace("_", " ")}"`,
          completed: true,
          completed_at: new Date().toISOString(),
        })

        router.refresh()
      }

      setDraggedLead(null)
      setIsUpdating(false)
    },
    [draggedLead, agentId, router, isUpdating],
  )

  const getTotalValue = (stageLeads: Lead[]) => {
    return stageLeads.reduce((sum, lead) => sum + (lead.budget_max || lead.budget_min || 0), 0)
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
    return `$${amount}`
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = getLeadsByStatus(stage.status)
          const totalValue = getTotalValue(stageLeads)
          const isDragOver = dragOverStage === stage.status

          return (
            <div
              key={stage.status}
              className={`w-72 flex-shrink-0 rounded-xl border-2 transition-all duration-200 ${
                isDragOver ? "border-blue-400 bg-blue-50/50 scale-[1.02]" : "border-gray-200 bg-gray-50/50"
              }`}
              onDragOver={(e) => handleDragOver(e, stage.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.status)}
            >
              {/* Stage Header */}
              <div className={`p-3 rounded-t-lg border-b ${stage.bgColor}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${stage.color}`}>{stage.label}</h3>
                  <Badge variant="secondary" className="bg-white/80">
                    {stageLeads.length}
                  </Badge>
                </div>
                {totalValue > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(totalValue)} pipeline
                  </p>
                )}
              </div>

              {/* Stage Content */}
              <div className="p-2 space-y-2 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
                {stageLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${
                      draggedLead?.id === lead.id ? "opacity-50 scale-95" : ""
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/dashboard/leads/${lead.id}`}
                            className="font-medium text-sm hover:text-blue-600 block truncate"
                          >
                            {lead.first_name} {lead.last_name}
                          </Link>

                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${typeColors[lead.lead_type]}`}>
                              {lead.lead_type}
                            </Badge>
                            {lead.budget_max && (
                              <span className="text-xs text-muted-foreground">{formatCurrency(lead.budget_max)}</span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                            {lead.phone && (
                              <span className="flex items-center gap-1 truncate">
                                <Phone className="h-3 w-3" />
                                {lead.phone}
                              </span>
                            )}
                            {lead.email && (
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </span>
                            )}
                          </div>

                          {lead.next_follow_up && (
                            <div
                              className={`flex items-center gap-1 mt-2 text-xs ${
                                new Date(lead.next_follow_up) <= new Date()
                                  ? "text-red-600 font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Calendar className="h-3 w-3" />
                              {new Date(lead.next_follow_up).toLocaleDateString()}
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Link href={`/dashboard/leads/${lead.id}`}>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {stageLeads.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    Drop leads here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
