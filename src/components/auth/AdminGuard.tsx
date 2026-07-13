import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"

/**
 * Chỉ cho phép tài khoản ROLE_ADMIN truy cập các trang quản trị.
 * Người dùng thường bị điều hướng về trang chủ; khách chưa đăng nhập về trang đăng nhập.
 */
export function AdminGuard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
