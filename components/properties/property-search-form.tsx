"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X } from "lucide-react"
import type { PropertySearchQuery } from "@/lib/types/database"

interface PropertySearchFormProps {
  initialQuery: PropertySearchQuery
}

export function PropertySearchForm({ initialQuery }: PropertySearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [location, setLocation] = useState(initialQuery.location || "")
  const [minPrice, setMinPrice] = useState(initialQuery.minPrice?.toString() || "")
  const [maxPrice, setMaxPrice] = useState(initialQuery.maxPrice?.toString() || "")
  const [minBeds, setMinBeds] = useState(initialQuery.minBeds?.toString() || "")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()

    if (location) params.set("location", location)
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)
    if (minBeds) params.set("minBeds", minBeds)

    router.push(`/dashboard/properties?${params.toString()}`)
  }

  const handleClear = () => {
    setLocation("")
    setMinPrice("")
    setMaxPrice("")
    setMinBeds("")
    router.push("/dashboard/properties")
  }

  const hasFilters = location || minPrice || maxPrice || minBeds

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="City, ZIP, or address"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="w-32">
            <Label htmlFor="minPrice">Min Price</Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="$0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>

          <div className="w-32">
            <Label htmlFor="maxPrice">Max Price</Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="Any"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          <div className="w-28">
            <Label htmlFor="minBeds">Beds</Label>
            <Select value={minBeds} onValueChange={setMinBeds}>
              <SelectTrigger id="minBeds">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {hasFilters && (
              <Button type="button" variant="outline" onClick={handleClear}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
