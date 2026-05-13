"use client"

import { useEffect, useRef } from "react"

interface IDXWidgetProps {
  widgetId: string
  className?: string
}

export function IDXWidget({ widgetId, className }: IDXWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if script already exists
    const existingScript = document.getElementById(`idxwidgetsrc-${widgetId}`)
    if (existingScript) {
      return
    }

    // Create and inject the IDX Broker script
    const script = document.createElement("script")
    script.id = `idxwidgetsrc-${widgetId}`
    script.src = `//mckinneyrealtyco.idxbroker.com/idx/widgets/${widgetId}`
    script.type = "text/javascript"
    script.charset = "UTF-8"
    script.async = true

    if (containerRef.current) {
      containerRef.current.appendChild(script)
    }

    return () => {
      // Cleanup on unmount
      const scriptToRemove = document.getElementById(`idxwidgetsrc-${widgetId}`)
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [widgetId])

  return (
    <div ref={containerRef} className={className}>
      {/* IDX Broker widget will be injected here */}
      <div id={`IDX-widgetsrc-${widgetId}`} />
    </div>
  )
}
