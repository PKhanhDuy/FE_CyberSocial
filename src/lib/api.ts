import type { User } from "@/mocks/types"
import type { NotificationType } from "@/store/useNotificationStore"

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "")
const ACCESS_TOKEN_KEY = "cybersocial_access_token"
const USER_KEY = "cybersocial_user"

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface BackendUser {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  coverUrl?: string
  role: "USER" | "ADMIN"
  themePreference: "LIGHT" | "DARK" | "SYSTEM"
  createdAt: string
  updatedAt: string
}

interface AuthResponse {
  tokenType: string
  accessToken: string
  expiresInSeconds: number
  user: BackendUser
}

export interface BackendPost {
  id: string
  authorId: string
  authorDisplayName: string
  authorAvatarUrl?: string
  content: string
  visibility: "PUBLIC" | "PRIVATE"
  mediaUrls: string[]
  createdAt: string
  updatedAt: string
}

export interface UploadedImage {
  publicId: string
  originalFileName: string
  contentType: string
  size: number
  url: string
}

export type FriendshipStatus = "PENDING" | "ACCEPTED"

export interface FriendUser {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  coverUrl?: string
  relationshipStatus?: FriendshipStatus
  friendshipId?: string
}

export interface Friendship {
  id: string
  status: FriendshipStatus
  requesterId: string
  addresseeId: string
  user: FriendUser
  createdAt: string
  updatedAt: string
}

interface BackendNotification {
  id: string
  type: "SYSTEM" | "POST" | "SECURITY"
  title: string
  message: string
  read: boolean
  readAt?: string
  createdAt: string
}

export interface AppPost {
  id: string
  author: User
  content: string
  media?: string
  timestamp: string
  likes: number
  comments: number
  shares: number
  aiState: "monitoring" | "suspicious" | "verified"
}

export const getAccessToken = () => {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

const setAccessToken = (token: string) => {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const clearAuthStorage = () => {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

export const storeAuthUser = (user: User) => {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

const parseErrorMessage = async (response: Response) => {
  try {
    const body = await response.json()
    return body.message ?? body.error ?? "Request failed"
  } catch {
    return "Request failed"
  }
}

async function refreshAccessToken() {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  })

  if (!response.ok) return false

  const body = (await response.json()) as ApiResponse<AuthResponse>
  setAccessToken(body.data.accessToken)
  storeAuthUser(mapUser(body.data.user))
  return true
}

async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken()
  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")

  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  })

  if (response.status === 401 && retry && path !== "/api/auth/refresh") {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return apiRequest<T>(path, init, false)
    }
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  const body = (await response.json()) as ApiResponse<T>
  if (!body.success) {
    throw new Error(body.message)
  }
  return body.data
}

const makeHandle = (value: string) => `@${value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`

export const mapUser = (user: BackendUser): User => ({
  id: user.id,
  username: user.displayName,
  handle: makeHandle(user.displayName || user.email.split("@")[0]),
  avatar: user.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email)}`,
  cover: user.coverUrl,
  isVerified: user.role === "ADMIN",
  trustScore: user.role === "ADMIN" ? 98 : 80,
  bio: "Thanh vien CyberSocial.",
})

const relativeTime = (value: string) => {
  const then = new Date(value).getTime()
  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSeconds < 60) return "vua xong"
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} phut truoc`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} gio truoc`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} ngay truoc`
}

