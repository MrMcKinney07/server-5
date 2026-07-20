"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Trash2,
  Upload,
  Loader2,
  Package,
  Edit,
  Eye,
  EyeOff,
  ShoppingCart,
  ImageIcon,
} from "lucide-react"
import type { PrintTemplate } from "@/components/marketing/print-store"

const CATEGORIES = [
  { value: "business_cards", label: "Business Cards" },
  { value: "postcards", label: "Postcards" },
  { value: "flyers", label: "Flyers" },
  { value: "signs", label: "Signs" },
  { value: "door_hangers", label: "Door Hangers" },
  { value: "brochures", label: "Brochures" },
]

const DEFAULT_LAYERS = JSON.stringify(
  [
    { id: "photo", type: "photo", label: "Agent Photo", x: 5, y: 10, width: 25, height: 40, shape: "circle" },
    { id: "name", type: "text", label: "Agent Name", field: "name", x: 35, y: 12, width: 60, height: 12, font_size: 16, font_color: "#ffffff" },
    { id: "phone", type: "text", label: "Phone", field: "phone", x: 35, y: 30, width: 60, height: 10, font_size: 12, font_color: "#cccccc" },
    { id: "email", type: "text", label: "Email", field: "email", x: 35, y: 44, width: 60, height: 10, font_size: 11, font_color: "#cccccc" },
  ],
  null,
  2
)

const DEFAULT_QTY = JSON.stringify(
  [
    { qty: 250, price: 49.99 },
    { qty: 500, price: 79.99 },
    { qty: 1000, price: 119.99 },
  ],
  null,
  2
)

const fetcher = async (url: string) => {
  const res = await fetch(url, { method: "PATCH" })
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

interface OrderRow {
  id: string
  created_at: string
  status: string
  quantity: number
  total_price: number
  fourover_order_id: string | null
  agent: { Name: string; Email: string } | null
  template: { name: string; category: string } | null
}

const orderFetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch orders")
  return res.json()
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  submitted: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  in_production: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  shipped: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  delivered: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
}

