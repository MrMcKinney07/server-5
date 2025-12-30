"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Gift, Plus, Pencil, Trash2, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PrizesManager() {
  const [prizes, setPrizes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPrize, setEditingPrize] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [form, setForm] = useState({
    name: "",
    description: "",
    xp_cost: "",
    image_url: "",
    category: "general",
    quantity_available: "",
    is_active: true,
  })

  useEffect(() => {
    fetchPrizes()
  }, [])

  async function fetchPrizes() {
    const { data } = await supabase.from("rewards_prizes").select("*").order("created_at", { ascending: false })

    if (data) setPrizes(data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const prizeData = {
      name: form.name,
      description: form.description,
      xp_cost: Number.parseInt(form.xp_cost),
      image_url: form.image_url,
      category: form.category,
      quantity_available: form.quantity_available ? Number.parseInt(form.quantity_available) : null,
      is_active: form.is_active,
    }

    if (editingPrize) {
      const { error } = await supabase.from("rewards_prizes").update(prizeData).eq("id", editingPrize.id)

      if (error) {
        toast({ title: "Error updating prize", variant: "destructive" })
        return
      }
      toast({ title: "Prize updated successfully" })
    } else {
      const { error } = await supabase.from("rewards_prizes").insert([prizeData])

      if (error) {
        toast({ title: "Error creating prize", variant: "destructive" })
        return
      }
      toast({ title: "Prize created successfully" })
    }

    setOpen(false)
    resetForm()
    fetchPrizes()
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this prize?")) return

    const { error } = await supabase.from("rewards_prizes").delete().eq("id", id)

    if (error) {
      toast({ title: "Error deleting prize", variant: "destructive" })
      return
    }

    toast({ title: "Prize deleted successfully" })
    fetchPrizes()
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" })
      return
    }

    setUploading(true)

    try {
      // Upload to Vercel Blob
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()

      setForm({ ...form, image_url: url })
      setImagePreview(url)
      toast({ title: "Image uploaded successfully" })
    } catch (error) {
      toast({ title: "Error uploading image", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  function removeImage() {
    setForm({ ...form, image_url: "" })
    setImagePreview("")
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      xp_cost: "",
      image_url: "",
      category: "general",
      quantity_available: "",
      is_active: true,
    })
    setEditingPrize(null)
    setImagePreview("")
  }

  function openEditDialog(prize: any) {
    setEditingPrize(prize)
    setForm({
      name: prize.name,
      description: prize.description || "",
      xp_cost: prize.xp_cost.toString(),
      image_url: prize.image_url || "",
      category: prize.category,
      quantity_available: prize.quantity_available?.toString() || "",
      is_active: prize.is_active,
    })
    setImagePreview(prize.image_url || "")
    setOpen(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Manage Prizes</h1>
        </div>

        <Dialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val)
            if (!val) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Prize
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPrize ? "Edit Prize" : "Add New Prize"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Prize Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., $100 Amazon Gift Card"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the prize..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="xp_cost">XP Cost</Label>
                  <Input
                    id="xp_cost"
                    type="number"
                    value={form.xp_cost}
                    onChange={(e) => setForm({ ...form, xp_cost: e.target.value })}
                    placeholder="500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity Available</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={form.quantity_available}
                    onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="gift_cards">Gift Cards</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="experiences">Experiences</SelectItem>
                      <SelectItem value="swag">Company Swag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Active</Label>
                  <Switch
                    id="active"
                    checked={form.is_active}
                    onCheckedChange={(val) => setForm({ ...form, is_active: val })}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Prize Image</Label>
                  <div className="space-y-3">
                    {imagePreview ? (
                      <div className="relative rounded-lg border overflow-hidden">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full h-48 object-cover"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                        <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                        <Label
                          htmlFor="image-upload"
                          className="cursor-pointer text-sm text-muted-foreground hover:text-primary"
                        >
                          Click to upload image or drag and drop
                          <br />
                          <span className="text-xs">PNG, JPG, GIF up to 5MB</span>
                        </Label>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </div>
                    )}
                    {uploading && <p className="text-sm text-center text-muted-foreground">Uploading...</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {editingPrize ? "Update Prize" : "Create Prize"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prizes.map((prize) => (
          <Card key={prize.id} className="overflow-hidden">
            <CardHeader className="p-0">
              {prize.image_url ? (
                <img
                  src={prize.image_url || "/placeholder.svg"}
                  alt={prize.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Gift className="h-16 w-16 text-primary/40" />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold line-clamp-1">{prize.name}</h3>
                  <p className="text-sm text-muted-foreground">{prize.xp_cost} XP</p>
                </div>
                {!prize.is_active && <span className="text-xs bg-muted px-2 py-1 rounded">Inactive</span>}
              </div>

              {prize.description && <p className="text-sm text-muted-foreground line-clamp-2">{prize.description}</p>}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {prize.quantity_available !== null ? `${prize.quantity_available} available` : "Unlimited"}
                </span>
                <span className="capitalize text-muted-foreground">{prize.category}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => openEditDialog(prize)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(prize.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && prizes.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">No prizes yet</h3>
            <p className="text-sm text-muted-foreground">Click "Add Prize" to create your first reward</p>
          </div>
        </Card>
      )}
    </div>
  )
}
