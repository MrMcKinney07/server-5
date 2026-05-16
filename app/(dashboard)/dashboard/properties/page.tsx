import { requireAuth } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase/server"
import { PropertyCart } from "@/components/properties/property-cart"
import { PropertySearch } from "@/components/properties/property-search"

export default async function PropertiesPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  const { data: leads } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, phone")
    .eq("agent_id", user.id)
    .order("first_name", { ascending: true })

  return (
    <>
      <div className="flex flex-col gap-4 pb-20">
        <div>
          <h1 className="text-2xl font-semibold">Property Search</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Search live MLS listings and add properties to send to leads
          </p>
        </div>

        <PropertySearch />
      </div>

      <PropertyCart leads={leads || []} agentId={user.id} />
    </>
  )
}
