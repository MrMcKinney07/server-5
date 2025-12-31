import type * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 px-4 py-2 text-base md:text-sm",
        "bg-white dark:bg-[rgba(255,255,255,0.03)]",
        "backdrop-blur-sm",
        "border border-slate-200 dark:border-[rgba(255,255,255,0.08)]",
        "rounded-lg dark:rounded-[var(--radius-bubble-md)]",
        "text-slate-900 dark:text-white",
        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
        "shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]",
        "transition-all duration-200 outline-none",
        // Focus state
        "focus:bg-slate-50 dark:focus:bg-[rgba(255,255,255,0.05)]",
        "focus:border-cyan-500 dark:focus:border-cyan-500/50",
        "focus:ring-[3px] focus:ring-cyan-500/20",
        "dark:focus:shadow-[0_0_20px_rgba(34,211,238,0.15),inset_0_1px_2px_rgba(0,0,0,0.2)]",
        // File input
        "file:text-slate-900 dark:file:text-white file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Selection
        "selection:bg-cyan-500/30 selection:text-white",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid
        "aria-invalid:border-red-500 dark:aria-invalid:border-red-500/50 aria-invalid:ring-red-500/20",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
