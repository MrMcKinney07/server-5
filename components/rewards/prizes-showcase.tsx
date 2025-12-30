"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Gift, Sparkles, Zap, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PrizesShowcase({ agentXP }: { agentXP: number }) {
  const [prizes, setPrizes] = useState<any[]>([])
  const [selectedPrize, setSelectedPrize] = useState<any>(null)
  const [redeeming, setRedeeming] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchPrizes()
  }, [])

  async function fetchPrizes() {
    const { data } = await supabase
      .from("rewards_prizes")
      .select("*")
      .eq("is_active", true)
      .order("xp_cost", { ascending: true })

    if (data) setPrizes(data)
  }

  async function handleRedeem() {
    if (!selectedPrize) return

    setRedeeming(true)

    // Get current agent
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // Check if agent has enough XP
    if (agentXP < selectedPrize.xp_cost) {
      toast({
        title: "Insufficient XP",
        description: `You need ${selectedPrize.xp_cost - agentXP} more XP to redeem this prize.`,
        variant: "destructive",
      })
      setRedeeming(false)
      return
    }

    // Create redemption record
    const { error: redemptionError } = await supabase.from("prize_redemptions").insert([
      {
        prize_id: selectedPrize.id,
        agent_id: user.id,
      },
    ])

    if (redemptionError) {
      toast({ title: "Error redeeming prize", variant: "destructive" })
      setRedeeming(false)
      return
    }

    // Deduct XP from agent
    const { error: xpError } = await supabase
      .from("agents")
      .update({ exp: agentXP - selectedPrize.xp_cost })
      .eq("id", user.id)

    if (xpError) {
      toast({ title: "Error updating XP", variant: "destructive" })
      setRedeeming(false)
      return
    }

    // Update prize quantity if limited
    if (selectedPrize.quantity_available !== null) {
      await supabase
        .from("rewards_prizes")
        .update({ quantity_available: selectedPrize.quantity_available - 1 })
        .eq("id", selectedPrize.id)
    }

    toast({
      title: "Prize redeemed!",
      description: `You've successfully redeemed ${selectedPrize.name}. A broker will contact you soon.`,
    })

    setSelectedPrize(null)
    setRedeeming(false)
    fetchPrizes()
    window.location.reload() // Refresh to update XP display
  }

  const canAfford = (prize: any) => agentXP >= prize.xp_cost
  const isAvailable = (prize: any) => prize.quantity_available === null || prize.quantity_available > 0

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {prizes.map((prize) => {
          const affordable = canAfford(prize)
          const available = isAvailable(prize)

          return (
            <Card
              key={prize.id}
              className={`group relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                affordable && available ? "border-2 border-primary/50 shadow-lg shadow-primary/20" : "opacity-60"
              }`}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <Sparkles className="absolute top-4 right-4 h-4 w-4 text-yellow-400 animate-pulse" />
                <Zap
                  className="absolute bottom-4 left-4 h-3 w-3 text-cyan-400 animate-bounce"
                  style={{ animationDelay: "0.5s" }}
                />
              </div>

              {/* Prize image */}
              <div className="relative h-56 overflow-hidden">
                {prize.image_url ? (
                  <img
                    src={prize.image_url || "/placeholder.svg"}
                    alt={prize.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Gift className="h-24 w-24 text-primary/60" />
                  </div>
                )}

                {/* Category badge */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wide">
                  {prize.category}
                </div>

                {/* XP cost badge */}
                <div className="absolute top-3 right-3 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-orange-500/50">
                  <span className="text-lg">{prize.xp_cost}</span>
                  <span className="text-xs ml-1">XP</span>
                </div>
              </div>

              {/* Prize content */}
              <div className="relative p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {prize.name}
                  </h3>

                  {prize.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{prize.description}</p>
                  )}
                </div>

                {/* Availability */}
                {prize.quantity_available !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {prize.quantity_available > 0 ? `${prize.quantity_available} left` : "Out of stock"}
                    </span>
                  </div>
                )}

                {/* Redeem button */}
                <Button
                  className="w-full"
                  disabled={!affordable || !available}
                  onClick={() => setSelectedPrize(prize)}
                  variant={affordable && available ? "default" : "outline"}
                >
                  {!available ? (
                    "Out of Stock"
                  ) : !affordable ? (
                    `Need ${prize.xp_cost - agentXP} more XP`
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Redeem Prize
                    </>
                  )}
                </Button>
              </div>

              {/* Shine effect */}
              {affordable && available && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
              )}
            </Card>
          )
        })}
      </div>

      {prizes.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <Gift className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">No prizes available yet</h3>
            <p className="text-muted-foreground">Check back soon for exciting rewards!</p>
          </div>
        </Card>
      )}

      {/* Redemption confirmation dialog */}
      <Dialog open={!!selectedPrize} onOpenChange={() => setSelectedPrize(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Prize Redemption</DialogTitle>
          </DialogHeader>

          {selectedPrize && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                {selectedPrize.image_url ? (
                  <img
                    src={selectedPrize.image_url || "/placeholder.svg"}
                    alt={selectedPrize.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                    <Gift className="h-16 w-16 text-primary/60" />
                  </div>
                )}

                <h3 className="text-xl font-bold">{selectedPrize.name}</h3>
                <p className="text-2xl font-bold text-primary">{selectedPrize.xp_cost} XP</p>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  Your current XP: <span className="font-bold">{agentXP}</span>
                </p>
                <p>
                  XP after redemption: <span className="font-bold">{agentXP - selectedPrize.xp_cost}</span>
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                A broker will contact you within 24-48 hours to arrange delivery of your prize.
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setSelectedPrize(null)}
                  disabled={redeeming}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleRedeem} disabled={redeeming}>
                  {redeeming ? "Redeeming..." : "Confirm Redemption"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
