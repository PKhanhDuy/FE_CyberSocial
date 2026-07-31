import type { User } from "@/mocks/types"
import type { NotificationType } from "@/store/useNotificationStore"
import { getStoredLanguage } from "@/i18n"

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
  enabled?: boolean
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
  sharedPost?: BackendPost
  viaShareId?: string | null
  likeCount: number
  commentCount: number
  shareCount: number
  likedByCurrentUser: boolean
  createdAt: string
  updatedAt: string
}

export interface BackendPostComment {
  id: string
  postId: string
  userId: string
  authorDisplayName: string
  authorAvatarUrl?: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface BackendPostShare {
  id: string
  postId: string
  userId: string
  authorDisplayName: string
  authorAvatarUrl?: string
  content?: string
  createdAt: string
}

export type PostVerificationStatus = "PENDING" | "ANALYZING" | "COMPLETED" | "FAILED"

export type ImpactLevel = "high" | "medium" | "low"

export interface BackendEventAttribution {
  eventIndex: number
  eventType: string
  eventTypeLabel?: string
  relativeTime?: string
  actorLabel?: string
  tigeRemoval?: number | null
  confidenceDrop?: number | null
  conditionalTige?: number | null
  summary?: string
  impactLevel?: ImpactLevel | null
}

export interface BackendPropagationTimelineEvent {
  eventIndex: number
  eventId?: string
  parentEventId?: string | null
  depth?: number
  relativeTime: string
  eventType: string
  eventTypeLabel: string
  actorLabel: string
  tigeRemoval?: number | null
  conditionalTige?: number | null
  influential: boolean
}

export interface BackendPostVerification {
  postId: string
  status: PostVerificationStatus
  fakeProbability?: number
  label?: "REAL" | "FAKE"
  riskLevel?: "LOW" | "MEDIUM" | "HIGH"
  threshold?: number
  mode?: string
  analysisTier: number
  interactionCountAtAnalysis: number
  totalInteractions: number
  nextThreshold: number
  explanation?: string
  headline?: string
  narrative?: string
  contextHints?: string[]
  eventAttributions?: BackendEventAttribution[]
  propagationTimeline?: BackendPropagationTimelineEvent[]
  lastAnalyzedAt?: string
  updatedAt?: string
}

export interface PostVerification {
  postId: string
  status: PostVerificationStatus
  fakeProbability?: number
  label?: "REAL" | "FAKE"
  riskLevel?: "LOW" | "MEDIUM" | "HIGH"
  threshold?: number
  mode?: string
  analysisTier: number
  interactionCountAtAnalysis: number
  totalInteractions: number
  nextThreshold: number
  explanation?: string
  headline?: string
  narrative?: string
  contextHints?: string[]
  eventAttributions: BackendEventAttribution[]
  propagationTimeline: BackendPropagationTimelineEvent[]
  lastAnalyzedAt?: string
  updatedAt?: string
}

export type DemoPropagationPattern = "ORGANIC" | "VIRAL_BURST" | "COORDINATED" | "CHAIN"

export interface DemoPropagationRequest {
  postId: string
  demoUserCount: number
  shares: number
  likes: number
  comments: number
  durationSeconds: number
  pattern: DemoPropagationPattern
}

export interface DemoPropagationResponse {
  postId: string
  pattern: DemoPropagationPattern
  demoUsersAvailable: number
  usersCreated: number
  likesCreated: number
  commentsCreated: number
  sharesCreated: number
  totalLikes: number
  totalComments: number
  totalShares: number
  durationSeconds: number
  startedAt: string
  endedAt: string
}

export interface UploadedImage {
  publicId: string
  originalFileName: string
  contentType: string
  size: number
  url: string
}

export interface BackendMusicTrack {
  id: string
  title: string
  artist: string
  audioUrl: string
  coverUrl?: string
  durationSeconds: number
}

export interface BackendStoryMedia {
  id: string
  mediaType: "IMAGE" | "VIDEO"
  mediaUrl: string
  thumbnailUrl?: string
  width?: number
  height?: number
  durationMs?: number
}

export interface BackendStoryAuthor {
  id: string
  displayName: string
  avatarUrl?: string
}

export interface BackendStoryViewer {
  userId: string
  displayName: string
  avatarUrl?: string
  viewedAt: string
}

export interface BackendStoryReactionSummary {
  userId: string
  displayName: string
  avatarUrl?: string
  reactionType: string
  createdAt: string
}

export interface BackendStory {
  id: string
  author: BackendStoryAuthor
  caption?: string
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE"
  media: BackendStoryMedia
  music?: BackendMusicTrack
  musicStartMs?: number
  musicDurationMs?: number
  viewCount: number
  reactionCount: number
  viewedByCurrentUser: boolean
  currentUserReaction?: string
  viewers?: BackendStoryViewer[]
  reactions?: BackendStoryReactionSummary[]
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface StoryCreatePayload {
  caption?: string
  visibility?: "PUBLIC" | "FRIENDS" | "PRIVATE"
  media: {
    mediaType: "IMAGE" | "VIDEO"
    mediaUrl: string
    thumbnailUrl?: string
    width?: number
    height?: number
    durationMs?: number
  }
  musicTrackId?: string
  musicStartMs?: number
  musicDurationMs?: number
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

export interface FollowUser {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  followedAt: string
}

export interface FollowStatus {
  following: boolean
}

export interface FollowCount {
  count: number
}

export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "LINK"

export interface MessageParticipant {
  id: string
  displayName: string
  avatarUrl?: string
}

export interface MessageReaction {
  id: string
  messageId: string
  userId: string
  displayName: string
  avatarUrl?: string
  emoji: string
  createdAt: string
  updatedAt: string
}

export interface BackendMessage {
  id: string
  conversationId: string
  sender: MessageParticipant
  messageType: MessageType
  content?: string
  mediaUrl?: string
  linkUrl?: string
  reactions: MessageReaction[]
  createdAt: string
  updatedAt: string
}

export type MessageSocketEvent =
  | {
      type: "MESSAGE_CREATED"
      conversationId: string
      message: BackendMessage
      messageId: string
      reaction?: null
      userId?: null
      online?: null
    }
  | {
      type: "REACTION_UPDATED"
      conversationId: string
      message?: null
      messageId: string
      reaction: MessageReaction
      userId: string
      online?: null
    }
  | {
      type: "REACTION_DELETED"
      conversationId: string
      message?: null
      messageId: string
      reaction?: null
      userId: string
      online?: null
    }
  | {
      type: "PRESENCE_UPDATED"
      conversationId?: null
      message?: null
      messageId?: null
      reaction?: null
      userId: string
      online: boolean
    }

export interface MessageConversation {
  id: string
  friend: MessageParticipant
  latestMessage?: BackendMessage
  createdAt: string
  updatedAt: string
}

interface BackendNotification {
  id: string
  type: "SYSTEM" | "POST" | "STORY" | "SECURITY"
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
  isLiked?: boolean
  aiState: "monitoring" | "suspicious" | "verified"
  sharedPost?: AppPost
  viaShareId?: string
}

export const getAccessToken = () => {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

const getMessageSocketUrl = () => {
  const token = getAccessToken()
  if (!token || typeof window === "undefined") return null

  const url = new URL(API_BASE_URL, window.location.origin)
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
  url.pathname = "/ws/messages"
  url.search = ""
  url.searchParams.set("token", token)
  return url.toString()
}

export const createMessageSocket = (onEvent: (event: MessageSocketEvent) => void) => {
  const url = getMessageSocketUrl()
  if (!url) return null

  const socket = new WebSocket(url)
  socket.addEventListener("message", (message) => {
    try {
      onEvent(JSON.parse(message.data) as MessageSocketEvent)
    } catch {
      // Ignore malformed realtime payloads; REST remains the source of truth.
    }
  })
  return socket
}

export const presenceApi = {
  async listOnlineFriends() {
    return apiRequest<string[]>("/api/presence/friends")
  },
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

export class ApiError extends Error {
  code?: string
  reason?: string

  constructor(message: string, code?: string, reason?: string) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.reason = reason
  }
}

const parseApiError = async (response: Response) => {
  try {
    const body = await response.json() as {
      message?: string
      error?: string
      data?: { code?: string; reason?: string | null }
    }
    return new ApiError(
      body.message ?? body.error ?? "Request failed",
      body.data?.code,
      body.data?.reason ?? undefined,
    )
  } catch {
    return new ApiError("Request failed")
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
  headers.set("Accept-Language", getStoredLanguage())

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
    throw await parseApiError(response)
  }

  const body = (await response.json()) as ApiResponse<T>
  if (!body.success) {
    throw new ApiError(body.message, body.data && typeof body.data === "object" && "code" in (body.data as object)
      ? String((body.data as { code?: string }).code)
      : undefined)
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
  role: user.role,
  isVerified: user.role === "ADMIN",
  trustScore: user.role === "ADMIN" ? 98 : 80,
  bio: "Thành viên CyberSocial.",
  enabled: user.enabled ?? true,
})

const relativeTime = (value: string) => {
  const then = new Date(value).getTime()
  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSeconds < 60) return "Vừa xong"
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} ngày trước`
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
  likes: post.likeCount ?? 0,
  comments: post.commentCount ?? 0,
  shares: post.shareCount ?? 0,
  isLiked: post.likedByCurrentUser ?? false,
  aiState: "monitoring",
  sharedPost: post.sharedPost ? mapPost(post.sharedPost) : undefined,
  viaShareId: post.viaShareId ?? undefined,
})

export const mapVerifiedPost = (post: BackendPost): AppPost => ({
  ...mapPost(post),
  aiState: "verified",
})

export const mapPostComment = (comment: BackendPostComment) => ({
  id: comment.id,
  postId: comment.postId,
  author: {
    id: comment.userId,
    username: comment.authorDisplayName,
    avatar: comment.authorAvatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(comment.userId)}`,
  },
  content: comment.content,
  timestamp: relativeTime(comment.createdAt),
})

