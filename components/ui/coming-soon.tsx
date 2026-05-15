"use client"

import { Clock } from "lucide-react"

interface ComingSoonProps {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
        <Clock className="h-7 w-7 text-cyan-400" />
      </div>
      <h1 className="text-2xl font-semibold text-white mb-2">{title}</h1>
      <p className="text-slate-400 text-sm max-w-sm">
        {description ?? "This feature is coming soon. Check back later."}
      </p>
      <div className="mt-8 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-xs font-medium tracking-wide uppercase">
        Coming Soon
      </div>
    </div>
  )
}
