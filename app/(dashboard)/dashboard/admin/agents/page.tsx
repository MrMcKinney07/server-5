import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Users, User } from "lucide-react"
import Link from "next/link"

export default async function AdminAgentsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: agents } = await supabase.from("agents").select("*").order("created_at", { ascending: false })

  const roleColors: Record<string, string> = {
    broker: "bg-amber-100 text-amber-800",
    admin: "bg-purple-100 text-purple-800",
    agent: "bg-blue-100 text-blue-800",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Agent Management</h1>
          <p className="text-muted-foreground">View and manage agent accounts</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            All Agents ({agents?.length || 0})
          </CardTitle>
          <CardDescription>Team members with access to the CRM</CardDescription>
        </CardHeader>
        <CardContent>
          {agents && agents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {agent.Name || "Unnamed"}
                      </div>
                    </TableCell>
                    <TableCell>{agent.Email}</TableCell>
                    <TableCell>{agent.Phone || "-"}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[agent.Role] || roleColors.agent}>{agent.Role || "agent"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(agent.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No agents found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