export const mapPostVerification = (verification: BackendPostVerification): PostVerification => ({
  postId: verification.postId,
  status: verification.status,
  fakeProbability: verification.fakeProbability,
  label: verification.label,
  riskLevel: verification.riskLevel,
  threshold: verification.threshold,
  mode: verification.mode,
  analysisTier: verification.analysisTier ?? 0,
  interactionCountAtAnalysis: verification.interactionCountAtAnalysis ?? 0,
  totalInteractions: verification.totalInteractions ?? 0,
  nextThreshold: verification.nextThreshold ?? 0,
  explanation: verification.explanation,
  headline: verification.headline,
  narrative: verification.narrative,
  contextHints: verification.contextHints ?? [],
  eventAttributions: verification.eventAttributions ?? [],
  propagationTimeline: verification.propagationTimeline ?? [],
  lastAnalyzedAt: verification.lastAnalyzedAt,
  updatedAt: verification.updatedAt,
})

const mapNotificationType = (type: BackendNotification["type"]): NotificationType => {
  if (type === "SECURITY" || type === "SYSTEM") return "system_alert"
  if (type === "STORY") return "social_like"
  if (type === "POST") return "social_comment"
  return "network_alert"
}

export const authApi = {
  async login(email: string, password: string, rememberMe = false) {
    const auth = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberMe }),
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

  async validateResetToken(token: string) {
    const encodedToken = encodeURIComponent(token)
    return apiRequest<{ valid: boolean }>(`/api/auth/reset-password/validate?token=${encodedToken}`, {
      method: "GET",
    }, false)
  },

  async resetPassword(token: string, newPassword: string) {
    await apiRequest<void>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }, false)
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await apiRequest<void>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },
}

