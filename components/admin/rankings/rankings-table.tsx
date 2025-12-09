import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award } from "lucide-react"
import type { MonthlyAgentStats, Agent } from "@/lib/types/database"

interface RankingWithAgent extends MonthlyAgentStats {
  agent: Pick<Agent, "id" | "full_name" | "email" | "segment"> | null
}

interface RankingsTableProps {
  rankings: RankingWithAgent[]
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <span className="font-bold text-yellow-600">1st</span>
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex items-center gap-2">
        <Medal className="h-5 w-5 text-gray-400" />
        <span className="font-semibold text-gray-500">2nd</span>
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-amber-600" />
        <span className="font-semibold text-amber-700">3rd</span>
      </div>
    )
  }
  return <span className="text-muted-foreground">{rank}th</span>
}

export function RankingsTable({ rankings }: RankingsTableProps) {
  if (rankings.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Rankings Yet</h3>
        <p className="text-sm text-muted-foreground">
          Click "Rebuild Rankings" to calculate the current month's leaderboard.
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Rank</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Segment</TableHead>
            <TableHead className="text-right">Total Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.map((ranking) => (
            <TableRow key={ranking.id} className={ranking.rank && ranking.rank <= 3 ? "bg-muted/30" : ""}>
              <TableCell>
                <RankBadge rank={ranking.rank || 0} />
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">{ranking.agent?.full_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{ranking.agent?.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={ranking.agent?.segment === "seasoned" ? "default" : "secondary"}>
                  {ranking.agent?.segment || "—"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-lg font-semibold text-foreground">{ranking.total_points}</span>
                <span className="text-sm text-muted-foreground ml-1">pts</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
