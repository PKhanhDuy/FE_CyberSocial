import type { AIAnalysis, AIState, Post, PropagationTimelineEvent, EventAttribution } from "@/mocks/types"
import type { PostVerification } from "@/lib/api"

const RISK_LABELS: Record<string, AIAnalysis["riskLevel"]> = {
  LOW: "THẤP",
  MEDIUM: "TRUNG BÌNH",
  HIGH: "CAO",
}

export function resolveAiState(verification: PostVerification | null): AIState {
  if (!verification || verification.status === "PENDING" || verification.status === "ANALYZING" || verification.status === "FAILED") {
    return "monitoring"
  }
  if (verification.status === "COMPLETED") {
    return verification.label === "FAKE" ? "suspicious" : "verified"
  }
  return "monitoring"
}

function mapTimeline(verification: PostVerification): PropagationTimelineEvent[] {
  return (verification.propagationTimeline ?? []).map((event) => ({
    eventIndex: event.eventIndex,
    eventId: event.eventId,
    parentEventId: event.parentEventId,
    depth: event.depth ?? 0,
    relativeTime: event.relativeTime,
    eventType: event.eventType,
    eventTypeLabel: event.eventTypeLabel,
    actorLabel: event.actorLabel,
    tigeRemoval: event.tigeRemoval,
    isInfluential: event.influential,
  }))
}

function mapAttributions(verification: PostVerification): EventAttribution[] {
  return (verification.eventAttributions ?? []).map((item) => ({
    eventIndex: item.eventIndex,
    eventType: item.eventType,
    eventTypeLabel: item.eventTypeLabel,
    relativeTime: item.relativeTime,
    actorLabel: item.actorLabel,
    tigeRemoval: item.tigeRemoval,
    confidenceDrop: item.confidenceDrop,
    summary: item.summary,
  }))
}

function buildReasons(verification: PostVerification): string[] {
  const attributions = mapAttributions(verification)
  if (attributions.length > 0) {
    return attributions
      .map((item) => item.summary)
      .filter((summary): summary is string => Boolean(summary))
      .slice(0, 5)
  }

  if (!verification.explanation) {
    return []
  }

  const parts = verification.explanation
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.slice(0, 5) : [verification.explanation]
}

export function buildAiAnalysis(verification: PostVerification | null): AIAnalysis | undefined {
  if (!verification || verification.status !== "COMPLETED" || verification.fakeProbability == null) {
    return undefined
  }

  const propagationTimeline = mapTimeline(verification)
  const eventAttributions = mapAttributions(verification)

  return {
    fakeProbability: verification.fakeProbability,
    riskLevel: RISK_LABELS[verification.riskLevel ?? "LOW"] ?? "THẤP",
    reasons: buildReasons(verification),
    propagationVelocity: Math.max(verification.totalInteractions, 1) / 60,
    propagationTimeline,
    eventAttributions,
  }
}

export function resolvePostTrustScore(verification: PostVerification | null): number | null {
  if (!verification || verification.status !== "COMPLETED" || verification.fakeProbability == null) {
    return null
  }
  return Math.max(0, Math.min(100, Math.round((1 - verification.fakeProbability) * 100)))
}

export function buildPostWithVerification(post: Post, verification: PostVerification | null): Post {
  const aiState = resolveAiState(verification)
  const trustScore = resolvePostTrustScore(verification)
  return {
    ...post,
    aiState,
    aiAnalysis: buildAiAnalysis(verification),
    author: trustScore == null
      ? post.author
      : { ...post.author, trustScore },
  }
}

export function buildTimelineChartData(timeline: PropagationTimelineEvent[]) {
  if (timeline.length === 0) {
    return []
  }

  return timeline.map((event, index) => ({
    time: event.relativeTime.replace(/^t=/, ""),
    nodes: index + 1,
    influential: event.isInfluential,
  }))
}
