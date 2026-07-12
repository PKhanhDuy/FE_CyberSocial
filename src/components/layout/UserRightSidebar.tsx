import { CheckCircle, Hash, ShieldCheck, TrendingUp, UserPlus } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { exploreApi, friendApi, postApi } from "@/lib/api"
import { Avatar } from "@/components/ui/Avatar"
import { useFriendStore } from "@/store/useFriendStore"

export function UserRightSidebar() {
  const { t } = useTranslation()
  const incomingRequestCount = useFriendStore((state) => state.incomingRequestCount)

  const { data: verifiedPosts = [] } = useQuery({
    queryKey: ["sidebar-verified-posts"],
    queryFn: async () => {
      const response = await postApi.listVerified(0, 3)
      return response.content
    },
    staleTime: 60_000,
  })

  const { data: incomingRequests = [] } = useQuery({
    queryKey: ["sidebar-incoming-requests"],
    queryFn: () => friendApi.incomingRequests(),
    staleTime: 30_000,
  })

  const { data: overview } = useQuery({
    queryKey: ["explore-overview"],
    queryFn: () => exploreApi.getOverview(),
    staleTime: 60_000,
  })

  const trendingKeywords = overview?.trendingKeywords ?? []

  const previewRequests = incomingRequests.slice(0, 3)

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 glass-panel border-l border-border z-10 p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-8">
        <ShieldCheck className="w-5 h-5 text-green-400" />
        <h2 className="text-lg font-bold tracking-wider text-foreground">{t("sidebar.title")}</h2>
      </div>

      <div className="space-y-8">
        {(incomingRequestCount > 0 || previewRequests.length > 0) && (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-accent-pink" />
              {t("sidebar.friendRequests")}
            </h3>
            <div className="space-y-3">
              {previewRequests.length > 0 ? previewRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-panel rounded-lg p-3 border border-border flex items-center gap-3"
                >
                  <Avatar
                    src={request.user.avatarUrl}
                    fallback={request.user.displayName[0] || "U"}
                    className="h-10 w-10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {request.user.displayName}
                    </div>
                    <div className="text-xs text-muted truncate">{t("sidebar.pendingRequest")}</div>
                  </div>
                </div>
              )) : (
                <div className="bg-panel rounded-lg p-3 border border-border text-xs text-muted text-center">
                  {t("sidebar.pendingRequestCount", { count: incomingRequestCount })}
                </div>
              )}
              <Link
                to="/friends"
                className="block text-center text-xs font-bold text-accent-blue hover:underline"
              >
                {t("sidebar.viewAllRequests")}
              </Link>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-widest flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            {t("sidebar.verifiedNews")}
          </h3>
          <div className="space-y-3">
            {verifiedPosts.length > 0 ? verifiedPosts.map((post) => (
              <Link
                key={post.id}
                to="/verified"
                className="block bg-panel rounded-lg p-3 border border-green-500/20 hover:border-green-500/40 transition-colors group"
              >
                <div className="text-xs text-green-400 font-bold mb-1">{t("sidebar.verifiedBadge")}</div>
                <div className="text-sm text-foreground line-clamp-2 group-hover:text-green-300 transition-colors">
                  {post.content || t("sidebar.noContent")}
                </div>
                <div className="text-[11px] text-muted mt-2 truncate">{post.author.username}</div>
              </Link>
            )) : (
              <div className="bg-panel rounded-lg p-3 border border-border text-xs text-muted text-center">
                {t("sidebar.noVerifiedNews")}
              </div>
            )}
            <Link
              to="/verified"
              className="block text-center text-xs font-bold text-green-400 hover:underline"
            >
              {t("sidebar.viewVerifiedNews")}
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-blue" />
            {t("sidebar.trending")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {trendingKeywords.length > 0 ? trendingKeywords.map((tag) => (
              <Link
                key={tag}
                to="/explore"
                className="inline-flex items-center gap-1 rounded-full border border-accent-blue/30 bg-accent-blue/10 px-3 py-1.5 text-xs font-mono text-accent-blue hover:bg-accent-blue/20 transition-colors"
              >
                <Hash className="w-3 h-3" />
                {tag.replace("#", "")}
              </Link>
            )) : (
              <div className="text-xs text-muted">{t("explore.noTrendingKeywords")}</div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-panel/60 p-4 text-xs text-muted leading-relaxed">
          {t("sidebar.aiProtectionHint")}
        </section>
      </div>
    </aside>
  )
}
