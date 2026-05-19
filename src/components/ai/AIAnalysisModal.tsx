import type { Post } from "@/mocks/types"
import { motion, AnimatePresence } from "framer-motion"
import { X, Activity, ShieldAlert, GitMerge } from "lucide-react"
import { PropagationGraphScene } from "../3d/PropagationGraphScene"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"

interface AIAnalysisModalProps {
  post: Post
  onClose: () => void
}

const mockChartData = [
  { time: '0m', nodes: 0 },
  { time: '5m', nodes: 12 },
  { time: '10m', nodes: 45 },
  { time: '15m', nodes: 180 },
  { time: '20m', nodes: 890 },
  { time: '25m', nodes: 3200 },
  { time: '30m', nodes: 8400 },
]

export function AIAnalysisModal({ post, onClose }: AIAnalysisModalProps) {
  const isSuspicious = post.aiState === "suspicious"

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
            <PropagationGraphScene isSuspicious={isSuspicious} />
            
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
              <div className="bg-panel/ backdrop-blur-md border border-border rounded-lg p-3 inline-flex flex-col gap-1">
                <span className="text-xs text-muted font-semibold tracking-wider">BIỂU ĐỒ LAN TRUYỀN</span>
                <span className={cn("text-lg font-bold font-mono", isSuspicious ? "text-accent-pink" : "text-accent-blue")}>
                  {post.aiAnalysis?.propagationVelocity.toFixed(1)} N/s
                </span>
              </div>
            </div>
          </div>

          {/* Analysis Sidebar */}
          <div className="w-full md:w-[400px] bg-panel/ backdrop-blur-xl border-l border-border flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold tracking-wider text-foreground flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-accent-blue" />
                PHÂN TÍCH XAI
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                Chẩn đoán mô hình AI có thể diễn giải về sự lan truyền mạng lưới cấu trúc và sự bất thường của nội dung.
              </p>
            </div>

            <div className="p-6 flex-1 space-y-6">
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
                      {post.aiAnalysis?.riskLevel}
                    </div>
                  </div>
                  {isSuspicious && <ShieldAlert className="w-8 h-8 text-accent-pink" />}
                </div>
                
                <div className="space-y-2 relative">
                  <div className="flex justify-between text-xs text-muted">
                    <span>Xác suất Deepfake</span>
                    <span className="font-mono">{(post.aiAnalysis!.fakeProbability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all", isSuspicious ? "bg-accent-pink" : "bg-accent-blue")}
                      style={{ width: `${post.aiAnalysis!.fakeProbability * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Explanations */}
              <div>
                <h3 className="text-sm font-semibold text-muted mb-3 tracking-wider uppercase flex items-center gap-2">
                  <GitMerge className="w-4 h-4" />
                  Các yếu tố chính
                </h3>
                <div className="space-y-2">
                  {post.aiAnalysis?.reasons.map((reason, idx) => (
                    <div key={idx} className="bg-background border border-border rounded-lg p-3 text-sm text-muted flex items-start gap-3">
                      <div className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0", isSuspicious ? "bg-accent-pink" : "bg-accent-blue")} />
                      {reason}
                    </div>
                  ))}
                </div>
              </div>

              {/* Velocity Timeline Chart */}
              <div>
                <h3 className="text-sm font-semibold text-muted mb-3 tracking-wider uppercase">Vận tốc lây lan</h3>
                <div className="h-40 w-full bg-background border border-border rounded-lg p-3 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockChartData}>
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
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
