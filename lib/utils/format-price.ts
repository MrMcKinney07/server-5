export function formatPrice(price?: number | null): string {
  // Only treat null/undefined as "no value" — 0 is a legitimate price.
  if (price == null) return ""
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}M`
  }
  if (price >= 1_000) {
    // Show one decimal for non-round thousands (e.g. $1.5K) instead of truncating to $1K.
    return `$${(price / 1_000).toFixed(price % 1_000 === 0 ? 0 : 1)}K`
  }
  return `$${price.toLocaleString()}`
}
