import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import { MainLayout } from "./components/layout/MainLayout"
import { Home } from "./pages/Home"
import { Explore } from "./pages/Explore"
import { Profile } from "./pages/Profile"
import { Notifications } from "./pages/Notifications"
import { VerifiedNews } from "./pages/VerifiedNews"
import { useThemeStore } from "./store/useThemeStore"

function App() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="verified" element={<VerifiedNews />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
