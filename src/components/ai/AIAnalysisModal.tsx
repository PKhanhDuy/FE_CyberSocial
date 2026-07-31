import { useState } from "react"
import type { Post } from "@/mocks/types"
import { motion, AnimatePresence } from "framer-motion"
import { X, Activity, ShieldAlert, GitMerge, ChevronDown, ChevronUp } from "lucide-react"
import { PropagationGraphScene, getGraphStats } from "../3d/PropagationGraphScene"
import { buildPropagationGraphFromTimeline } from "@/lib/propagationGraphLayout"
import { PropagationTimeline } from "./PropagationTimeline"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { buildTimelineChartData } from "@/lib/postVerification"

interface AIAnalysisModalProps {
  post: Post
  onClose: () => void
}

export function AIAnalysisModal({ post, onClose }: AIAnalysisModalProps) {
  const { t } = useTranslation()
  const [showTechnical, setShowTechnical] = useState(false)
  const analysis = post.aiAnalysis
  const isSuspicious = post.aiState === "suspicious"
  const fakeProbabilityPercent = analysis ? (analysis.fakeProbability * 100).toFixed(1) : "0.0"
  const chartData = analysis ? buildTimelineChartData(analysis.propagationTimeline) : []
  const timeline = analysis?.propagationTimeline ?? []
  const graphLayout = buildPropagationGraphFromTimeline(timeline)
  const graphStats = getGraphStats(graphLayout)

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/ backdrop-blur-xl"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={cn(
            "relative w-full max-w-6xl h-[85vh] rounded-2xl overflow-hidden glass-panel border flex flex-col md:flex-row shadow-2xl",
            isSuspicious ? "border-accent-pink/50 shadow-[var(--shadow-neon-pink)]" : "border-accent-blue/50 shadow-[var(--shadow-neon-blue)]"
          )}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-panel/ rounded-full hover:bg-white/10 transition-colors border border-border text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 3D Visualization Area */}
          <div className="relative flex-1 bg-black/50 overflow-hidden min-h-[300px] md:min-h-0">
            <PropagationGraphScene
              timeline={timeline}
              isSuspicious={isSuspicious}
              fallbackAuthor={post.author.username}
            />
            
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
              <div className="bg-panel/ backdrop-blur-md border border-border rounded-lg p-3 inline-flex flex-col gap-1">
                <span className="text-xs text-muted font-semibold tracking-wider">
                  {graphStats.mode === "tree" ? "CÂY LAN TRUYỀN" : "ĐỒ THỊ LAN TRUYỀN"}
                </span>
                <span className={cn("text-lg font-bold font-mono", isSuspicious ? "text-accent-pink" : "text-accent-blue")}>
                  {graphStats.actorCount} node · {graphStats.eventCount} sự kiện
                </span>
                {graphStats.mode === "tree" && (
                  <span className="text-[10px] text-muted font-mono">
                    Chế độ cây share · like/comment không vẽ trên 3D
                  </span>
                )}
                {graphStats.influentialCount > 0 && (
                  <span className="text-[10px] text-muted font-mono">
                    {graphStats.influentialCount} tương tác quan trọng · node sáng = ảnh hưởng nhiều nhất
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Sidebar */}
          <div className="w-full md:w-[400px] bg-panel/ backdrop-blur-xl border-l border-border flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold tracking-wider text-foreground flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-accent-blue" />
                Phân tích lan truyền
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                Giải thích cách bài viết lan truyền và các tương tác ảnh hưởng đến kết luận của hệ thống.
              </p>
            </div>

            <div className="p-6 flex-1 space-y-6">
              {!analysis ? (
                <div className="rounded-xl border border-border bg-background p-6 text-sm text-muted text-center">
                  {t("post.analysisNotReady")}
                </div>
              ) : (
                <>
                  {/* Headline & narrative */}
                  {(analysis.headline || analysis.narrative) && (
                    <div className={cn(
                      "rounded-xl p-4 border space-y-3",
                      isSuspicious ? "bg-accent-pink/5 border-accent-pink/30" : "bg-accent-blue/5 border-accent-blue/30"
                    )}>
                      {analysis.headline && (
                        <p className={cn(
                          "text-base font-semibold leading-snug",
                          isSuspicious ? "text-accent-pink" : "text-accent-blue"
                        )}>
                          {analysis.headline}
                        </p>
                      )}
                      {analysis.narrative && (
                        <p className="text-sm text-muted leading-relaxed">
                          {analysis.narrative}
                        </p>
                      )}
                      {analysis.contextHints.length > 0 && (
                        <ul className="space-y-1.5">
                          {analysis.contextHints.map((hint) => (
                            <li key={hint} className="text-xs text-muted flex items-start gap-2">
                              <span className={cn("mt-1.5 h-1 w-1 rounded-full shrink-0", isSuspicious ? "bg-accent-pink" : "bg-accent-blue")} />
                              {hint}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Risk Gauge & Status */}
                  <div className={cn(
                    "rounded-xl p-4 border relative overflow-hidden",
                    isSuspicious ? "bg-accent-pink/5 border-accent-pink/30" : "bg-accent-blue/5 border-accent-blue/30"
                  )}>
                    <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl -mr-10 -mt-10 opacity-20", isSuspicious ? "bg-accent-pink" : "bg-accent-blue")} />
                    <div className="flex justify-between items-start mb-4 relative">
                      <div>
                        <div className="text-xs text-muted font-semibold mb-1 tracking-wider uppercase">Mức độ đe dọa</div>
                        <div className={cn("text-2xl font-black tracking-widest", isSuspicious ? "text-accent-pink" : "text-accent-blue")}>
                          {analysis.riskLevel}
                        </div>
                      </div>
                      {isSuspicious && <ShieldAlert className="w-8 h-8 text-accent-pink" />}
                    </div>
                    
                    <div className="space-y-2 relative">
                      <div className="flex justify-between text-xs text-muted">
                        <span>Mức nghi ngờ tin giả</span>
                        <span className="font-mono">{fakeProbabilityPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all", isSuspicious ? "bg-accent-pink" : "bg-accent-blue")}
                          style={{ width: `${analysis.fakeProbability * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Propagation Timeline */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted mb-1 tracking-wider uppercase flex items-center gap-2">
                      <GitMerge className="w-4 h-4" />
                      Diễn biến theo thời gian
                    </h3>
                    <p className="mb-3 text-xs text-muted">
                      Các mốc được chọn vì chúng ảnh hưởng nhiều nhất đến kết luận.
                    </p>
                    <PropagationTimeline
                      events={analysis.propagationTimeline}
                      isSuspicious={isSuspicious}
                    />
                  </div>

                  {/* Explanations */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted mb-3 tracking-wider uppercase flex items-center gap-2">
                      <GitMerge className="w-4 h-4" />
                      Các yếu tố chính
                    </h3>
                    <div className="space-y-2">
                      {analysis.reasons.length > 0 ? analysis.reasons.map((reason, idx) => (
                        <div key={idx} className="bg-background border border-border rounded-lg p-3 text-sm text-muted flex items-start gap-3">
                          <div className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0", isSuspicious ? "bg-accent-pink" : "bg-accent-blue")} />
                          {reason}
                        </div>
                      )) : (
                        <div className="bg-background border border-border rounded-lg p-3 text-sm text-muted">
                          {t("post.analysisNotReady")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Technical details toggle */}
                  {analysis.explanation && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowTechnical((value) => !value)}
                        className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted hover:bg-white/5 transition-colors"
                      >
                        <span>Chi tiết kỹ thuật</span>
                        {showTechnical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {showTechnical && (
                        <div className="mt-2 rounded-lg border border-border bg-background p-3 text-xs text-muted leading-relaxed font-mono">
                          {analysis.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cumulative propagation chart */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted mb-3 tracking-wider uppercase">Mức độ lan truyền</h3>
                    <div className="h-40 w-full bg-background border border-border rounded-lg p-3 pt-4">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorNodes" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isSuspicious ? "#2dd4bf" : "#38bdf8"} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={isSuspicious ? "#2dd4bf" : "#38bdf8"} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="#2a2a40" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                              itemStyle={{ color: isSuspicious ? "#2dd4bf" : "#38bdf8" }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="nodes" 
                              stroke={isSuspicious ? "#2dd4bf" : "#38bdf8"} 
                              fillOpacity={1} 
                              fill="url(#colorNodes)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted">
                          Chưa đủ sự kiện để vẽ biểu đồ.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
