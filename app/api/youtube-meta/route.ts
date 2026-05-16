import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get("id")

  if (!videoId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  try {
    // noembed.com is a reliable free oEmbed proxy — returns title reliably
    const [noembedRes, ytRes] = await Promise.all([
      fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`, {
        cache: "no-store",
      }),
      fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
      }),
    ])

    let title = ""
    if (noembedRes.ok) {
      const data = await noembedRes.json()
      title = data.title || ""
    }

    let description = ""
    if (ytRes.ok) {
      const html = await ytRes.text()

      // YouTube embeds a JSON-LD block with description
      const ldMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
      if (ldMatch?.[1]) {
        try {
          const ld = JSON.parse(ldMatch[1])
          description = ld.description || ld.articleBody || ""
        } catch {
          // fall through to meta tag approach
        }
      }

      // Fallback: pull description from ytInitialData snippet
      if (!description) {
        const snipMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/s)
        if (snipMatch?.[1]) {
          description = snipMatch[1]
            .replace(/\\n/g, " ")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\")
            .slice(0, 300)
        }
      }
    }

    return NextResponse.json({ title, description })
  } catch {
    return NextResponse.json({ title: "", description: "" })
  }
}
