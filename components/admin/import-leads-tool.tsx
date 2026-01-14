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
    const lines = text.trim().split("\n")
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const leads: ParsedLead[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      const lead: ParsedLead = {
        first_name: "",
        last_name: "",
      }

      headers.forEach((header, index) => {
        const value = values[index]
        if (!value) return

        if (header.includes("first") || header.includes("fname")) {
          lead.first_name = value
        } else if (header.includes("last") || header.includes("lname")) {
          lead.last_name = value
        } else if (header.includes("email")) {
          lead.email = value
        } else if (header.includes("phone")) {
          lead.phone = value
        } else if (header.includes("type")) {
          lead.lead_type = value.toLowerCase() as any
        } else if (header.includes("source")) {
          lead.source = value.toLowerCase()
        } else if (header.includes("note")) {
          lead.notes = value
        }
      })

      if (lead.first_name && lead.last_name) {
        leads.push(lead)
      }
    }

    return leads
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setImportResults(null)
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file",
        variant: "destructive",
      })
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
          description: "The CSV file doesn't contain any valid lead data",
          variant: "destructive",
        })
        return
      }

      const supabase = createBrowserClient()

      // Import leads in batches
      for (const lead of leads) {
        try {
          const { error } = await supabase.from("leads").insert({
            first_name: lead.first_name,
            last_name: lead.last_name,
            email: lead.email || null,
            phone: lead.phone || null,
            lead_type: lead.lead_type || "buyer",
            source: lead.source || "manual",
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
        } catch (err) {
          failedCount++
          errors.push(`${lead.first_name} ${lead.last_name}: Import error`)
        }
      }

      setImportResults({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10), // Show first 10 errors
      })

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} leads. ${failedCount} failed.`,
      })
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to read or parse the CSV file",
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

          <Button onClick={handleImport} disabled={!file || isImporting} className="w-full bg-emerald-600">
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
