import { Outlet } from "react-router-dom"
import { LeftSidebar } from "./LeftSidebar"
import { RightSidebar } from "./RightSidebar"
import { MobileBottomNav } from "./MobileBottomNav"
import { MobileTopBar } from "./MobileTopBar"

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MobileTopBar />

      <div className="mx-auto grid min-h-screen w-full max-w-[1280px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <LeftSidebar />

        <main className="relative z-0 min-w-0 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] pt-14 lg:border-x lg:border-border lg:pb-0 lg:pt-0">
          <div className="mx-auto w-full max-w-2xl px-4 py-3 sm:px-6">
            <Outlet />
          </div>
        </main>

        <RightSidebar />
      </div>

      <MobileBottomNav />
    </div>
  )
}
