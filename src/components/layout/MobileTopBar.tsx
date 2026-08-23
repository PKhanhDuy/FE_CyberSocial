import { Link, NavLink } from "react-router-dom"
import { Bell, Shield, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/useAuthStore"
import { useNotificationStore } from "@/store/useNotificationStore"
import { useFriendStore } from "@/store/useFriendStore"

export function MobileTopBar() {
  const { t } = useTranslation()
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN")
  const unreadCount = useNotificationStore((state) => state.unreadCount())
  const incomingFriendRequestCount = useFriendStore((state) => state.incomingRequestCount)

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md lg:hidden">
      <Link to="/" className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent-pink bg-accent-pink/20 neon-border-pink">
          <span className="text-sm font-bold text-accent-pink">C</span>
        </div>
        <span className="truncate text-base font-bold tracking-wider">
          <span className="neon-text-pink">CYBER</span>
          <span className="text-foreground">SOCIAL</span>
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-1.5">
        <NavLink
          to="/friends"
          className={({ isActive }) =>
            cn(
              "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-accent-blue/10 text-accent-blue"
                : "text-muted hover:bg-panel-hover hover:text-foreground",
            )
          }
          aria-label={t("nav.friends")}
        >
          <Users className="h-5 w-5" />
          {incomingFriendRequestCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-pink px-1 text-[9px] font-bold text-white">
              {incomingFriendRequestCount > 9 ? "9+" : incomingFriendRequestCount}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            cn(
              "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-accent-blue/10 text-accent-blue"
                : "text-muted hover:bg-panel-hover hover:text-foreground",
            )
          }
          aria-label={t("nav.notifications")}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-pink px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </NavLink>

        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent-pink/40 bg-accent-pink/10 px-2.5 py-1.5 text-xs font-semibold text-accent-pink"
          >
            <Shield className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:inline">{t("nav.admin")}</span>
          </Link>
        )}
      </div>
    </header>
  )
}
