import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-cyan-500/30",
  {
    variants: {
      variant: {
        // Primary - Cyan glass pill with glow
        default: [
          "bg-gradient-to-r from-cyan-500/20 to-cyan-400/10",
          "backdrop-blur-sm",
          "border border-cyan-500/30",
          "text-cyan-400 font-medium",
          "rounded-full",
          "shadow-[0_0_20px_rgba(34,211,238,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "hover:from-cyan-500/30 hover:to-cyan-400/20",
          "hover:border-cyan-500/50",
          "hover:shadow-[0_0_30px_rgba(34,211,238,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:-translate-y-0.5",
        ].join(" "),
        green: [
          "bg-gradient-to-r from-emerald-500/25 to-teal-500/20",
          "backdrop-blur-sm",
          "border border-emerald-500/40",
          "text-white font-medium",
          "rounded-full",
          "shadow-[0_0_20px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:from-emerald-500/35 hover:to-teal-500/30",
          "hover:border-emerald-500/60",
          "hover:shadow-[0_0_30px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:-translate-y-0.5",
        ].join(" "),
        purple: [
          "bg-gradient-to-r from-purple-500/25 to-indigo-500/20",
          "backdrop-blur-sm",
          "border border-purple-500/40",
          "text-white font-medium",
          "rounded-full",
          "shadow-[0_0_20px_rgba(168,85,247,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:from-purple-500/35 hover:to-indigo-500/30",
          "hover:border-purple-500/60",
          "hover:shadow-[0_0_30px_rgba(168,85,247,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:-translate-y-0.5",
        ].join(" "),
        amber: [
          "bg-gradient-to-r from-amber-500/25 to-orange-500/20",
          "backdrop-blur-sm",
          "border border-amber-500/40",
          "text-white font-medium",
          "rounded-full",
          "shadow-[0_0_20px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:from-amber-500/35 hover:to-orange-500/30",
          "hover:border-amber-500/60",
          "hover:shadow-[0_0_30px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:-translate-y-0.5",
        ].join(" "),
        blue: [
          "bg-gradient-to-r from-blue-500/25 to-sky-500/20",
          "backdrop-blur-sm",
          "border border-blue-500/40",
          "text-white font-medium",
          "rounded-full",
          "shadow-[0_0_20px_rgba(59,130,246,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:from-blue-500/35 hover:to-sky-500/30",
          "hover:border-blue-500/60",
          "hover:shadow-[0_0_30px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:-translate-y-0.5",
        ].join(" "),
        // Destructive - Red glass
        destructive: [
          "bg-gradient-to-r from-red-500/20 to-red-400/10",
          "backdrop-blur-sm",
          "border border-red-500/30",
          "text-red-400",
          "rounded-full",
          "shadow-[0_0_15px_rgba(239,68,68,0.1)]",
          "hover:from-red-500/30 hover:to-red-400/20",
          "hover:border-red-500/50",
          "hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]",
        ].join(" "),
        // Outline - Glass border pill
        outline: [
          "bg-[rgba(255,255,255,0.03)]",
          "backdrop-blur-sm",
          "border border-[rgba(255,255,255,0.15)]",
          "text-white",
          "rounded-full",
          "hover:bg-[rgba(255,255,255,0.06)]",
          "hover:border-[rgba(255,255,255,0.25)]",
          "hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]",
        ].join(" "),
        // Secondary - Subtle glass
        secondary: [
          "bg-[rgba(255,255,255,0.05)]",
          "backdrop-blur-sm",
          "border border-[rgba(255,255,255,0.08)]",
          "text-slate-300",
          "rounded-[var(--radius-bubble-md)]",
          "hover:bg-[rgba(255,255,255,0.08)]",
          "hover:text-white",
          "hover:border-[rgba(255,255,255,0.12)]",
        ].join(" "),
        // Ghost - Minimal glass hover
        ghost: [
          "text-slate-300",
          "rounded-[var(--radius-bubble-sm)]",
          "hover:bg-[rgba(255,255,255,0.05)]",
          "hover:text-white",
        ].join(" "),
        // Link
        link: "text-cyan-400 underline-offset-4 hover:underline hover:text-cyan-300",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-12 px-8 has-[>svg]:px-6 text-base",
        icon: "size-10 rounded-[var(--radius-bubble-md)]",
        "icon-sm": "size-8 rounded-[var(--radius-bubble-sm)]",
        "icon-lg": "size-12 rounded-[var(--radius-bubble-lg)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
