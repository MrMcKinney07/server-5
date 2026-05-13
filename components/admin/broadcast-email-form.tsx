"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mail, Send, Users, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface Agent {
  id: string
  Name: string
  Email: string
  Role: string
}

interface BroadcastEmailFormProps {
  agents: Agent[]
}

export function BroadcastEmailForm({ agents }: BroadcastEmailFormProps) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [sendToAll, setSendToAll] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleAgent = (agentId: string) => {
    setSelectedAgents((prev) => (prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]))
  }

  const handleSelectAll = () => {
    if (selectedAgents.length === agents.length) {
      setSelectedAgents([])
    } else {
      setSelectedAgents(agents.map((a) => a.id))
    }
  }

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please enter both subject and message")
      return
    }

    if (!sendToAll && selectedAgents.length === 0) {
      toast.error("Please select at least one agent or choose 'Send to All'")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/broadcast-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentIds: selectedAgents,
          subject,
          message,
          sendToAll,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send emails")
      }

      toast.success(`Successfully sent ${data.sent} email(s) to ${data.total} agent(s)`)

      // Reset form
      setSubject("")
      setMessage("")
      setSelectedAgents([])
      setSendToAll(false)
    } catch (error) {
      console.error("Error sending broadcast email:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send broadcast email")
    } finally {
      setIsLoading(false)
    }
  }

  const recipientCount = sendToAll ? agents.length : selectedAgents.length

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Email Composition */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-500" />
            Compose Message
          </CardTitle>
          <CardDescription>Write your announcement or update for the team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Input
              placeholder="e.g., Important Update: New Office Hours"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-2">{message.length} characters</p>
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Checkbox
              id="send-to-all"
              checked={sendToAll}
              onCheckedChange={(checked) => setSendToAll(checked as boolean)}
              disabled={isLoading}
            />
            <label htmlFor="send-to-all" className="text-sm font-medium leading-none cursor-pointer">
              Send to all active agents ({agents.length} total)
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {recipientCount} recipient{recipientCount !== 1 ? "s" : ""} selected
              </span>
            </div>
            <Button
              onClick={handleSendEmail}
              disabled={isLoading || !subject.trim() || !message.trim() || recipientCount === 0}
              className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white"
            >
              {isLoading ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agent Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Recipients
          </CardTitle>
          <CardDescription>Select specific agents to receive this email</CardDescription>
        </CardHeader>
        <CardContent>
          {sendToAll ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-medium">Sending to all agents</p>
              <p className="text-xs text-muted-foreground mt-1">
                {agents.length} active agent{agents.length !== 1 ? "s" : ""} will receive this email
              </p>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="w-full mb-3 bg-transparent"
                disabled={isLoading}
              >
                {selectedAgents.length === agents.length ? "Deselect All" : "Select All"}
              </Button>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={agent.id}
                        checked={selectedAgents.includes(agent.id)}
                        onCheckedChange={() => handleToggleAgent(agent.id)}
                        disabled={isLoading}
                        className="mt-1"
                      />
                      <label htmlFor={agent.id} className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm">{agent.Name}</div>
                        <div className="text-xs text-muted-foreground">{agent.Email}</div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {agent.Role}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
