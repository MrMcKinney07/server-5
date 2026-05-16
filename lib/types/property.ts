export interface RapidAPIProperty {
  property_id: string
  listing_id?: string
  mls_id?: string
  address: {
    line?: string
    city?: string
    state_code?: string
    postal_code?: string
    lat?: number
    lon?: number
  }
  lat?: number
  lon?: number
  price?: number
  beds?: number
  baths?: number
  baths_full?: number
  sqft?: number
  year_built?: number
  prop_type?: string
  prop_status?: string
  thumbnail?: string
  photos?: { href: string }[]
  rdc_web_url?: string
  list_date?: string
}
