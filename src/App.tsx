import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import { MainLayout } from "./components/layout/MainLayout"
import { Home } from "./pages/Home"
import { Explore } from "./pages/Explore"
import { Profile } from "./pages/Profile"
import { Notifications } from "./pages/Notifications"
import { VerifiedNews } from "./pages/VerifiedNews"
import { Friends } from "./pages/Friends"
import { useThemeStore } from "./store/useThemeStore"
import { useAuthStore } from "./store/useAuthStore"
import { useFriendStore } from "./store/useFriendStore"
import { useNotificationStore } from "./store/useNotificationStore"
import { AuthGuard, GuestGuard } from "./components/auth/AuthGuard"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { ForgotPassword } from "./pages/ForgotPassword"
import { ChangePassword } from "./pages/ChangePassword"

function App() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode)
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const refreshCurrentUser = useAuthStore((state) => state.refreshCurrentUser)
  const loadIncomingFriendRequestCount = useFriendStore((state) => state.loadIncomingRequestCount)
  const loadNotifications = useNotificationStore((state) => state.loadNotifications)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    if (isAuthenticated) {
      refreshCurrentUser()
      loadIncomingFriendRequestCount()
      loadNotifications()
      hydrateTheme()
    }
  }, [hydrateTheme, isAuthenticated, loadIncomingFriendRequestCount, loadNotifications, refreshCurrentUser])

  return (
    <Router>
      <Routes>
        {/* Guest only routes */}
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<Explore />} />
            <Route path="verified" element={<VerifiedNews />} />
            <Route path="friends" element={<Friends />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
