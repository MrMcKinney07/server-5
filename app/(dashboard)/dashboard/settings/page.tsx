import { requireAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AgentProfileForm } from "@/components/settings/agent-profile-form"
import { ChangePasswordForm } from "@/components/settings/change-password-form"

export default async function SettingsPage() {
  const agent = await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="border-l-4 border-l-blue-500 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-blue-600">Profile Information</CardTitle>
            <CardDescription>Update your personal information and contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <AgentProfileForm agent={agent} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {/* Account Info Card */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-amber-600">Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground text-sm">Email</span>
                <span className="font-medium text-sm">{agent.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground text-sm">Role</span>
                <span className="font-medium text-sm capitalize">{agent.role}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground text-sm">Segment</span>
                <span className="font-medium text-sm capitalize">{(agent as any).segment ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground text-sm">Member Since</span>
                <span className="font-medium text-sm">{new Date(agent.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card className="border-l-4 border-l-rose-500">
            <CardHeader>
              <CardTitle className="text-rose-600">Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
