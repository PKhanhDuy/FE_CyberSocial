import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import { MainLayout } from "./components/layout/MainLayout"
import { Home } from "./pages/Home"
import { Explore } from "./pages/Explore"
import { Profile } from "./pages/Profile"
import { PublicProfile } from "./pages/PublicProfile"
import { Notifications } from "./pages/Notifications"
import { VerifiedNews } from "./pages/VerifiedNews"
import { Friends } from "./pages/Friends"
import { Messages } from "./pages/Messages"
import { useThemeStore } from "./store/useThemeStore"
import { useAuthStore } from "./store/useAuthStore"
import { useFriendStore } from "./store/useFriendStore"
import { useNotificationStore } from "./store/useNotificationStore"
import { usePresenceStore } from "./store/usePresenceStore"
import { AuthGuard, GuestGuard } from "./components/auth/AuthGuard"
import { SessionBootstrapScreen } from "./components/auth/SessionBootstrapScreen"
import { AdminGuard } from "./components/auth/AdminGuard"
import { AdminLayout } from "./components/admin/AdminLayout"
import { AdminDashboard } from "./pages/admin/AdminDashboard"
import { AdminUsers } from "./pages/admin/AdminUsers"
import { AdminPosts } from "./pages/admin/AdminPosts"
import { AdminAiMonitoring } from "./pages/admin/AdminAiMonitoring"
import { AdminFakeReview } from "./pages/admin/AdminFakeReview"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { ForgotPassword } from "./pages/ForgotPassword"
import { ResetPassword } from "./pages/ResetPassword"
import { ChangePassword } from "./pages/ChangePassword"

function App() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode)
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)
  const bootstrap = useAuthStore((state) => state.bootstrap)
  const loadIncomingFriendRequestCount = useFriendStore((state) => state.loadIncomingRequestCount)
  const loadNotifications = useNotificationStore((state) => state.loadNotifications)
  const startPresence = usePresenceStore((state) => state.start)
  const stopPresence = usePresenceStore((state) => state.stop)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (isAuthenticated) {
      loadIncomingFriendRequestCount()
      loadNotifications()
      hydrateTheme()
      startPresence()
      return () => stopPresence()
    }
    stopPresence()
  }, [hydrateTheme, isAuthenticated, loadIncomingFriendRequestCount, loadNotifications, startPresence, stopPresence])

  if (isBootstrapping) {
    return <SessionBootstrapScreen />
  }

  return (
    <Router>
      <Routes>
        {/* Guest only routes */}
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin-only routes (UC20–UC24) */}
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="ai" element={<AdminAiMonitoring />} />
            <Route path="fake" element={<AdminFakeReview />} />
          </Route>
        </Route>

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<Explore />} />
            <Route path="verified" element={<VerifiedNews />} />
            <Route path="friends" element={<Friends />} />
            <Route path="messages" element={<Messages />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="users/:userId" element={<PublicProfile />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
