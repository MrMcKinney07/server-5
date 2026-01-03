"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, Calendar, User, Zap, ImageIcon } from "lucide-react"

interface MissionReview {
  id: string
  status: string
  completed_at: string
  notes: string | null
  photo_url: string | null
  mission_templates: {
    id: string
    title: string
    description: string
    xp_reward: number
  }
  daily_mission_sets: {
    user_id: string
    mission_date: string
    agents: {
      id: string
      "First Name": string
      "Last Name": string
      Email: string
    }
  }
}

interface MissionReviewListProps {
  missions: MissionReview[]
}

export function MissionReviewList({ missions }: MissionReviewListProps) {
  const [selectedMission, setSelectedMission] = useState<MissionReview | null>(null)

  if (missions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-lg font-medium text-muted-foreground">No mission photos to review</p>
          <p className="text-sm text-muted-foreground mt-1">
            Photos from completed missions will appear here for review
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {missions.map((mission) => (
          <Card key={mission.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <div
              className="aspect-video bg-gray-100 overflow-hidden relative"
              onClick={() => setSelectedMission(mission)}
            >
              {mission.photo_url ? (
                <img
                  src={mission.photo_url || "/placeholder.svg"}
                  alt={mission.mission_templates.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge className="bg-emerald-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              </div>
            </div>
            <CardHeader className="p-4">
              <CardTitle className="text-base">{mission.mission_templates.title}</CardTitle>
              <CardDescription className="space-y-1 text-xs">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {mission.daily_mission_sets.agents["First Name"]} {mission.daily_mission_sets.agents["Last Name"]}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(mission.completed_at).toLocaleDateString()} at{" "}
                  {new Date(mission.completed_at).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {mission.mission_templates.xp_reward} XP Awarded
                </div>
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedMission} onOpenChange={() => setSelectedMission(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedMission?.mission_templates.title}</DialogTitle>
          </DialogHeader>
          {selectedMission && (
            <div className="space-y-4">
              {selectedMission.photo_url && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={selectedMission.photo_url || "/placeholder.svg"}
                    alt={selectedMission.mission_templates.title}
                    className="w-full h-auto"
                  />
                </div>
              )}

              <div className="grid gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Agent</h4>
                  <p className="text-sm">
                    {selectedMission.daily_mission_sets.agents["First Name"]}{" "}
                    {selectedMission.daily_mission_sets.agents["Last Name"]}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedMission.daily_mission_sets.agents.Email}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Mission Details</h4>
                  <p className="text-sm text-muted-foreground">{selectedMission.mission_templates.description}</p>
                </div>

                {selectedMission.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedMission.notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(selectedMission.completed_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{selectedMission.mission_templates.xp_reward} XP</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
