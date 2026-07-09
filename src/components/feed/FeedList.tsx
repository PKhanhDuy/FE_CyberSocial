import { useCallback, useEffect, useState } from "react"
import { MOCK_POSTS } from "@/mocks/data"
import { PostCard } from "./PostCard"
import type { Post } from "@/mocks/types"
import { postApi } from "@/lib/api"
import { useTranslation } from "react-i18next"
import { useQuery, useQueryClient } from "@tanstack/react-query"

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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery.trim())
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const normalizedQuery = debouncedSearchQuery.trim()
  const queryKey = ["posts", normalizedQuery] as const

  const prependRepost = useCallback((post: Post) => {
    queryClient.setQueryData<Awaited<ReturnType<typeof postApi.list>>>(queryKey, (current) => (
      current ? { ...current, content: [post, ...current.content] } : current
    ))
  }, [queryClient, queryKey])

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearchQuery(searchQuery.trim()),
      searchQuery.trim() ? 300 : 0,
    )
    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchQuery])

  const { data, error, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => normalizedQuery ? postApi.search(normalizedQuery) : postApi.list(),
  })

  useEffect(() => {
    const refreshPosts = () => {
      void refetch()
    }
    window.addEventListener("cybersocial:post-created", refreshPosts)
    return () => window.removeEventListener("cybersocial:post-created", refreshPosts)
  }, [refetch])

  const posts = filterPosts(data?.content ?? (error ? MOCK_POSTS : []), normalizedQuery)
  const errorMessage = error instanceof Error ? error.message : error ? t("post.noPostLoad") : null

  return (
    <div className="space-y-2 mt-6 pb-20">
      {isLoading && (
        <div className="text-center py-8 text-muted font-mono">
          {t("post.downloading")}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-sm text-foreground">
          {errorMessage}
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onViewAnalysis={onViewAnalysis} onRepostCreated={prependRepost} />
      ))}

      {!isLoading && posts.length === 0 && (
        <div className="text-center py-8 text-muted font-mono">
          {normalizedQuery ? t("post.notFound") : t("post.noPosts")}
        </div>
      )}
    </div>
  )
}
