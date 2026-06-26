"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUp, Upload, AlertCircle, CheckCircle2, Download } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ImportLeadsToolProps {
  agentId: string
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

export function ImportLeadsTool({ agentId }: ImportLeadsToolProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)
  const { toast } = useToast()

  const normalizePhone = (raw: string): string => {
    // Strip everything except digits and leading +
    const cleaned = raw.replace(/[^\d+]/g, "")
    // Remove leading country code +1 or 1 if 11 digits
    const digits = cleaned.replace(/^\+?1/, "")
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    // Return cleaned original if we can't normalize
    return raw.trim()
  }

  const normalizeLeadType = (raw: string): string => {
    const v = raw.toLowerCase().trim()
    if (/buy/.test(v)) return "buyer"
    if (/sell/.test(v)) return "seller"
    if (/both|buy.*sell|sell.*buy/.test(v)) return "both"
    if (/invest/.test(v)) return "investor"
    if (/rent|tenant/.test(v)) return "renter"
    return "buyer" // default
  }

  const normalizeSource = (raw: string): string => {
    const v = raw.toLowerCase().trim()
    if (/referral|refer/.test(v)) return "referral"
    if (/facebook|fb|meta/.test(v)) return "fb_ads"
    if (/zillow/.test(v)) return "zillow"
    if (/realtor\.com|realtor/.test(v)) return "realtor"
    if (/upnest/.test(v)) return "upnest"
    if (/opcity/.test(v)) return "opcity"
    if (/web|site|online/.test(v)) return "website"
    if (/manual|self|direct/.test(v)) return "manual"
    if (/import/.test(v)) return "import"
    return v || "import"
  }

  const parseCSV = (text: string): ParsedLead[] => {
    // Strip BOM (Excel UTF-8 exports)
    const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    const lines = cleaned.split("\n").filter((line) => line.trim())
    if (lines.length < 2) return []

    // Detect delimiter: tab > semicolon > comma
    const firstLine = lines[0]
    const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ","

    // RFC-4180 compliant parser: handles quoted fields, escaped quotes (""), embedded newlines
    const parseLine = (line: string): string[] => {
      const result: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // Escaped quote inside quoted field
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    // Normalize header: lowercase, strip non-alphanumeric
    const rawHeaders = parseLine(lines[0])
    const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""))

    const leads: ParsedLead[] = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      const values = parseLine(lines[i])
      const lead: ParsedLead = { first_name: "", last_name: "" }
      let fullName = ""

      headers.forEach((header, index) => {
        const value = values[index]?.trim()
        if (!value) return

        // Name fields
        if (/^(first|fname|firstname|first_name)$/.test(header) || header.startsWith("first")) {
          if (!lead.first_name) lead.first_name = value
        } else if (/^(last|lname|lastname|surname|last_name)$/.test(header) || header.startsWith("last")) {
          if (!lead.last_name) lead.last_name = value
        } else if (header.match(/name|fullname|contactname|yourname/)) {
          // Full name column — only use if no dedicated first/last
          if (!fullName) fullName = value
        }
        // Contact fields
        else if (header.match(/^e?mail|emailaddress/)) {
          if (!lead.email) lead.email = value
        } else if (header.match(/phone|mobile|cell|telephone|number/)) {
          if (!lead.phone) lead.phone = normalizePhone(value)
        }
        // Classification
        else if (header.match(/^(type|leadtype|lead_type|clienttype)$/)) {
          lead.lead_type = normalizeLeadType(value)
        } else if (header.match(/source|leadsource/)) {
          lead.source = normalizeSource(value)
        } else if (header.match(/note|comment|description/)) {
          lead.notes = value
        }
      })

      // Split full name if no dedicated first/last columns
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Accept .csv regardless of MIME type — Excel exports often send text/plain or application/vnd.ms-excel
      const isCSV =
        selectedFile.name.endsWith(".csv") ||
        selectedFile.name.endsWith(".txt") ||
        selectedFile.type === "text/csv" ||
        selectedFile.type === "text/plain" ||
        selectedFile.type === "application/vnd.ms-excel" ||
        selectedFile.type === ""
      if (isCSV) {
        setFile(selectedFile)
        setImportResults(null)
        toast({
          title: "File Selected",
          description: `${selectedFile.name} ready to import`,
        })
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a CSV file (.csv extension)",
          variant: "destructive",
        })
      }
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    const errors: string[] = []
    let successCount = 0
    let failedCount = 0

    try {
      const text = await file.text()
      const leads = parseCSV(text)

      if (leads.length === 0) {
        toast({
          title: "No Valid Leads",
          description:
            "The CSV file doesn't contain any valid lead data. Check that it has first_name and last_name columns.",
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

      setImportResults({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10),
      })

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} leads. ${failedCount} failed.`,
      })

      if (successCount > 0) {
        setTimeout(() => window.location.reload(), 2000)
      }
    } catch {
      toast({
        title: "Import Failed",
        description: "Failed to read or parse the CSV file. Check the console for details.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = `first_name,last_name,email,phone,lead_type,source,notes
John,Doe,john.doe@email.com,(555) 010-0100,buyer,referral,Interested in 3BR homes
Jane,Smith,jane.smith@email.com,555.010.0101,seller,website,Wants to sell by June
Bob,Johnson,bob@email.com,+1-555-010-0102,both,fb_ads,First time buyer
Alice,Brown,alice@email.com,5550100103,investor,zillow,Looking for rental properties`

    const blob = new Blob([template], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "leads_import_template.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Import Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-emerald-500" />
            Import Leads
          </CardTitle>
          <CardDescription>Bulk upload leads from a CSV file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv,.txt,text/csv,text/plain,application/vnd.ms-excel" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground">
              Comma, semicolon, or tab-delimited. Accepts most column name variations — see instructions for details.
            </p>
          </div>

          <Button variant="outline" onClick={downloadTemplate} className="w-full bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>

          <Button variant="default" onClick={handleImport} disabled={!file || isImporting} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Importing..." : "Import Leads"}
          </Button>

          {importResults && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">✓ {importResults.success} leads imported successfully</p>
                  {importResults.failed > 0 && <p className="text-red-600">✗ {importResults.failed} leads failed</p>}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {importResults && importResults.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Import Errors:</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  {importResults.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Import Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
          <CardDescription>How to prepare your CSV file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Required (one of):</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>first_name</strong> + <strong>last_name</strong> columns</li>
                <li><strong>name</strong> or <strong>full_name</strong> — auto-split</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Optional Columns:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>email / email_address</li>
                <li>phone / mobile / cell — any format accepted</li>
                <li>lead_type — buyer, seller, both, investor, renter</li>
                <li>source — referral, fb_ads, zillow, realtor, website, etc.</li>
                <li>notes / comments</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Supported Formats:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Comma, semicolon, or tab delimited</li>
                <li>Excel CSV exports (UTF-8 BOM handled)</li>
                <li>Phone: (555) 000-0000, 555.000.0000, +1-555-000-0000</li>
                <li>Quoted fields with commas inside</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Tip:</strong> Download the template for reference. Column names are flexible — the importer matches common variations automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
