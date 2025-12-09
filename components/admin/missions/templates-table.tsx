"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { MissionTemplate } from "@/lib/types/database"
import { EditTemplateDialog } from "./edit-template-dialog"

interface MissionTemplatesTableProps {
  templates: MissionTemplate[]
}

export function MissionTemplatesTable({ templates }: MissionTemplatesTableProps) {
  const router = useRouter()
  const [editingTemplate, setEditingTemplate] = useState<MissionTemplate | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return

    const supabase = createClient()
    await supabase.from("mission_templates").delete().eq("id", id)
    router.refresh()
  }

  async function handleToggleActive(template: MissionTemplate) {
    const supabase = createClient()
    await supabase.from("mission_templates").update({ is_active: !template.is_active }).eq("id", template.id)
    router.refresh()
  }

  const segmentColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    seasoned: "bg-amber-100 text-amber-800",
    all: "bg-gray-100 text-gray-800",
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No templates yet. Create your first mission template.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.title}</TableCell>
                  <TableCell className="max-w-[300px] truncate text-muted-foreground">
                    {template.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={segmentColors[template.segment]}>
                      {template.segment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={template.is_active ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleToggleActive(template)}
                    >
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(template.id)}>
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

      {editingTemplate && (
        <EditTemplateDialog
          template={editingTemplate}
          open={!!editingTemplate}
          onOpenChange={(open) => !open && setEditingTemplate(null)}
        />
      )}
    </>
  )
}
