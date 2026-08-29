"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { PrintTemplate, CustomizableLayer } from "@/components/marketing/print-store"
import {
  ArrowLeft,
  Upload,
  GripVertical,
  CheckCircle2,
  Loader2,
  MapPin,
  Truck,
  User,
} from "lucide-react"

interface LayerState {
  id: string
  x: number // percent
  y: number // percent
  value: string // text value or photo url
}

interface ShippingAddress {
  name: string
  address1: string
  address2: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
}

interface TemplateCustmizerProps {
  template: PrintTemplate
  agentId: string
  agentName: string
  agentPhone: string
  agentEmail: string
  agentPhotoUrl?: string
  onBack: () => void
  onOrderComplete: () => void
}

const FIELD_LABELS: Record<string, string> = {
  name: "Full Name",
  phone: "Phone Number",
  email: "Email Address",
  brokerage: "Brokerage Name",
  website: "Website",
  tagline: "Tagline",
  license: "License Number",
}

type Step = "customize" | "shipping" | "confirm"

export function TemplateCustomizer({
  template,
  agentId,
  agentName,
  agentPhone,
  agentEmail,
  agentPhotoUrl,
  onBack,
  onOrderComplete,
}: TemplateCustmizerProps) {
  const { toast } = useToast()
  const previewRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null)

  const [step, setStep] = useState<Step>("customize")
  const [selectedQty, setSelectedQty] = useState<number>(
    template.quantity_options?.[0]?.qty || 0
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)

  // Initialize layer state from template definition + agent defaults
  const [layers, setLayers] = useState<LayerState[]>(() =>
    (template.customizable_layers || []).map((layer) => ({
      id: layer.id,
      x: layer.x,
      y: layer.y,
      value:
        layer.type === "photo"
          ? agentPhotoUrl || ""
          : layer.field === "name"
          ? agentName
          : layer.field === "phone"
          ? agentPhone
          : layer.field === "email"
          ? agentEmail
          : layer.default_value || "",
    }))
  )

  const [shipping, setShipping] = useState<ShippingAddress>({
    name: agentName,
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    phone: agentPhone,
    email: agentEmail,
  })

  const getLayerDef = (id: string) =>
    template.customizable_layers.find((l) => l.id === id)

  const getLayerState = (id: string) =>
    layers.find((l) => l.id === id)

  // Drag handling
  const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
    e.preventDefault()
    const layer = layers.find((l) => l.id === layerId)
    if (!layer) return
    draggingRef.current = {
      id: layerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: layer.x,
      origY: layer.y,
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !previewRef.current) return
      const container = previewRef.current.getBoundingClientRect()
      const dx = ((e.clientX - draggingRef.current.startX) / container.width) * 100
      const dy = ((e.clientY - draggingRef.current.startY) / container.height) * 100
      const id = draggingRef.current.id
      setLayers((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                x: Math.max(0, Math.min(90, draggingRef.current!.origX + dx)),
                y: Math.max(0, Math.min(90, draggingRef.current!.origY + dy)),
              }
            : l
        )
      )
    }
    const handleMouseUp = () => {
      draggingRef.current = null
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  // Photo upload for headshot layer
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, layerId: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, value: url, _file: file as any } : l))
    )
  }

  const getSelectedPrice = () => {
    const opt = template.quantity_options?.find((o) => o.qty === selectedQty)
    return opt?.price ?? template.price ?? 0
  }

  const handleSubmitOrder = async () => {
    setIsSubmitting(true)
    try {
      // Build customization payload
      const customization: Record<string, any> = {}
      layers.forEach((layer) => {
        const def = getLayerDef(layer.id)
        if (!def) return
        customization[layer.id] = {
          type: def.type,
          field: def.field,
          value: layer.value,
          x: layer.x,
          y: layer.y,
        }
      })

      const formData = new FormData()
      formData.append("template_id", template.id)
      formData.append("quantity", String(selectedQty))
      formData.append("total_price", String(getSelectedPrice()))
      formData.append("customization", JSON.stringify(customization))
      formData.append("shipping_address", JSON.stringify(shipping))

      // Attach photo file if any
      const photoLayer = layers.find((l) => {
        const def = getLayerDef(l.id)
        return def?.type === "photo" && (l as any)._file
      })
      if (photoLayer && (photoLayer as any)._file) {
        formData.append("preview_image", (photoLayer as any)._file)
      }

      const res = await fetch("/api/print-store/order", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Order failed")

      if (!data.checkoutUrl) throw new Error("Unable to start Stripe checkout")
      window.location.assign(data.checkoutUrl)
    } catch (err: any) {
      toast({ title: "Order Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-400" />
        <h2 className="text-xl font-semibold text-white">Order Placed!</h2>
        <p className="text-white/50 text-sm max-w-xs">
          Your personalized marketing piece is ready to move forward. You&apos;ll receive a confirmation shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-white">{template.name}</h2>
          <p className="text-sm text-white/40">
            {step === "customize" && "Drag elements to reposition • Upload your headshot"}
            {step === "shipping" && "Enter your shipping address"}
            {step === "confirm" && "Review and place your order"}
          </p>
        </div>
      </div>

      {/* Step: Customize */}
      {step === "customize" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Preview canvas */}
          <div className="space-y-3">
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Preview — drag to reposition</p>
            <div
              ref={previewRef}
              className="relative w-full rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02] select-none"
              style={{ aspectRatio: "1.4 / 1" }}
            >
              {/* Base template image */}
              <img
                src={template.preview_url}
                alt={template.name}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* Draggable layers */}
              {template.customizable_layers.map((layerDef) => {
                const state = getLayerState(layerDef.id)
                if (!state) return null
                return (
                  <div
                    key={layerDef.id}
                    className="absolute cursor-move group"
                    style={{
                      left: `${state.x}%`,
                      top: `${state.y}%`,
                      width: `${layerDef.width}%`,
                      height: `${layerDef.height}%`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, layerDef.id)}
                  >
                    {layerDef.type === "photo" ? (
                      <div
                        className={`w-full h-full border-2 border-dashed border-white/40 group-hover:border-cyan-400 overflow-hidden transition-colors ${
                          layerDef.shape === "circle" ? "rounded-full" : "rounded-lg"
                        }`}
                        style={{ background: "rgba(0,0,0,0.3)" }}
                      >
                        {state.value ? (
                          <img
                            src={state.value}
                            alt="Headshot"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <User className="h-5 w-5 text-white/40" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="w-full h-full flex items-center border border-dashed border-white/20 group-hover:border-cyan-400/60 transition-colors px-1 rounded"
                        style={{ background: "rgba(0,0,0,0.4)" }}
                      >
                        <span
                          className="text-white truncate leading-tight"
                          style={{ fontSize: `${layerDef.font_size || 12}px`, color: layerDef.font_color || "#ffffff" }}
                        >
                          {state.value || layerDef.label}
                        </span>
                      </div>
                    )}
                    {/* Drag handle indicator */}
                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-3 w-3 text-cyan-400" />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-white/30 text-center">
              Drag elements to reposition them on the template
            </p>
          </div>

          {/* Controls panel */}
          <div className="space-y-5">
            {/* Layer controls */}
            {template.customizable_layers.map((layerDef) => {
              const state = getLayerState(layerDef.id)
              if (!state) return null
              return (
                <div key={layerDef.id} className="space-y-1.5">
                  <Label className="text-xs text-white/60 font-medium">
                    {FIELD_LABELS[layerDef.field || ""] || layerDef.label}
                  </Label>
                  {layerDef.type === "photo" ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="flex-1 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-white/40 truncate">
                        {state.value ? "Photo uploaded" : "No photo selected"}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs hover:bg-cyan-500/20 transition-colors cursor-pointer">
                        <Upload className="h-3 w-3" />
                        Upload
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handlePhotoUpload(e, layerDef.id)}
                      />
                    </label>
                  ) : (
                    <Input
                      value={state.value}
                      onChange={(e) =>
                        setLayers((prev) =>
                          prev.map((l) =>
                            l.id === layerDef.id ? { ...l, value: e.target.value } : l
                          )
                        )
                      }
                      className="h-8 text-sm bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20"
                      placeholder={layerDef.default_value || layerDef.label}
                    />
                  )}
                </div>
              )
            })}

            {/* Quantity selector */}
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <Label className="text-xs text-white/60 font-medium">Quantity</Label>
              {template.quantity_options?.length > 0 ? (
                <Select
                  value={String(selectedQty)}
                  onValueChange={(v) => setSelectedQty(parseInt(v))}
                >
                  <SelectTrigger className="h-8 text-sm bg-white/[0.03] border-white/[0.08] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {template.quantity_options.map((opt) => (
                      <SelectItem key={opt.qty} value={String(opt.qty)}>
                        {opt.qty.toLocaleString()} — ${opt.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="number"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(parseInt(e.target.value) || 1)}
                  min={1}
                  className="h-8 text-sm bg-white/[0.03] border-white/[0.08] text-white"
                />
              )}
            </div>

            {/* Price */}
            <div className="flex items-center justify-between py-3 border-t border-white/[0.06]">
              <span className="text-sm text-white/50">Total</span>
              <span className="text-lg font-bold text-cyan-400">${getSelectedPrice().toFixed(2)}</span>
            </div>

            <Button
              onClick={() => setStep("shipping")}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              Continue to Shipping
            </Button>
          </div>
        </div>
      )}

      {/* Step: Shipping */}
      {step === "shipping" && (
        <div className="max-w-lg space-y-4">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
            <Truck className="h-4 w-4" />
            <span>Shipped directly from 4over to your address</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-white/60">Full Name</Label>
              <Input value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                className="bg-white/[0.03] border-white/[0.08] text-white h-9" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-white/60">Address</Label>
              <Input value={shipping.address1} onChange={(e) => setShipping({ ...shipping, address1: e.target.value })}
                placeholder="Street address" className="bg-white/[0.03] border-white/[0.08] text-white h-9" />
            </div>
            <div className="col-span-2 space-y-1">
              <Input value={shipping.address2} onChange={(e) => setShipping({ ...shipping, address2: e.target.value })}
                placeholder="Apt, Suite, etc. (optional)" className="bg-white/[0.03] border-white/[0.08] text-white h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/60">City</Label>
              <Input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                className="bg-white/[0.03] border-white/[0.08] text-white h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/60">State</Label>
              <Input value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                maxLength={2} placeholder="FL" className="bg-white/[0.03] border-white/[0.08] text-white h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/60">ZIP Code</Label>
              <Input value={shipping.zip} onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                className="bg-white/[0.03] border-white/[0.08] text-white h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Phone</Label>
              <Input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                className="bg-white/[0.03] border-white/[0.08] text-white h-9" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep("customize")}
              className="flex-1 border-white/[0.08] bg-transparent text-white/70 hover:bg-white/[0.04]">
              Back
            </Button>
            <Button
              onClick={() => setStep("confirm")}
              disabled={!shipping.name || !shipping.address1 || !shipping.city || !shipping.state || !shipping.zip}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              Review Order
            </Button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && (
        <div className="max-w-lg space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Order Summary</h3>
            <div className="flex items-start gap-3">
              <img src={template.preview_url} alt={template.name} className="w-16 h-16 object-cover rounded-lg border border-white/[0.06]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{template.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{selectedQty.toLocaleString()} units</p>
                <p className="text-sm font-bold text-cyan-400 mt-1">${getSelectedPrice().toFixed(2)}</p>
              </div>
            </div>
            <div className="border-t border-white/[0.06] pt-3 space-y-1">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <MapPin className="h-3.5 w-3.5" />
                <span>{shipping.address1}{shipping.address2 ? `, ${shipping.address2}` : ""}, {shipping.city}, {shipping.state} {shipping.zip}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("shipping")}
              className="flex-1 border-white/[0.08] bg-transparent text-white/70 hover:bg-white/[0.04]">
              Back
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing Order...</>
              ) : (
                "Place Order"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
