"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Phone, MailIcon, MessageSquare, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Lead } from "@/lib/types/database"

interface LeadCRMActionsProps {
  lead: Lead
  agentId: string
}

export function LeadCRMActions({ lead }: LeadCRMActionsProps) {
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const { toast } = useToast()

  const handleCall = () => {
    if (!lead.phone) {
      toast({
        title: "No phone number",
        description: "This lead doesn't have a phone number on file.",
        variant: "destructive",
      })
      return
    }

    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobile) {
      // Open phone dialer on mobile
      window.location.href = `tel:${lead.phone}`
    } else {
      // Copy to clipboard on desktop
      navigator.clipboard.writeText(lead.phone)
      setCopiedPhone(true)
      toast({
        title: "Phone number copied",
        description: `${lead.phone} has been copied to your clipboard.`,
      })
      setTimeout(() => setCopiedPhone(false), 2000)
    }
  }

  const handleEmail = () => {
    if (!lead.email) {
      toast({
        title: "No email address",
        description: "This lead doesn't have an email address on file.",
        variant: "destructive",
      })
      return
    }

    const subject = encodeURIComponent(`Following up with ${lead.first_name} ${lead.last_name}`)
    const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${lead.email}&subject=${subject}`
    window.open(outlookUrl, "_blank")

    toast({
      title: "Opening Outlook",
      description: `Composing email to ${lead.email}`,
    })
  }

  const handleSMS = () => {
    if (!lead.phone) {
      toast({
        title: "No phone number",
        description: "This lead doesn't have a phone number on file.",
        variant: "destructive",
      })
      return
    }

    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobile) {
      // Open SMS app on mobile
      window.location.href = `sms:${lead.phone}`
    } else {
      // Copy phone number on desktop
      navigator.clipboard.writeText(lead.phone)
      toast({
        title: "Phone number copied",
        description: `${lead.phone} has been copied. Use your phone or messaging app to send SMS.`,
      })
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">Contact {lead.first_name} directly</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCall} variant="outline" className="gap-2 bg-transparent" disabled={!lead.phone}>
            {copiedPhone ? <Check className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            Call
          </Button>
          <Button onClick={handleEmail} variant="outline" className="gap-2 bg-transparent" disabled={!lead.email}>
            {copiedEmail ? <Check className="h-4 w-4" /> : <MailIcon className="h-4 w-4" />}
            Email
          </Button>
          <Button onClick={handleSMS} variant="outline" className="gap-2 bg-transparent" disabled={!lead.phone}>
            <MessageSquare className="h-4 w-4" />
            SMS
          </Button>
        </div>
      </div>
    </Card>
  )
}
