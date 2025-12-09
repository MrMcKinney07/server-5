import { requireAuth } from "@/lib/auth"
import { searchProperties } from "@/lib/idx/search-properties"
import { PropertySearchForm } from "@/components/properties/property-search-form"
import { PropertyGrid } from "@/components/properties/property-grid"
import { SaveSearchDialog } from "@/components/properties/save-search-dialog"
import type { PropertySearchQuery } from "@/lib/types/database"

interface PropertiesPageProps {
  searchParams: Promise<{
    location?: string
    minPrice?: string
    maxPrice?: string
    minBeds?: string
    maxBeds?: string
    status?: string
    page?: string
  }>
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const agent = await requireAuth()
  const params = await searchParams

  const query: PropertySearchQuery = {}
  if (params.location) query.location = params.location
  if (params.minPrice) query.minPrice = Number.parseInt(params.minPrice)
  if (params.maxPrice) query.maxPrice = Number.parseInt(params.maxPrice)
  if (params.minBeds) query.minBeds = Number.parseInt(params.minBeds)
  if (params.maxBeds) query.maxBeds = Number.parseInt(params.maxBeds)
  if (params.status) query.status = params.status as PropertySearchQuery["status"]

  const page = params.page ? Number.parseInt(params.page) : 1
  const hasFilters = Object.keys(query).length > 0

  const results = await searchProperties(query, page, 12)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Property Search</h1>
          <p className="text-sm text-muted-foreground">
            Search available listings {hasFilters && `• ${results.total} results`}
          </p>
        </div>
        {hasFilters && <SaveSearchDialog query={query} agentId={agent.id} />}
      </div>

      <PropertySearchForm initialQuery={query} />

      <PropertyGrid properties={results.properties} total={results.total} page={page} pageSize={12} />
    </div>
  )
}
