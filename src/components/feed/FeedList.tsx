import { useCallback, useEffect, useState } from "react"
import { MOCK_POSTS } from "@/mocks/data"
import { PostCard } from "./PostCard"
import type { Post } from "@/mocks/types"
import { postApi } from "@/lib/api"

interface FeedListProps {
  searchQuery?: string
  onViewAnalysis: (post: Post) => void
}

const normalizeSearchValue = (value: string) => value.trim().toLowerCase()

const filterPosts = (posts: Post[], query: string) => {
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return posts

  return posts.filter((post) => {
    const searchableValues = [
      post.id,
      post.author.id,
      post.author.username,
      post.author.handle,
      post.content,
    ]

    return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery))
  })
}

export function FeedList({ searchQuery = "", onViewAnalysis }: FeedListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    const normalizedQuery = searchQuery.trim()
    setIsLoading(true)
    setError(null)
    try {
      const response = normalizedQuery ? await postApi.search(normalizedQuery) : await postApi.list()
      setPosts(filterPosts(response.content, normalizedQuery))
    } catch (error) {
      setError(error instanceof Error ? error.message : "Khong tai duoc bang tin")
      setPosts(filterPosts(MOCK_POSTS, normalizedQuery))
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadPosts, searchQuery.trim() ? 300 : 0)
    window.addEventListener("cybersocial:post-created", loadPosts)
    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener("cybersocial:post-created", loadPosts)
    }
  }, [loadPosts, searchQuery])

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
          {searchQuery.trim() ? "Khong tim thay bai viet phu hop." : "Chua co bai viet nao."}
        </div>
      )}
    </div>
  )
}
