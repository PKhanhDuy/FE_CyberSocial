import { useAuthStore } from "@/store/useAuthStore"
import { AdminRightSidebar } from "./AdminRightSidebar"
import { UserRightSidebar } from "./UserRightSidebar"

export function RightSidebar() {
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN")

  if (isAdmin) {
    return <AdminRightSidebar />
  }

  return <UserRightSidebar />
}
