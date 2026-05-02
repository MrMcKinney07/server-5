"use client"

import { useState, useCallback, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, Download, Trash2, File, FileText, Image, Search } from "lucide-react"
import useSWR from "swr"

interface MarketingFile {
  id: string
  filename: string
  template_name: string
  category: string
  content_type: string
  size: number
  created_at: string
  pathname: string
}

const CATEGORIES = [
  { value: "flyers", label: "Flyers" },
  { value: "postcards", label: "Postcards" },
  { value: "business-cards", label: "Business Cards" },
  { value: "yard-signs", label: "Yard Signs" },
  { value: "emails", label: "Email Templates" },
  { value: "social-media", label: "Social Media" },
  { value: "other", label: "Other" },
]

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((data) => data.files || [])

export function MarketingFiles() {
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [templateName, setTemplateName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const { data: files = [], mutate } = useSWR<MarketingFile[]>(
    "/api/marketing-files/list",
    fetcher,
    { revalidateOnFocus: false }
  )

  const filteredFiles = files?.filter((file) => {
    const matchesSearch =
      file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.template_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || file.category === selectedCategory
    return matchesSearch && matchesCategory
  }) || []

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !templateName) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("template_name", templateName)
      formData.append("category", selectedCategory === "all" ? "general" : selectedCategory)

      const response = await fetch("/api/marketing-files/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      await mutate()
      setSelectedFile(null)
      setTemplateName("")
      setSelectedCategory("all")
      setIsOpen(false)
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileId: string, filename: string) => {
    if (!confirm("Delete this file?")) return

    try {
      const response = await fetch("/api/marketing-files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      })

      if (!response.ok) throw new Error("Delete failed")

      await mutate()
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const handleDownload = (pathname: string, filename: string) => {
    const url = `/api/marketing-files/${encodeURIComponent(pathname)}`
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
  }

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) return <Image className="h-5 w-5" />
    if (contentType.includes("pdf")) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Marketing Files</h2>
          <p className="text-slate-400 text-sm mt-1">{filteredFiles.length} files</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle>Upload Marketing File</DialogTitle>
              <DialogDescription>
                Upload custom templates and marketing materials
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  File Name
                </label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., My Custom Flyer"
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="all">General</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  File
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary cursor-pointer"
                  accept=".pdf,.doc,.docx,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                  required
                />
              </div>

              <Button type="submit" disabled={uploading} className="w-full">
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-40 bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10">
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredFiles.length === 0 ? (
        <Card className="p-12 text-center bg-white/5 border-white/10">
          <File className="h-12 w-12 mx-auto text-slate-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No files yet</h3>
          <p className="text-slate-400">Upload your first marketing file to get started</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    {getFileIcon(file.content_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{file.template_name}</h3>
                    <p className="text-xs text-slate-400 truncate">{file.filename}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary capitalize text-xs">
                        {file.category}
                      </Badge>
                      <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(file.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file.pathname, file.filename)}
                    className="border-white/10 hover:bg-white/10"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(file.id, file.filename)}
                    className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
