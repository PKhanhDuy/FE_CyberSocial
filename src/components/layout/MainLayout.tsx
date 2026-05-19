import { Outlet } from "react-router-dom"
import { LeftSidebar } from "./LeftSidebar"
import { RightSidebar } from "./RightSidebar"

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      <LeftSidebar />
      <main className="ml-64 mr-80 min-h-screen relative z-0">
        <div className="max-w-3xl mx-auto py-3 px-6">
          <Outlet />
        </div>
      </main>
      <RightSidebar />
    </div>
  )
}
