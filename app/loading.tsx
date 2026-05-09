export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}
