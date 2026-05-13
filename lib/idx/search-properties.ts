/**
 * IDX Property Search Abstraction
 *
 * This module provides a unified interface for property search.
 * Currently uses local Supabase database with mock data.
 *
 * TO INTEGRATE WITH REAL IDX PROVIDER:
 * 1. Create a new file like lib/idx/providers/mls-provider.ts
 * 2. Implement the same searchProperties interface
 * 3. Update this file to call the provider API instead of Supabase
 * 4. Handle API authentication, rate limiting, and caching
 *
 * Example future integration:
 * ```
 * import { searchMLSProperties } from './providers/mls-provider'
 * export async function searchProperties(query: PropertySearchQuery) {
 *   return searchMLSProperties(query)
 * }
 * ```
 */

import { createClient } from "@/lib/supabase/server"
import type { Property, PropertySearchQuery } from "@/lib/types/database"

export interface SearchPropertiesResult {
  properties: Property[]
  total: number
  page: number
  pageSize: number
}

export async function searchProperties(
  query: PropertySearchQuery,
  page = 1,
  pageSize = 20,
): Promise<SearchPropertiesResult> {
  const supabase = await createClient()

  // Start building the query
  let dbQuery = supabase.from("properties").select("*", { count: "exact" })

  // Apply filters
  if (query.location) {
    // Search in city, zip, or address
    dbQuery = dbQuery.or(
      `city.ilike.%${query.location}%,zip.ilike.%${query.location}%,address.ilike.%${query.location}%`,
    )
  }

  if (query.city) {
    dbQuery = dbQuery.ilike("city", `%${query.city}%`)
  }

  if (query.zip) {
    dbQuery = dbQuery.eq("zip", query.zip)
  }

  if (query.minPrice !== undefined) {
    dbQuery = dbQuery.gte("price", query.minPrice)
  }

  if (query.maxPrice !== undefined) {
    dbQuery = dbQuery.lte("price", query.maxPrice)
  }

  if (query.minBeds !== undefined) {
    dbQuery = dbQuery.gte("beds", query.minBeds)
  }

  if (query.maxBeds !== undefined) {
    dbQuery = dbQuery.lte("beds", query.maxBeds)
  }

  if (query.minBaths !== undefined) {
    dbQuery = dbQuery.gte("baths", query.minBaths)
  }

  if (query.maxBaths !== undefined) {
    dbQuery = dbQuery.lte("baths", query.maxBaths)
  }

  if (query.minSqft !== undefined) {
    dbQuery = dbQuery.gte("sqft", query.minSqft)
  }

  if (query.maxSqft !== undefined) {
    dbQuery = dbQuery.lte("sqft", query.maxSqft)
  }

  if (query.status) {
    dbQuery = dbQuery.eq("status", query.status)
  } else {
    // Default to active listings only
    dbQuery = dbQuery.eq("status", "active")
  }

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  dbQuery = dbQuery.order("created_at", { ascending: false }).range(from, to)

  const { data, count, error } = await dbQuery

  if (error) {
    console.error("Error searching properties:", error)
    return { properties: [], total: 0, page, pageSize }
  }

  return {
    properties: (data as Property[]) || [],
    total: count || 0,
    page,
    pageSize,
  }
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("properties").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching property:", error)
    return null
  }

  return data as Property
}
