import { create } from "zustand"
import {
  ApiError,
  authApi,
  clearAuthStorage,
  hasSessionHint,
  restoreSession,
  setSessionExpiredHandler,
  userApi,
} from "@/lib/api"
import type { User } from "@/mocks/types"

export type { User } from "@/mocks/types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  isLoading: boolean
  error: string | null
  accountLockedReason: string | null
  bootstrap: () => Promise<void>
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  register: (username: string, email: string, password: string) => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshCurrentUser: () => Promise<void>
  updateDisplayName: (displayName: string) => Promise<boolean>
  updateAvatar: (avatarUrl: string) => Promise<boolean>
  updateCover: (coverUrl: string) => Promise<boolean>
  clearError: () => void
  clearAccountLocked: () => void
}

/** Chặn StrictMode gọi bootstrap hai lần trong môi trường phát triển. */
let bootstrapPromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>((set) => {
  return {
    user: null,
    isAuthenticated: false,
    // Chỉ chờ silent refresh khi thiết bị này từng đăng nhập; khách vào được trang login ngay.
    isBootstrapping: hasSessionHint(),
    isLoading: false,
    error: null,
    accountLockedReason: null,

    bootstrap: async () => {
      if (bootstrapPromise) return bootstrapPromise

      bootstrapPromise = (async () => {
        try {
          const user = await restoreSession()
          set({ user, isAuthenticated: Boolean(user) })
        } finally {
          set({ isBootstrapping: false })
        }
      })()

      return bootstrapPromise
    },

    login: async (email, password, rememberMe = false) => {
      set({ isLoading: true, error: null, accountLockedReason: null })
      try {
        const user = await authApi.login(email, password, rememberMe)
        set({ user, isAuthenticated: true, isLoading: false })
        return true
      } catch (error) {
        if (error instanceof ApiError && error.code === "ACCOUNT_LOCKED") {
          set({
            accountLockedReason: error.reason || "Không có lý do được cung cấp.",
            error: null,
            isLoading: false,
          })
          return false
        }
        set({
          error: error instanceof Error ? error.message : "Đăng nhập thất bại",
          isLoading: false,
        })
        return false
      }
    },

    register: async (username, email, password) => {
      set({ isLoading: true, error: null })
      try {
        const user = await authApi.register(username, email, password)
        set({ user, isAuthenticated: true, isLoading: false })
        return true
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Đăng ký thất bại", isLoading: false })
        return false
      }
    },

    forgotPassword: async (email) => {
      set({ isLoading: true, error: null })
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      if (!isValidEmail) {
        set({ error: "Email không hợp lệ", isLoading: false })
        return false
      }

      try {
        await authApi.forgotPassword(email.trim())
        set({ isLoading: false })
        return true
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Gửi yêu cầu thất bại", isLoading: false })
        return false
      }
    },

    changePassword: async (currentPassword, newPassword) => {
      set({ isLoading: true, error: null })
      try {
        await authApi.changePassword(currentPassword, newPassword)
        set({ isLoading: false })
        return true
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Đổi mật khẩu thất bại", isLoading: false })
        return false
      }
    },

    logout: async () => {
      await authApi.logout()
      set({ user: null, isAuthenticated: false, error: null, accountLockedReason: null })
    },

    refreshCurrentUser: async () => {
      try {
        const user = await userApi.me()
        set({ user, isAuthenticated: true })
      } catch {
        clearAuthStorage()
        set({ user: null, isAuthenticated: false })
      }
    },

    updateDisplayName: async (displayName) => {
      set({ isLoading: true, error: null })
      try {
        const user = await userApi.updateMe(displayName)
        set({ user, isLoading: false })
        return true
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Cập nhật hồ sơ thất bại", isLoading: false })
        return false
      }
    },

    updateAvatar: async (avatarUrl) => {
      set({ isLoading: true, error: null })
      try {
        const user = await userApi.updateAvatar(avatarUrl)
        set({ user, isLoading: false })
        return true
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Cập nhật ảnh đại diện thất bại", isLoading: false })
        return false
      }
    },

    updateCover: async (coverUrl) => {
      set({ isLoading: true, error: null })
      try {
        const user = await userApi.updateCover(coverUrl)
        set({ user, isLoading: false })
        return true
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Cập nhật ảnh bìa thất bại", isLoading: false })
        return false
      }
    },

    clearError: () => set({ error: null }),
    clearAccountLocked: () => set({ accountLockedReason: null }),
  }
})

/** Khi refresh token hết hạn hoặc bị thu hồi, đưa UI về trạng thái khách ngay lập tức. */
setSessionExpiredHandler(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, isBootstrapping: false })
})
