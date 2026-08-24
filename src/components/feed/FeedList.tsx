import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MOCK_POSTS } from "@/mocks/data"
import { PostCard } from "./PostCard"
import type { Post } from "@/mocks/types"
import { postApi } from "@/lib/api"
import { useTranslation } from "react-i18next"
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query"

interface FeedListProps {
  searchQuery?: string
  onViewAnalysis: (post: Post) => void
}

const FEED_PAGE_SIZE = 20

type FeedPage = Awaited<ReturnType<typeof postApi.list>>

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
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const normalizedQuery = debouncedSearchQuery.trim()
  const queryKey = ["posts", normalizedQuery] as const

  const prependRepost = useCallback((post: Post) => {
    queryClient.setQueryData<InfiniteData<FeedPage, number>>(queryKey, (current) => {
      if (!current?.pages.length) return current
      const [firstPage, ...otherPages] = current.pages
      return {
        ...current,
        pages: [{ ...firstPage, content: [post, ...firstPage.content] }, ...otherPages],
      }
    })
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

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => (
      normalizedQuery
        ? postApi.search(normalizedQuery, pageParam, FEED_PAGE_SIZE)
        : postApi.list(pageParam, FEED_PAGE_SIZE)
    ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
  })

  useEffect(() => {
    const refreshPosts = () => {
      void refetch()
    }
    window.addEventListener("cybersocial:post-created", refreshPosts)
    return () => window.removeEventListener("cybersocial:post-created", refreshPosts)
  }, [refetch])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: "480px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const loadedPosts = useMemo(
    () => data?.pages.flatMap((page) => page.content) ?? [],
    [data],
  )
  const posts = filterPosts(
    loadedPosts.length > 0 ? loadedPosts : (error ? MOCK_POSTS : []),
    normalizedQuery,
  )
  const errorMessage = error instanceof Error ? error.message : error ? t("post.noPostLoad") : null

  return (
    <div className="space-y-6 mt-6">
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

      <div ref={loadMoreRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="text-center py-6 text-muted font-mono text-sm">
          {t("post.loadingMore")}
        </div>
      )}

      {!isLoading && !isFetchingNextPage && hasNextPage && (
        <button
          type="button"
          onClick={() => void fetchNextPage()}
          className="mx-auto block text-sm font-bold text-accent-blue hover:underline"
        >
          {t("post.loadMore")}
        </button>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="text-center py-8 text-muted font-mono">
          {normalizedQuery ? t("post.notFound") : t("post.noPosts")}
        </div>
      )}
    </div>
  )
}
