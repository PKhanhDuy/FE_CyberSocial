import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Search, Radar, TrendingUp, Filter, Globe, Hash } from "lucide-react"
import { PostCard } from "@/components/feed/PostCard"
import type { Post } from "@/mocks/types"
import { AIAnalysisModal } from "@/components/ai/AIAnalysisModal"
import { exploreApi, postApi } from "@/lib/api"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

export function Explore() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["explore-overview"],
    queryFn: () => exploreApi.getOverview(),
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await postApi.list()
        setPosts(response.content)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t("explore.noData"))
        setPosts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPosts()
    window.addEventListener("cybersocial:post-created", loadPosts)
    return () => window.removeEventListener("cybersocial:post-created", loadPosts)
  }, [t])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesFilter = activeFilter === "all" || post.aiState === activeFilter
      const normalizedSearch = searchQuery.trim().toLowerCase()
      const matchesSearch = !normalizedSearch
        || post.content.toLowerCase().includes(normalizedSearch)
        || post.author.username.toLowerCase().includes(normalizedSearch)
      return matchesFilter && matchesSearch
    })
  }, [activeFilter, posts, searchQuery])

  const loadBadgeLabel = overview?.loadStatus === "CRITICAL"
    ? t("explore.loadCritical")
    : overview?.loadStatus === "ELEVATED"
      ? t("explore.loadElevated")
      : t("explore.loadStable")

  const loadBadgeClass = overview?.loadStatus === "CRITICAL"
    ? "bg-accent-pink/10 border-accent-pink/30 text-accent-pink shadow-[var(--shadow-neon-pink)]"
    : overview?.loadStatus === "ELEVATED"
      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
      : "bg-green-500/10 border-green-500/30 text-green-400"

  const handleViewAnalysis = (post: Post) => {
    setSelectedPost(post)
  }

  const handleTrendingClick = (tag: string) => {
    setSearchQuery(tag.startsWith("#") ? tag.slice(1) : tag)
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="sticky top-0 bg-background/ backdrop-blur-md z-20 pt-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-6 h-6 text-accent-blue" />
          <h1 className="text-2xl font-bold tracking-wider text-foreground neon-text-blue">{t("explore.title")}</h1>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted group-focus-within:text-accent-blue transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-border rounded-xl leading-5 bg-panel/ text-muted placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue transition-all sm:text-sm focus:shadow-[var(--shadow-neon-blue)]"
            placeholder={t("explore.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button className="p-2 mr-2 text-muted hover:text-accent-blue transition-colors rounded-lg hover:bg-accent-blue/10">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 text-accent-pink/5 translate-x-1/4 -translate-y-1/4">
          <Radar className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 border border-accent-blue/30 rounded-full"></div>
            <div className="absolute inset-2 border border-accent-blue/20 rounded-full"></div>
            <div className="absolute inset-4 border border-accent-blue/10 rounded-full"></div>

            <motion.div
              animate={{
                scale: [1, 2.5],
                opacity: [0.8, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute w-12 h-12 bg-accent-blue/40 rounded-full"
            />

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Radar className="w-8 h-8 text-accent-blue relative z-10" />
            </motion.div>

            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute top-4 right-8 w-2 h-2 bg-accent-pink rounded-full shadow-[var(--shadow-neon-pink)]" />
            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-accent-blue rounded-full shadow-[var(--shadow-neon-blue)]" />
            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 1 }} className="absolute top-10 left-4 w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_#4ade80]" />
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-blue" />
              {t("explore.networkStatus")}
            </h2>
            <p className="text-muted text-sm mb-4">
              {isOverviewLoading || !overview
                ? t("explore.statsLoading")
                : t("explore.statsDescription", {
                    totalPosts: overview.totalPostCount.toLocaleString(),
                    fakePosts: overview.fakePostCount.toLocaleString(),
                    pendingPosts: overview.pendingScanCount.toLocaleString(),
                    analyzingPosts: overview.analyzingCount.toLocaleString(),
                    trustScore: overview.averageTrustScore.toFixed(1),
                  })}
            </p>
            {overview && (
              <div className="flex flex-wrap gap-2">
                <div className={cn("px-3 py-1 rounded-md border text-xs font-mono font-bold", loadBadgeClass)}>
                  {loadBadgeLabel}
                </div>
                {overview.warningLevel > 0 ? (
                  <div className="px-3 py-1 rounded-md bg-accent-pink/10 border border-accent-pink/30 text-accent-pink text-xs font-mono font-bold shadow-[var(--shadow-neon-pink)]">
                    {t("explore.warningLevel", { level: overview.warningLevel })}
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-md bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono font-bold">
                    {t("explore.warningSafe")}
                  </div>
                )}
                <div className={cn(
                  "px-3 py-1 rounded-md border text-xs font-mono font-bold flex items-center gap-1",
                  overview.syncing
                    ? "bg-accent-blue/10 border-accent-blue/30 text-accent-blue"
                    : "bg-panel border-border text-muted",
                )}>
                  {overview.syncing && (
                    <div className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse shadow-[var(--shadow-neon-blue)]"></div>
                  )}
                  {overview.syncing ? t("explore.syncing") : t("explore.synced")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-5 h-5 text-accent-pink" />
          <h2 className="text-lg font-bold text-foreground tracking-wide">{t("explore.trendingKeys")}</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {isOverviewLoading && (
            <div className="text-sm text-muted font-mono py-2">{t("explore.statsLoading")}</div>
          )}
          {!isOverviewLoading && (overview?.trendingKeywords.length ?? 0) === 0 && (
            <div className="text-sm text-muted font-mono py-2">{t("explore.noTrendingKeywords")}</div>
          )}
          {overview?.trendingKeywords.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTrendingClick(tag)}
              className="whitespace-nowrap px-4 py-2 rounded-lg bg-panel/ border border-border text-muted hover:text-foreground hover:border-accent-pink hover:bg-accent-pink/10 hover:shadow-[var(--shadow-neon-pink)] transition-all font-mono text-sm shadow-sm cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-border pb-2">
        <button
          onClick={() => setActiveFilter("all")}
          className={`pb-2 text-sm font-bold tracking-wider uppercase transition-colors relative ${activeFilter === "all" ? "text-accent-blue" : "text-muted hover:text-muted"}`}
        >
          {t("explore.all")}
          {activeFilter === "all" && (
            <motion.div layoutId="explore-filter" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue shadow-[var(--shadow-neon-blue)]" />
          )}
        </button>
        <button
          onClick={() => setActiveFilter("suspicious")}
          className={`pb-2 text-sm font-bold tracking-wider uppercase transition-colors relative ${activeFilter === "suspicious" ? "text-accent-pink" : "text-muted hover:text-muted"}`}
        >
          {t("explore.suspicious")}
          {activeFilter === "suspicious" && (
            <motion.div layoutId="explore-filter" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-pink shadow-[var(--shadow-neon-pink)]" />
          )}
        </button>
      </div>

      <div className="space-y-6">
        {isLoading && (
          <div className="text-center py-10 text-muted font-mono">
            {t("explore.asyncData")}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-sm text-foreground">
            {error}
          </div>
        )}

        {filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onViewAnalysis={handleViewAnalysis}
          />
        ))}
        {!isLoading && filteredPosts.length === 0 && (
          <div className="text-center py-10 text-muted font-mono">
            {t("explore.noDataFeed")}
          </div>
        )}
      </div>

      {selectedPost && (
        <AIAnalysisModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  )
}
