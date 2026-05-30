import type { Post } from "@/mocks/types"
import { Avatar } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Progress } from "@/components/ui/Progress"
import { Button } from "@/components/ui/Button"
import { Heart, MessageSquare, Repeat2, Share, ShieldAlert, ShieldCheck, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/useAuthStore"
import {useTranslation} from "react-i18next"

interface PostCardProps {
  post: Post
  onViewAnalysis: (post: Post) => void
}

export function PostCard({ post, onViewAnalysis }: PostCardProps) {
  const currentUser = useAuthStore((state) => state.user)
  const isSuspicious = post.aiState === "suspicious"
  const isVerified = post.aiState === "verified"
  const isMonitoring = post.aiState === "monitoring"
  const authorAvatar = currentUser?.id === post.author.id ? currentUser.avatar : post.author.avatar
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-panel rounded-xl overflow-hidden mb-6 transition-all duration-300",
        isSuspicious && "neon-border-pink",
        isVerified && "border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]",
        isMonitoring && "border-accent-blue/30"
      )}
    >
      {/* AI Header Status */}
      <div className={cn(
        "px-4 py-2 border-b flex justify-between items-center text-xs font-semibold tracking-wider",
        isSuspicious ? "bg-accent-pink/10 border-accent-pink/30 text-accent-pink" :
          isVerified ? "bg-green-500/10 border-green-500/30 text-green-400" :
            "bg-accent-blue/10 border-accent-blue/30 text-accent-blue"
      )}>
        <div className="flex items-center gap-2">
          {isSuspicious && <ShieldAlert className="w-4 h-4" />}
          {isVerified && <ShieldCheck className="w-4 h-4" />}
          {isMonitoring && <Activity className="w-4 h-4 animate-pulse" />}
          <span>
            {isSuspicious ? t("post.isSuspicious") :
              isVerified ? t("post.isVerified") :
                t("post.isMonitoring")}
          </span>
        </div>
        {isMonitoring && (
          <div className="flex items-center gap-2 w-32">
            <Progress value={Math.random() * 100} indicatorColor="bg-accent-blue" className="h-1.5" />
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar src={authorAvatar} fallback={post.author.username[0]} />
              {post.author.isOnline && (
                <span className="absolute bottom-0 right-0 block h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-[#0d0d1a]" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{post.author.username}</span>
                {post.author.isVerified && <Badge variant="verified">✓</Badge>}
              </div>
              <div className="text-muted text-sm flex items-center gap-2">
                <span>{post.author.handle}</span>
                <span>•</span>
                <span>{post.timestamp}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted">{t("post.trustScore")}</div>
            <div className={cn("font-mono font-bold", post.author.trustScore > 80 ? "text-green-400" : post.author.trustScore < 50 ? "text-accent-pink" : "text-yellow-400")}>
              {post.author.trustScore}%
            </div>
          </div>
        </div>

        {post.content && (
          <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
        )}

        {post.media && (
          <div className="rounded-lg overflow-hidden border border-border mb-4 relative">
            <img src={post.media} alt="Post media" className="w-full h-auto object-cover max-h-96" />
            {isSuspicious && (
              <div className="absolute inset-0 bg-accent-pink/10 pointer-events-none flex items-center justify-center">
                <div className="bg-panel/ backdrop-blur-md border border-accent-pink/50 text-accent-pink px-4 py-2 rounded-full font-bold text-sm tracking-wider uppercase flex items-center gap-2 shadow-[var(--shadow-neon-pink)]">
                  <ShieldAlert className="w-4 h-4" />
                  {t("post.fakeProbability")}: {(post.aiAnalysis!.fakeProbability * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        )}

        {isSuspicious && (
          <div className="bg-accent-pink/5 border border-accent-pink/30 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-accent-pink">{t("post.riskLevel")}: {post.aiAnalysis?.riskLevel}</span>
              <Button variant="neon-pink" size="sm" onClick={() => onViewAnalysis(post)}>
                {t("post.viewAnalysis")}
              </Button>
            </div>
            <ul className="text-xs text-muted space-y-1 list-disc pl-4">
              {post.aiAnalysis?.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-between items-center text-muted pt-4 border-t border-border">
          <button className="flex items-center gap-2 hover:text-accent-pink transition-colors group">
            <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm">{post.likes.toLocaleString()}</span>
          </button>
          <button className="flex items-center gap-2 hover:text-accent-blue transition-colors group">
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm">{post.comments.toLocaleString()}</span>
          </button>
          <button className="flex items-center gap-2 hover:text-green-400 transition-colors group">
            <Repeat2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm">{post.shares.toLocaleString()}</span>
          </button>
          <button className="flex items-center gap-2 hover:text-foreground transition-colors">
            <Share className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
