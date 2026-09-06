import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Bed, Bath, Square, ExternalLink } from "lucide-react"
import { TrackView } from "@/components/property-view/track-view"

export default async function PropertyViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  // Fetch the saved property
  const { data: property } = await supabase
    .from("saved_properties")
    .select("*, agent:agents(full_name:Name, Email, phone:Phone)")
    .eq("id", id)
    .single()

  if (!property) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <TrackView propertyId={id} />

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Card className="overflow-hidden">
          {property.photo_url && (
            <div className="relative h-[400px] w-full">
              <img
                src={property.photo_url || "/placeholder.svg"}
                alt={property.address}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{property.address}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {property.city}, {property.state} {property.zip}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">${property.price?.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-6 mb-8 pb-8 border-b">
              {property.beds && (
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{property.beds} Beds</span>
                </div>
              )}
              {property.baths && (
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{property.baths} Baths</span>
                </div>
              )}
              {property.mls_number && (
                <div className="flex items-center gap-2">
                  <Square className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">MLS #{property.mls_number}</span>
                </div>
              )}
            </div>

            {property.idx_url && (
              <div className="mb-8">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <a href={property.idx_url} target="_blank" rel="noopener noreferrer">
                    View Full Listing
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            )}

            <Card className="bg-slate-50 p-6">
              <h3 className="font-semibold mb-4">Your Agent</h3>
              <div className="space-y-2">
                <p className="font-medium text-lg">{property.agent.full_name}</p>
                {property.agent.Email && <p className="text-sm text-muted-foreground">Email: {property.agent.Email}</p>}
                {property.agent.phone && <p className="text-sm text-muted-foreground">Phone: {property.agent.phone}</p>}
              </div>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  )
}
