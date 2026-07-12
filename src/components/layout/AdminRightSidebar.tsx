import { Activity, ShieldAlert, Zap } from "lucide-react"
import { Progress } from "@/components/ui/Progress"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { aiMonitoringApi } from "@/lib/api"

export function AdminRightSidebar() {
  const { t } = useTranslation()

  const { data: stats } = useQuery({
    queryKey: ["ai-monitoring-stats"],
    queryFn: () => aiMonitoringApi.getStats(),
    refetchInterval: 5000,
    retry: false,
  })

  const { data: pendingPosts = [] } = useQuery({
    queryKey: ["ai-monitoring-pending"],
    queryFn: () => aiMonitoringApi.getPendingScan(3),
    refetchInterval: 5000,
    retry: false,
  })

  const fakeDetectionRate = stats?.fakeDetectionRate ?? 0
  const averageTrustScore = stats?.averageTrustScore ?? 0

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 glass-panel border-l border-border z-10 p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-8">
        <Activity className="w-5 h-5 text-accent-blue" />
        <h2 className="text-lg font-bold tracking-wider text-foreground">{t("aitracking.title")}</h2>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-widest">{t("aitracking.networkStatus")}</h3>
          <div className="bg-panel rounded-lg p-4 border border-border space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">{t("aitracking.globalThreat")}</span>
              <span className="text-accent-pink font-mono">{fakeDetectionRate.toFixed(1)}%</span>
            </div>
            <Progress value={fakeDetectionRate} indicatorColor="bg-accent-pink" className="h-1" />

            <div className="flex justify-between items-center text-sm pt-2">
              <span className="text-muted">{t("aitracking.averageTrust")}</span>
              <span className="text-accent-blue font-mono">{averageTrustScore.toFixed(1)}%</span>
            </div>

            {stats && (
              <div className="text-[11px] text-muted font-mono pt-1">
                {t("aitracking.fakeDetectedCount", {
                  fake: stats.fakePostCount,
                  total: stats.totalPostCount,
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            {t("aitracking.liveTracking")}
          </h3>
          <div className="space-y-3">
            {pendingPosts.length > 0 ? pendingPosts.map((post) => (
              <div
                key={post.postId}
                className="bg-panel rounded-lg p-3 border border-border text-xs font-mono relative overflow-hidden group"
              >
                <div className="absolute left-0 top-0 w-1 h-full bg-accent-blue opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between text-muted mb-1 gap-2">
                  <span className="truncate">Node_ID: {post.nodeId}</span>
                  <span className="text-accent-blue shrink-0">{t("aitracking.waitingInteractions")}</span>
                </div>
                <div className="text-foreground truncate mb-1">{post.authorDisplayName}</div>
                <div className="text-muted truncate">{post.contentPreview || t("aitracking.waitingPreview")}</div>
                <div className="text-[10px] text-muted mt-1">
                  {post.totalInteractions}/{post.nextThreshold} {t("aitracking.interactions")}
                </div>
                <Progress
                  value={post.nextThreshold > 0 ? (post.totalInteractions / post.nextThreshold) * 100 : 0}
                  indicatorColor="bg-accent-blue"
                  className="h-1 mt-2"
                />
              </div>
            )) : (
              <div className="bg-panel rounded-lg p-3 border border-border text-xs text-muted text-center">
                {t("aitracking.noPendingScan")}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent-pink" />
            {t("aitracking.suspiciousWarning")}
          </h3>
          <div className="space-y-3">
            {stats && stats.fakePostCount > 0 ? (
              <div className="bg-accent-pink/5 rounded-lg p-3 border border-accent-pink/30">
                <div className="text-sm font-medium text-foreground mb-1">{t("aitracking.fakeDetectedTitle")}</div>
                <div className="text-xs text-muted">
                  {t("aitracking.fakeDetectedDetail", {
                    fake: stats.fakePostCount,
                    rate: fakeDetectionRate.toFixed(1),
                  })}
                </div>
                <div className="mt-2 text-right">
                  <span className="text-xs text-accent-pink border border-accent-pink/50 px-2 py-1 rounded bg-accent-pink/10">
                    {t("aitracking.highRisk")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-panel rounded-lg p-3 border border-border text-xs text-muted text-center">
                {t("aitracking.noSuspiciousAlerts")}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
