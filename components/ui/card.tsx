import type * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Glass bubble base styles
        "relative flex flex-col gap-6 rounded-[var(--radius-bubble-lg)] py-6",
        "bg-[rgba(255,255,255,0.03)] backdrop-blur-md",
        "border border-[rgba(255,255,255,0.08)]",
        "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]",
        // Top edge highlight
        "before:absolute before:top-0 before:left-0 before:right-0 before:h-px",
        "before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.1)] before:to-transparent",
        // Hover state
        "transition-all duration-200",
        "hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.12)]",
        "hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]",
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("leading-none font-semibold text-white", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-slate-400 text-sm", className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-6 [.border-t]:pt-6", className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
