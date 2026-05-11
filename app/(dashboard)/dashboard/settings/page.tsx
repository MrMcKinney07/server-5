import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AgentProfileForm } from "@/components/settings/agent-profile-form"

export default async function SettingsPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-600">Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <AgentProfileForm agent={agent} />
          </CardContent>
        </Card>

        {/* Account Info Card */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="text-amber-600">Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{agent.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{agent.role}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Segment</span>
              <span className="font-medium capitalize">{agent.segment}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Member Since</span>
              <span className="font-medium">{new Date(agent.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="border-l-4 border-l-rose-500">
          <CardHeader>
            <CardTitle className="text-rose-600">Notifications</CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Notification settings coming soon. You will be able to customize email and SMS alerts for leads, missions,
              and transactions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
