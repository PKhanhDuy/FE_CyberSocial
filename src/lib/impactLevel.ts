import type { ImpactLevel } from "@/mocks/types"

const IMPACT_LABELS: Record<ImpactLevel, string> = {
  high: "Mạnh",
  medium: "Vừa",
  low: "Nhẹ",
}

export function impactLevelFromTige(tigeRemoval?: number | null): ImpactLevel | null {
  if (tigeRemoval == null || Number.isNaN(tigeRemoval)) {
    return null
  }
  const magnitude = Math.abs(tigeRemoval)
  if (magnitude >= 0.06) return "high"
  if (magnitude >= 0.03) return "medium"
  return "low"
}

export function impactLevelLabel(level?: ImpactLevel | null): string | null {
  if (!level) return null
  return IMPACT_LABELS[level]
}

export function resolveImpactLevel(
  explicit?: ImpactLevel | null,
  tigeRemoval?: number | null,
): ImpactLevel | null {
  return explicit ?? impactLevelFromTige(tigeRemoval)
}
