import { useEffect, useState } from "react"
import { ShieldCheck, Clock, Lock, Newspaper } from "lucide-react"
import { PostCard } from "@/components/feed/PostCard"
import { AIAnalysisModal } from "@/components/ai/AIAnalysisModal"
import type { Post } from "@/mocks/types"
import { postApi, type VerifiedNewsStats } from "@/lib/api"
import { useTranslation } from "react-i18next"

function formatAnalysisDelay(ms: number | null | undefined, t: (key: string) => string) {
  if (ms == null || Number.isNaN(ms)) {
    return t("verifyedNews.noAnalysisDelay")
  }

  if (ms < 1_000) {
    return `${Math.round(ms)}ms`
  }
  if (ms < 60_000) {
    return `${(ms / 1_000).toFixed(1)}s`
  }
  if (ms < 3_600_000) {
    return `${Math.round(ms / 60_000)} ${t("verifyedNews.minutes")}`
  }
  return `${(ms / 3_600_000).toFixed(1)} ${t("verifyedNews.hours")}`
}

export function VerifiedNews() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<VerifiedNewsStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [response, statsResponse] = await Promise.all([
          postApi.listVerified(),
          postApi.getVerifiedStats(),
        ])
        setPosts(response.content)
        setStats(statsResponse)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Khong tai duoc tin xac thuc")
        setPosts([])
        setStats(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadPosts()
    window.addEventListener("cybersocial:post-created", loadPosts)
    return () => window.removeEventListener("cybersocial:post-created", loadPosts)
  }, [])

  return (
    <div className="space-y-6 pb-20">
      <div className="glass-panel border-green-500/30 rounded-xl overflow-hidden relative shadow-[0_0_20px_rgba(34,197,94,0.1)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[100px] pointer-events-none" />

        <div className="p-8 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-green-400">{t("verifyedNews.title")}</h1>
              <p className="text-green-500/70 font-mono text-sm uppercase tracking-widest mt-1">
                {t("verifyedNews.logan")}
              </p>
            </div>
          </div>

          <p className="text-muted max-w-2xl leading-relaxed mb-6">
            {t("verifyedNews.description")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-green-500/20 pt-6">
            <div className="flex items-center gap-3">
              <Newspaper className="w-5 h-5 text-green-500/50" />
              <div>
                <div className="text-xl font-bold text-foreground tracking-wider">
                  {isLoading ? "..." : (stats?.verifiedPostCount ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted uppercase tracking-widest">{t("verifyedNews.verifiedPostCount")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-500/50" />
              <div>
                <div className="text-xl font-bold text-foreground tracking-wider">
                  {isLoading ? "..." : formatAnalysisDelay(stats?.averageAnalysisDelayMs, t)}
                </div>
                <div className="text-xs text-muted uppercase tracking-widest">{t("verifyedNews.averageAnalysisTime")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-green-500/50" />
              <div>
                <div className="text-xl font-bold text-green-400 tracking-wider">{t("verifyedNews.encryption")}</div>
                <div className="text-xs text-muted uppercase tracking-widest">{t("verifyedNews.securityProtocol")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-8 text-muted font-mono">
            {t("verifyedNews.loading")}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-sm text-foreground">
            {error}
          </div>
        )}

        {!isLoading && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onViewAnalysis={setSelectedPost} />
          ))
        ) : !isLoading && !error ? (
          <div className="p-8 border border-green-500/20 bg-green-500/5 rounded-xl text-center">
            <ShieldCheck className="w-12 h-12 text-green-500/30 mx-auto mb-4" />
            <p className="text-green-400 font-mono">{t("verifyedNews.scanning")}</p>
          </div>
        ) : null}
      </div>

      {selectedPost && (
        <AIAnalysisModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  )
}
