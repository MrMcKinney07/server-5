"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Bot, X, Send, Sparkles, Loader2 } from "lucide-react"

interface CopilotPanelProps {
  context?: {
    lead?: Record<string, unknown>
    contact?: Record<string, unknown>
    agent?: Record<string, unknown>
    activities?: Record<string, unknown>[]
  }
  onClose: () => void
}

export function CopilotPanel({ context, onClose }: CopilotPanelProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/copilot",
      body: { context },
    }),
  })

  const isLoading = status === "in_progress"

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput("")
  }

  const quickPrompts = [
    "Summarize this lead's history",
    "What should I do next?",
    "Draft a follow-up text",
    "Draft an email introduction",
    "Write a listing description",
  ]

  return (
    <Card className="w-96 h-[500px] flex flex-col shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          McKinney HQ
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Hi! I'm McKinney HQ, your AI assistant. How can I help you today?
              </p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Quick actions:</p>
                {quickPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs h-auto py-2 bg-transparent"
                    onClick={() => {
                      sendMessage({ text: prompt })
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}
            >
              {message.role === "assistant" && (
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {message.parts.map((part, i) => (
                  <span key={i}>{part.type === "text" ? part.text : null}</span>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Loader2 className="h-3 w-3 text-primary animate-spin" />
              </div>
              <div className="rounded-lg px-3 py-2 text-sm bg-muted">
                <span className="text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <CardContent className="p-3 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask McKinney HQ..."
            className="text-sm"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
