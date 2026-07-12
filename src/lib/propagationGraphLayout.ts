import type { PropagationTimelineEvent } from "@/mocks/types"

export type PropagationGraphMode = "star" | "tree"

export interface PropagationGraphNode {
  id: string
  label: string
  isRoot: boolean
  isInfluential: boolean
  isShareBranch: boolean
  position: [number, number, number]
  radius: number
  eventType: string
  depth: number
  maxTige: number | null
}

export interface PropagationGraphEdge {
  id: string
  from: string
  to: string
  eventType: string
  isInfluential: boolean
  isBranchEdge: boolean
}

export interface PropagationGraphLayout {
  mode: PropagationGraphMode
  rootId: string
  nodes: PropagationGraphNode[]
  edges: PropagationGraphEdge[]
  eventCount: number
  maxDepth: number
}

const EVENT_TYPE_PRIORITY: Record<string, number> = {
  share: 3,
  comment: 2,
  like: 1,
  tweet: 0,
}

function parseRelativeSeconds(relativeTime: string): number {
  const normalized = relativeTime.replace(/^t=/, "")
  if (normalized === "0") return 0

  const match = normalized.match(/^\+(\d+)(s|m|h)?$/)
  if (!match) return 0

  const value = Number.parseInt(match[1], 10)
  const unit = match[2] ?? "s"
  if (unit === "m") return value * 60
  if (unit === "h") return value * 3600
  return value
}

function eventNodeId(event: PropagationTimelineEvent): string {
  return event.eventId ?? `event:${event.eventIndex}`
}

function rootEvent(timeline: PropagationTimelineEvent[]): PropagationTimelineEvent {
  return timeline.find((event) => event.eventType === "tweet") ?? timeline[0]
}

function hasShareChain(timeline: PropagationTimelineEvent[]): boolean {
  const root = rootEvent(timeline)
  const rootId = eventNodeId(root)
  const shareIds = new Set(
    timeline.filter((event) => event.eventType === "share").map((event) => eventNodeId(event)),
  )

  return timeline.some(
    (event) =>
      event.eventType === "share"
      && event.parentEventId
      && event.parentEventId !== rootId
      && shareIds.has(event.parentEventId),
  )
}

function satellitePosition(index: number, total: number, baseRadius: number, zOffset: number): [number, number, number] {
  if (total <= 0) return [baseRadius, 0, zOffset]

  const angle = (index / total) * Math.PI * 2 - Math.PI / 2
  return [Math.cos(angle) * baseRadius, Math.sin(angle) * baseRadius, zOffset]
}

