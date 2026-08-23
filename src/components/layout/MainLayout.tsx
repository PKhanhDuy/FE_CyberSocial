import { Outlet, useLocation } from "react-router-dom"
import { LeftSidebar } from "./LeftSidebar"
import { RightSidebar } from "./RightSidebar"
import { MobileBottomNav } from "./MobileBottomNav"
import { MobileTopBar } from "./MobileTopBar"
import { cn } from "@/lib/utils"

export function MainLayout() {
  const location = useLocation()
  const hideRightSidebar = location.pathname.startsWith("/messages")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MobileTopBar />

      <div
        className={cn(
          "mx-auto grid min-h-screen w-full grid-cols-1",
          hideRightSidebar
            ? "max-w-6xl lg:grid-cols-[260px_minmax(0,1fr)]"
            : "max-w-[1280px] lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_320px]",
        )}
      >
        <LeftSidebar />

        <main
          className={cn(
            "relative z-0 min-w-0 lg:border-x lg:border-border",
            "pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] pt-14 lg:pt-0 lg:pb-0",
          )}
        >
          <div className="mx-auto w-full max-w-2xl px-4 py-3 sm:px-6">
            <Outlet />
          </div>
        </main>

        {!hideRightSidebar && <RightSidebar />}
      </div>

      <MobileBottomNav />
    </div>
  )
}
