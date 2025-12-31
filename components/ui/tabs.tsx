"use client"

import type * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-11 w-fit items-center justify-center gap-1 p-1",
        "bg-[rgba(255,255,255,0.03)] backdrop-blur-sm",
        "border border-[rgba(255,255,255,0.08)] rounded-full",
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-full flex-1 items-center justify-center gap-1.5 px-4 py-1.5",
        "text-sm font-medium whitespace-nowrap rounded-full",
        "text-slate-400 transition-all duration-200",
        // Hover
        "hover:text-slate-200",
        // Active state - glass indicator
        "data-[state=active]:bg-[rgba(255,255,255,0.08)]",
        "data-[state=active]:text-white",
        "data-[state=active]:shadow-[0_0_20px_rgba(34,211,238,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]",
        "data-[state=active]:border data-[state=active]:border-[rgba(255,255,255,0.1)]",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-50",
        // Icons
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none mt-2", className)} {...props} />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
