"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trophy } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Agent, Competition } from "@/lib/types/database"

interface AdminCompetitionsManagerProps {
  competitions: Competition[]
  agents: Agent[]
}

const metricOptions = [
  { id: "missions_completed", label: "Missions Completed" },
  { id: "leads_closed", label: "Leads Closed" },
  { id: "response_time", label: "Lead Response Time" },
  { id: "gci", label: "GCI" },
  { id: "activities", label: "Total Activities" },
]

export function AdminCompetitionsManager({ competitions, agents }: AdminCompetitionsManagerProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddCompetition = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    const { error } = await supabase.from("competitions").insert({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      metric: formData.get("metric") as string,
      prize_description: (formData.get("prize_description") as string) || null,
    })

    setIsLoading(false)
    if (!error) {
      setIsAddOpen(false)
      router.refresh()
    }
  }

  const toggleActive = async (compId: string, currentState: boolean) => {
    await supabase.from("competitions").update({ is_active: !currentState }).eq("id", compId)
    router.refresh()
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Competition
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Competition</DialogTitle>
              <DialogDescription>Set up a new agent competition or challenge</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCompetition}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" placeholder="Q1 Missions Challenge" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Complete the most missions this quarter" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input id="start_date" name="start_date" type="date" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input id="end_date" name="end_date" type="date" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="metric">Metric *</Label>
                  <Select name="metric" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {metricOptions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prize_description">Prize Description</Label>
                  <Input id="prize_description" name="prize_description" placeholder="$500 bonus + trophy" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Competition"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            All Competitions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prize</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitions.map((comp) => {
                const isOngoing = comp.start_date <= today && comp.end_date >= today
                const isPast = comp.end_date < today
                const isFuture = comp.start_date > today

                return (
                  <TableRow key={comp.id}>
                    <TableCell className="font-medium">{comp.name}</TableCell>
                    <TableCell>{metricOptions.find((m) => m.id === comp.metric)?.label || comp.metric}</TableCell>
                    <TableCell>
                      {new Date(comp.start_date).toLocaleDateString()} - {new Date(comp.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {isPast && <Badge variant="secondary">Ended</Badge>}
                      {isOngoing && comp.is_active && <Badge className="bg-green-600">Active</Badge>}
                      {isOngoing && !comp.is_active && <Badge variant="destructive">Paused</Badge>}
                      {isFuture && <Badge variant="outline">Upcoming</Badge>}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{comp.prize_description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => toggleActive(comp.id, comp.is_active)}>
                        {comp.is_active ? "Pause" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
