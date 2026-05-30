import { Activity, ShieldAlert, Zap } from "lucide-react"
import { Progress } from "@/components/ui/Progress"
import {useTranslation} from "react-i18next"

export function RightSidebar() {
  const { t } = useTranslation()
  return (
    <aside className="fixed right-0 top-0 h-screen w-80 glass-panel border-l border-border z-10 p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-8">
        <Activity className="w-5 h-5 text-accent-blue" />
        <h2 className="text-lg font-bold tracking-wider text-foreground">{t("aitracking.title")}</h2>
      </div>

      <div className="space-y-8">
        {/* Network Status */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-widest">{t("aitracking.networkStatus")}</h3>
          <div className="bg-panel rounded-lg p-4 border border-border space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">{t("aitracking.globalThreat")}</span>
              <span className="text-accent-pink font-mono">14.2%</span>
            </div>
            <Progress value={14.2} indicatorColor="bg-accent-pink" className="h-1" />
            
            <div className="flex justify-between items-center text-sm pt-2">
              <span className="text-muted">{t("aitracking.processingSpeed")}</span>
              <span className="text-accent-blue font-mono">1.2ms/req</span>
            </div>
          </div>
        </div>

        {/* Live Tracking */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            {t("aitracking.liveTracking")}
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-panel rounded-lg p-3 border border-border text-xs font-mono relative overflow-hidden group">
                <div className="absolute left-0 top-0 w-1 h-full bg-accent-blue opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between text-muted mb-1">
                  <span>Node_ID: 0x{Math.floor(Math.random() * 9999)}</span>
                  <span className="text-accent-blue">{t("aitracking.scanning")}</span>
                </div>
                <div className="text-muted truncate">{t("aitracking.analyzing")}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Suspicious Alerts */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent-pink" />
            {t("aitracking.suspiciousWarning")}
          </h3>
          <div className="space-y-3">
            <div className="bg-accent-pink/5 rounded-lg p-3 border border-accent-pink/30">
              <div className="text-sm font-medium text-foreground mb-1">Phát hiện Deepfake</div>
              <div className="text-xs text-muted">Vận tốc: +400% trong 1h</div>
              <div className="mt-2 text-right">
                <span className="text-xs text-accent-pink border border-accent-pink/50 px-2 py-1 rounded bg-accent-pink/10">Rủi ro: CAO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
