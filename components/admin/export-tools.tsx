"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FileDown, FileSpreadsheet, Users, Target, DollarSign } from "lucide-react"

interface Agent {
  id: string
  Name: string
  Email: string
  Phone?: string
  Role: string
}

interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  status: string
  lead_type: string
  source: string | null
  created_at: string
  agent_id: string
  agent?: { Name: string } | null
}

interface Transaction {
  id: string
  property_address: string
  transaction_type: string
  status: string
  sale_price: number
  gross_commission: number
  closing_date: string | null
  agent_id: string
  agent?: { Name: string } | null
}

interface Props {
  leads: Lead[]
  transactions: Transaction[]
  agents: Agent[]
}

export function ExportTools({ leads, transactions, agents }: Props) {
  const [exportType, setExportType] = useState<string>("leads")
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const generateCSV = (data: Record<string, unknown>[], headers: string[]) => {
    const rows = data.map((item) =>
      headers
        .map((header) => {
          const value = item[header]
          // Escape quotes and wrap in quotes if contains comma
          const str = String(value ?? "")
          return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
        })
        .join(","),
    )

    if (includeHeaders) {
      rows.unshift(headers.join(","))
    }

    return rows.join("\n")
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = () => {
    setIsExporting(true)
    const timestamp = new Date().toISOString().split("T")[0]

    try {
      if (exportType === "leads") {
        const headers = [
          "first_name",
          "last_name",
          "email",
          "phone",
          "status",
          "lead_type",
          "source",
          "agent",
          "created_at",
        ]
        const data = leads.map((lead) => ({
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email || "",
          phone: lead.phone || "",
          status: lead.status,
          lead_type: lead.lead_type,
          source: lead.source || "",
          agent: lead.agent?.Name || "",
          created_at: new Date(lead.created_at).toLocaleDateString(),
        }))
        const csv = generateCSV(data, headers)
        downloadCSV(csv, `mckinney-leads-${timestamp}.csv`)
      } else if (exportType === "transactions") {
        const headers = [
          "property_address",
          "transaction_type",
          "status",
          "sale_price",
          "gross_commission",
          "closing_date",
          "agent",
        ]
        const data = transactions.map((tx) => ({
          property_address: tx.property_address,
          transaction_type: tx.transaction_type,
          status: tx.status,
          sale_price: tx.sale_price || 0,
          gross_commission: tx.gross_commission || 0,
          closing_date: tx.closing_date ? new Date(tx.closing_date).toLocaleDateString() : "",
          agent: tx.agent?.Name || "",
        }))
        const csv = generateCSV(data, headers)
        downloadCSV(csv, `mckinney-transactions-${timestamp}.csv`)
      } else if (exportType === "agents") {
        const headers = ["Name", "Email", "Phone", "Role"]
        const data = agents.map((agent) => ({
          Name: agent.Name,
          Email: agent.Email,
          Phone: agent.Phone || "",
          Role: agent.Role,
        }))
        const csv = generateCSV(data, headers)
        downloadCSV(csv, `mckinney-agents-${timestamp}.csv`)
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-blue-500" />
            Export Data
          </CardTitle>
          <CardDescription>Download your data as CSV files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Data Type</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leads">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Leads ({leads.length})
                  </div>
                </SelectItem>
                <SelectItem value="transactions">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Transactions ({transactions.length})
                  </div>
                </SelectItem>
                <SelectItem value="agents">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Agents ({agents.length})
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="headers"
              checked={includeHeaders}
              onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
            />
            <Label htmlFor="headers">Include column headers</Label>
          </div>

          <Button onClick={handleExport} disabled={isExporting} className="w-full">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export to CSV"}
          </Button>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
          <CardDescription>Overview of available export data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Leads</p>
                  <p className="text-sm text-muted-foreground">All team leads</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600">{leads.length}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium">Transactions</p>
                  <p className="text-sm text-muted-foreground">All deals</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-emerald-600">{transactions.length}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium">Agents</p>
                  <p className="text-sm text-muted-foreground">Team members</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-amber-600">{agents.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
