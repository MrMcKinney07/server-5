"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, MessageSquare, Plus, Copy, Pencil, Trash2, Check } from "lucide-react"
import { toast } from "sonner"

type Template = {
  id: string
  name: string
  type: "email" | "sms"
  category: string
  subject?: string
  body: string
  created_at: string
}

const DEFAULT_TEMPLATES: Omit<Template, "id" | "created_at">[] = [
  {
    name: "New Lead Introduction",
    type: "email",
    category: "Introduction",
    subject: "Welcome! Let's Find Your Perfect Home",
    body: `Hi {{first_name}},

Thank you for reaching out! I'm excited to help you with your real estate journey.

I'd love to learn more about what you're looking for. Are you available for a quick call this week?

Best regards,
{{agent_name}}`,
  },
  {
    name: "Follow-Up After Showing",
    type: "email",
    category: "Follow-up",
    subject: "Thanks for Touring {{property_address}}!",
    body: `Hi {{first_name}},

It was great showing you {{property_address}} today! I wanted to follow up and see if you have any questions about the property.

What are your thoughts? Would you like to schedule another viewing or explore similar properties?

Looking forward to hearing from you!

Best,
{{agent_name}}`,
  },
  {
    name: "Quick Check-In",
    type: "sms",
    category: "Follow-up",
    body: `Hi {{first_name}}! Just checking in on your home search. Any questions I can help with? -{{agent_name}}`,
  },
  {
    name: "New Listing Alert",
    type: "sms",
    category: "Marketing",
    body: `Hi {{first_name}}! A new listing just hit the market that matches your criteria. Want me to schedule a showing? -{{agent_name}}`,
  },
  {
    name: "Price Reduction",
    type: "email",
    category: "Marketing",
    subject: "Price Drop Alert: {{property_address}}",
    body: `Hi {{first_name}},

Great news! A property you showed interest in just had a price reduction.

{{property_address}} is now listed at {{price}}.

Would you like to take another look? Let me know if you'd like to schedule a showing.

Best,
{{agent_name}}`,
  },
  {
    name: "Appointment Reminder",
    type: "sms",
    category: "Reminder",
    body: `Hi {{first_name}}! Just a reminder about our showing tomorrow at {{time}} for {{property_address}}. See you there! -{{agent_name}}`,
  },
  {
    name: "Contract Congratulations",
    type: "email",
    category: "Transaction",
    subject: "Congratulations! Your Offer Was Accepted!",
    body: `Hi {{first_name}},

CONGRATULATIONS! Your offer on {{property_address}} has been accepted!

This is such an exciting milestone. Here's what happens next:

1. We'll schedule the home inspection
2. Begin the appraisal process
3. Work with your lender on final mortgage approval
4. Prepare for closing

I'll be with you every step of the way. Let's schedule a call to discuss the timeline.

Congratulations again!

{{agent_name}}`,
  },
  {
    name: "Closing Reminder",
    type: "email",
    category: "Transaction",
    subject: "Your Closing is Coming Up!",
    body: `Hi {{first_name}},

Your closing for {{property_address}} is scheduled for {{closing_date}}!

Please remember to bring:
- Valid photo ID
- Cashier's check for closing costs (if applicable)
- Any documents your lender requested

I'll see you there! Let me know if you have any last-minute questions.

Best,
{{agent_name}}`,
  },
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const supabase = createBrowserClient()

  // Form state
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState<"email" | "sms">("email")
  const [formCategory, setFormCategory] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formBody, setFormBody] = useState("")

  useEffect(() => {
    // Load templates from localStorage (in a real app, this would be from database)
    const saved = localStorage.getItem("crm_templates")
    if (saved) {
      setTemplates(JSON.parse(saved))
    } else {
      // Initialize with default templates
      const initialTemplates = DEFAULT_TEMPLATES.map((t, i) => ({
        ...t,
        id: `template-${i}`,
        created_at: new Date().toISOString(),
      }))
      setTemplates(initialTemplates)
      localStorage.setItem("crm_templates", JSON.stringify(initialTemplates))
    }
    setLoading(false)
  }, [])

  const saveTemplates = (newTemplates: Template[]) => {
    setTemplates(newTemplates)
    localStorage.setItem("crm_templates", JSON.stringify(newTemplates))
  }

  const handleSave = () => {
    if (!formName || !formBody) {
      toast.error("Please fill in all required fields")
      return
    }

    if (editingTemplate) {
      // Update existing
      const updated = templates.map((t) =>
        t.id === editingTemplate.id
          ? { ...t, name: formName, type: formType, category: formCategory, subject: formSubject, body: formBody }
          : t,
      )
      saveTemplates(updated)
      toast.success("Template updated")
    } else {
      // Create new
      const newTemplate: Template = {
        id: `template-${Date.now()}`,
        name: formName,
        type: formType,
        category: formCategory,
        subject: formSubject,
        body: formBody,
        created_at: new Date().toISOString(),
      }
      saveTemplates([...templates, newTemplate])
      toast.success("Template created")
    }

    resetForm()
    setDialogOpen(false)
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormName(template.name)
    setFormType(template.type)
    setFormCategory(template.category)
    setFormSubject(template.subject || "")
    setFormBody(template.body)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    const updated = templates.filter((t) => t.id !== id)
    saveTemplates(updated)
    toast.success("Template deleted")
  }

  const handleCopy = (template: Template) => {
    const text = template.type === "email" ? `Subject: ${template.subject}\n\n${template.body}` : template.body
    navigator.clipboard.writeText(text)
    setCopiedId(template.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success("Copied to clipboard")
  }

  const resetForm = () => {
    setEditingTemplate(null)
    setFormName("")
    setFormType("email")
    setFormCategory("")
    setFormSubject("")
    setFormBody("")
  }

  const emailTemplates = templates.filter((t) => t.type === "email")
  const smsTemplates = templates.filter((t) => t.type === "sms")

  const categories = [...new Set(templates.map((t) => t.category))].filter(Boolean)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Message Templates</h1>
          <p className="text-muted-foreground">Pre-built email and SMS templates for quick communication</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
              <DialogDescription>
                Use variables like {"{{first_name}}"}, {"{{property_address}}"}, {"{{agent_name}}"} for personalization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., New Lead Welcome"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={formType} onValueChange={(v: "email" | "sms") => setFormType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g., Follow-up, Marketing, Transaction"
                />
              </div>
              {formType === "email" && (
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g., Welcome to {{agent_name}}'s Team!"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Message Body *</Label>
                <Textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Write your message here..."
                  rows={formType === "email" ? 10 : 4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>{editingTemplate ? "Update" : "Create"} Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Variable Reference */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Available variables:</span>
            {[
              "{{first_name}}",
              "{{last_name}}",
              "{{property_address}}",
              "{{price}}",
              "{{agent_name}}",
              "{{closing_date}}",
              "{{time}}",
            ].map((v) => (
              <Badge key={v} variant="secondary" className="font-mono text-xs">
                {v}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="email">
        <TabsList>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email ({emailTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS ({smsTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emailTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.category && (
                        <Badge variant="outline" className="mt-1">
                          {template.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(template)}>
                        {copiedId === template.id ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.subject && (
                    <p className="text-sm font-medium text-muted-foreground mb-2">Subject: {template.subject}</p>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">{template.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sms" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {smsTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {template.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(template)}>
                        {copiedId === template.id ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{template.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">{template.body.length}/160 characters</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
