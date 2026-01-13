"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Target, CheckCircle2, Clock, Zap, AlertCircle, X, ImageIcon, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { selectDailyMissionsAction, completeMissionAction } from "@/app/actions/missions"

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
  isNewAgent: boolean
}

export function MissionsView({ missions, templates, isNewAgent }: MissionsViewProps) {
  const [completingMission, setCompletingMission] = useState<MissionItem | null>(null)
  const [notes, setNotes] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectMissionsOpen, setSelectMissionsOpen] = useState(false)
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])
  const router = useRouter()
  const { toast } = useToast()
  const todayMissionsRef = useRef<HTMLDivElement>(null)
  const [shouldScrollToMissions, setShouldScrollToMissions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expandedMissions, setExpandedMissions] = useState<Set<string>>(new Set())

  const hasEnoughMissions = missions.length >= 3
  const needsMoreMissions = missions.length < 3
  const missionsNeeded = 3 - missions.length

  const alreadyAssignedTemplateIds = missions.map((m) => m.mission_templates.id)
  const availableTemplates = templates.filter((t) => !alreadyAssignedTemplateIds.includes(t.id))

  const handleCompleteMission = async () => {
    if (!completingMission) return
    setIsLoading(true)

    let photoUrl: string | undefined

    if (photoFile) {
      setUploadingPhoto(true)
      const formData = new FormData()
      formData.append("file", photoFile)

      try {
        const response = await fetch("/api/missions/upload-photo", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const data = await response.json()
        photoUrl = data.url
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Failed to upload photo. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        setUploadingPhoto(false)
        return
      }
      setUploadingPhoto(false)
    }

    const result = await completeMissionAction(completingMission.id, notes, photoUrl)

    if (result.success) {
      toast({
        title: "Mission Complete!",
        description: `You earned ${result.xpEarned} XP!`,
      })
      setCompletingMission(null)
      setNotes("")
      removePhoto()
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

    const result = await selectDailyMissionsAction(selectedTemplateIds)

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const toggleMissionDescription = (missionId: string) => {
    setExpandedMissions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(missionId)) {
        newSet.delete(missionId)
      } else {
        newSet.add(missionId)
      }
      return newSet
    })
  }

  const shouldTruncateDescription = (description: string) => {
    return description.length > 100
  }

  useEffect(() => {
    if (shouldScrollToMissions && todayMissionsRef.current) {
      todayMissionsRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      setShouldScrollToMissions(false)
    }
  }, [shouldScrollToMissions, missions.length])

  return (
    <div className="space-y-6">
      {needsMoreMissions && !isNewAgent && (
        <Card className="border-blue-500/30 bg-blue-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">
                  {missions.length === 0
                    ? "Select Your Daily Missions"
                    : `Select ${missionsNeeded} More Mission${missionsNeeded > 1 ? "s" : ""}`}
                </h3>
                <p className="text-sm text-slate-300">
                  {missions.length === 0
                    ? `Choose 3 missions to complete today.`
                    : `You have ${missions.length} mission${missions.length > 1 ? "s" : ""} selected. Select ${missionsNeeded} more.`}
                </p>
              </div>
              <Button
                data-select-missions-button
                onClick={() => {
                  setSelectedTemplateIds([])
                  setSelectMissionsOpen(true)
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md text-white"
              >
                Select {missionsNeeded} Mission{missionsNeeded > 1 ? "s" : ""}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {needsMoreMissions && isNewAgent && (
        <Card className="border-purple-500/30 bg-purple-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg">
                <Target className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Auto-Assigned Missions</h3>
                <p className="text-sm text-slate-300">
                  During your first 6 months, missions are automatically assigned daily to help you build momentum.
                  After 6 months, you'll be able to choose your own missions!
                </p>
              </div>
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
              {missions.map((mission) => {
                const isExpanded = expandedMissions.has(mission.id)
                const description = mission.mission_templates.description
                const shouldTruncate = shouldTruncateDescription(description)
                const displayDescription =
                  shouldTruncate && !isExpanded ? description.slice(0, 100) + "..." : description

                return (
                  <div
                    key={mission.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      mission.status === "completed"
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-blue-500/10 border-blue-500/30 shadow-sm"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        mission.status === "completed"
                          ? "bg-emerald-500 text-white"
                          : "bg-blue-500 text-white font-bold"
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
                        <div className="flex-1">
                          <h3
                            className={`font-medium text-blue-400 ${mission.status === "completed" ? "line-through opacity-60" : ""}`}
                          >
                            {mission.mission_templates.title}
                          </h3>
                          <p className="text-sm text-slate-300 mt-1">{displayDescription}</p>
                          {shouldTruncate && (
                            <button
                              onClick={() => toggleMissionDescription(mission.id)}
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1 transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  See Less <ChevronUp className="h-3 w-3" />
                                </>
                              ) : (
                                <>
                                  See More <ChevronDown className="h-3 w-3" />
                                </>
                              )}
                            </button>
                          )}
                          {mission.status !== "completed" && (
                            <div className="flex items-center gap-1 mt-2">
                              <Zap className="h-3.5 w-3.5 text-amber-400" />
                              <span className="text-xs font-semibold text-amber-400">
                                +{mission.mission_templates.xp_reward} XP
                              </span>
                            </div>
                          )}
                        </div>
                        {mission.status !== "completed" && (
                          <Button
                            onClick={() => setCompletingMission(mission)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                        )}
                      </div>
                      {mission.status === "completed" && mission.completed_at && (
                        <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Completed {new Date(mission.completed_at).toLocaleTimeString()} •{" "}
                          <span className="text-amber-400 font-semibold">
                            +{mission.mission_templates.xp_reward} XP
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No missions selected yet</p>
              <p className="text-sm mt-1">Select 3 missions to start earning XP today</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Mission Dialog */}
      <Dialog
        open={!!completingMission}
        onOpenChange={() => {
          setCompletingMission(null)
          setNotes("")
          removePhoto()
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Mission</DialogTitle>
            <DialogDescription>{completingMission?.mission_templates.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                Photo Proof <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Mission preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-red-500/50 rounded-lg p-8 text-center cursor-pointer hover:bg-accent transition-colors"
                  >
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">Upload Photo Proof</p>
                    <p className="text-xs text-red-400 mt-1">Required - Click to select an image (max 5MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about completing this mission..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <Zap className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-white">
                You'll earn <strong>{completingMission?.mission_templates.xp_reward} XP</strong> for completing this
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCompletingMission(null)
                setNotes("")
                removePhoto()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteMission}
              disabled={isLoading || uploadingPhoto || !photoFile}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {uploadingPhoto ? "Uploading..." : isLoading ? "Completing..." : "Mark Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select Missions Dialog - Only accessible to veteran agents */}
      {!isNewAgent && (
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
              <div className="mb-4 p-3 bg-blue-500/10 rounded-lg flex items-center justify-between border border-blue-500/30">
                <span className="text-sm text-slate-300">
                  Selected: <strong className="text-white">{selectedTemplateIds.length}</strong> of {missionsNeeded}
                </span>
                {selectedTemplateIds.length === missionsNeeded && (
                  <Badge className="bg-emerald-500 text-white">Ready to submit</Badge>
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
                            ? "border-blue-500/50 bg-blue-500/10 shadow-sm"
                            : isDisabled
                              ? "border-border/50 bg-muted/30 opacity-50 cursor-not-allowed"
                              : "border-border/50 hover:border-blue-500/50 hover:bg-blue-500/5"
                        }`}
                      >
                        <Checkbox checked={isSelected} disabled={isDisabled} className="pointer-events-none" />
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{template.title}</h4>
                          <p className="text-sm text-slate-300">{template.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
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
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
              >
                {isLoading ? "Submitting..." : `Confirm ${missionsNeeded} Mission${missionsNeeded > 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
