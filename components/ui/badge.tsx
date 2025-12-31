import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden backdrop-blur-sm",
  {
    variants: {
      variant: {
        // Cyan glass default
        default: [
          "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25",
          "shadow-[0_0_10px_rgba(34,211,238,0.1)]",
          "[a&]:hover:bg-cyan-500/25",
        ].join(" "),
        // Subtle glass secondary
        secondary: [
          "bg-[rgba(255,255,255,0.05)] text-slate-300 border border-[rgba(255,255,255,0.1)]",
          "[a&]:hover:bg-[rgba(255,255,255,0.1)]",
        ].join(" "),
        // Red glass destructive
        destructive: [
          "bg-red-500/15 text-red-400 border border-red-500/25",
          "shadow-[0_0_10px_rgba(239,68,68,0.1)]",
          "[a&]:hover:bg-red-500/25",
        ].join(" "),
        // Glass outline
        outline: [
          "bg-transparent text-slate-300 border border-[rgba(255,255,255,0.15)]",
          "[a&]:hover:bg-[rgba(255,255,255,0.05)] [a&]:hover:text-white",
        ].join(" "),
        // Success green
        success: [
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
          "shadow-[0_0_10px_rgba(16,185,129,0.1)]",
        ].join(" "),
        // Warning amber
        warning: [
          "bg-amber-500/15 text-amber-400 border border-amber-500/25",
          "shadow-[0_0_10px_rgba(245,158,11,0.1)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
