import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "verified" | "suspicious" | "monitoring"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        {
          "border-border bg-panel text-foreground": variant === "default",
          "border-green-500/50 bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]": variant === "verified",
          "border-accent-pink/50 bg-accent-pink/10 text-accent-pink shadow-[var(--shadow-neon-pink)]": variant === "suspicious",
          "border-accent-blue/50 bg-accent-blue/10 text-accent-blue shadow-[var(--shadow-neon-blue)] animate-pulse": variant === "monitoring",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
