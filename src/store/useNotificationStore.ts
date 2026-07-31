import { create } from "zustand"
import { notificationApi } from "@/lib/api"
export type NotificationType = "system_alert" | "ai_update" | "social_like" | "social_comment" | "social_follow" | "network_alert"

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  createdAt?: string
  isRead: boolean
  source?: string
}

interface NotificationStore {
  notifications: AppNotification[]
  isLoading: boolean
  error: string | null
  loadNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
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
  markAsRead: async (id: string) => {
    const current = get().notifications.find((notification) => notification.id === id)
    if (!current) return

    if (!current.isRead) {
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification,
        ),
      }))

      try {
        const updated = await notificationApi.markRead(id)
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, ...updated } : notification,
          ),
        }))
      } catch (error) {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, isRead: false } : notification,
          ),
          error: error instanceof Error ? error.message : "Khong danh dau da doc thong bao",
        }))
      }
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