function createStarLayout(timeline: PropagationTimelineEvent[]): PropagationGraphLayout {
  if (timeline.length === 0) {
    return { mode: "star", rootId: "root", nodes: [], edges: [], eventCount: 0, maxDepth: 0 }
  }

  const root = rootEvent(timeline)
  const rootId = `actor:${root.actorLabel}`

  type ActorAggregate = {
    label: string
    interactionCount: number
    maxTige: number | null
    isInfluential: boolean
    dominantEventType: string
    earliestSeconds: number
  }

  const actors = new Map<string, ActorAggregate>()
  actors.set(rootId, {
    label: root.actorLabel,
    interactionCount: 1,
    maxTige: root.tigeRemoval ?? null,
    isInfluential: root.isInfluential,
    dominantEventType: root.eventType,
    earliestSeconds: parseRelativeSeconds(root.relativeTime),
  })

  for (const event of timeline) {
    if (event.eventIndex === root.eventIndex) continue

    const actorId = `actor:${event.actorLabel}`
    const seconds = parseRelativeSeconds(event.relativeTime)
    const existing = actors.get(actorId)

    if (!existing) {
      actors.set(actorId, {
        label: event.actorLabel,
        interactionCount: 1,
        maxTige: event.tigeRemoval ?? null,
        isInfluential: event.isInfluential,
        dominantEventType: event.eventType,
        earliestSeconds: seconds,
      })
      continue
    }

    existing.interactionCount += 1
    existing.isInfluential = existing.isInfluential || event.isInfluential
    existing.dominantEventType =
      (EVENT_TYPE_PRIORITY[event.eventType] ?? 0) > (EVENT_TYPE_PRIORITY[existing.dominantEventType] ?? 0)
        ? event.eventType
        : existing.dominantEventType
    existing.earliestSeconds = Math.min(existing.earliestSeconds, seconds)
    if (event.tigeRemoval != null) {
      const absTige = Math.abs(event.tigeRemoval)
      const currentAbs = existing.maxTige == null ? -1 : Math.abs(existing.maxTige)
      if (absTige > currentAbs) existing.maxTige = event.tigeRemoval
    }
  }

  const satellites = [...actors.entries()]
    .filter(([id]) => id !== rootId)
    .sort((a, b) => a[1].earliestSeconds - b[1].earliestSeconds)

  const baseRadius = Math.min(6, 3 + satellites.length * 0.18)
  const nodes: PropagationGraphNode[] = [
    {
      id: rootId,
      label: root.actorLabel,
      isRoot: true,
      isInfluential: root.isInfluential,
      isShareBranch: false,
      position: [0, 0, 0],
      radius: 0.42,
      eventType: "tweet",
      depth: 0,
      maxTige: root.tigeRemoval ?? null,
    },
  ]

  satellites.forEach(([id, actor], index) => {
    const zOffset = (actor.earliestSeconds / 60) * 0.15
    nodes.push({
      id,
      label: actor.label,
      isRoot: false,
      isInfluential: actor.isInfluential,
      isShareBranch: false,
      position: satellitePosition(index, satellites.length, baseRadius, zOffset),
      radius: 0.12 + Math.min(actor.interactionCount * 0.03, 0.18),
      eventType: actor.dominantEventType,
      depth: 1,
      maxTige: actor.maxTige,
    })
  })

  const edges: PropagationGraphEdge[] = timeline
    .filter((event) => event.eventIndex !== root.eventIndex)
    .map((event) => ({
      id: `edge:${event.eventIndex}`,
      from: rootId,
      to: `actor:${event.actorLabel}`,
      eventType: event.eventType,
      isInfluential: event.isInfluential,
      isBranchEdge: false,
    }))

  return {
    mode: "star",
    rootId,
    nodes,
    edges,
    eventCount: timeline.length,
    maxDepth: 1,
  }
}

