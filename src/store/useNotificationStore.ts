import { create } from "zustand"
import { notificationApi } from "@/lib/api"

export type NotificationType = "system_alert" | "ai_update" | "social_like" | "social_comment" | "social_follow" | "network_alert"

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  isRead: boolean
  source?: string
}

interface NotificationStore {
  notifications: AppNotification[]
  isLoading: boolean
  error: string | null
  loadNotifications: () => Promise<void>
  markAllAsRead: () => Promise<void>
  unreadCount: () => number
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  loadNotifications: async () => {
    set({ isLoading: true, error: null })
    try {
      const notifications = await notificationApi.list()
      set({ notifications, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Khong tai duoc thong bao",
        isLoading: false,
      })
    }
  },
  markAllAsRead: async () => {
    const unread = get().notifications.filter((notification) => !notification.isRead)
    set((state) => ({
      notifications: state.notifications.map((notification) => ({ ...notification, isRead: true }))
    }))

    await Promise.allSettled(unread.map((notification) => notificationApi.markRead(notification.id)))
  },
  unreadCount: () => get().notifications.filter((notification) => !notification.isRead).length
}))
