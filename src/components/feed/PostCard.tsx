import { useState, type FormEvent } from "react"
import type { Post } from "@/mocks/types"
import { Link } from "react-router-dom"
import { createPortal } from "react-dom"
import { Avatar } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Progress } from "@/components/ui/Progress"
import { Button } from "@/components/ui/Button"
import { Activity, Heart, MessageSquare, Repeat2, Send, Share, ShieldAlert, ShieldCheck, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { postApi } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore"
import { useTranslation } from "react-i18next"

interface PostCardProps {
  post: Post
  onViewAnalysis: (post: Post) => void
  onRepostCreated?: (post: Post) => void
}

interface LocalComment {
  id: string
  author: {
    id: string
    username: string
    avatar: string
  }
  content: string
  timestamp: string
}

const isVideoMedia = (url: string) => {
  const normalizedUrl = url.toLowerCase().split("?")[0]
  return normalizedUrl.includes("/video/upload/") || /\.(mp4|webm|mov|m4v|ogg)$/.test(normalizedUrl)
}

function SharedPostPreview({ post }: { post: Post }) {
  return (
    <div className="mb-4 rounded-lg border border-border bg-panel/60 overflow-hidden">
      <div className="p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar src={post.author.avatar} fallback={post.author.username[0]} className="h-9 w-9" />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-foreground">{post.author.username}</div>
            <div className="text-xs text-muted">{post.timestamp}</div>
          </div>
        </div>
        {post.content && <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>}
      </div>
      {post.media && (
        <div className="border-t border-border bg-background">
          {isVideoMedia(post.media) ? (
            <video src={post.media} controls className="w-full h-auto max-h-80 bg-black" />
          ) : (
            <img src={post.media} alt="" className="w-full h-auto max-h-80 object-cover" />
          )}
        </div>
      )}
    </div>
  )
}

export function PostCard({ post, onViewAnalysis, onRepostCreated }: PostCardProps) {
  const currentUser = useAuthStore((state) => state.user)
  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked))
  const [likeCount, setLikeCount] = useState(post.likes)
  const [commentCount, setCommentCount] = useState(post.comments)
  const [shareCount, setShareCount] = useState(post.shares)
  const [isSavingLike, setIsSavingLike] = useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [hasLoadedComments, setHasLoadedComments] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentDraft, setCommentDraft] = useState("")
  const [localComments, setLocalComments] = useState<LocalComment[]>([])
  const [isRepostOpen, setIsRepostOpen] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [repostText, setRepostText] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)
  const isSuspicious = post.aiState === "suspicious"
  const isVerified = post.aiState === "verified"
  const isMonitoring = post.aiState === "monitoring"
  const authorAvatar = currentUser?.id === post.author.id ? currentUser.avatar : post.author.avatar
  const authorProfilePath = currentUser?.id === post.author.id ? "/profile" : `/users/${post.author.id}`
  const { t } = useTranslation()
  const canInteract = Boolean(currentUser)

  const toggleLike = async () => {
    if (isSavingLike) return

    const nextLiked = !isLiked
    const previousLiked = isLiked
    const previousLikeCount = likeCount
    setActionError(null)
    setIsSavingLike(true)
    setIsLiked(nextLiked)
    setLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)))

    try {
      const updatedPost = nextLiked ? await postApi.like(post.id) : await postApi.unlike(post.id)
      setIsLiked(Boolean(updatedPost.isLiked))
      setLikeCount(updatedPost.likes)
      setCommentCount(updatedPost.comments)
      setShareCount(updatedPost.shares)
    } catch (error) {
      setIsLiked(previousLiked)
      setLikeCount(previousLikeCount)
      setActionError(error instanceof Error ? error.message : t("post.actions.actionError"))
    } finally {
      setIsSavingLike(false)
    }
  }

  const toggleComments = async () => {
    const nextOpen = !isCommentsOpen
    setIsCommentsOpen(nextOpen)
    if (!nextOpen || hasLoadedComments || isLoadingComments) return

    setIsLoadingComments(true)
    setActionError(null)
    try {
      setLocalComments(await postApi.comments(post.id))
      setHasLoadedComments(true)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("post.actions.actionError"))
    } finally {
      setIsLoadingComments(false)
    }
  }

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = commentDraft.trim()
    if (!text || isSubmittingComment) return

    setIsSubmittingComment(true)
    setActionError(null)
    try {
      const comment = await postApi.comment(post.id, text)
      setLocalComments((comments) => [...comments, comment])
      setCommentCount((count) => count + 1)
      setCommentDraft("")
      setIsCommentsOpen(true)
      setHasLoadedComments(true)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("post.actions.actionError"))
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const submitRepost = async () => {
    if (!currentUser || !onRepostCreated || isSharing) return

    setIsSharing(true)
    setActionError(null)
    try {
      const share = await postApi.share(post.id, repostText.trim())
      setShareCount((count) => count + 1)
      setRepostText("")
      setIsRepostOpen(false)
      onRepostCreated({
        id: share.id,
        author: currentUser,
        content: share.content ?? "",
        timestamp: t("post.actions.justNow"),
        likes: 0,
        comments: 0,
        shares: 0,
        aiState: "monitoring",
        sharedPost: post,
      })
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("post.actions.actionError"))
    } finally {
      setIsSharing(false)
    }
  }

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
            <Link to={authorProfilePath} className="relative shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-blue">
              <Avatar src={authorAvatar} fallback={post.author.username[0]} />
              {post.author.isOnline && (
                <span className="absolute bottom-0 right-0 block h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-[#0d0d1a]" />
                </span>
              )}
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link to={authorProfilePath} className="font-bold text-foreground hover:text-accent-blue transition-colors">
                  {post.author.username}
                </Link>
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

        {post.sharedPost && <SharedPostPreview post={post.sharedPost} />}

        {post.media && (
          <div className="rounded-lg overflow-hidden border border-border mb-4 relative">
            {isVideoMedia(post.media) ? (
              <video src={post.media} controls className="w-full h-auto max-h-96 bg-black" />
            ) : (
              <img src={post.media} alt="Post media" className="w-full h-auto object-cover max-h-96" />
            )}
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
          <button
            type="button"
            onClick={toggleLike}
            disabled={!canInteract || isSavingLike}
            className={cn(
              "flex items-center gap-2 transition-colors group disabled:cursor-not-allowed disabled:opacity-50",
              isLiked ? "text-accent-pink" : "hover:text-accent-pink"
            )}
            aria-pressed={isLiked}
            title={isLiked ? t("post.actions.unlike") : t("post.actions.like")}
          >
            <Heart className={cn("w-5 h-5 group-hover:scale-110 transition-transform", isLiked && "fill-current")} />
            <span className="text-sm">{likeCount.toLocaleString()}</span>
          </button>
          <button
            type="button"
            onClick={toggleComments}
            className={cn(
              "flex items-center gap-2 transition-colors group",
              isCommentsOpen ? "text-accent-blue" : "hover:text-accent-blue"
            )}
            aria-expanded={isCommentsOpen}
            title={t("post.actions.comment")}
          >
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm">{commentCount.toLocaleString()}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRepostOpen(true)}
            disabled={!canInteract || !onRepostCreated || isSharing}
            className="flex items-center gap-2 hover:text-green-400 transition-colors group disabled:cursor-not-allowed disabled:opacity-50"
            title={t("post.actions.repost")}
          >
            <Repeat2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm">{shareCount.toLocaleString()}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRepostOpen(true)}
            disabled={!canInteract || !onRepostCreated || isSharing}
            className="flex items-center gap-2 hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            title={t("post.actions.share")}
          >
            <Share className="w-5 h-5" />
          </button>
        </div>

        {actionError && (
          <div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-foreground">
            {actionError}
          </div>
        )}

        <AnimatePresence>
          {isCommentsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                {isLoadingComments && (
                  <div className="rounded-lg border border-border bg-panel/50 px-3 py-3 text-sm text-muted">
                    {t("post.actions.loadingComments")}
                  </div>
                )}
                {!isLoadingComments && localComments.length === 0 && (
                  <div className="rounded-lg border border-border bg-panel/50 px-3 py-3 text-sm text-muted">
                    {t("post.actions.noComments")}
                  </div>
                )}
                {localComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar src={comment.author.avatar} fallback={comment.author.username[0]} className="h-8 w-8" />
                    <div className="min-w-0 flex-1 rounded-lg bg-panel px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{comment.author.username}</span>
                        <span className="text-xs text-muted">{comment.timestamp}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}
                <form onSubmit={submitComment} className="flex items-center gap-2 pt-1">
                  <Avatar src={currentUser?.avatar ?? post.author.avatar} fallback={(currentUser?.username ?? post.author.username)[0]} className="h-8 w-8" />
                  <input
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder={t("post.actions.commentPlaceholder")}
                    className="h-10 flex-1 rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent-blue"
                  />
                  <button
                    type="submit"
                    disabled={!commentDraft.trim() || isSubmittingComment}
                    className="h-10 w-10 rounded-lg border border-accent-blue/40 bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-colors"
                    title={t("post.actions.postComment")}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isRepostOpen && (
            <motion.div
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                className="glass-panel w-full max-w-xl overflow-hidden rounded-xl border border-border shadow-[var(--shadow-neon-blue)]"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h2 className="text-base font-bold text-foreground">{t("post.actions.repostTitle")}</h2>
                  <button
                    type="button"
                    onClick={() => setIsRepostOpen(false)}
                    aria-label={t("common.cancel")}
                    className="h-9 w-9 rounded-full text-muted hover:bg-panel-hover hover:text-foreground flex items-center justify-center transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="max-h-[75vh] overflow-y-auto p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <Avatar src={currentUser?.avatar ?? post.author.avatar} fallback={(currentUser?.username ?? post.author.username)[0]} />
                    <div>
                      <div className="font-bold text-foreground">{currentUser?.username ?? post.author.username}</div>
                      <div className="text-xs text-muted">{t("post.actions.repostAudience")}</div>
                    </div>
                  </div>
                  <textarea
                    value={repostText}
                    onChange={(event) => setRepostText(event.target.value)}
                    placeholder={t("post.actions.repostPlaceholder")}
                    className="mb-4 min-h-28 w-full resize-none rounded-lg border border-border bg-panel px-3 py-3 text-sm text-foreground outline-none focus:border-accent-blue"
                  />
                  <SharedPostPreview post={post} />
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-border bg-panel/80 px-4 py-3">
                  <Button type="button" variant="outline" onClick={() => setIsRepostOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="button" variant="neon-blue" className="gap-2" onClick={submitRepost} disabled={!canInteract || isSharing}>
                    <Repeat2 className="h-4 w-4" />
                    {isSharing ? `${t("post.actions.repostSubmit")}...` : t("post.actions.repostSubmit")}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  )
}
