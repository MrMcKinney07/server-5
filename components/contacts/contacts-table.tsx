"use client"

import type { Contact } from "@/lib/types/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface ContactsTableProps {
  contacts: Contact[]
}

const contactTypeBadgeColors: Record<string, string> = {
  buyer: "bg-blue-100 text-blue-800 border-blue-200",
  seller: "bg-emerald-100 text-emerald-800 border-emerald-200",
  both: "bg-amber-100 text-amber-800 border-amber-200",
  investor: "bg-purple-100 text-purple-800 border-purple-200",
  referral: "bg-rose-100 text-rose-800 border-rose-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
}

export function ContactsTable({ contacts }: ContactsTableProps) {
  if (contacts.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No contacts yet. Create your first contact to get started.
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>
                <Link href={`/dashboard/contacts/${contact.id}`} className="font-medium hover:underline text-blue-600">
                  {contact.first_name} {contact.last_name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{contact.email || "-"}</TableCell>
              <TableCell className="text-muted-foreground">{contact.phone || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={contactTypeBadgeColors[contact.contact_type] || ""}>
                  {contact.contact_type}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{contact.source || "-"}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
