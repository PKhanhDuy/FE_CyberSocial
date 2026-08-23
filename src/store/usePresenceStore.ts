import { create } from "zustand"
import { createMessageSocket, presenceApi, type MessageSocketEvent, type PostStatsUpdatedEvent } from "@/lib/api"

type RealtimeListener = (event: MessageSocketEvent) => void
type PostStatsListener = (event: PostStatsUpdatedEvent) => void

interface PresenceState {
  onlineIds: Set<string>
  isConnected: boolean
  hydrate: () => Promise<void>
  start: () => void
  stop: () => void
  isOnline: (userId: string) => boolean
  subscribe: (listener: RealtimeListener) => () => void
  subscribePostStats: (listener: PostStatsListener) => () => void
  subscribePost: (postId: string) => void
  unsubscribePost: (postId: string) => void
}

let socket: WebSocket | null = null
let reconnectTimer: number | undefined
let disposed = true
const listeners = new Set<RealtimeListener>()
const postStatsListeners = new Set<PostStatsListener>()
const activePostSubscriptions = new Set<string>()

const dispatch = (event: MessageSocketEvent) => {
  listeners.forEach((listener) => listener(event))
  if (event.type === "POST_STATS_UPDATED") {
    postStatsListeners.forEach((listener) => listener(event))
  }
}

const sendPostCommand = (action: "SUBSCRIBE_POST" | "UNSUBSCRIBE_POST", postId: string) => {
  if (!postId || !socket || socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify({ action, postId }))
}

const resubscribeActivePosts = () => {
  activePostSubscriptions.forEach((postId) => {
    sendPostCommand("SUBSCRIBE_POST", postId)
  })
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineIds: new Set(),
  isConnected: false,

  isOnline: (userId) => get().onlineIds.has(userId),

  hydrate: async () => {
    try {
      const ids = await presenceApi.listOnlineFriends()
      set({ onlineIds: new Set(ids) })
    } catch {
      // Presence is best-effort; UI stays usable without it.
    }
  },

  subscribe: (listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  subscribePostStats: (listener) => {
    postStatsListeners.add(listener)
    return () => {
      postStatsListeners.delete(listener)
    }
  },

  subscribePost: (postId) => {
    if (!postId) return
    activePostSubscriptions.add(postId)
    sendPostCommand("SUBSCRIBE_POST", postId)
  },

  unsubscribePost: (postId) => {
    if (!postId) return
    activePostSubscriptions.delete(postId)
    sendPostCommand("UNSUBSCRIBE_POST", postId)
  },

  start: () => {
    disposed = false

    const connect = () => {
      if (disposed) return
      socket?.close()
      socket = createMessageSocket((event) => {
        if (event.type === "PRESENCE_UPDATED" && event.userId) {
          set((state) => {
            const next = new Set(state.onlineIds)
            if (event.online) next.add(event.userId)
            else next.delete(event.userId)
            return { onlineIds: next }
          })
        }
        dispatch(event)
      })

      if (!socket) {
        set({ isConnected: false })
        return
      }

      socket.addEventListener("open", () => {
        set({ isConnected: true })
        resubscribeActivePosts()
        void get().hydrate()
      })

      socket.addEventListener("close", () => {
        set({ isConnected: false })
        if (!disposed) {
          reconnectTimer = window.setTimeout(connect, 3000)
        }
      })
    }

    void get().hydrate()
    connect()
  },

  stop: () => {
    disposed = true
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = undefined
    }
    socket?.close()
    socket = null
    activePostSubscriptions.clear()
    set({ onlineIds: new Set(), isConnected: false })
  },
}))
