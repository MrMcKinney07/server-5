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

  const parseCSV = (text: string): ParsedLead[] => {
    const lines = text
      .trim()
      .split("\n")
      .filter((line) => line.trim())
    if (lines.length < 2) return []

    // Detect delimiter (comma, semicolon, or tab)
    const firstLine = lines[0]
    const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ","

    // Parse CSV line handling quoted values
    const parseLine = (line: string): string[] => {
      const result: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
          inQuotes = !inQuotes
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

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""))
    const leads: ParsedLead[] = []

    console.log("[v0] CSV Headers detected:", headers)

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i])
      const lead: ParsedLead = {
        first_name: "",
        last_name: "",
      }

      let fullName = ""

      headers.forEach((header, index) => {
        const value = values[index]?.trim()
        if (!value) return

        // Match first/last name patterns
        if (header.match(/first|fname|firstname/)) {
          lead.first_name = value
        } else if (header.match(/last|lname|lastname|surname/)) {
          lead.last_name = value
        }
        // Match full name columns (like "whatisyourname", "name", "fullname")
        else if (header.match(/name|fullname/)) {
          fullName = value
        } else if (header.match(/email|mail/)) {
          lead.email = value
        } else if (header.match(/phone|mobile|cell|telephone|number/)) {
          lead.phone = value
        } else if (header.match(/type|leadtype/)) {
          const normalizedType = value.toLowerCase()
          if (["buyer", "seller", "both", "investor", "renter"].includes(normalizedType)) {
            lead.lead_type = normalizedType
          }
        } else if (header.match(/source/)) {
          lead.source = value.toLowerCase()
        } else if (header.match(/note|notes/)) {
          lead.notes = value
        }
      })

      if (fullName && !lead.first_name) {
        const nameParts = fullName.trim().split(/\s+/)
        if (nameParts.length >= 2) {
          lead.first_name = nameParts[0]
          lead.last_name = nameParts.slice(1).join(" ")
        } else if (nameParts.length === 1) {
          lead.first_name = nameParts[0]
          lead.last_name = "Contact"
        }
      }

      // Only add if we have at least first name
      if (lead.first_name) {
        if (!lead.last_name) {
          lead.last_name = "Contact"
        }
        leads.push(lead)
      } else {
        console.log("[v0] Skipping invalid row:", values)
      }
    }

    console.log("[v0] Parsed leads:", leads.length)
    return leads
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
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
    console.log("[v0] Import button clicked, file:", file?.name)
    if (!file) {
      console.log("[v0] No file selected")
      return
    }

    setIsImporting(true)
    const errors: string[] = []
    let successCount = 0
    let failedCount = 0

    try {
      const text = await file.text()
      console.log("[v0] File content loaded, size:", text.length)

      const leads = parseCSV(text)
      console.log("[v0] Parsed", leads.length, "leads")

      if (leads.length === 0) {
        console.log("[v0] No valid leads parsed")
        toast({
          title: "No Valid Leads",
          description:
            "The CSV file doesn't contain any valid lead data. Check that it has first_name and last_name columns.",
          variant: "destructive",
        })
        setIsImporting(false)
        return
      }

      console.log("[v0] Starting import of", leads.length, "leads for agent:", agentId)
      const supabase = createBrowserClient()

      for (const lead of leads) {
        try {
          console.log("[v0] Inserting lead:", lead.first_name, lead.last_name)
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
            console.log("[v0] Insert failed:", error)
          } else {
            successCount++
            console.log("[v0] Insert successful for", lead.first_name)
          }
        } catch (err) {
          failedCount++
          errors.push(`${lead.first_name} ${lead.last_name}: Import error`)
          console.log("[v0] Insert exception:", err)
        }
      }

      console.log("[v0] Import completed. Success:", successCount, "Failed:", failedCount)

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
        console.log("[v0] Reloading page in 2 seconds")
        setTimeout(() => window.location.reload(), 2000)
      }
    } catch (error) {
      console.log("[v0] Import error:", error)
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
John,Doe,john.doe@email.com,555-0100,buyer,referral,Interested in 3BR homes
Jane,Smith,jane.smith@email.com,555-0101,seller,website,Wants to sell by June
Bob,Johnson,bob@email.com,555-0102,both,fb_ads,First time buyer`

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
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground">
              Upload a CSV file with columns: first_name, last_name, email, phone, lead_type, source, notes
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
              <h4 className="font-medium mb-2">Required Columns:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>first_name</strong> - Lead's first name
                </li>
                <li>
                  <strong>last_name</strong> - Lead's last name
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Optional Columns:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>email - Email address</li>
                <li>phone - Phone number</li>
                <li>lead_type - buyer, seller, both, investor, renter</li>
                <li>source - realtor, upnest, opcity, fb_ads, manual, referral, website, other</li>
                <li>notes - Additional information</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Tip:</strong> Download the template to see the correct format. All imported leads will be
                assigned to the system pool for distribution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
