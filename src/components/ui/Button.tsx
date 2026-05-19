import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "neon-pink" | "neon-blue"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-panel border border-border text-foreground hover:bg-panel-hover": variant === "default",
            "border border-border bg-transparent hover:bg-panel-hover": variant === "outline",
            "hover:bg-panel-hover hover:text-foreground": variant === "ghost",
            "bg-accent-pink/20 text-accent-pink border border-accent-pink/50 hover:bg-accent-pink/30 shadow-[var(--shadow-neon-pink)]": variant === "neon-pink",
            "bg-accent-blue/20 text-accent-blue border border-accent-blue/50 hover:bg-accent-blue/30 shadow-[var(--shadow-neon-blue)]": variant === "neon-blue",
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
