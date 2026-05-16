"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Play, Plus, Trash2, Youtube } from "lucide-react"
import { cn } from "@/lib/utils"

interface Video {
  id: string
  title: string
  youtube_url: string
  description: string | null
  category: string
  sort_order: number
}

interface RecommendedVideosProps {
  videos: Video[]
  agentId: string
  isBroker: boolean
}

// Extract YouTube video ID from any YT URL format
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function getThumbnail(url: string): string | null {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

function getEmbedUrl(url: string): string | null {
  const id = getYouTubeId(url)
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null
}

const VIDEO_CATEGORIES = [
  { value: "general",       label: "General" },
  { value: "lead_handling", label: "Lead Mastery" },
  { value: "listings",      label: "Listing Excellence" },
  { value: "transactions",  label: "Deal Management" },
  { value: "open_house",    label: "Open House Strategies" },
  { value: "training",      label: "Agent Development" },
]

export function RecommendedVideos({ videos: initial, agentId, isBroker }: RecommendedVideosProps) {
  const [videos, setVideos]         = useState<Video[]>(initial)
  const [playing, setPlaying]       = useState<string | null>(null)
  const [showAdd, setShowAdd]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const supabaseRef                 = useRef(createClient())

  // Add form state
  const [title, setTitle]           = useState("")
  const [url, setUrl]               = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory]     = useState("general")

  const [fetchingTitle, setFetchingTitle] = useState(false)
  const urlPreviewId = getYouTubeId(url)

  async function handleUrlChange(value: string) {
    setUrl(value)
    const ytId = getYouTubeId(value.trim())
    if (!ytId) return
    // Only auto-fill if title is still empty
    if (title.trim()) return
    setFetchingTitle(true)
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`)
      if (res.ok) {
        const data = await res.json()
        if (data.title) setTitle(data.title)
      }
    } catch {
      // silently ignore — user can type it manually
    } finally {
      setFetchingTitle(false)
    }
  }

  async function handleAdd() {
    if (!title.trim() || !url.trim()) return
    const ytId = getYouTubeId(url.trim())
    if (!ytId) return
    setSaving(true)
    const { data, error } = await supabaseRef.current
      .from("recommended_videos")
      .insert({
        title:       title.trim(),
        youtube_url: url.trim(),
        description: description.trim() || null,
        category,
        sort_order:  videos.length,
        created_by:  agentId,
      })
      .select()
      .single()
    if (!error && data) {
      setVideos((v) => [...v, data as Video])
      setTitle(""); setUrl(""); setDescription(""); setCategory("general")
      setShowAdd(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabaseRef.current.from("recommended_videos").delete().eq("id", id)
    setVideos((v) => v.filter((x) => x.id !== id))
    setDeleting(null)
  }

  if (videos.length === 0 && !isBroker) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Youtube className="h-4 w-4 text-rose-500" />
            Recommended Videos
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Curated training and development resources</p>
        </div>
        {isBroker && (
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Video
          </Button>
        )}
      </div>

      {videos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <Youtube className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">No recommended videos yet</p>
            <p className="text-xs mt-1">Click &quot;Add Video&quot; to add YouTube links for your agents</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => {
            const thumbnail = getThumbnail(video.youtube_url)
            const embedUrl  = getEmbedUrl(video.youtube_url)
            const isPlaying = playing === video.id

            return (
              <Card key={video.id} className="overflow-hidden group">
                {/* Thumbnail / Player */}
                <div className="relative aspect-video bg-black">
                  {isPlaying && embedUrl ? (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={video.title}
                    />
                  ) : (
                    <>
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Youtube className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <button
                        onClick={() => setPlaying(video.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Play ${video.title}`}
                      >
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Play className="h-5 w-5 text-rose-600 ml-0.5" />
                        </div>
                      </button>
                    </>
                  )}

                  {/* Delete button for brokers */}
                  {isBroker && !isPlaying && (
                    <button
                      onClick={() => handleDelete(video.id)}
                      disabled={deleting === video.id}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                      aria-label="Remove video"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                    </button>
                  )}
                </div>

                {/* Info */}
                <CardContent className="p-3">
                  <p className="text-sm font-medium leading-tight line-clamp-2">{video.title}</p>
                  {video.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
                  )}
                  <span className={cn(
                    "inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium",
                    "bg-muted text-muted-foreground"
                  )}>
                    {VIDEO_CATEGORIES.find((c) => c.value === video.category)?.label || video.category}
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Video Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-rose-500" />
              Add Recommended Video
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="vid-url">YouTube URL *</Label>
              <Input
                id="vid-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
              {/* Live thumbnail preview */}
              {urlPreviewId && (
                <div className="mt-2 rounded-lg overflow-hidden aspect-video w-full bg-muted">
                  <img
                    src={`https://img.youtube.com/vi/${urlPreviewId}/hqdefault.jpg`}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="vid-title">Title *</Label>
                {fetchingTitle && <span className="text-xs text-muted-foreground">Fetching title...</span>}
              </div>
              <Input
                id="vid-title"
                placeholder="e.g. How to Handle Objections"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vid-desc">Description</Label>
              <Textarea
                id="vid-desc"
                placeholder="Brief description of what agents will learn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={saving || !title.trim() || !urlPreviewId}
            >
              {saving ? "Adding..." : "Add Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
