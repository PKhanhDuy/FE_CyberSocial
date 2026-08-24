import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X, ShieldAlert, Activity, User, MessageSquare, Heart, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AppNotification, NotificationType } from "@/store/useNotificationStore"
import { useTranslation } from "react-i18next"

interface NotificationDetailModalProps {
  notification: AppNotification | null
  onClose: () => void
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "system_alert":
      return <ShieldAlert className="h-6 w-6 text-accent-pink" />
    case "ai_update":
      return <Activity className="h-6 w-6 text-accent-blue" />
    case "network_alert":
      return <Zap className="h-6 w-6 text-yellow-400" />
    case "social_follow":
      return <User className="h-6 w-6 text-purple-400" />
    case "social_like":
      return <Heart className="h-6 w-6 text-pink-400" />
    case "social_comment":
      return <MessageSquare className="h-6 w-6 text-blue-400" />
  }
}

function formatCreatedAt(createdAt?: string) {
  if (!createdAt) return null
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(createdAt))
  } catch {
    return createdAt
  }
}

export function NotificationDetailModal({ notification, onClose }: NotificationDetailModalProps) {
  const { t } = useTranslation()

  const typeLabelKey: Record<NotificationType, string> = {
    system_alert: "notifications.typeSystem",
    ai_update: "notifications.typeAi",
    network_alert: "notifications.typeNetwork",
    social_follow: "notifications.typeFollow",
    social_like: "notifications.typeLike",
    social_comment: "notifications.typeComment",
  }

  return createPortal(
    <AnimatePresence>
      {notification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            className={cn(
              "relative w-full max-w-lg rounded-2xl border glass-panel shadow-2xl overflow-hidden",
              notification.type === "system_alert"
                ? "border-accent-pink/40 shadow-[var(--shadow-neon-pink)]"
                : "border-border",
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-detail-title"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 rounded-full border border-border bg-panel p-2 text-foreground transition-colors hover:bg-white/10"
              aria-label={t("notifications.closeDetail")}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 pt-8">
              <div className="mb-4 flex items-start gap-4">
                <div className="rounded-xl border border-border bg-background p-3 shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="min-w-0 flex-1 pr-8">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    {t(typeLabelKey[notification.type])}
                  </p>
                  <h2
                    id="notification-detail-title"
                    className={cn(
                      "text-lg font-bold tracking-wide",
                      notification.type === "system_alert" ? "text-accent-pink" : "text-foreground",
                    )}
                  >
                    {notification.title}
                  </h2>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-border bg-background/60 p-4">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {notification.message}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                <span className="font-mono">
                  {formatCreatedAt(notification.createdAt) ?? notification.timestamp}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 font-semibold",
                    notification.isRead
                      ? "border-border text-muted"
                      : "border-accent-blue/40 bg-accent-blue/10 text-accent-blue",
                  )}
                >
                  {notification.isRead ? t("notifications.statusRead") : t("notifications.statusUnread")}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
