"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import type { MissionTemplate, Agent } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Send } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface AssignMissionsFormProps {
  templates: MissionTemplate[]
  agents: Agent[]
}

export function AssignMissionsForm({ templates, agents }: AssignMissionsFormProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [missionDate, setMissionDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggleTemplate = (id: string) => {
    setSelectedTemplates((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const handleToggleAgent = (id: string) => {
    setSelectedAgents((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  const handleSelectAllAgents = () => {
    if (selectedAgents.length === agents.length) {
      setSelectedAgents([])
    } else {
      setSelectedAgents(agents.map((a) => a.id))
    }
  }

  const handleAssign = async () => {
    if (selectedTemplates.length === 0 || selectedAgents.length === 0) return
    setIsLoading(true)
    const supabase = createBrowserClient()

    const missions = selectedAgents.flatMap((agentId) =>
      selectedTemplates.map((templateId) => ({
        agent_id: agentId,
        template_id: templateId,
        mission_date: format(missionDate, "yyyy-MM-dd"),
        status: "pending",
        points_earned: 0,
      })),
    )

    const { error } = await supabase.from("agent_missions").upsert(missions, {
      onConflict: "agent_id,template_id,mission_date",
      ignoreDuplicates: true,
    })

    if (!error) {
      setSelectedTemplates([])
      setSelectedAgents([])
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-500" />
          Assign Missions
        </CardTitle>
        <CardDescription>Select templates and agents to assign missions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div className="space-y-2">
          <Label>Mission Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(missionDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={missionDate}
                onSelect={(d) => d && setMissionDate(d)}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Select Missions ({selectedTemplates.length} selected)</Label>
          <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
            {templates.map((template) => (
              <div
                key={template.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted transition-colors",
                  selectedTemplates.includes(template.id) && "bg-blue-50",
                )}
                onClick={() => handleToggleTemplate(template.id)}
              >
                <Checkbox checked={selectedTemplates.includes(template.id)} />
                <span className="flex-1 text-sm">{template.title}</span>
                <span className="text-xs text-muted-foreground">{template.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Select Agents ({selectedAgents.length} selected)</Label>
            <Button variant="ghost" size="sm" onClick={handleSelectAllAgents}>
              {selectedAgents.length === agents.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted transition-colors",
                  selectedAgents.includes(agent.id) && "bg-blue-50",
                )}
                onClick={() => handleToggleAgent(agent.id)}
              >
                <Checkbox checked={selectedAgents.includes(agent.id)} />
                <span className="flex-1 text-sm">{agent.full_name || agent.email}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assign Button */}
        <Button
          onClick={handleAssign}
          disabled={isLoading || selectedTemplates.length === 0 || selectedAgents.length === 0}
          className="w-full"
        >
          {isLoading
            ? "Assigning..."
            : `Assign ${selectedTemplates.length} Mission(s) to ${selectedAgents.length} Agent(s)`}
        </Button>
      </CardContent>
    </Card>
  )
}
