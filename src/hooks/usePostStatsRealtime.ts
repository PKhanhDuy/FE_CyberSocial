import { useEffect } from "react"
import { usePresenceStore } from "@/store/usePresenceStore"

interface PostStats {
  likes: number
  comments: number
  shares: number
}

export function usePostStatsRealtime(postId: string, onStatsUpdate: (stats: PostStats) => void) {
  const subscribePost = usePresenceStore((state) => state.subscribePost)
  const unsubscribePost = usePresenceStore((state) => state.unsubscribePost)
  const subscribePostStats = usePresenceStore((state) => state.subscribePostStats)
  const isConnected = usePresenceStore((state) => state.isConnected)

  useEffect(() => {
    if (!postId) return

    subscribePost(postId)
    const unsubscribeListener = subscribePostStats((event) => {
      if (event.postId !== postId) return
      onStatsUpdate({
        likes: event.likeCount,
        comments: event.commentCount,
        shares: event.shareCount,
      })
    })

    return () => {
      unsubscribeListener()
      unsubscribePost(postId)
    }
  }, [postId, subscribePost, subscribePostStats, unsubscribePost, onStatsUpdate])

  useEffect(() => {
    if (!postId || !isConnected) return
    subscribePost(postId)
  }, [isConnected, postId, subscribePost])
}