function buildTreeGraphFromTimeline(timeline: PropagationTimelineEvent[]): PropagationGraphLayout {
  const root = rootEvent(timeline)
  const rootId = eventNodeId(root)
  const shareEvents = timeline.filter((event) => event.eventType === "share")
  const rootInteractions = timeline.filter(
    (event) => event.eventType === "like" || event.eventType === "comment",
  )

  const childrenByParent = new Map<string, PropagationTimelineEvent[]>()
  for (const share of shareEvents) {
    const parentId = share.parentEventId ?? rootId
    const bucket = childrenByParent.get(parentId) ?? []
    bucket.push(share)
    childrenByParent.set(parentId, bucket)
  }

  const nodes: PropagationGraphNode[] = []
  const edges: PropagationGraphEdge[] = []
  const levelHeight = 2.2
  const maxDepth = Math.max(1, ...shareEvents.map((event) => event.depth ?? 1))

  nodes.push({
    id: rootId,
    label: root.actorLabel,
    isRoot: true,
    isInfluential: root.isInfluential,
    isShareBranch: false,
    position: [0, maxDepth * levelHeight, 0],
    radius: 0.45,
    eventType: "tweet",
    depth: 0,
    maxTige: root.tigeRemoval ?? null,
  })

  const assignShareSubtree = (
    parentId: string,
    parentPosition: [number, number, number],
    depth: number,
    spanStart: number,
    spanEnd: number,
  ) => {
    const children = childrenByParent.get(parentId) ?? []
    if (children.length === 0) return

    const width = spanEnd - spanStart
    children.forEach((child, index) => {
      const childId = eventNodeId(child)
      const x = spanStart + (width * (index + 1)) / (children.length + 1)
      const y = parentPosition[1] - levelHeight
      const position: [number, number, number] = [x, y, depth * 0.2]
      nodes.push({
        id: childId,
        label: child.actorLabel,
        isRoot: false,
        isInfluential: child.isInfluential,
        isShareBranch: true,
        position,
        radius: 0.14 + (child.isInfluential ? 0.06 : 0),
        eventType: "share",
        depth: child.depth ?? depth,
        maxTige: child.tigeRemoval ?? null,
      })
      edges.push({
        id: `edge:${child.eventIndex}`,
        from: parentId,
        to: childId,
        eventType: "share",
        isInfluential: child.isInfluential,
        isBranchEdge: true,
      })

      const childSpanStart = spanStart + (width * index) / children.length
      const childSpanEnd = spanStart + (width * (index + 1)) / children.length
      assignShareSubtree(childId, position, depth + 1, childSpanStart, childSpanEnd)
    })
  }

  assignShareSubtree(rootId, nodes[0].position, 1, -6, 6)

  rootInteractions.forEach((event, index) => {
    const nodeId = eventNodeId(event)
    const angle = (index / Math.max(rootInteractions.length, 1)) * Math.PI * 2
    const radius = 1.4
    nodes.push({
      id: nodeId,
      label: event.actorLabel,
      isRoot: false,
      isInfluential: event.isInfluential,
      isShareBranch: false,
      position: [
        nodes[0].position[0] + Math.cos(angle) * radius,
        nodes[0].position[1] + 0.2,
        nodes[0].position[2] + Math.sin(angle) * radius,
      ],
      radius: 0.09,
      eventType: event.eventType,
      depth: 0,
      maxTige: event.tigeRemoval ?? null,
    })
    edges.push({
      id: `edge:${event.eventIndex}`,
      from: rootId,
      to: nodeId,
      eventType: event.eventType,
      isInfluential: event.isInfluential,
      isBranchEdge: false,
    })
  })

  return {
    mode: "tree",
    rootId,
    nodes,
    edges,
    eventCount: timeline.length,
    maxDepth,
  }
}

export function buildPropagationGraphFromTimeline(
  timeline: PropagationTimelineEvent[],
): PropagationGraphLayout {
  if (timeline.length === 0) {
    return { mode: "star", rootId: "root", nodes: [], edges: [], eventCount: 0, maxDepth: 0 }
  }
  if (hasShareChain(timeline)) {
    return buildTreeGraphFromTimeline(timeline)
  }
  return createStarLayout(timeline)
}

export function edgeColor(eventType: string, isSuspicious: boolean): string {
  if (eventType === "share") return isSuspicious ? "#f472b6" : "#fb923c"
  if (eventType === "comment") return isSuspicious ? "#5eead4" : "#a78bfa"
  if (eventType === "like") return isSuspicious ? "#34d399" : "#60a5fa"
  return isSuspicious ? "#2dd4bf" : "#38bdf8"
}

export function getGraphStats(layout: PropagationGraphLayout) {
  const actorCount = layout.nodes.length
  const influentialCount = layout.nodes.filter((node) => node.isInfluential && !node.isRoot).length
  return {
    actorCount,
    eventCount: layout.eventCount,
    influentialCount,
    mode: layout.mode,
    maxDepth: layout.maxDepth,
  }
}

// Backward-compatible alias
export { buildPropagationGraphFromTimeline as buildStarGraphFromTimeline }
export type StarGraphLayout = PropagationGraphLayout
export type StarGraphNode = PropagationGraphNode
export type StarGraphEdge = PropagationGraphEdge
export { getGraphStats as getStarGraphStats }
