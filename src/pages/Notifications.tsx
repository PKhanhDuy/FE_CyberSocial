import { useEffect, useState } from "react"
import { ShieldAlert, Activity, User, MessageSquare, Heart, CheckCircle2, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotificationStore, type NotificationType } from "@/store/useNotificationStore"

type FilterTab = "ALL" | "SOCIAL" | "SYSTEM"

export function Notifications() {
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL")
  const notifications = useNotificationStore((state) => state.notifications)
  const loadNotifications = useNotificationStore((state) => state.loadNotifications)
  const isLoading = useNotificationStore((state) => state.isLoading)
  const error = useNotificationStore((state) => state.error)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)
  const unreadCount = useNotificationStore((state) => state.unreadCount())

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "ALL") return true
    if (activeTab === "SOCIAL") return n.type.startsWith("social_")
    if (activeTab === "SYSTEM") return !n.type.startsWith("social_")
    return true
  })

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "system_alert": return <ShieldAlert className="w-5 h-5 text-accent-pink" />
      case "ai_update": return <Activity className="w-5 h-5 text-accent-blue" />
      case "network_alert": return <Zap className="w-5 h-5 text-yellow-400" />
      case "social_follow": return <User className="w-5 h-5 text-purple-400" />
      case "social_like": return <Heart className="w-5 h-5 text-pink-400" />
      case "social_comment": return <MessageSquare className="w-5 h-5 text-blue-400" />
    }
  }

  const getNotificationStyles = (type: NotificationType, isRead: boolean) => {
    if (type === "system_alert") {
      return cn(
        "border-accent-pink/50 bg-accent-pink/5",
        !isRead ? "shadow-[var(--shadow-neon-pink)]" : "opacity-70"
      )
    }
    if (type === "ai_update" || type === "network_alert") {
      return cn(
        "border-accent-blue/30 bg-accent-blue/5",
        !isRead ? "shadow-[var(--shadow-neon-blue)]" : "opacity-70"
      )
    }
    return cn(
      "border-border bg-panel",
      !isRead ? "border-purple-500/30 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)]" : "opacity-70"
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="border-b border-border pb-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-wider text-foreground flex items-center gap-3">
          CẢNH BÁO HỆ THỐNG
          {unreadCount > 0 && (
            <span className="bg-accent-pink text-white text-xs px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
              {unreadCount} MỚI
            </span>
          )}
        </h1>
        <button
          onClick={markAllAsRead}
          className="flex items-center gap-2 text-sm text-muted hover:text-accent-blue transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {[
          { id: "ALL", label: "Tất Cả" },
          { id: "SOCIAL", label: "Xã Hội" },
          { id: "SYSTEM", label: "Hệ Thống" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as FilterTab)}
            className={cn(
              "px-6 py-3 border-b-2 transition-all font-bold tracking-wider text-sm",
              activeTab === tab.id
                ? "border-accent-blue text-accent-blue"
                : "border-transparent text-muted hover:text-foreground hover:bg-panel-hover/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-6 text-muted font-mono">
            Dang dong bo thong bao...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-sm text-foreground">
            {error}
          </div>
        )}

        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "p-4 rounded-xl border relative overflow-hidden transition-all hover:bg-panel-hover",
              getNotificationStyles(notification.type, notification.isRead)
            )}
          >
            {!notification.isRead && (
              <div className={cn(
                "absolute left-0 top-0 w-1 h-full",
                notification.type === "system_alert" ? "bg-accent-pink" :
                  (notification.type.startsWith("social_") ? "bg-purple-500" : "bg-accent-blue")
              )} />
            )}

            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-background rounded-lg border border-border shrink-0">
                {getNotificationIcon(notification.type)}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={cn(
                    "font-bold tracking-wider text-sm",
                    notification.type === "system_alert" ? "text-accent-pink" : "text-foreground"
                  )}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-muted font-mono whitespace-nowrap ml-4">
                    {notification.timestamp}
                  </span>
                </div>

                <p className="text-muted text-sm leading-relaxed mb-2">
                  {notification.message}
                </p>

                {notification.source && (
                  <div className="text-xs font-mono text-muted flex items-center gap-1">
                    <span className="opacity-50">Nguồn:</span>
                    <span className="text-accent-blue/70">{notification.source}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12 text-muted font-mono">
            Không phát hiện tín hiệu nào trong khu vực này.
          </div>
        )}
      </div>
    </div>
  )
}
