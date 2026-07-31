import type { PropagationTimelineEvent } from "@/mocks/types"
import { cn } from "@/lib/utils"
import { impactLevelLabel, resolveImpactLevel } from "@/lib/impactLevel"
import { Clock, MessageCircle, Heart, Share2, FileText } from "lucide-react"

interface PropagationTimelineProps {
  events: PropagationTimelineEvent[]
  isSuspicious: boolean
}

const EVENT_ICONS: Record<string, typeof FileText> = {
  tweet: FileText,
  comment: MessageCircle,
  like: Heart,
  share: Share2,
  retweet: Share2,
}

function EventIcon({ eventType }: { eventType: string }) {
  const Icon = EVENT_ICONS[eventType] ?? FileText
  return <Icon className="w-3.5 h-3.5" />
}

export function PropagationTimeline({ events, isSuspicious }: PropagationTimelineProps) {
  const keyEvents = events.filter((event) => event.isInfluential)

  if (keyEvents.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted text-center">
        {events.length === 0
          ? "Chưa có dữ liệu timeline lan truyền."
          : "Không có sự kiện chính ảnh hưởng đến kết luận."}
      </div>
    )
  }

  const accent = isSuspicious ? "text-accent-pink border-accent-pink/40 bg-accent-pink/10" : "text-accent-blue border-accent-blue/40 bg-accent-blue/10"
  const dotAccent = isSuspicious ? "bg-accent-pink" : "bg-accent-blue"
  const lineAccent = isSuspicious ? "bg-accent-pink/30" : "bg-accent-blue/30"

  return (
    <div className="space-y-0">
      {keyEvents.map((event, index) => {
        const impactLevel = resolveImpactLevel(null, event.tigeRemoval)
        const impactLabel = impactLevelLabel(impactLevel)
        const isLast = index === keyEvents.length - 1

        return (
          <div key={`${event.eventIndex}-${event.relativeTime}`} className="relative flex gap-3 pb-4">
            {!isLast && (
              <div className={cn("absolute left-[11px] top-6 bottom-0 w-px", lineAccent)} />
            )}

            <div className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-panel">
              <div className={cn("h-2 w-2 rounded-full", event.isInfluential ? dotAccent : "bg-muted")} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {event.relativeTime.replace(/^t=/, "")}
                </span>
                {event.isInfluential && (
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide", accent)}>
                    Quan trọng
                  </span>
                )}
                {impactLabel && (
                  <span
                    className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", accent)}
                    title="Mức ảnh hưởng của tương tác này đến kết luận AI"
                  >
                    Ảnh hưởng {impactLabel.toLowerCase()}
                  </span>
                )}
                {(event.eventType === "share" || event.eventType === "retweet") && (event.depth ?? 0) > 1 && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-mono text-muted">
                    nhánh depth {event.depth}
                  </span>
                )}
              </div>

              <div className="mt-1 text-sm text-foreground">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <EventIcon eventType={event.eventType} />
                  {event.eventTypeLabel}
                </span>
                <span className="text-muted"> bởi </span>
                <span className="font-semibold">{event.actorLabel}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
