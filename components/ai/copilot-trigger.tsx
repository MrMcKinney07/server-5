"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { CopilotPanel } from "./copilot-panel"

interface CopilotTriggerProps {
  context?: {
    lead?: Record<string, unknown>
    contact?: Record<string, unknown>
    agent?: Record<string, unknown>
    activities?: Record<string, unknown>[]
  }
}

export function CopilotTrigger({ context }: CopilotTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <CopilotPanel context={context} onClose={() => setIsOpen(false)} />
      ) : (
        <Button size="lg" className="rounded-full h-14 w-14 shadow-lg" onClick={() => setIsOpen(true)}>
          <Sparkles className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
