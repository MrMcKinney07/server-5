"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Mail,
  MessageSquare,
  Users,
  Home,
  Star,
  TrendingDown,
  Clock,
  ChevronRight,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react"

type TemplateStep = {
  id: string
  step_number: number
  type: string
  subject: string | null
  body: string
  delay_hours: number
}

type Template = {
  id: string
  name: string
  description: string
  category: string
  channel: string
  type: string
  tags: string[]
  step_count: number
  campaign_template_steps?: TemplateStep[]
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  lead_nurture: {
    label: "Lead Nurture",
    icon: Users,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  seller: {
    label: "Seller",
    icon: Home,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  past_client: {
    label: "Past Client",
    icon: Star,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  open_house: {
    label: "Open House",
    icon: Home,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  sphere: {
    label: "Sphere of Influence",
    icon: Users,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
  buyer: {
    label: "Buyer",
    icon: TrendingDown,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
}

function formatDelay(hours: number) {
  if (hours === 0) return "Immediately"
  if (hours < 24) return `${hours}h delay`
  const days = Math.round(hours / 24)
  if (days < 30) return `Day ${days}`
  const months = Math.round(days / 30)
  return `Month ${months}`
}

function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
}: {
  template: Template
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const router = useRouter()
  const [campaignName, setCampaignName] = useState(template.name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewStep, setPreviewStep] = useState<TemplateStep | null>(null)
  const [steps, setSteps] = useState<TemplateStep[]>(template.campaign_template_steps || [])
  const [stepsLoading, setStepsLoading] = useState(false)
  const cat = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.lead_nurture

  // Fetch steps lazily when dialog opens
  useEffect(() => {
    if (open && steps.length === 0) {
      setStepsLoading(true)
      fetch(`/api/campaigns/templates/${template.id}/steps`)
        .then((r) => r.json())
        .then((d) => { if (d.steps) setSteps(d.steps) })
        .catch(() => {})
        .finally(() => setStepsLoading(false))
    }
  }, [open])

  async function handleUseTemplate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/campaigns/templates/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, name: campaignName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create campaign")
      onOpenChange(false)
      router.push(`/dashboard/campaigns/${data.campaignId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className={`rounded-md p-1.5 ${cat.bg} border ${cat.border}`}>
              <cat.icon className={`h-4 w-4 ${cat.color}`} />
            </div>
            <Badge variant="outline" className={`text-[10px] ${cat.color} border-current/30`}>
              {cat.label}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {template.channel === "SMS" ? "SMS" : "Email"}
            </Badge>
          </div>
          <DialogTitle className="text-lg">{template.name}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{template.description}</DialogDescription>
        </DialogHeader>

        {/* Sequence preview */}
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {template.step_count}-Step Sequence
          </p>
          {stepsLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading steps...</div>
          )}
          <div className="space-y-2">
            {steps.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setPreviewStep(previewStep?.id === step.id ? null : step)}
                className="w-full text-left group"
              >
                <div className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] p-3 transition-colors">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground w-5 text-right tabular-nums">
                      {i + 1}
                    </span>
                    <div className={`rounded-md p-1 ${step.type === "SMS" ? "bg-emerald-500/10" : "bg-blue-500/10"}`}>
                      {step.type === "SMS" ? (
                        <MessageSquare className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Mail className="h-3 w-3 text-blue-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {step.subject || `SMS Message ${step.step_number}`}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDelay(step.delay_hours)}
                    </p>
                    {previewStep?.id === step.id && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line border-t border-white/[0.06] pt-2">
                        {step.body.slice(0, 300)}{step.body.length > 300 ? "…" : ""}
                      </p>
                    )}
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform ${previewStep?.id === step.id ? "rotate-90" : ""}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Campaign name */}
        <div className="mt-4 space-y-2">
          <Label>Campaign Name</Label>
          <Input
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Name your campaign"
          />
          <p className="text-[11px] text-muted-foreground">
            The campaign will be created in a paused state so you can review the steps before activating.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUseTemplate} disabled={loading || !campaignName.trim()}>
            {loading ? "Creating..." : "Use This Template"}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TemplateCard({ template }: { template: Template }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const cat = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.lead_nurture

  return (
    <>
      <button
        onClick={() => setPreviewOpen(true)}
        className="text-left w-full rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all p-4 group"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`rounded-lg p-2 ${cat.bg} border ${cat.border} shrink-0`}>
            <cat.icon className={`h-4 w-4 ${cat.color}`} />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {template.channel === "SMS" ? (
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-[11px] text-muted-foreground">
              {template.channel === "SMS" ? "SMS" : "Email"}
            </span>
          </div>
        </div>

        <p className="text-sm font-semibold leading-snug mb-1 group-hover:text-foreground transition-colors">
          {template.name}
        </p>
        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {template.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Layers className="h-3 w-3" />
            <span>{template.step_count} steps</span>
          </div>
          <span className={`text-[11px] font-medium ${cat.color}`}>{cat.label}</span>
        </div>
      </button>

      <TemplatePreviewDialog
        template={template}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </>
  )
}

type Props = {
  templates: Template[]
}

const CATEGORY_ORDER = ["lead_nurture", "seller", "open_house", "past_client", "sphere", "buyer"]

export function CampaignTemplatesGallery({ templates }: Props) {
  const [filter, setFilter] = useState<string>("all")

  const categories = Array.from(new Set(templates.map((t) => t.category))).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  )

  const filtered = filter === "all" ? templates : templates.filter((t) => t.category === filter)

  if (templates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/[0.08] p-16 text-center">
        <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">No templates available</p>
        <p className="text-xs text-muted-foreground mt-1">Templates are managed by your broker.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Category filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            filter === "all"
              ? "bg-foreground text-background border-foreground"
              : "border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-white/[0.15]"
          }`}
        >
          All ({templates.length})
        </button>
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat]
          const count = templates.filter((t) => t.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === cat
                  ? `${config.bg} ${config.color} ${config.border}`
                  : "border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-white/[0.15]"
              }`}
            >
              {config?.label || cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Templates are pre-written by your broker. All merge tags like {`{{first_name}}`} and {`{{agent_name}}`} are automatically filled in when messages send.
      </p>
    </div>
  )
}
