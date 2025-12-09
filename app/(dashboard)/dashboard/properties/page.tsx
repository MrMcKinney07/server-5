import { requireAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Script from "next/script"

export default async function PropertiesPage() {
  await requireAuth()

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Property Search</h1>
        <p className="text-sm text-muted-foreground">Search MLS listings with interactive map</p>
      </div>

      <Card className="overflow-hidden flex-1 flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0">
          <CardTitle className="text-lg">MLS Property Search</CardTitle>
          <CardDescription>Browse and search available listings</CardDescription>
        </CardHeader>
        <CardContent className="p-4 flex-1">
          <div id="idxwidgetsrc-131657" className="w-full h-full min-h-[500px]"></div>
          <Script
            id="idxwidgetsrc-131657-script"
            src="//mckinneyrealtyco.idxbroker.com/idx/widgets/131657"
            strategy="afterInteractive"
            charSet="UTF-8"
          />
        </CardContent>
      </Card>
    </div>
  )
}