export const mapPost = (post: BackendPost): AppPost => ({
  id: post.id,
  author: {
    id: post.authorId,
    username: post.authorDisplayName,
    handle: makeHandle(post.authorDisplayName),
    avatar: post.authorAvatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(post.authorId)}`,
    isVerified: false,
    trustScore: 80,
  },
  content: post.content,
  media: post.mediaUrls?.[0],
  timestamp: relativeTime(post.createdAt),
  likes: 0,
  comments: 0,
  shares: 0,
  aiState: "monitoring",
})

const mapNotificationType = (type: BackendNotification["type"]): NotificationType => {
  if (type === "SECURITY") return "system_alert"
  if (type === "POST") return "social_comment"
  return "network_alert"
}

export const authApi = {
  async login(email: string, password: string) {
    const auth = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    setAccessToken(auth.accessToken)
    const user = mapUser(auth.user)
    storeAuthUser(user)
    return user
  },

  async register(displayName: string, email: string, password: string) {
    const auth = await apiRequest<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ displayName, email, password }),
    })
    setAccessToken(auth.accessToken)
    const user = mapUser(auth.user)
    storeAuthUser(user)
    return user
  },

  async logout() {
    try {
      await apiRequest<void>("/api/auth/logout", { method: "POST" }, false)
    } finally {
      clearAuthStorage()
    }
  },

  async forgotPassword(email: string) {
    await apiRequest<void>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }, false)
  },
}

export const userApi = {
  async me() {
    const user = mapUser(await apiRequest<BackendUser>("/api/users/me"))
    storeAuthUser(user)
    return user
  },

  async updateMe(displayName: string) {
    const user = mapUser(await apiRequest<BackendUser>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify({ displayName }),
    }))
    storeAuthUser(user)
    return user
  },

  async updateAvatar(avatarUrl: string) {
    const user = mapUser(await apiRequest<BackendUser>("/api/users/me/avatar", {
      method: "PUT",
      body: JSON.stringify({ avatarUrl }),
    }))
    storeAuthUser(user)
    return user
  },

  async updateCover(coverUrl: string) {
    const user = mapUser(await apiRequest<BackendUser>("/api/users/me/cover", {
      method: "PUT",
      body: JSON.stringify({ coverUrl }),
    }))
    storeAuthUser(user)
    return user
  },
}

export const postApi = {
  async list(page = 0, size = 20) {
    const response = await apiRequest<PagedResponse<BackendPost>>(`/api/posts?page=${page}&size=${size}`)
    return {
      ...response,
      content: response.content.map(mapPost),
    }
  },

  async search(query: string, page = 0, size = 100) {
    const params = new URLSearchParams({
      query,
      page: String(page),
      size: String(size),
    })
    const response = await apiRequest<PagedResponse<BackendPost>>(`/api/posts?${params.toString()}`)
    return {
      ...response,
      content: response.content.map(mapPost),
    }
  },

  async create(content: string, visibility: "PUBLIC" | "PRIVATE" = "PUBLIC", mediaUrls: string[] = []) {
    return mapPost(await apiRequest<BackendPost>("/api/posts", {
      method: "POST",
      body: JSON.stringify({ content, visibility, mediaUrls }),
    }))
  },
}

export const uploadApi = {
  async image(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiRequest<UploadedImage>("/api/uploads/images", {
      method: "POST",
      body: formData,
    })
  },
}

export const friendApi = {
  async list() {
    return apiRequest<Friendship[]>("/api/friends")
  },

  async incomingRequests() {
    return apiRequest<Friendship[]>("/api/friends/requests/incoming")
  },

  async outgoingRequests() {
    return apiRequest<Friendship[]>("/api/friends/requests/outgoing")
  },

  async search(query: string, page = 0, size = 20) {
    const params = new URLSearchParams({
      query,
      page: String(page),
      size: String(size),
    })
    return apiRequest<PagedResponse<FriendUser>>(`/api/friends/search?${params.toString()}`)
  },

  async sendRequest(userId: string) {
    return apiRequest<Friendship>(`/api/friends/requests/${userId}`, {
      method: "POST",
    })
  },

  async acceptRequest(requestId: string) {
    return apiRequest<Friendship>(`/api/friends/requests/${requestId}/accept`, {
      method: "POST",
    })
  },

  async deleteRequest(requestId: string) {
    return apiRequest<void>(`/api/friends/requests/${requestId}`, {
      method: "DELETE",
    })
  },

  async removeFriend(friendshipId: string) {
    return apiRequest<void>(`/api/friends/${friendshipId}`, {
      method: "DELETE",
    })
  },
}

export const notificationApi = {
  async list(page = 0, size = 20) {
    const response = await apiRequest<PagedResponse<BackendNotification>>(`/api/notifications?page=${page}&size=${size}`)
    return response.content.map((notification) => ({
      id: notification.id,
      type: mapNotificationType(notification.type),
      title: notification.title,
      message: notification.message,
      timestamp: relativeTime(notification.createdAt),
      isRead: notification.read,
      source: "CyberSocial Backend",
    }))
  },

  async markRead(id: string) {
    const notification = await apiRequest<BackendNotification>(`/api/notifications/${id}/read`, {
      method: "PATCH",
    })
    return {
      id: notification.id,
      type: mapNotificationType(notification.type),
      title: notification.title,
      message: notification.message,
      timestamp: relativeTime(notification.createdAt),
      isRead: notification.read,
      source: "CyberSocial Backend",
    }
  },
}

export const themeApi = {
  async get() {
    return apiRequest<{ theme: "LIGHT" | "DARK" | "SYSTEM" }>("/api/theme")
  },

  async update(theme: "LIGHT" | "DARK" | "SYSTEM") {
    return apiRequest<{ theme: "LIGHT" | "DARK" | "SYSTEM" }>("/api/theme", {
      method: "PUT",
      body: JSON.stringify({ theme }),
    })
  },
}