export const userApi = {
  async me() {
    const user = mapUser(await apiRequest<BackendUser>("/api/users/me"))
    storeAuthUser(user)
    return user
  },

  async get(id: string) {
    return mapUser(await apiRequest<BackendUser>(`/api/users/${id}`))
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

  async get(postId: string) {
    return mapPost(await apiRequest<BackendPost>(`/api/posts/${postId}`))
  },

  async listVerified(page = 0, size = 20) {
    const response = await apiRequest<PagedResponse<BackendPost>>(`/api/posts/verified?page=${page}&size=${size}`)
    return {
      ...response,
      content: response.content.map(mapVerifiedPost),
    }
  },

  async getVerifiedStats() {
    return apiRequest<VerifiedNewsStats>("/api/posts/verified/stats")
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

  async byAuthor(authorId: string, page = 0, size = 100) {
    const params = new URLSearchParams({
      authorId,
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

  async like(postId: string) {
    return mapPost(await apiRequest<BackendPost>(`/api/posts/${postId}/likes`, {
      method: "POST",
    }))
  },

  async unlike(postId: string) {
    return mapPost(await apiRequest<BackendPost>(`/api/posts/${postId}/likes`, {
      method: "DELETE",
    }))
  },

  async comments(postId: string, page = 0, size = 10) {
    const response = await apiRequest<PagedResponse<BackendPostComment>>(`/api/posts/${postId}/comments?page=${page}&size=${size}`)
    return {
      ...response,
      content: response.content.map(mapPostComment),
    }
  },

  async comment(postId: string, content: string) {
    return mapPostComment(await apiRequest<BackendPostComment>(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }))
  },

  async share(postId: string, content: string, options?: { viaShareId?: string }) {
    return mapPost(await apiRequest<BackendPost>(`/api/posts/${postId}/shares`, {
      method: "POST",
      body: JSON.stringify({
        content,
        viaShareId: options?.viaShareId ?? null,
      }),
    }))
  },

  async getVerification(postId: string) {
    return mapPostVerification(await apiRequest<BackendPostVerification>(`/api/posts/${postId}/verification`))
  },
}

export interface VerifiedNewsStats {
  verifiedPostCount: number
  averageAnalysisDelayMs: number | null
}

export interface ExploreOverview {
  averageTrustScore: number
  fakeDetectionRate: number
  fakePostCount: number
  totalPostCount: number
  verifiedPostCount: number
  pendingScanCount: number
  analyzingCount: number
  loadStatus: "STABLE" | "ELEVATED" | "CRITICAL"
  warningLevel: number
  syncing: boolean
  trendingKeywords: string[]
}

export const exploreApi = {
  async getOverview() {
    return apiRequest<ExploreOverview>("/api/explore/overview")
  },
}

export const demoApi = {
  async simulatePropagation(payload: DemoPropagationRequest) {
    return apiRequest<DemoPropagationResponse>("/api/demo/propagation/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
}

export interface AIMonitoringStats {
  averageTrustScore: number
  fakeDetectionRate: number
  fakePostCount: number
  totalPostCount: number
  verifiedPostCount: number
}

export interface PendingScanPost {
  postId: string
  nodeId: string
  authorDisplayName: string
  contentPreview: string
  status: PostVerificationStatus
  totalInteractions: number
  nextThreshold: number
}

export const aiMonitoringApi = {
  async getStats() {
    return apiRequest<AIMonitoringStats>("/api/admin/ai/monitoring/stats")
  },

  async getPendingScan(limit = 3) {
    return apiRequest<PendingScanPost[]>(`/api/admin/ai/monitoring/pending-scan?limit=${limit}`)
  },
}

export interface AdminUser {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  coverUrl?: string
  role: "USER" | "ADMIN"
  enabled: boolean
  themePreference: "LIGHT" | "DARK" | "SYSTEM"
  createdAt: string
  updatedAt: string
}

export interface AdminPost {
  id: string
  authorId: string
  authorDisplayName: string
  authorAvatarUrl?: string
  content: string
  visibility: "PUBLIC" | "PRIVATE"
  mediaUrls: string[]
  hidden: boolean
  hiddenAt?: string
  likeCount: number
  commentCount: number
  shareCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminFakePost {
  postId: string
  authorId: string
  authorDisplayName: string
  contentPreview: string
  hidden: boolean
  label?: string
  fakeProbability?: number
  riskLevel?: "LOW" | "MEDIUM" | "HIGH"
  publicLabel: boolean
  adminDecision?: "CONFIRM_FAKE" | "REJECT_LABEL" | null
  reviewedAt?: string
  lastAnalyzedAt?: string
  createdAt: string
}

export type AdminVerdictDecision = "CONFIRM_FAKE" | "REJECT_LABEL"

export interface AiConfig {
  enabled: boolean
  tierThresholds: number[]
  debounceMinutes: number
  fakeThresholdPercent: number
  maxTiers: number
  timeoutSeconds: number
  includeSyntheticPosts: boolean
  updatedAt?: string
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  lockedUsers: number
  totalPosts: number
  visiblePosts: number
  hiddenPosts: number
  acceptedFriendships: number
  totalFollows: number
  totalMessages: number
  activeStories: number
  aiStats: AIMonitoringStats
}

export const adminApi = {
  async listUsers(params?: { page?: number; size?: number; query?: string; enabled?: boolean; role?: "USER" | "ADMIN" }) {
    const search = new URLSearchParams()
    if (params?.page !== undefined) search.set("page", String(params.page))
    if (params?.size !== undefined) search.set("size", String(params.size))
    if (params?.query?.trim()) search.set("query", params.query.trim())
    if (params?.enabled !== undefined) search.set("enabled", String(params.enabled))
    if (params?.role) search.set("role", params.role)
    const suffix = search.toString() ? `?${search.toString()}` : ""
    return apiRequest<PagedResponse<AdminUser>>(`/api/admin/users${suffix}`)
  },

  async updateUserStatus(userId: string, enabled: boolean, reason?: string, note?: string) {
    return apiRequest<AdminUser>(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ enabled, reason, note }),
    })
  },

  async listPosts(params?: { page?: number; size?: number; query?: string; hidden?: boolean }) {
    const search = new URLSearchParams()
    if (params?.page !== undefined) search.set("page", String(params.page))
    if (params?.size !== undefined) search.set("size", String(params.size))
    if (params?.query?.trim()) search.set("query", params.query.trim())
    if (params?.hidden !== undefined) search.set("hidden", String(params.hidden))
    const suffix = search.toString() ? `?${search.toString()}` : ""
    return apiRequest<PagedResponse<AdminPost>>(`/api/admin/posts${suffix}`)
  },

  async listFakePosts(params?: { page?: number; size?: number }) {
    const search = new URLSearchParams()
    if (params?.page !== undefined) search.set("page", String(params.page))
    if (params?.size !== undefined) search.set("size", String(params.size))
    const suffix = search.toString() ? `?${search.toString()}` : ""
    return apiRequest<PagedResponse<AdminFakePost>>(`/api/admin/posts/fake${suffix}`)
  },

  async updatePostHidden(postId: string, hidden: boolean, reason?: string) {
    return apiRequest<AdminPost>(`/api/admin/posts/${postId}/hidden`, {
      method: "PATCH",
      body: JSON.stringify({ hidden, reason }),
    })
  },

  async deletePost(postId: string, reason: string) {
    return apiRequest<void>(`/api/admin/posts/${postId}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    })
  },

  async applyVerdict(postId: string, decision: AdminVerdictDecision, note: string) {
    return apiRequest<AdminFakePost>(`/api/admin/posts/${postId}/verdict`, {
      method: "POST",
      body: JSON.stringify({ decision, note }),
    })
  },

  async getStats() {
    return apiRequest<AdminStats>("/api/admin/stats")
  },
}

export interface UpdateAiConfigPayload {
  enabled: boolean
  tierThresholds: number[]
  debounceMinutes: number
  fakeThresholdPercent: number
}

export const aiConfigApi = {
  async get() {
    return apiRequest<AiConfig>("/api/admin/ai/config")
  },

  async update(payload: UpdateAiConfigPayload) {
    return apiRequest<AiConfig>("/api/admin/ai/config", {
      method: "PUT",
      body: JSON.stringify(payload),
    })
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

  async video(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiRequest<UploadedImage>("/api/uploads/videos", {
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

export const followApi = {
  async follow(userId: string) {
    return apiRequest<FollowUser>(`/api/follows/${userId}`, {
      method: "POST",
    })
  },

  async cancelFollow(userId: string) {
    return apiRequest<void>(`/api/follows/${userId}`, {
      method: "DELETE",
    })
  },

  async countFollowers(userId: string) {
    return apiRequest<FollowCount>(`/api/follows/${userId}/followers/count`)
  },

  async countFollowing(userId: string) {
    return apiRequest<FollowCount>(`/api/follows/${userId}/following/count`)
  },

  async getFollowers(userId: string, page = 0, size = 20) {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    })
    return apiRequest<PagedResponse<FollowUser>>(`/api/follows/${userId}/followers?${params.toString()}`)
  },

  async getFollowing(userId: string, page = 0, size = 20) {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    })
    return apiRequest<PagedResponse<FollowUser>>(`/api/follows/${userId}/following?${params.toString()}`)
  },

  async isFollowing(userId: string) {
    return apiRequest<FollowStatus>(`/api/follows/${userId}/status`)
  },
}

export const messageApi = {
  async conversations() {
    return apiRequest<MessageConversation[]>("/api/messages/conversations")
  },

  async getOrCreateConversation(friendId: string) {
    return apiRequest<MessageConversation>(`/api/messages/conversations/friends/${friendId}`, {
      method: "POST",
    })
  },

  async messages(conversationId: string, page = 0, size = 50) {
    return apiRequest<PagedResponse<BackendMessage>>(`/api/messages/conversations/${conversationId}/messages?page=${page}&size=${size}`)
  },

  async sendMessage(conversationId: string, payload: {
    messageType: MessageType
    content?: string
    mediaUrl?: string
    linkUrl?: string
  }) {
    return apiRequest<BackendMessage>(`/api/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async react(messageId: string, emoji: string) {
    return apiRequest<MessageReaction>(`/api/messages/${messageId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    })
  },

  async deleteReaction(messageId: string) {
    return apiRequest<void>(`/api/messages/${messageId}/reactions`, {
      method: "DELETE",
    })
  },
}

export const storyApi = {
  async list(page = 0, size = 20) {
    return apiRequest<PagedResponse<BackendStory>>(`/api/stories?page=${page}&size=${size}`)
  },

  async create(payload: StoryCreatePayload) {
    return apiRequest<BackendStory>("/api/stories", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async markViewed(id: string) {
    return apiRequest<BackendStory>(`/api/stories/${id}/views`, {
      method: "POST",
    })
  },

  async react(id: string, reactionType: string) {
    return apiRequest(`/api/stories/${id}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reactionType }),
    })
  },

  async deleteReaction(id: string) {
    return apiRequest<void>(`/api/stories/${id}/reactions`, {
      method: "DELETE",
    })
  },

  async delete(id: string) {
    return apiRequest<void>(`/api/stories/${id}`, {
      method: "DELETE",
    })
  },
}

export const musicTrackApi = {
  async list(query?: string) {
    const params = new URLSearchParams()
    if (query?.trim()) params.set("query", query.trim())
    const suffix = params.toString() ? `?${params.toString()}` : ""
    return apiRequest<BackendMusicTrack[]>(`/api/music-tracks${suffix}`)
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
