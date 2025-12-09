import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { getPropertyById } from "@/lib/idx/search-properties"
import { notFound } from "next/navigation"
import { PropertyDetails } from "@/components/properties/property-details"
import { FavoritePropertyButton } from "@/components/properties/favorite-property-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Contact } from "@/lib/types/database"

interface PropertyPageProps {
  params: Promise<{ id: string }>
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params
  const agent = await requireAuth()

  const property = await getPropertyById(id)

  if (!property) {
    notFound()
  }

  // Get agent's contacts for "favorite for client" feature
  const supabase = await createClient()
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name")
    .eq("primary_agent_id", agent.id)
    .order("full_name")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/properties">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{property.address}</h1>
          <p className="text-sm text-muted-foreground">
            {property.city}, {property.state} {property.zip}
          </p>
        </div>
        <FavoritePropertyButton propertyId={id} contacts={(contacts as Contact[]) || []} agentId={agent.id} />
      </div>

      <PropertyDetails property={property} />
    </div>
  )
}
