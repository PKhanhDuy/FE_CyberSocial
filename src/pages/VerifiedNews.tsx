import { useEffect, useState } from "react"
import { ShieldCheck, Server, Database, Lock } from "lucide-react"
import { PostCard } from "@/components/feed/PostCard"
import { AIAnalysisModal } from "@/components/ai/AIAnalysisModal"
import type { Post } from "@/mocks/types"
import { postApi } from "@/lib/api"
import { useTranslation } from "react-i18next"

export function VerifiedNews() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await postApi.listVerified()
        setPosts(response.content)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Khong tai duoc tin xac thuc")
        setPosts([])
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
      {/* Header/Banner Section */}
      <div className="glass-panel border-green-500/30 rounded-xl overflow-hidden relative shadow-[0_0_20px_rgba(34,197,94,0.1)]">
        {/* Background glow */}
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
              <Database className="w-5 h-5 text-green-500/50" />
              <div>
                <div className="text-xl font-bold text-foreground tracking-wider">12,492</div>
                <div className="text-xs text-muted uppercase tracking-widest">{t("verifyedNews.source")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-green-500/50" />
              <div>
                <div className="text-xl font-bold text-foreground tracking-wider">0.02ms</div>
                <div className="text-xs text-muted uppercase tracking-widest">{t("verifyedNews.timeDelay")}</div>
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

      {/* Feed List */}
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
