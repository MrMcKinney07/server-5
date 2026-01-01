"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { MoreHorizontal, Pencil, Trash2, Mail, Users, MessageSquare, Send } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Campaign {
  id: string
  name: string
  description: string | null
  is_active: boolean
  channel?: string
  type?: string
  created_at: string
  stepsCount: number
  enrollmentsCount: number
}

interface CampaignsTableProps {
  campaigns: Campaign[]
}

function ChannelBadge({ channel }: { channel?: string }) {
  switch (channel) {
    case "SMS":
      return (
        <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
          <MessageSquare className="h-3 w-3" />
          SMS
        </Badge>
      )
    case "EMAIL":
      return (
        <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <Mail className="h-3 w-3" />
          Email
        </Badge>
      )
    case "BOTH":
      return (
        <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
          <Mail className="h-3 w-3" />
          <MessageSquare className="h-3 w-3" />
          Both
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <Mail className="h-3 w-3" />
          Email
        </Badge>
      )
  }
}

function TypeBadge({ type }: { type?: string }) {
  switch (type) {
    case "BROADCAST":
      return (
        <Badge variant="secondary" className="gap-1">
          <Send className="h-3 w-3" />
          Broadcast
        </Badge>
      )
    case "SEQUENCE":
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Send className="h-3 w-3" />
          Sequence
        </Badge>
      )
  }
}

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const router = useRouter()
  const supabase = createBrowserClient()

  async function toggleActive(id: string, currentValue: boolean) {
    await supabase.from("campaigns").update({ is_active: !currentValue }).eq("id", id)
    router.refresh()
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Are you sure you want to delete this campaign? This will also delete all steps and enrollments.")) {
      return
    }
    await supabase.from("campaigns").delete().eq("id", id)
    router.refresh()
  }

  if (campaigns.length === 0) {
    return (
      <div className="border border-dashed rounded-lg p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No campaigns yet</h3>
        <p className="text-muted-foreground text-sm">Create your first drip campaign to automate lead nurturing.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Steps</TableHead>
            <TableHead>Enrolled</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell>
                <Link href={`/dashboard/campaigns/${campaign.id}`} className="font-medium hover:underline">
                  {campaign.name}
                </Link>
                {campaign.description && (
                  <p className="text-sm text-muted-foreground truncate max-w-xs">{campaign.description}</p>
                )}
              </TableCell>
              <TableCell>
                <ChannelBadge channel={campaign.channel} />
              </TableCell>
              <TableCell>
                <TypeBadge type={campaign.type} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="font-medium text-foreground">{campaign.stepsCount}</span>
                  steps
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-foreground">{campaign.enrollmentsCount}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={campaign.is_active ? "default" : "secondary"}>
                  {campaign.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Switch
                  checked={campaign.is_active}
                  onCheckedChange={() => toggleActive(campaign.id, campaign.is_active)}
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/campaigns/${campaign.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteCampaign(campaign.id)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
