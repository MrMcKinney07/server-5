import { requireAuth } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase/server"
import { PropertyCart } from "@/components/properties/property-cart"
import { IDXWidgetClient } from "@/components/properties/idx-widget-client"

export default async function PropertiesPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Fetch agent's leads for the cart
  const { data: leads } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, phone")
    .eq("agent_id", user.id)
    .order("first_name", { ascending: true })

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="py-2 px-1 flex-shrink-0">
          <h1 className="text-2xl font-semibold">Property Search</h1>
          <p className="text-sm text-muted-foreground">Search MLS listings and add properties to send to leads</p>
        </div>

        <div className="flex-1 w-full border rounded-lg overflow-hidden">
          <IDXWidgetClient widgetId="131657" />
        </div>
      </div>

      <PropertyCart leads={leads || []} agentId={user.id} />
    </>
  )
}
