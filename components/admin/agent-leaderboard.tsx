import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award } from "lucide-react"

interface LeaderboardEntry {
  id: string
  name: string
  email: string
  completed: number
  points: number
}

interface AgentLeaderboardProps {
  leaderboard: LeaderboardEntry[]
  title?: string
}

export function AgentLeaderboard({ leaderboard, title = "Agent Leaderboard" }: AgentLeaderboardProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-amber-500" />
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 2:
        return <Award className="h-5 w-5 text-amber-700" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium">{index + 1}</span>
    }
  }

  const getRankBg = (index: number) => {
    switch (index) {
      case 0:
        return "bg-amber-500/20 border-amber-500/30"
      case 1:
        return "bg-slate-400/20 border-slate-400/30"
      case 2:
        return "bg-orange-500/20 border-orange-500/30"
      default:
        return "bg-slate-800/30 border-slate-700/30"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          {title}
        </CardTitle>
        <CardDescription>Based on completed missions</CardDescription>
      </CardHeader>
      <CardContent>
        {leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(index)} transition-colors`}
              >
                <div className="flex-shrink-0">{getRankIcon(index)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-white">{entry.name || entry.email}</p>
                  <p className="text-xs text-slate-400">{entry.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-slate-700 text-slate-200">
                    {entry.completed} missions
                  </Badge>
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                    {entry.points} pts
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No mission completions this period</p>
            <p className="text-sm">Data will appear as agents complete missions</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
