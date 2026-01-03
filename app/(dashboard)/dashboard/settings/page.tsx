import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AgentProfileForm } from "@/components/settings/agent-profile-form"

export default async function SettingsPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  // Fetch commission plan for this agent
  const { data: agentPlan } = await supabase
    .from("agent_commission_plans")
    .select("*, plan:commission_plans(*)")
    .eq("agent_id", agent.id)
    .maybeSingle()

  // Fetch default plan if agent doesn't have one assigned
  const { data: defaultPlan } = await supabase.from("commission_plans").select("*").eq("is_default", true).maybeSingle()

  const currentPlan = agentPlan?.plan || defaultPlan

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

        {/* Commission Plan Card */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle className="text-emerald-600">Commission Plan</CardTitle>
            <CardDescription>Your current commission structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentPlan ? (
              <>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Split</span>
                  <span className="font-medium text-emerald-600">
                    {Number(currentPlan.split_percentage)}% / {100 - Number(currentPlan.split_percentage)}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Marketing Fund Threshold</span>
                  <span className="font-medium">
                    {currentPlan.marketing_fund_threshold
                      ? `$${Number(currentPlan.marketing_fund_threshold).toLocaleString()}`
                      : "No Threshold"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Transaction Fee</span>
                  <span className="font-medium">${Number(currentPlan.transaction_fee) || 499}</span>
                </div>
                {agentPlan && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">Marketing Fund Progress:</span> $
                      {agentPlan.cap_progress?.toLocaleString() || 0} / $
                      {currentPlan.marketing_fund_threshold
                        ? Number(currentPlan.marketing_fund_threshold).toLocaleString()
                        : "∞"}
                    </p>
                    <p className="text-sm text-amber-800 mt-1">
                      <span className="font-medium">YTD GCI:</span> ${agentPlan.ytd_gci?.toLocaleString() || 0}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No commission plan assigned. Contact your broker.</p>
            )}
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
