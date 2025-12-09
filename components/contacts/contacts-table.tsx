"use client"

import type { Contact } from "@/lib/types/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface ContactsTableProps {
  contacts: Contact[]
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
            <TableHead>Tags</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>
                <Link href={`/dashboard/contacts/${contact.id}`} className="font-medium hover:underline">
                  {contact.full_name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{contact.email || "-"}</TableCell>
              <TableCell className="text-muted-foreground">{contact.phone || "-"}</TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {contact.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {contact.tags?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{contact.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
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
