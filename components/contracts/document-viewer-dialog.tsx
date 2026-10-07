"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Download, ExternalLink, FileText } from "lucide-react"

interface DocumentViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  fileUrl: string
  fileName?: string | null
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|heic)$/i
const PDF_EXT = /\.pdf$/i

export function DocumentViewerDialog({ open, onOpenChange, title, fileUrl, fileName }: DocumentViewerDialogProps) {
  const name = fileName || fileUrl.split("/").pop()?.split("?")[0] || "document"
  const isImage = IMAGE_EXT.test(name) || IMAGE_EXT.test(fileUrl.split("?")[0])
  const isPdf = PDF_EXT.test(name) || PDF_EXT.test(fileUrl.split("?")[0])
  const downloadUrl = `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}download=1`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[95vw] h-[90vh] flex flex-col gap-3 p-4">
        <DialogHeader className="flex flex-row items-center justify-between gap-3 pr-8">
          <div className="min-w-0">
            <DialogTitle className="truncate">{title}</DialogTitle>
            <DialogDescription className="truncate">{name}</DialogDescription>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              New tab
            </a>
            <a href={downloadUrl} className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 rounded-lg border border-white/10 bg-black/30 overflow-hidden">
          {isImage ? (
            <div className="h-full w-full flex items-center justify-center overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl} alt={title} className="max-h-full max-w-full object-contain" />
            </div>
          ) : isPdf ? (
            <iframe src={`${fileUrl}#view=FitH`} title={title} className="h-full w-full" />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-6">
              <FileText className="h-10 w-10 text-slate-500" />
              <p className="text-sm text-slate-400">This file type can&apos;t be previewed in the browser.</p>
              <a href={downloadUrl} className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300">
                <Download className="h-4 w-4" />
                Download {name}
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
