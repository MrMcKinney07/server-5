import { BrokerRevenueDashboard } from "@/components/admin/financials/broker-revenue-dashboard"

export default function AdminFinancialsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Broker Financials</h1>
        <p className="text-muted-foreground">Revenue tracking and agent profitability</p>
      </div>
      <BrokerRevenueDashboard />
    </div>
  )
}
