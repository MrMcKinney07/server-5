"use client"

import { useState } from "react"
import { AlertCircle, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface IDXWidgetClientProps {
  widgetId: string
}

export function IDXWidgetClient({ widgetId }: IDXWidgetClientProps) {
  const [loadError, setLoadError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const iframeSrc = `https://mckinneyrealtyco.idxbroker.com/idx/map/mapsearch`

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = () => {
    setLoadError(true)
    setIsLoading(false)
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/30 p-8">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">IDX Widget Unavailable</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          The MLS property search widget could not be loaded. This may be due to network restrictions in preview mode.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="default">
            <a
              href="https://mckinneyrealtyco.idxbroker.com/idx/map/mapsearch"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open MLS Search
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setLoadError(false)
              setIsLoading(true)
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Use the cart button to manually add properties from the external search
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading property search...</p>
          </div>
        </div>
      )}
      <iframe
        src={iframeSrc}
        className="w-full h-full border-0"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="geolocation"
        title="IDX Property Search"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  )
}
