"use client"

import { useState } from "react"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TemplateCustomizer } from "@/components/marketing/template-customizer"
import { ShoppingBag, Package, AlertCircle } from "lucide-react"

export interface PrintTemplate {
  id: string
  name: string
  category: string
  description: string | null
  preview_url: string
  template_file_url: string
  price: number
  quantity_options: Array<{ qty: number; price: number }>
  fourover_product_uuid: string | null
  fourover_runsize_uuid: string | null
  fourover_turnaround_uuid: string | null
  fourover_colorspec_uuid: string | null
  customizable_layers: CustomizableLayer[]
  is_active: boolean
  created_at: string
}

export interface CustomizableLayer {
  id: string
  type: "photo" | "text"
  label: string
  field?: string // "name" | "phone" | "email" | "brokerage" | "website" | "tagline"
  default_value?: string
  x: number // percentage 0-100
  y: number // percentage 0-100
  width: number // percentage
  height: number // percentage
  font_size?: number
  font_color?: string
  shape?: "circle" | "rectangle" // for photo layers
}

const CATEGORY_LABELS: Record<string, string> = {
  business_cards: "Business Cards",
  postcards: "Postcards",
  flyers: "Flyers",
  signs: "Signs",
  door_hangers: "Door Hangers",
  brochures: "Brochures",
}

const CATEGORY_COLORS: Record<string, string> = {
  business_cards: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  postcards: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  flyers: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  signs: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  door_hangers: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  brochures: "bg-blue-500/15 text-blue-300 border-blue-500/20",
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch templates")
  return res.json()
}

const CATEGORIES = ["all", "business_cards", "postcards", "flyers", "signs", "door_hangers", "brochures"]

interface PrintStoreProps {
  agentId: string
  agentName: string
  agentPhone: string
  agentEmail: string
  agentPhotoUrl?: string
}

export function PrintStore({ agentId, agentName, agentPhone, agentEmail, agentPhotoUrl }: PrintStoreProps) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null)

  const { data, isLoading, error } = useSWR("/api/print-store/templates", fetcher)
  const templates: PrintTemplate[] = data?.templates || []

  const filtered = activeCategory === "all"
    ? templates
    : templates.filter((t) => t.category === activeCategory)

  if (selectedTemplate) {
    return (
      <TemplateCustomizer
        template={selectedTemplate}
        agentId={agentId}
        agentName={agentName}
        agentPhone={agentPhone}
        agentEmail={agentEmail}
        agentPhotoUrl={agentPhotoUrl}
        onBack={() => setSelectedTemplate(null)}
        onOrderComplete={() => setSelectedTemplate(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Print Store</h2>
          <p className="text-sm text-white/50 mt-0.5">
            Pre-approved templates — customize and order with direct delivery via 4over
          </p>
        </div>
        <div className="flex items-center gap-2 text-white/40">
          <Package className="h-4 w-4" />
          <span className="text-xs">Fulfilled by 4over</span>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              activeCategory === cat
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                : "bg-white/[0.03] text-white/50 border-white/[0.06] hover:text-white/70 hover:bg-white/[0.06]"
            }`}
          >
            {cat === "all" ? "All Products" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] text-rose-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load templates. Please try again.</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] overflow-hidden">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full mt-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="h-12 w-12 text-white/20 mb-4" />
          <p className="text-white/50 font-medium">No templates available</p>
          <p className="text-white/30 text-sm mt-1">
            {activeCategory === "all"
              ? "Ask your broker to add print templates."
              : `No ${CATEGORY_LABELS[activeCategory] || activeCategory} templates yet.`}
          </p>
        </div>
      )}

      {/* Template grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <Card
              key={template.id}
              className="border-white/[0.06] bg-white/[0.02] overflow-hidden group hover:border-cyan-500/30 transition-all duration-200"
            >
              {/* Preview image */}
              <div className="relative h-48 bg-white/[0.04] overflow-hidden">
                <img
                  src={template.preview_url}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      CATEGORY_COLORS[template.category] || "bg-white/10 text-white/60 border-white/10"
                    }`}
                  >
                    {CATEGORY_LABELS[template.category] || template.category}
                  </span>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-white text-sm leading-tight">{template.name}</h3>
                  {template.description && (
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">{template.description}</p>
                  )}
                </div>

                {/* Quantity options */}
                {template.quantity_options?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {template.quantity_options.map((opt) => (
                      <span
                        key={opt.qty}
                        className="text-xs px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white/50"
                      >
                        {opt.qty.toLocaleString()} / ${opt.price}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-cyan-400">
                    from ${template.price > 0 ? template.price.toFixed(2) : "—"}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setSelectedTemplate(template)}
                    className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs h-7 px-3"
                  >
                    Customize
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
