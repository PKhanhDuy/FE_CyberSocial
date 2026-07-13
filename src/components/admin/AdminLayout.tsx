import { NavLink, Outlet, useLocation } from "react-router-dom"
import { LayoutDashboard, Users, FileText, Activity, ShieldAlert, ArrowLeft, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/useAuthStore"

const navItems = [
  { to: "/admin", end: true, icon: LayoutDashboard, label: "Bảng điều khiển", crumb: "Bảng điều khiển" },
  { to: "/admin/users", icon: Users, label: "Quản lý người dùng", crumb: "Quản lý người dùng" },
  { to: "/admin/posts", icon: FileText, label: "Quản lý bài viết", crumb: "Quản lý bài viết" },
  { to: "/admin/ai", icon: Activity, label: "Giám sát AI", crumb: "Giám sát AI" },
  { to: "/admin/fake", icon: ShieldAlert, label: "Giám sát tin giả", crumb: "Giám sát tin giả" },
]

export function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const active = [...navItems].reverse().find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed left-0 top-0 z-20 flex h-screen w-60 flex-col border-r border-border glass-panel">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue/20 text-accent-blue neon-border-blue">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide text-foreground">CyberSocial</div>
            <div className="text-[10px] uppercase tracking-widest text-muted">Admin Console</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  isActive
                    ? "bg-accent-blue/10 text-accent-blue neon-border-blue font-semibold"
                    : "text-muted hover:bg-panel-hover hover:text-foreground"
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] flex-none" />
              <span className="flex-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-all hover:bg-panel-hover hover:text-foreground"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
            Về ứng dụng
          </NavLink>
          <div className="mt-2 flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-blue/20 text-xs font-bold text-accent-blue">
              {(user?.username ?? "QT").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{user?.username ?? "Quản trị viên"}</div>
              <div className="font-mono text-[10px] text-accent-blue">ROLE_ADMIN</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="ml-60 flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
          <span className="text-sm text-muted">Console</span>
          <span className="text-muted">/</span>
          <span className="text-sm font-semibold text-foreground">{active?.crumb ?? "Bảng điều khiển"}</span>
        </header>
        <main className="flex-1 px-6 py-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
