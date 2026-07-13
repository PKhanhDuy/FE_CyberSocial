import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

export function StatTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-panel p-4",
        accent ? "border-accent-blue/40" : "border-border"
      )}
    >
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div
        className={cn(
          "mt-2 font-mono text-3xl font-bold tabular-nums leading-none",
          accent ? "text-accent-blue" : "text-foreground"
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-2 text-sm text-muted">{sub}</div>}
    </div>
  )
}

export function StatusPill({ on, labelOn, labelOff }: { on: boolean; labelOn: string; labelOff: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        on ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", on ? "bg-success" : "bg-danger")} />
      {on ? labelOn : labelOff}
    </span>
  )
}

const riskStyles: Record<string, string> = {
  HIGH: "text-danger",
  MEDIUM: "text-warning",
  LOW: "text-success",
}
const riskBar: Record<string, string> = {
  HIGH: "bg-danger",
  MEDIUM: "bg-warning",
  LOW: "bg-success",
}

export function RiskBadge({ risk, probability }: { risk?: string; probability?: number }) {
  const level = risk ?? "MEDIUM"
  const pct = Math.round((probability ?? 0) * 100)
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-semibold", riskStyles[level])}>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-border">
        <span className={cn("block h-full rounded-full", riskBar[level])} style={{ width: `${pct}%` }} />
      </span>
      {level}
    </span>
  )
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-panel", className)}>{children}</div>
}
