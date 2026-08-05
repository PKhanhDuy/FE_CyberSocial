import { create } from "zustand"
import { createMessageSocket, presenceApi, type MessageSocketEvent } from "@/lib/api"

type RealtimeListener = (event: MessageSocketEvent) => void

interface PresenceState {
  onlineIds: Set<string>
  isConnected: boolean
  hydrate: () => Promise<void>
  start: () => void
  stop: () => void
  isOnline: (userId: string) => boolean
  subscribe: (listener: RealtimeListener) => () => void
}

let socket: WebSocket | null = null
let reconnectTimer: number | undefined
let disposed = true
const listeners = new Set<RealtimeListener>()

const dispatch = (event: MessageSocketEvent) => {
  listeners.forEach((listener) => listener(event))
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
    set({ onlineIds: new Set(), isConnected: false })
  },
}))
