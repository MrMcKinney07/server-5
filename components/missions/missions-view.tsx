"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import type { AgentMission, MissionTemplate } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Target, CheckCircle2, Camera, Plus, Upload, Clock, Zap } from "lucide-react"

interface MissionsViewProps {
  todayMissions: (AgentMission & { template?: MissionTemplate })[]
  templates: MissionTemplate[]
  agentId: string
  today: string
}

const categoryColors: Record<string, string> = {
  prospecting: "bg-blue-100 text-blue-800 border-blue-200",
  follow_up: "bg-emerald-100 text-emerald-800 border-emerald-200",
  learning: "bg-purple-100 text-purple-800 border-purple-200",
  marketing: "bg-rose-100 text-rose-800 border-rose-200",
  general: "bg-gray-100 text-gray-800 border-gray-200",
}

export function MissionsView({ todayMissions, templates, agentId, today }: MissionsViewProps) {
  const [completingMission, setCompletingMission] = useState<(AgentMission & { template?: MissionTemplate }) | null>(
    null,
  )
  const [notes, setNotes] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [addMissionOpen, setAddMissionOpen] = useState(false)
  const router = useRouter()

  const handleCompleteMission = async () => {
    if (!completingMission) return
    setIsLoading(true)

    const supabase = createBrowserClient()

    let photoUrl = null
    // If photo is required and provided, upload it
    if (photoFile) {
      const fileExt = photoFile.name.split(".").pop()
      const fileName = `${agentId}/${completingMission.id}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("mission-photos")
        .upload(fileName, photoFile)

      if (!uploadError && uploadData) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("mission-photos").getPublicUrl(fileName)
        photoUrl = publicUrl
      }
    }

    const { error } = await supabase
      .from("agent_missions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        points_earned: completingMission.template?.points || 10,
        notes: notes || null,
        photo_url: photoUrl,
      })
      .eq("id", completingMission.id)

    if (!error) {
      setCompletingMission(null)
      setNotes("")
      setPhotoFile(null)
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleAddMission = async (templateId: string) => {
    setIsLoading(true)
    const supabase = createBrowserClient()

    const { error } = await supabase.from("agent_missions").insert({
      agent_id: agentId,
      template_id: templateId,
      mission_date: today,
      status: "pending",
    })

    if (!error) {
      setAddMissionOpen(false)
      router.refresh()
    }

    setIsLoading(false)
  }

  const assignedTemplateIds = todayMissions.map((m) => m.template_id)
  const availableTemplates = templates.filter((t) => !assignedTemplateIds.includes(t.id))

  return (
    <div className="space-y-6">
      {/* Today's Missions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" />
              Today's Missions
            </CardTitle>
            <CardDescription>Complete these missions to earn points</CardDescription>
          </div>
          <Button onClick={() => setAddMissionOpen(true)} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Mission
          </Button>
        </CardHeader>
        <CardContent>
          {todayMissions.length > 0 ? (
            <div className="space-y-4">
              {todayMissions.map((mission) => (
                <div
                  key={mission.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    mission.status === "completed"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-white border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      mission.status === "completed"
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-100 text-amber-600 font-bold"
                    }`}
                  >
                    {mission.status === "completed" ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <span>{mission.template?.points || 10}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className={`font-medium ${mission.status === "completed" ? "line-through text-gray-500" : ""}`}
                        >
                          {mission.template?.title || "Mission"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{mission.template?.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={categoryColors[mission.template?.category || "general"]}>
                            {mission.template?.category}
                          </Badge>
                          {mission.template?.requires_photo && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              <Camera className="h-3 w-3 mr-1" />
                              Photo Required
                            </Badge>
                          )}
                        </div>
                      </div>
                      {mission.status !== "completed" && (
                        <Button
                          onClick={() => setCompletingMission(mission)}
                          className="bg-emerald-500 hover:bg-emerald-600 flex-shrink-0"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Complete
                        </Button>
                      )}
                    </div>
                    {mission.status === "completed" && mission.completed_at && (
                      <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Completed {new Date(mission.completed_at).toLocaleTimeString()}
                        {mission.points_earned && ` • +${mission.points_earned} points`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No missions for today</p>
              <p className="text-sm mt-1">Click "Add Mission" to assign yourself a mission</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Mission Dialog */}
      <Dialog open={!!completingMission} onOpenChange={() => setCompletingMission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Mission</DialogTitle>
            <DialogDescription>{completingMission?.template?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {completingMission?.template?.requires_photo && (
              <div className="space-y-2">
                <Label>Photo Proof (Required)</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  {photoFile ? (
                    <div className="space-y-2">
                      <p className="text-sm text-emerald-600">{photoFile.name}</p>
                      <Button variant="outline" size="sm" onClick={() => setPhotoFile(null)}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload photo</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about completing this mission..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
              <Zap className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-amber-800">
                You'll earn <strong>{completingMission?.template?.points || 10} points</strong> for completing this
                mission
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletingMission(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompleteMission}
              disabled={isLoading || (completingMission?.template?.requires_photo && !photoFile)}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isLoading ? "Completing..." : "Mark Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Mission Dialog */}
      <Dialog open={addMissionOpen} onOpenChange={setAddMissionOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Mission</DialogTitle>
            <DialogDescription>Select a mission to add to your daily goals</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {availableTemplates.length > 0 ? (
              availableTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{template.title}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={categoryColors[template.category]}>
                        {template.category}
                      </Badge>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {template.points} pts
                      </Badge>
                      {template.requires_photo && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          <Camera className="h-3 w-3 mr-1" />
                          Photo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddMission(template.id)}
                    disabled={isLoading}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">All available missions have been added for today</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
