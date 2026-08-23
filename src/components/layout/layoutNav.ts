import {
  Bell,
  CheckCircle,
  Compass,
  Home,
  MessageCircle,
  User,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface LayoutNavItem {
  icon: LucideIcon
  labelKey: string
  path: string
  showBadge?: "notifications" | "friends"
}

export const primaryNavItems: LayoutNavItem[] = [
  { icon: Home, labelKey: "nav.home", path: "/" },
  { icon: Compass, labelKey: "nav.explore", path: "/explore" },
  { icon: CheckCircle, labelKey: "nav.verifiedNews", path: "/verified" },
  { icon: Users, labelKey: "nav.friends", path: "/friends", showBadge: "friends" },
  { icon: MessageCircle, labelKey: "nav.messages", path: "/messages" },
  { icon: Bell, labelKey: "nav.notifications", path: "/notifications", showBadge: "notifications" },
  { icon: User, labelKey: "nav.profile", path: "/profile" },
]

/** Bottom nav: 4 items + nút đăng bài ở giữa = 5 ô, tránh xuống dòng */
export const mobileNavItems: LayoutNavItem[] = [
  { icon: Home, labelKey: "nav.home", path: "/" },
  { icon: Compass, labelKey: "nav.explore", path: "/explore" },
  { icon: MessageCircle, labelKey: "nav.messages", path: "/messages" },
  { icon: User, labelKey: "nav.profile", path: "/profile" },
]
