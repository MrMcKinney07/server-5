import { PrizesManager } from "@/components/admin/prizes-manager"
import { requireAdmin } from "@/lib/auth"

export default async function AdminPrizesPage() {
  await requireAdmin()
  return <PrizesManager />
}
