import { convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

const SYSTEM_PROMPT = `You are McKinney HQ, the AI assistant built into McKinney One - a real estate brokerage CRM platform.

Your capabilities:
- Summarize lead and contact histories
- Propose next best actions for leads and clients
- Draft texts and emails in a professional but friendly tone
- Suggest mission improvements for struggling agents (admin context only)
- Write listing descriptions, social media posts, and scripts
- Answer questions about real estate best practices

Guidelines:
- Be concise and actionable
- Use bullet points for lists
- When drafting communications, match the brokerage's professional but approachable tone
- Always consider urgency and context when suggesting actions
- For lead follow-ups, prioritize speed and personalization

When given context about a specific lead, contact, or agent, use that information to provide tailored advice.`

export async function POST(req: Request) {
  const { messages, context }: { messages: UIMessage[]; context?: Record<string, unknown> } = await req.json()

  // Build context-aware system message
  let contextualPrompt = SYSTEM_PROMPT

  if (context) {
    contextualPrompt += "\n\nCurrent Context:\n"

    if (context.lead) {
      contextualPrompt += `\nLead Information:\n${JSON.stringify(context.lead, null, 2)}`
    }
    if (context.contact) {
      contextualPrompt += `\nContact Information:\n${JSON.stringify(context.contact, null, 2)}`
    }
    if (context.agent) {
      contextualPrompt += `\nAgent Information:\n${JSON.stringify(context.agent, null, 2)}`
    }
    if (context.activities) {
      contextualPrompt += `\nRecent Activities:\n${JSON.stringify(context.activities, null, 2)}`
    }
  }

  const prompt = convertToModelMessages([
    { id: "system", role: "system", content: contextualPrompt, parts: [{ type: "text", text: contextualPrompt }] },
    ...messages,
  ])

  const result = streamText({
    model: "openai/gpt-4o-mini",
    prompt,
    maxOutputTokens: 2000,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse()
}
