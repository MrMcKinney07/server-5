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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Target, CheckCircle2, Camera, Upload, Clock, Zap, AlertCircle } from "lucide-react"

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

const REQUIRED_MISSIONS = 3

export function MissionsView({ todayMissions, templates, agentId, today }: MissionsViewProps) {
  const [completingMission, setCompletingMission] = useState<(AgentMission & { template?: MissionTemplate }) | null>(
    null,
  )
  const [notes, setNotes] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectMissionsOpen, setSelectMissionsOpen] = useState(false)
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])
  const router = useRouter()

  const hasSelectedMissions = todayMissions.length >= REQUIRED_MISSIONS
  const needsToSelectMissions = todayMissions.length === 0

  const handleCompleteMission = async () => {
    if (!completingMission) return
    setIsLoading(true)

    const supabase = createBrowserClient()

    let photoUrl = null
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

  const toggleTemplateSelection = (templateId: string) => {
    setSelectedTemplateIds((prev) => {
      if (prev.includes(templateId)) {
        return prev.filter((id) => id !== templateId)
      }
      if (prev.length >= REQUIRED_MISSIONS) {
        return prev // Don't allow more than 3
      }
      return [...prev, templateId]
    })
  }

  const handleSubmitMissions = async () => {
    if (selectedTemplateIds.length !== REQUIRED_MISSIONS) return
    setIsLoading(true)
    const supabase = createBrowserClient()

    const missions = selectedTemplateIds.map((templateId) => ({
      agent_id: agentId,
      template_id: templateId,
      mission_date: today,
      status: "pending",
    }))

    const { error } = await supabase.from("agent_missions").insert(missions)

    if (!error) {
      setSelectMissionsOpen(false)
      setSelectedTemplateIds([])
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {needsToSelectMissions && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Select Your Daily Missions</h3>
                <p className="text-sm text-amber-700">
                  Choose {REQUIRED_MISSIONS} missions to complete today. Once selected, you cannot change them.
                </p>
              </div>
              <Button onClick={() => setSelectMissionsOpen(true)} className="bg-amber-500 hover:bg-amber-600">
                Select {REQUIRED_MISSIONS} Missions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Missions */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" />
              Today's Missions
            </CardTitle>
            <CardDescription>
              {hasSelectedMissions
                ? "Complete these missions to earn points"
                : `Select ${REQUIRED_MISSIONS} missions to get started`}
            </CardDescription>
          </div>
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
              <p className="text-lg font-medium">No missions selected yet</p>
              <p className="text-sm mt-1">Select {REQUIRED_MISSIONS} missions to start earning points today</p>
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

      <Dialog open={selectMissionsOpen} onOpenChange={setSelectMissionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Your {REQUIRED_MISSIONS} Daily Missions</DialogTitle>
            <DialogDescription>
              Choose exactly {REQUIRED_MISSIONS} missions to complete today. You cannot change your selection after
              submitting.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Selection counter */}
            <div className="mb-4 p-3 bg-amber-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-amber-800">
                Selected: <strong>{selectedTemplateIds.length}</strong> of {REQUIRED_MISSIONS}
              </span>
              {selectedTemplateIds.length === REQUIRED_MISSIONS && (
                <Badge className="bg-emerald-500">Ready to submit</Badge>
              )}
            </div>

            <div className="space-y-3">
              {templates.map((template) => {
                const isSelected = selectedTemplateIds.includes(template.id)
                const isDisabled = !isSelected && selectedTemplateIds.length >= REQUIRED_MISSIONS

                return (
                  <div
                    key={template.id}
                    onClick={() => !isDisabled && toggleTemplateSelection(template.id)}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "border-amber-500 bg-amber-50"
                        : isDisabled
                          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                          : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
                    }`}
                  >
                    <Checkbox checked={isSelected} disabled={isDisabled} className="pointer-events-none" />
                    <div className="flex-1">
                      <h4 className="font-medium">{template.title}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={categoryColors[template.category || "general"]}>
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
                  </div>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectMissionsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitMissions}
              disabled={isLoading || selectedTemplateIds.length !== REQUIRED_MISSIONS}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isLoading ? "Submitting..." : `Confirm ${REQUIRED_MISSIONS} Missions`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