export function TemplateManager() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"templates" | "orders">("templates")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [templateFile, setTemplateFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    name: "",
    category: "business_cards",
    description: "",
    price: "",
    quantity_options: DEFAULT_QTY,
    customizable_layers: DEFAULT_LAYERS,
    fourover_product_uuid: "",
    fourover_runsize_uuid: "",
    fourover_turnaround_uuid: "",
    fourover_colorspec_uuid: "",
  })

  const { data: tplData, isLoading: tplLoading } = useSWR("/api/print-store/templates", fetcher)
  const { data: ordData, isLoading: ordLoading } = useSWR(
    activeTab === "orders" ? "/api/print-store/order" : null,
    orderFetcher
  )
  const templates: PrintTemplate[] = tplData?.templates || []
  const orders: OrderRow[] = ordData?.orders || []

  const resetForm = () => {
    setForm({
      name: "", category: "business_cards", description: "", price: "",
      quantity_options: DEFAULT_QTY, customizable_layers: DEFAULT_LAYERS,
      fourover_product_uuid: "", fourover_runsize_uuid: "",
      fourover_turnaround_uuid: "", fourover_colorspec_uuid: "",
    })
    setPreviewFile(null)
    setTemplateFile(null)
  }

  const handleSubmit = async () => {
    if (!previewFile || !templateFile || !form.name || !form.category) {
      toast({ title: "Missing Fields", description: "Name, category, preview image, and print file are required.", variant: "destructive" })
      return
    }

    let qtyParsed, layersParsed
    try {
      qtyParsed = JSON.parse(form.quantity_options)
      layersParsed = JSON.parse(form.customizable_layers)
    } catch {
      toast({ title: "Invalid JSON", description: "Quantity options or layer definitions have invalid JSON.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("preview_file", previewFile)
      fd.append("template_file", templateFile)
      fd.append("name", form.name)
      fd.append("category", form.category)
      fd.append("description", form.description)
      fd.append("price", form.price || "0")
      fd.append("quantity_options", JSON.stringify(qtyParsed))
      fd.append("customizable_layers", JSON.stringify(layersParsed))
      fd.append("fourover_product_uuid", form.fourover_product_uuid)
      fd.append("fourover_runsize_uuid", form.fourover_runsize_uuid)
      fd.append("fourover_turnaround_uuid", form.fourover_turnaround_uuid)
      fd.append("fourover_colorspec_uuid", form.fourover_colorspec_uuid)

      const res = await fetch("/api/print-store/templates", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      toast({ title: "Template Added", description: `"${form.name}" is now live in the store.` })
      setDialogOpen(false)
      resetForm()
      mutate("/api/print-store/templates")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from the store?`)) return
    try {
      const res = await fetch("/api/print-store/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error("Failed to remove template")
      toast({ title: "Template Removed", description: `"${name}" has been deactivated.` })
      mutate("/api/print-store/templates")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Print Store Management</h2>
          <p className="text-sm text-white/40 mt-0.5">Manage pre-approved templates and view agent orders</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] w-fit">
        {(["templates", "orders"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {tab === "templates" ? (
              <span className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" />{tab}</span>
            ) : (
              <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" />{tab}</span>
            )}
          </button>
        ))}
      </div>

      {/* Templates tab */}
      {activeTab === "templates" && (
        <div>
          {tplLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-52 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/[0.08] rounded-xl">
              <ImageIcon className="h-10 w-10 text-white/20 mb-3" />
              <p className="text-white/40 text-sm">No templates yet</p>
              <p className="text-white/25 text-xs mt-1">Click "Add Template" to upload the first one</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {templates.map((t) => (
                <div key={t.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden group">
                  <div className="relative h-36 bg-white/[0.04]">
                    <img src={t.preview_url} alt={t.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDelete(t.id, t.name)}
                        className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className={`absolute top-1.5 right-1.5 text-xs px-1.5 py-0.5 rounded-full border font-medium ${
                      t.is_active
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
                        : "bg-white/10 text-white/40 border-white/[0.06]"
                    }`}>
                      {t.is_active ? "Live" : "Hidden"}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-white truncate">{t.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{CATEGORIES.find(c => c.value === t.category)?.label || t.category}</p>
                    <p className="text-xs text-cyan-400 mt-1.5 font-medium">
                      from ${(t.quantity_options?.[0]?.price ?? t.price ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders tab */}
      {activeTab === "orders" && (
        <div className="space-y-2">
          {ordLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/[0.08] rounded-xl">
              <ShoppingCart className="h-10 w-10 text-white/20 mb-3" />
              <p className="text-white/40 text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Agent</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Template</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Qty</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Total</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Status</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">4over ID</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white/80">{order.agent?.Name || "—"}</td>
                      <td className="px-4 py-3 text-white/60">{order.template?.name || "—"}</td>
                      <td className="px-4 py-3 text-white/60">{order.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-cyan-400 font-medium">${order.total_price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[order.status] || "bg-white/10 text-white/50 border-white/[0.06]"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/40 font-mono text-xs">{order.fourover_order_id || "pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f1117] border-white/[0.08] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add Print Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Template Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Classic Business Card" className="bg-white/[0.03] border-white/[0.08] text-white h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-9 bg-white/[0.03] border-white/[0.08] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/60">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2} className="bg-white/[0.03] border-white/[0.08] text-white resize-none text-sm" />
            </div>

            {/* File uploads */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Preview Image * (PNG/JPG)</Label>
                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-xs text-white/50">
                  <Upload className="h-3.5 w-3.5 shrink-0" />
                  {previewFile ? previewFile.name : "Choose file"}
                  <input type="file" accept="image/*" className="sr-only"
                    onChange={(e) => setPreviewFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Print File * (PDF/PNG)</Label>
                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-xs text-white/50">
                  <Upload className="h-3.5 w-3.5 shrink-0" />
                  {templateFile ? templateFile.name : "Choose file"}
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="sr-only"
                    onChange={(e) => setTemplateFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            {/* 4over UUIDs */}
            <div className="space-y-2 border-t border-white/[0.06] pt-4">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider">4over Product Configuration</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "fourover_product_uuid", label: "Product UUID" },
                  { key: "fourover_runsize_uuid", label: "Run Size UUID" },
                  { key: "fourover_turnaround_uuid", label: "Turnaround UUID" },
                  { key: "fourover_colorspec_uuid", label: "Color Spec UUID" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-white/60">{label}</Label>
                    <Input
                      value={(form as any)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder="xxxxxxxx-xxxx-xxxx..."
                      className="bg-white/[0.03] border-white/[0.08] text-white h-9 font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Quantity options */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60">Quantity Options (JSON)</Label>
              <Textarea
                value={form.quantity_options}
                onChange={(e) => setForm({ ...form, quantity_options: e.target.value })}
                rows={5}
                className="bg-white/[0.03] border-white/[0.08] text-white resize-none font-mono text-xs"
              />
              <p className="text-xs text-white/30">Format: {`[{"qty": 250, "price": 49.99}, ...]`}</p>
            </div>

            {/* Customizable layers */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60">Customizable Layers (JSON)</Label>
              <Textarea
                value={form.customizable_layers}
                onChange={(e) => setForm({ ...form, customizable_layers: e.target.value })}
                rows={10}
                className="bg-white/[0.03] border-white/[0.08] text-white resize-none font-mono text-xs"
              />
              <p className="text-xs text-white/30">
                Each layer: id, type (photo|text), label, field, x, y, width, height (all 0–100%), font_size, font_color, shape (circle|rectangle)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}
              className="border-white/[0.08] bg-transparent text-white/60 hover:bg-white/[0.04]">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : "Add Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
