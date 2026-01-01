"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { selectDailyMissions, completeMission } from "@/app/actions/missions"
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
import { Target, CheckCircle2, Clock, Zap, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MissionItem {
  id: string
  status: string
  completed_at?: string
  notes?: string
  photo_url?: string
  mission_templates: {
    id: string
    title: string
    description: string
    xp_reward: number
  }
}

interface MissionTemplate {
  id: string
  title: string
  description: string
  xp_reward: number
  active_days: number[]
}

interface MissionsViewProps {
  missions: MissionItem[]
  templates: MissionTemplate[]
}

const REQUIRED_MISSIONS = 3

export function MissionsView({ missions, templates }: MissionsViewProps) {
  const [completingMission, setCompletingMission] = useState<MissionItem | null>(null)
  const [notes, setNotes] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectMissionsOpen, setSelectMissionsOpen] = useState(false)
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])
  const router = useRouter()
  const { toast } = useToast()
  const todayMissionsRef = useRef<HTMLDivElement>(null)
  const [shouldScrollToMissions, setShouldScrollToMissions] = useState(false)

  const hasEnoughMissions = missions.length >= REQUIRED_MISSIONS
  const needsMoreMissions = missions.length < REQUIRED_MISSIONS
  const missionsNeeded = REQUIRED_MISSIONS - missions.length

  const alreadyAssignedTemplateIds = missions.map((m) => m.mission_templates.id)
  const availableTemplates = templates.filter((t) => !alreadyAssignedTemplateIds.includes(t.id))

  const handleCompleteMission = async () => {
    if (!completingMission) return
    setIsLoading(true)

    const result = await completeMission(completingMission.id, notes, photoFile ? "photo-url-here" : undefined)

    if (result.success) {
      toast({
        title: "Mission Complete!",
        description: `You earned ${result.xpEarned} XP!`,
      })
      setCompletingMission(null)
      setNotes("")
      setPhotoFile(null)
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to complete mission",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const toggleTemplateSelection = (templateId: string) => {
    setSelectedTemplateIds((prev) => {
      if (prev.includes(templateId)) {
        return prev.filter((id) => id !== templateId)
      }
      if (prev.length >= missionsNeeded) {
        return prev
      }
      return [...prev, templateId]
    })
  }

  const handleSubmitMissions = async () => {
    if (selectedTemplateIds.length !== missionsNeeded) return
    setIsLoading(true)

    const result = await selectDailyMissions(selectedTemplateIds)

    if (result.success) {
      setSelectMissionsOpen(false)
      setSelectedTemplateIds([])
      setShouldScrollToMissions(true)
      router.refresh()
      toast({
        title: "Missions Selected!",
        description: "Your daily missions have been added. Complete them to earn XP!",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save missions",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (shouldScrollToMissions && todayMissionsRef.current) {
      todayMissionsRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      setShouldScrollToMissions(false)
    }
  }, [shouldScrollToMissions, missions.length])

  return (
    <div className="space-y-6">
      {needsMoreMissions && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">
                  {missions.length === 0
                    ? "Select Your Daily Missions"
                    : `Select ${missionsNeeded} More Mission${missionsNeeded > 1 ? "s" : ""}`}
                </h3>
                <p className="text-sm text-blue-700">
                  {missions.length === 0
                    ? `Choose ${REQUIRED_MISSIONS} missions to complete today.`
                    : `You have ${missions.length} mission${missions.length > 1 ? "s" : ""} selected. Select ${missionsNeeded} more.`}
                </p>
              </div>
              <Button
                data-select-missions-button
                onClick={() => {
                  setSelectedTemplateIds([])
                  setSelectMissionsOpen(true)
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md"
              >
                Select {missionsNeeded} Mission{missionsNeeded > 1 ? "s" : ""}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card ref={todayMissionsRef}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Today's Missions
          </CardTitle>
          <CardDescription>
            {hasEnoughMissions
              ? "Complete these missions to earn XP"
              : `Select ${missionsNeeded} more mission${missionsNeeded > 1 ? "s" : ""} to complete your set`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {missions.length > 0 ? (
            <div className="space-y-4">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    mission.status === "completed"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-blue-50 border-blue-200 shadow-sm"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      mission.status === "completed"
                        ? "bg-emerald-500 text-white"
                        : "bg-blue-100 text-blue-600 font-bold border border-blue-200"
                    }`}
                  >
                    {mission.status === "completed" ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <span>{mission.mission_templates.xp_reward}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className={`font-medium ${mission.status === "completed" ? "line-through text-gray-500" : ""}`}
                        >
                          {mission.mission_templates.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{mission.mission_templates.description}</p>
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
                        Completed {new Date(mission.completed_at).toLocaleTimeString()} • +
                        {mission.mission_templates.xp_reward} XP
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
              <p className="text-sm mt-1">Select {REQUIRED_MISSIONS} missions to start earning XP today</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Mission Dialog */}
      <Dialog open={!!completingMission} onOpenChange={() => setCompletingMission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Mission</DialogTitle>
            <DialogDescription>{completingMission?.mission_templates.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about completing this mission..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Zap className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-800">
                You'll earn <strong>{completingMission?.mission_templates.xp_reward} XP</strong> for completing this
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletingMission(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompleteMission}
              disabled={isLoading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isLoading ? "Completing..." : "Mark Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select Missions Dialog */}
      <Dialog open={selectMissionsOpen} onOpenChange={setSelectMissionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Select {missionsNeeded} Mission{missionsNeeded > 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
              Choose missions to complete today. You'll earn XP for each completed mission.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-100">
              <span className="text-sm text-blue-800">
                Selected: <strong>{selectedTemplateIds.length}</strong> of {missionsNeeded}
              </span>
              {selectedTemplateIds.length === missionsNeeded && (
                <Badge className="bg-emerald-500">Ready to submit</Badge>
              )}
            </div>

            <div className="space-y-3">
              {availableTemplates.length > 0 ? (
                availableTemplates.map((template) => {
                  const isSelected = selectedTemplateIds.includes(template.id)
                  const isDisabled = !isSelected && selectedTemplateIds.length >= missionsNeeded

                  return (
                    <div
                      key={template.id}
                      onClick={() => !isDisabled && toggleTemplateSelection(template.id)}
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : isDisabled
                            ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      <Checkbox checked={isSelected} disabled={isDisabled} className="pointer-events-none" />
                      <div className="flex-1">
                        <h4 className="font-medium">{template.title}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {template.xp_reward} XP
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No more missions available today.</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectMissionsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitMissions}
              disabled={isLoading || selectedTemplateIds.length !== missionsNeeded}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              {isLoading ? "Submitting..." : `Confirm ${missionsNeeded} Mission${missionsNeeded > 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
