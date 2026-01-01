"use client"

interface MissionsHeaderProps {
  dateString: string
  completedCount: number
  totalSelected: number
  hasSelectedMissions: boolean
}

export function MissionsHeader({
  dateString,
  completedCount,
  totalSelected,
  hasSelectedMissions,
}: MissionsHeaderProps) {
  const scrollToMissions = () => {
    const selectButton = document.querySelector("[data-select-missions-button]") as HTMLButtonElement
    if (selectButton) {
      selectButton.click()
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Missions</h1>
          <p className="text-white/90 mt-1">
            {hasSelectedMissions
              ? "Complete your 3 missions to earn XP and climb the rankings"
              : "Select 3 missions to get started today"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-white/80">Today</p>
          <p className="text-lg font-semibold">{dateString}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
          <p className="text-sm text-white/90">Today's Progress</p>
          <p className="text-xl font-bold">
            {completedCount}/{totalSelected || 3}
          </p>
        </div>
        {hasSelectedMissions ? (
          completedCount === 3 ? (
            <div className="bg-emerald-500 rounded-lg px-4 py-2 shadow-md">
              <p className="text-sm font-medium">All Complete! 🎉</p>
            </div>
          ) : null
        ) : (
          <button
            onClick={scrollToMissions}
            className="bg-amber-500 hover:bg-amber-600 rounded-lg px-4 py-2 border border-amber-400 shadow-md animate-pulse transition-colors cursor-pointer"
          >
            <p className="text-sm font-medium">⚡ Start Your Day - Select Missions</p>
          </button>
        )}
      </div>
    </div>
  )
}
