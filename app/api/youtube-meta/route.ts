import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get("id")

  if (!videoId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  try {
    // oEmbed for title (no API key needed)
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { cache: "no-store" }
    )

    let title = ""
    if (oembedRes.ok) {
      const data = await oembedRes.json()
      title = data.title || ""
    }

    // Scrape YouTube page for og:description meta tag
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    })

    let description = ""
    if (pageRes.ok) {
      const html = await pageRes.text()
      // Try og:description
      const ogMatch = html.match(/<meta\s+(?:name|property)="og:description"\s+content="([^"]+)"/)
        || html.match(/<meta\s+content="([^"]+)"\s+(?:name|property)="og:description"/)
      if (ogMatch) {
        description = ogMatch[1]
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
      }
    }

    return NextResponse.json({ title, description })
  } catch {
    return NextResponse.json({ title: "", description: "" })
  }
}
