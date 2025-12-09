import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { ContactsTable } from "@/components/contacts/contacts-table"
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog"
import type { Contact } from "@/lib/types/database"

export default async function ContactsPage() {
  const agent = await requireAuth()
  const supabase = await createClient()

  const { data: contacts } = await supabase.from("contacts").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">Manage your contacts and their information</p>
        </div>
        <CreateContactDialog agentId={agent.id} />
      </div>
      <ContactsTable contacts={(contacts as Contact[]) || []} />
    </div>
  )
}
