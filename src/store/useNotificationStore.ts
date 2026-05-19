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

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n_1",
    type: "system_alert",
    title: "PHÁT HIỆN MỐI ĐE DỌA NGHIÊM TRỌNG",
    message: "Phát hiện tổng hợp Deepfake trong bảng tin Khu vực 4. Vận tốc lan truyền vượt quá giới hạn an toàn.",
    timestamp: "2 phút trước",
    isRead: false,
    source: "AI Lõi Trung Tâm"
  },
  {
    id: "n_2",
    type: "social_follow",
    title: "KẾT NỐI NODE MỚI",
    message: "@cipher_00 đã khởi tạo bắt tay bảo mật với node của bạn.",
    timestamp: "15 phút trước",
    isRead: false,
    source: "Cipher_Null"
  },
  {
    id: "n_3",
    type: "ai_update",
    title: "HOÀN TẤT CHẨN ĐOÁN",
    message: "Quét node định kỳ hoàn tất. Tính toàn vẹn hệ thống ở mức 99.9%. Không phát hiện bất thường.",
    timestamp: "1 giờ trước",
    isRead: true,
    source: "AI Nội Bộ"
  },
  {
    id: "n_4",
    type: "social_like",
    title: "ĐÃ XÁC NHẬN GÓI DỮ LIỆU",
    message: "@glitch_walker đã đẩy mạnh đường truyền quỹ đạo gần đây của bạn.",
    timestamp: "2 giờ trước",
    isRead: true,
    source: "Glitch_Walker"
  },
  {
    id: "n_5",
    type: "network_alert",
    title: "TẮC NGHẼN MẠNG LƯỚI",
    message: "Lưu lượng dữ liệu cao ở Khu vực 7. Dự kiến có độ trễ trong cập nhật bảng tin.",
    timestamp: "5 giờ trước",
    isRead: true,
    source: "Chương Trình Con Mạng"
  },
  {
    id: "n_6",
    type: "social_comment",
    title: "GIẢI MÃ ĐƯỜNG TRUYỀN",
    message: "@nexus_prime đã để lại bình luận: 'Sự liên kết quỹ đạo hôm nay thật hoàn hảo.'",
    timestamp: "1 ngày trước",
    isRead: true,
    source: "Nexus Prime"
  }
]

interface NotificationStore {
  notifications: AppNotification[]
  isLoading: boolean
  error: string | null
  loadNotifications: () => Promise<void>
  markAllAsRead: () => Promise<void>
  unreadCount: () => number
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: MOCK_NOTIFICATIONS,
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
      notifications: state.notifications.map(n => ({ ...n, isRead: true }))
    }))

    await Promise.allSettled(unread.map((notification) => notificationApi.markRead(notification.id)))
  },
  unreadCount: () => get().notifications.filter(n => !n.isRead).length
}))
