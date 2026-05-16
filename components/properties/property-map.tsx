"use client"

import { useEffect, useRef, useState } from "react"
import type { RapidAPIProperty } from "@/lib/types/property"
import { formatPrice } from "@/lib/utils/format-price"

interface PropertyMapProps {
  results: RapidAPIProperty[]
  center?: { lat: number; lon: number }
  radius?: number // miles
  onRadiusSearch: (lat: number, lon: number, radius: number) => void
  onSelectProperty?: (property: RapidAPIProperty) => void
  onAddToCart?: (property: RapidAPIProperty) => void
  cartIds?: string[]
}

function milesToMeters(miles: number) {
  return miles * 1609.344
}

export function PropertyMap({
  results,
  center,
  radius = 5,
  onRadiusSearch,
  onSelectProperty,
  onAddToCart,
  cartIds = [],
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<import("leaflet").Map | null>(null)
  const circleRef = useRef<import("leaflet").Circle | null>(null)
  const markersRef = useRef<import("leaflet").Marker[]>([])
  const [ready, setReady] = useState(false)
  const [localRadius, setLocalRadius] = useState(radius)
  const [pinCenter, setPinCenter] = useState<{ lat: number; lon: number } | null>(center || null)

  // Boot Leaflet once
  useEffect(() => {
    let map: import("leaflet").Map
    let L: typeof import("leaflet")

    async function init() {
      L = (await import("leaflet")).default

      // Fix default icon paths broken by bundlers
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      if (!mapRef.current || leafletMap.current) return

      map = L.map(mapRef.current, {
        center: center ? [center.lat, center.lon] : [27.9944024, -81.7602544], // Florida default
        zoom: center ? 12 : 7,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Click on map to set search center
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        setPinCenter({ lat, lon: lng })
      })

      leafletMap.current = map
      setReady(true)
    }

    init()

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }
    }
  }, [])

  // Draw/update the radius circle when pinCenter or localRadius changes
  useEffect(() => {
    if (!ready || !leafletMap.current) return

    import("leaflet").then(({ default: L }) => {
      const map = leafletMap.current!

      if (circleRef.current) circleRef.current.remove()

      if (pinCenter) {
        const circle = L.circle([pinCenter.lat, pinCenter.lon], {
          radius: milesToMeters(localRadius),
          color: "#2563eb",
          fillColor: "#2563eb",
          fillOpacity: 0.08,
          weight: 2,
        }).addTo(map)
        circleRef.current = circle
        map.setView([pinCenter.lat, pinCenter.lon], map.getZoom())
      }
    })
  }, [pinCenter, localRadius, ready])

  // Plot result markers
  useEffect(() => {
    if (!ready || !leafletMap.current) return

    import("leaflet").then(({ default: L }) => {
      const map = leafletMap.current!

      // Clear old markers
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      const bounds: [number, number][] = []

      results.forEach((p) => {
        const lat = p.lat ?? p.address?.lat
        const lon = p.lon ?? p.address?.lon
        if (!lat || !lon) return

        bounds.push([lat, lon])

        const inCart = cartIds.includes(p.property_id)

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            background:${inCart ? "#16a34a" : "#1d4ed8"};
            color:white;
            font-size:11px;
            font-weight:600;
            padding:3px 7px;
            border-radius:12px;
            white-space:nowrap;
            box-shadow:0 1px 4px rgba(0,0,0,.35);
            border:2px solid white;
          ">${p.price ? formatPrice(p.price) : "—"}</div>`,
          iconAnchor: [30, 14],
        })

        const marker = L.marker([lat, lon], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:180px;font-family:system-ui">
              <p style="font-weight:600;margin:0 0 2px">${p.address.line || ""}</p>
              <p style="font-size:12px;color:#555;margin:0 0 6px">${[p.address.city, p.address.state_code, p.address.postal_code].filter(Boolean).join(", ")}</p>
              <p style="font-size:13px;font-weight:700;margin:0 0 4px">${p.price ? formatPrice(p.price) : "—"}</p>
              <p style="font-size:12px;color:#555;margin:0 0 8px">${[p.beds ? `${p.beds} bd` : "", p.baths ? `${p.baths} ba` : "", p.sqft ? `${p.sqft.toLocaleString()} sqft` : ""].filter(Boolean).join(" · ")}</p>
              ${onAddToCart && !inCart ? `<button id="add-${p.property_id}" style="background:#1d4ed8;color:white;border:none;padding:5px 12px;border-radius:6px;font-size:12px;cursor:pointer;width:100%">+ Add to Cart</button>` : ""}
              ${inCart ? `<p style="color:#16a34a;font-size:12px;font-weight:600;margin:0">&#10003; In Cart</p>` : ""}
            </div>`,
          )

        marker.on("popupopen", () => {
          const btn = document.getElementById(`add-${p.property_id}`)
          if (btn && onAddToCart) btn.onclick = () => onAddToCart(p)
        })

        markersRef.current.push(marker)
      })

      if (bounds.length > 1 && !pinCenter) {
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    })
  }, [results, ready, cartIds, onAddToCart, pinCenter])

  const handleSearch = () => {
    if (!pinCenter) return
    onRadiusSearch(pinCenter.lat, pinCenter.lon, localRadius)
  }

  return (
    <div className="flex flex-col gap-0 h-full min-h-[500px]">
      {/* Map toolbar */}
      <div className="flex items-center gap-3 px-3 py-2 border rounded-t-lg bg-card text-sm flex-wrap">
        <span className="text-muted-foreground text-xs font-medium">Map Search</span>
        <span className="text-muted-foreground text-xs">Click anywhere on the map to set a search center</span>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-muted-foreground whitespace-nowrap">
            Radius: <span className="font-semibold text-foreground">{localRadius} mi</span>
          </label>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={localRadius}
            onChange={(e) => setLocalRadius(Number(e.target.value))}
            className="w-28 accent-primary"
          />
          <button
            onClick={handleSearch}
            disabled={!pinCenter}
            className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            Search Area
          </button>
          {pinCenter && (
            <button
              onClick={() => { setPinCenter(null); if (circleRef.current) { circleRef.current.remove(); circleRef.current = null } }}
              className="h-8 px-3 rounded-md border text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Leaflet map */}
      <div ref={mapRef} className="flex-1 rounded-b-lg border border-t-0 z-0" style={{ minHeight: 460 }} />

      {/* Inject Leaflet CSS once */}
      <style>{`@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');`}</style>
    </div>
  )
}
