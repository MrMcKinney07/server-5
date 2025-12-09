"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

interface CreateTransactionDialogProps {
  agentId: string
}

export function CreateTransactionDialog({ agentId }: CreateTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [propertyAddress, setPropertyAddress] = useState("")
  const [transactionType, setTransactionType] = useState("buyer")
  const [salePrice, setSalePrice] = useState("")
  const [commissionRate, setCommissionRate] = useState("3")
  const [contractDate, setContractDate] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const salePriceNum = Number.parseFloat(salePrice) || 0
    const commissionRateNum = Number.parseFloat(commissionRate) / 100 || 0.03
    const grossCommission = salePriceNum * commissionRateNum

    const supabase = createBrowserClient()
    const { error } = await supabase.from("transactions").insert({
      agent_id: agentId,
      property_address: propertyAddress,
      transaction_type: transactionType,
      sale_price: salePriceNum || null,
      commission_rate: commissionRateNum,
      gross_commission: grossCommission || null,
      contract_date: contractDate || null,
      status: "pending",
    })

    if (!error) {
      setOpen(false)
      setPropertyAddress("")
      setTransactionType("buyer")
      setSalePrice("")
      setCommissionRate("3")
      setContractDate("")
      router.refresh()
    } else {
      console.error("Error creating transaction:", error)
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>Add a new transaction to track your deal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="property-address">Property Address</Label>
              <Input
                id="property-address"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="123 Main St, City, State ZIP"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Transaction Type</Label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="dual">Dual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contract-date">Contract Date</Label>
                <Input
                  id="contract-date"
                  type="date"
                  value={contractDate}
                  onChange={(e) => setContractDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sale-price">Sale Price</Label>
                <Input
                  id="sale-price"
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="350000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                <Input
                  id="commission-rate"
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="3"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? "Creating..." : "Create Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
