"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

interface CreateLeadDialogProps {
  agentId: string
}

const sources = [
  { value: "manual", label: "Manual Entry" },
  { value: "realtor", label: "Realtor" },
  { value: "upnest", label: "UpNest" },
  { value: "opcity", label: "OpCity" },
  { value: "fb_ads", label: "FB Ads" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
]

const leadTypes = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "both", label: "Buyer & Seller" },
  { value: "investor", label: "Investor" },
  { value: "renter", label: "Renter" },
]

export function CreateLeadDialog({ agentId }: CreateLeadDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [leadType, setLeadType] = useState("buyer")
  const [source, setSource] = useState("manual")
  const [notes, setNotes] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createBrowserClient()
    const { error } = await supabase.from("leads").insert({
      agent_id: agentId,
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      phone: phone || null,
      lead_type: leadType,
      source,
      notes: notes || null,
      status: "new",
    })

    if (!error) {
      setOpen(false)
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setLeadType("buyer")
      setSource("manual")
      setNotes("")
      router.refresh()
    } else {
      console.error("Error creating lead:", error)
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Lead</DialogTitle>
          <DialogDescription>Add a new lead to your pipeline.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Lead Type</Label>
                <Select value={leadType} onValueChange={setLeadType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Initial notes about this lead..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Creating..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
