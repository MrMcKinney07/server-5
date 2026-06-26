"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertCircle, CheckCircle2, Download } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ImportLeadsToolProps {
  agentId: string
  // Dialog mode (used from leads-view)
  open?: boolean
  onClose?: () => void
  onImportComplete?: () => void
}

interface ParsedLead {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  lead_type?: string
  source?: string
  notes?: string
}

export function ImportLeadsTool({ agentId, open, onClose, onImportComplete }: ImportLeadsToolProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [importResults, setImportResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)
  const { toast } = useToast()

  const normalizePhone = (raw: string): string => {
    const digits = raw.replace(/[^\d]/g, "").replace(/^1/, "")
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    return raw.trim()
  }

  const normalizeLeadType = (raw: string): string => {
    const v = raw.toLowerCase().trim()
    if (/buy/.test(v)) return "buyer"
    if (/sell/.test(v)) return "seller"
    if (/both|buy.*sell|sell.*buy/.test(v)) return "both"
    if (/invest/.test(v)) return "investor"
    if (/rent|tenant/.test(v)) return "renter"
    return "buyer"
  }

  const normalizeSource = (raw: string): string => {
    const v = raw.toLowerCase().trim()
    if (/referral|refer/.test(v)) return "referral"
    if (/facebook|fb|meta/.test(v)) return "fb_ads"
    if (/zillow/.test(v)) return "zillow"
    if (/realtor/.test(v)) return "realtor"
    if (/web|site|online/.test(v)) return "website"
    if (/manual|self|direct/.test(v)) return "manual"
    return v || "import"
  }

  const parseCSV = (text: string): ParsedLead[] => {
    const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    const lines = cleaned.split("\n").filter((l) => l.trim())
    if (lines.length < 2) return []

    const firstLine = lines[0]
    const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ","

    const parseLine = (line: string): string[] => {
      const result: string[] = []
      let current = ""
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
          else inQuotes = !inQuotes
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim()); current = ""
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""))
    const leads: ParsedLead[] = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      const values = parseLine(lines[i])
      const lead: ParsedLead = { first_name: "", last_name: "" }
      let fullName = ""

      headers.forEach((header, index) => {
        const value = values[index]?.trim()
        if (!value) return
        if (/^(first|fname|firstname|first_name)$/.test(header) || header.startsWith("first")) {
          if (!lead.first_name) lead.first_name = value
        } else if (/^(last|lname|lastname|surname|last_name)$/.test(header) || header.startsWith("last")) {
          if (!lead.last_name) lead.last_name = value
        } else if (header.match(/name|fullname|contactname|yourname/)) {
          if (!fullName) fullName = value
        } else if (header.match(/^e?mail|emailaddress/)) {
          if (!lead.email) lead.email = value
        } else if (header.match(/phone|mobile|cell|telephone|number/)) {
          if (!lead.phone) lead.phone = normalizePhone(value)
        } else if (header.match(/^(type|leadtype|lead_type|clienttype)$/)) {
          lead.lead_type = normalizeLeadType(value)
        } else if (header.match(/source|leadsource/)) {
          lead.source = normalizeSource(value)
        } else if (header.match(/note|comment|description/)) {
          lead.notes = value
        }
      })

      if (fullName && !lead.first_name) {
        const parts = fullName.trim().split(/\s+/)
        lead.first_name = parts[0]
        lead.last_name = parts.length >= 2 ? parts.slice(1).join(" ") : "Contact"
      }

      if (lead.first_name) {
        if (!lead.last_name) lead.last_name = "Contact"
        leads.push(lead)
      }
    }

    return leads
  }

  const handleImportFile = async (target: File) => {
    setIsImporting(true)
    setImportResults(null)
    const errors: string[] = []
    let successCount = 0
    let failedCount = 0

    try {
      const text = await target.text()
      const leads = parseCSV(text)

      if (leads.length === 0) {
        toast({
          title: "No Valid Leads",
          description: "The file has no readable lead data. Make sure it has name columns.",
          variant: "destructive",
        })
        setIsImporting(false)
        return
      }

      const supabase = createBrowserClient()

      for (const lead of leads) {
        try {
          const { error } = await supabase.from("leads").insert({
            first_name: lead.first_name,
            last_name: lead.last_name,
            email: lead.email || null,
            phone: lead.phone || null,
            lead_type: lead.lead_type || "buyer",
            source: lead.source || "import",
            status: "new",
            agent_id: agentId,
            notes: lead.notes || null,
          })
          if (error) {
            failedCount++
            errors.push(`${lead.first_name} ${lead.last_name}: ${error.message}`)
          } else {
            successCount++
          }
        } catch {
          failedCount++
          errors.push(`${lead.first_name} ${lead.last_name}: Import error`)
        }
      }

      setImportResults({ success: successCount, failed: failedCount, errors: errors.slice(0, 10) })

      if (successCount > 0) {
        toast({ title: "Import Complete", description: `${successCount} leads imported successfully.` })
        if (onImportComplete) {
          setTimeout(() => onImportComplete(), 1500)
        } else {
          setTimeout(() => window.location.reload(), 1500)
        }
      }
    } catch {
      toast({ title: "Import Failed", description: "Could not read the file.", variant: "destructive" })
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    handleImportFile(selectedFile)
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (isImporting) return
    const dropped = e.dataTransfer.files?.[0]
    if (!dropped) return
    if (!dropped.name.endsWith(".csv") && !dropped.name.endsWith(".txt")) {
      toast({ title: "Invalid File", description: "Please drop a CSV file.", variant: "destructive" })
      return
    }
    setFile(dropped)
    handleImportFile(dropped)
  }

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isImporting) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const downloadTemplate = () => {
    const template = `first_name,last_name,email,phone,lead_type,source,notes\nJohn,Doe,john@email.com,(555) 123-4567,buyer,referral,Interested in 3BR homes\nJane,Smith,jane@email.com,555.234.5678,seller,website,Wants to sell by June`
    const blob = new Blob([template], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "leads_import_template.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const content = (
    <div className="space-y-4">
      {/* Drop zone — click or drag & drop */}
      <label
        htmlFor="csv-upload-input"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-8 rounded-lg border-2 border-dashed text-sm font-medium transition-colors ${
          isImporting
            ? "border-muted bg-muted/30 text-muted-foreground cursor-not-allowed pointer-events-none"
            : isDragging
            ? "border-primary bg-primary/10 text-primary cursor-copy"
            : "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
        }`}
      >
        <Upload className="h-6 w-6 shrink-0" />
        <span>
          {isImporting
            ? `Importing${file ? ` "${file.name}"` : ""}...`
            : isDragging
            ? "Drop your CSV here"
            : "Click to select or drag & drop a CSV"}
        </span>
        <span className="text-xs text-muted-foreground font-normal">.csv files only</span>
        <input
          id="csv-upload-input"
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          disabled={isImporting}
          className="sr-only"
        />
      </label>

      {file && !isImporting && (
        <p className="text-xs text-center text-muted-foreground">Last file: {file.name}</p>
      )}

      <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full bg-transparent">
        <Download className="h-4 w-4 mr-2" />
        Download CSV Template
      </Button>

      <div className="text-xs text-muted-foreground space-y-1 border rounded-md p-3">
        <p className="font-medium text-foreground mb-1">Accepted columns:</p>
        <p>first_name, last_name (or a single "name" column)</p>
        <p>email, phone, lead_type, source, notes</p>
        <p className="mt-1">Supports comma, semicolon, or tab-delimited files including Excel exports.</p>
      </div>

      {importResults && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">{importResults.success} leads imported successfully</p>
            {importResults.failed > 0 && (
              <p className="text-destructive text-sm mt-0.5">{importResults.failed} failed</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {importResults && importResults.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="text-xs space-y-1 list-disc list-inside">
              {importResults.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )

  // Dialog mode — used from leads-view Import button
  if (open !== undefined) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o && onClose) onClose() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-500" />
              Import Leads
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk-import leads into your pipeline.
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  // Standalone card mode — used from admin pages
  return (
    <div className="max-w-md space-y-2">
      <h3 className="font-semibold flex items-center gap-2">
        <Upload className="h-4 w-4 text-emerald-500" />
        Import Leads
      </h3>
      {content}
    </div>
  )
}
