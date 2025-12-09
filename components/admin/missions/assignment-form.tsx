"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { generateWeeklyMissionSchedule, formatDateForDB } from "@/lib/missions/generate-weekly-schedule"
import type { MissionSetWithItems, Agent, AgentSegment } from "@/lib/types/database"

interface MissionAssignmentFormProps {
  missionSets: MissionSetWithItems[]
  agents: Agent[]
}

export function MissionAssignmentForm({ missionSets, agents }: MissionAssignmentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const [selectedSetId, setSelectedSetId] = useState<string>("")
  const [startDate, setStartDate] = useState<Date>()
  const [segmentFilter, setSegmentFilter] = useState<AgentSegment | "all">("all")
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])

  // Get the selected mission set
  const selectedSet = missionSets.find((s) => s.id === selectedSetId)

  // Filter agents by segment
  const filteredAgents = agents.filter((agent) => {
    if (segmentFilter === "all") return true
    return agent.segment === segmentFilter
  })

  function toggleAgent(agentId: string) {
    setSelectedAgentIds((prev) => (prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]))
  }

  function selectAllFiltered() {
    setSelectedAgentIds(filteredAgents.map((a) => a.id))
  }

  function deselectAll() {
    setSelectedAgentIds([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedSet || !startDate || selectedAgentIds.length === 0) {
      setResult({ success: false, message: "Please select a mission set, start date, and at least one agent" })
      return
    }

    const templateIds = selectedSet.items?.map((item) => item.mission_template_id) ?? []

    if (templateIds.length < 3) {
      setResult({ success: false, message: "Mission set must have at least 3 templates" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // Generate the schedule
      const schedule = generateWeeklyMissionSchedule(templateIds, startDate, 7, 3)

      const supabase = createClient()

      // Prepare all mission records
      const missionRecords = []

      for (const agentId of selectedAgentIds) {
        for (const day of schedule) {
          missionRecords.push({
            agent_id: agentId,
            date: formatDateForDB(day.date),
            mission1_template_id: day.missionTemplateIds[0],
            mission2_template_id: day.missionTemplateIds[1],
            mission3_template_id: day.missionTemplateIds[2],
            mission1_completed: false,
            mission2_completed: false,
            mission3_completed: false,
            released_at: null,
          })
        }
      }

      // Upsert all records (will update if agent+date already exists)
      const { error } = await supabase.from("agent_daily_missions").upsert(missionRecords, {
        onConflict: "agent_id,date",
        ignoreDuplicates: false,
      })

      if (error) {
        throw error
      }

      const totalDays = schedule.length
      const totalAgents = selectedAgentIds.length
      setResult({
        success: true,
        message: `Successfully assigned ${totalDays} days of missions to ${totalAgents} agent${totalAgents > 1 ? "s" : ""}`,
      })

      // Reset form
      setSelectedAgentIds([])
    } catch (error) {
      console.error("Assignment error:", error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to assign missions",
      })
    } finally {
      setLoading(false)
    }
  }

  const segmentColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    seasoned: "bg-amber-100 text-amber-800",
    custom: "bg-purple-100 text-purple-800",
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Mission Set Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mission Set</CardTitle>
            <CardDescription>Select which mission set to assign</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedSetId} onValueChange={setSelectedSetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a mission set" />
              </SelectTrigger>
              <SelectContent>
                {missionSets.map((set) => (
                  <SelectItem key={set.id} value={set.id}>
                    <div className="flex items-center gap-2">
                      <span>{set.name}</span>
                      <Badge variant="secondary" className={cn("text-xs", segmentColors[set.segment])}>
                        {set.segment}
                      </Badge>
                      <span className="text-muted-foreground">({set.items?.length ?? 0} templates)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Week Start Date</CardTitle>
            <CardDescription>Select the first day of the mission week</CardDescription>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
      </div>

      {/* Agent Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Select Agents</CardTitle>
              <CardDescription>Choose which agents will receive these missions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Filter:</Label>
              <Select value={segmentFilter} onValueChange={(v) => setSegmentFilter(v as AgentSegment | "all")}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="new">New Agents</SelectItem>
                  <SelectItem value="seasoned">Seasoned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={selectAllFiltered}>
              Select All ({filteredAgents.length})
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
            {selectedAgentIds.length > 0 && <Badge variant="secondary">{selectedAgentIds.length} selected</Badge>}
          </div>

          <div className="grid max-h-[300px] gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.length === 0 ? (
              <p className="col-span-full text-center text-sm text-muted-foreground">No agents match the filter</p>
            ) : (
              filteredAgents.map((agent) => (
                <div key={agent.id} className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted">
                  <Checkbox
                    id={agent.id}
                    checked={selectedAgentIds.includes(agent.id)}
                    onCheckedChange={() => toggleAgent(agent.id)}
                  />
                  <label htmlFor={agent.id} className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
                    <span className="truncate">{agent.full_name || agent.email}</span>
                    <Badge variant="outline" className="text-xs">
                      {agent.segment}
                    </Badge>
                  </label>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Result message */}
      {result && (
        <div className={cn("rounded-md p-4", result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
          {result.message}
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        size="lg"
        disabled={loading || !selectedSetId || !startDate || selectedAgentIds.length === 0}
        className="w-full sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Weekly Missions"
        )}
      </Button>
    </form>
  )
}
