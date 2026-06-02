import { create } from "zustand"
import { friendApi } from "@/lib/api"

interface FriendState {
  incomingRequestCount: number
  isLoading: boolean
  loadIncomingRequestCount: () => Promise<void>
}

export const useFriendStore = create<FriendState>((set) => ({
  incomingRequestCount: 0,
  isLoading: false,
  loadIncomingRequestCount: async () => {
    set({ isLoading: true })
    try {
      const incoming = await friendApi.incomingRequests()
      set({ incomingRequestCount: incoming.length, isLoading: false })
    } catch {
      set({ incomingRequestCount: 0, isLoading: false })
    }
  },
}))
