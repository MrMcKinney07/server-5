import { requireAuth } from "@/lib/auth"
import Script from "next/script"

export default async function PropertiesPage() {
  await requireAuth()

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="py-2 px-1 flex-shrink-0">
        <h1 className="text-2xl font-semibold">Property Search</h1>
        <p className="text-sm text-muted-foreground">Search MLS listings with interactive map</p>
      </div>

      <div className="flex-1 w-full border rounded-lg overflow-hidden">
        <div id="idxwidgetsrc-131657" className="w-full h-full"></div>
        <Script
          id="idxwidgetsrc-131657-script"
          src="//mckinneyrealtyco.idxbroker.com/idx/widgets/131657"
          strategy="afterInteractive"
          charSet="UTF-8"
        />
      </div>
    </div>
  )
}
