import { useEffect, useState } from "react"
import { MOCK_POSTS } from "@/mocks/data"
import { PostCard } from "./PostCard"
import type { Post } from "@/mocks/types"
import { postApi } from "@/lib/api"

interface FeedListProps {
  onViewAnalysis: (post: Post) => void
}

export function FeedList({ onViewAnalysis }: FeedListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await postApi.list()
      setPosts(response.content)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Khong tai duoc bang tin")
      setPosts(MOCK_POSTS)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
    window.addEventListener("cybersocial:post-created", loadPosts)
    return () => window.removeEventListener("cybersocial:post-created", loadPosts)
  }, [])

  return (
    <div className="space-y-2 mt-6 pb-20">
      {isLoading && (
        <div className="text-center py-8 text-muted font-mono">
          Dang tai bang tin...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-sm text-foreground">
          {error}
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onViewAnalysis={onViewAnalysis} />
      ))}

      {!isLoading && posts.length === 0 && (
        <div className="text-center py-8 text-muted font-mono">
          Chua co bai viet nao.
        </div>
      )}
    </div>
  )
}
