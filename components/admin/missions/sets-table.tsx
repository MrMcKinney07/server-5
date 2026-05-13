"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { MissionSetWithItems, MissionTemplate } from "@/lib/types/database"
import { EditSetDialog } from "./edit-set-dialog"

interface MissionSetsTableProps {
  sets: MissionSetWithItems[]
  templates: MissionTemplate[]
}

export function MissionSetsTable({ sets, templates }: MissionSetsTableProps) {
  const router = useRouter()
  const [editingSet, setEditingSet] = useState<MissionSetWithItems | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this mission set?")) return

    const supabase = createClient()
    await supabase.from("mission_sets").delete().eq("id", id)
    router.refresh()
  }

  const segmentColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    seasoned: "bg-amber-100 text-amber-800",
    custom: "bg-purple-100 text-purple-800",
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Templates</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No mission sets yet. Create your first set.
                </TableCell>
              </TableRow>
            ) : (
              sets.map((set) => (
                <TableRow key={set.id}>
                  <TableCell className="font-medium">{set.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={segmentColors[set.segment]}>
                      {set.segment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{set.items?.length ?? 0} templates</span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {set.description || "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingSet(set)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(set.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingSet && (
        <EditSetDialog
          set={editingSet}
          templates={templates}
          open={!!editingSet}
          onOpenChange={(open) => !open && setEditingSet(null)}
        />
      )}
    </>
  )
}
