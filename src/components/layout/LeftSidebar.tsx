import { useState } from "react"
import { NavLink } from "react-router-dom"
import { Shield } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { CreatePostModal } from "@/components/feed/CreatePostModal"
import { useNotificationStore } from "@/store/useNotificationStore"
import { useFriendStore } from "@/store/useFriendStore"
import { useAuthStore } from "@/store/useAuthStore"
import { primaryNavItems } from "./layoutNav"

export function LeftSidebar() {
  const { t } = useTranslation()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const unreadCount = useNotificationStore((state) => state.unreadCount())
  const incomingFriendRequestCount = useFriendStore((state) => state.incomingRequestCount)
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN")

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-border glass-panel lg:flex">
      <div className="flex flex-1 flex-col overflow-y-auto p-5 xl:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-pink bg-accent-pink/20 neon-border-pink">
            <span className="text-xl font-bold text-accent-pink">C</span>
          </div>
          <h1 className="text-xl font-bold tracking-wider">
            <span className="neon-text-pink">CYBER</span>
            <span className="text-foreground">SOCIAL</span>
          </h1>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-300",
                  isActive
                    ? "bg-accent-blue/10 text-accent-blue neon-border-blue"
                    : "text-muted hover:bg-panel-hover hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex items-center justify-center">
                    <item.icon className={cn("h-5 w-5", isActive ? "text-accent-blue" : "group-hover:text-foreground")} />
                    {item.showBadge === "notifications" && unreadCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-pink text-[10px] font-bold text-white shadow-[var(--shadow-neon-pink)]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    {item.showBadge === "friends" && incomingFriendRequestCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-pink text-[10px] font-bold text-white shadow-[var(--shadow-neon-pink)]">
                        {incomingFriendRequestCount > 9 ? "9+" : incomingFriendRequestCount}
                      </span>
                    )}
                  </div>
                  <span className="flex-1 font-medium tracking-wide">{t(item.labelKey)}</span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-accent-blue shadow-[var(--shadow-neon-blue)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-300",
                  isActive
                    ? "bg-accent-pink/10 text-accent-pink neon-border-pink"
                    : "text-muted hover:bg-panel-hover hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Shield className={cn("h-5 w-5", isActive ? "text-accent-pink" : "group-hover:text-foreground")} />
                  <span className="flex-1 font-medium tracking-wide">{t("nav.admin")}</span>
                </>
              )}
            </NavLink>
          )}
        </nav>

        <div className="mt-4 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full cursor-pointer rounded-lg border border-accent-pink/50 bg-accent-pink/20 py-3 font-bold tracking-wider text-accent-pink transition-all duration-300 hover:bg-accent-pink/30 neon-border-pink"
          >
            {t("nav.createPost")}
          </button>
        </div>
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </aside>
  )
}
