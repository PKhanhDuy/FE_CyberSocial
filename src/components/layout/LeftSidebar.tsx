import { useState } from "react"
import { NavLink } from "react-router-dom"
import { Home, Compass, CheckCircle, User, Bell, Users, MessageCircle, Shield } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { CreatePostModal } from "@/components/feed/CreatePostModal"
import { useNotificationStore } from "@/store/useNotificationStore"
import { useFriendStore } from "@/store/useFriendStore"
import { useAuthStore } from "@/store/useAuthStore"

const navItems = [
  { icon: Home, labelKey: "nav.home", path: "/" },
  { icon: Compass, labelKey: "nav.explore", path: "/explore" },
  { icon: CheckCircle, labelKey: "nav.verifiedNews", path: "/verified" },
  { icon: Users, labelKey: "nav.friends", path: "/friends" },
  { icon: MessageCircle, labelKey: "nav.messages", path: "/messages" },
  { icon: Bell, labelKey: "nav.notifications", path: "/notifications" },
  { icon: User, labelKey: "nav.profile", path: "/profile" },
]

export function LeftSidebar() {
  const { t } = useTranslation()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const unreadCount = useNotificationStore((state) => state.unreadCount())
  const incomingFriendRequestCount = useFriendStore((state) => state.incomingRequestCount)
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN")

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-panel border-r-0 border-y-0 z-10 flex flex-col p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-accent-pink/20 border border-accent-pink flex items-center justify-center neon-border-pink">
          <span className="text-accent-pink font-bold text-xl">C</span>
        </div>
        <h1 className="text-xl font-bold tracking-wider neon-text-pink">CYBER<span className="text-foreground">SOCIAL</span></h1>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 relative group",
                isActive
                  ? "bg-accent-blue/10 text-accent-blue neon-border-blue"
                  : "text-muted hover:text-foreground hover:bg-panel-hover"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative flex items-center justify-center">
                  <item.icon className={cn("w-5 h-5", isActive ? "text-accent-blue" : "group-hover:text-foreground")} />
                  {item.path === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-pink text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-[var(--shadow-neon-pink)]">
                      {unreadCount}
                    </span>
                  )}
                  {item.path === "/friends" && incomingFriendRequestCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-pink text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-[var(--shadow-neon-pink)]">
                      {incomingFriendRequestCount}
                    </span>
                  )}
                </div>
                <span className="font-medium tracking-wide flex-1">{t(item.labelKey)}</span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-blue rounded-r-full shadow-[var(--shadow-neon-blue)]" />
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
                "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 relative group",
                isActive
                  ? "bg-accent-pink/10 text-accent-pink neon-border-pink"
                  : "text-muted hover:text-foreground hover:bg-panel-hover"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Shield className={cn("w-5 h-5", isActive ? "text-accent-pink" : "group-hover:text-foreground")} />
                <span className="font-medium tracking-wide flex-1">Quản trị</span>
                <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">ADMIN</span>
              </>
            )}
          </NavLink>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full py-3 rounded-lg bg-accent-pink/20 text-accent-pink border border-accent-pink/50 hover:bg-accent-pink/30 transition-all duration-300 font-bold tracking-wider neon-border-pink cursor-pointer"
        >
          {t("nav.createPost")}
        </button>
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </aside>
  )
}
