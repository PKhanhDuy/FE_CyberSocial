import { useMemo, useState, type FormEvent } from "react"
import type { Post } from "@/mocks/types"
import { Link } from "react-router-dom"
import { createPortal } from "react-dom"
import { Avatar } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Progress } from "@/components/ui/Progress"
import { Button } from "@/components/ui/Button"
import { Activity, FlaskConical, Heart, Link2, Loader2, MessageSquare, Repeat2, Send, Share2, ShieldAlert, ShieldCheck, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { demoApi, postApi, type DemoPropagationPattern } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore"
import { useTranslation } from "react-i18next"
import { optimizeCloudinaryImage } from "@/lib/media"
import { usePostVerification } from "@/hooks/usePostVerification"
import { buildPostWithVerification, isInteractionsLocked, resolvePostTrustScore } from "@/lib/postVerification"

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

const COMMENT_PAGE_SIZE = 10

function SharedPostPreview({ post }: { post: Post }) {
  const currentUser = useAuthStore((state) => state.user)
  const authorProfilePath = currentUser?.id === post.author.id ? "/profile" : `/users/${post.author.id}`
  const authorAvatar = currentUser?.id === post.author.id ? currentUser.avatar : post.author.avatar

  return (
    <div className="mb-4 rounded-lg border border-border bg-panel/60 overflow-hidden">
      <div className="p-4">
        <div className="mb-3 flex items-center gap-3">
          <Link
            to={authorProfilePath}
            className="relative shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <Avatar src={authorAvatar} fallback={post.author.username[0]} className="h-9 w-9" />
          </Link>
          <div className="min-w-0">
            <Link
              to={authorProfilePath}
              className="block truncate text-sm font-bold text-foreground hover:text-accent-blue transition-colors"
            >
              {post.author.username}
            </Link>
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
            <img
              src={optimizeCloudinaryImage(post.media, 900)}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-auto max-h-80 object-cover"
            />
          )}
        </div>
      )}
    </div>
  )
}

export function PostCard({ post, onViewAnalysis, onRepostCreated }: PostCardProps) {
  const currentUser = useAuthStore((state) => state.user)
  const isAdmin = currentUser?.role === "ADMIN"
  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked))
  const [likeCount, setLikeCount] = useState(post.likes)
  const [commentCount, setCommentCount] = useState(post.comments)
  const [shareCount, setShareCount] = useState(post.shares)
  const [isSavingLike, setIsSavingLike] = useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [hasLoadedComments, setHasLoadedComments] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [commentPage, setCommentPage] = useState(0)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentDraft, setCommentDraft] = useState("")
  const [localComments, setLocalComments] = useState<LocalComment[]>([])
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareText, setShareText] = useState("")
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const [isSimulatingDemo, setIsSimulatingDemo] = useState(false)
  const [demoResult, setDemoResult] = useState<string | null>(null)
  const [demoForm, setDemoForm] = useState({
    demoUserCount: 50,
    shares: 40,
    likes: 80,
    comments: 15,
    durationSeconds: 60,
    pattern: "VIRAL_BURST" as DemoPropagationPattern,
  })
  const { t } = useTranslation()
  const contentPostId = post.sharedPost?.id ?? post.id
  const totalInteractions = likeCount + commentCount + shareCount
  const { verification, refetch: refetchVerification } = usePostVerification(contentPostId, totalInteractions)
  const displayPost = useMemo(
    () => buildPostWithVerification(
      {
        ...post,
        likes: likeCount,
        comments: commentCount,
        shares: shareCount,
        isLiked,
      },
      verification,
    ),
    [post, verification, likeCount, commentCount, shareCount, isLiked],
  )
  const isLabelRejected = verification?.adminDecision === "REJECT_LABEL"
  const aiPredictedFake = displayPost.aiState === "suspicious"
  const isSuspicious = aiPredictedFake && (!isLabelRejected || isAdmin)
  const isVerified = displayPost.aiState === "verified"
  const isAnalyzing = verification?.status === "ANALYZING"
  const isPending = verification?.status === "PENDING" && (verification.nextThreshold ?? 0) > 0
  const isFailed = verification?.status === "FAILED"
  const isMonitoring = !isSuspicious && !isVerified
  const showAiHeader = isAdmin || isAnalyzing || isSuspicious || isVerified
  const interactionProgress = verification?.nextThreshold
    ? Math.min(100, Math.round((totalInteractions / verification.nextThreshold) * 100))
    : 0
  const showInteractionProgress = Boolean(
    isAdmin
    && verification?.nextThreshold
    && verification.nextThreshold > 0
    && !isAnalyzing,
  )
  const passedFirstThreshold = verification?.status === "PENDING"
    && (verification.analysisTier ?? 0) === 0
    && totalInteractions >= 5
  const postTrustScore = resolvePostTrustScore(verification)
  const showTrustScore = isAdmin || !isLabelRejected
  const headerStatusText = isAnalyzing
    ? t("post.aiAnalyzing")
    : isFailed
      ? t("post.aiAnalysisFailed")
      : passedFirstThreshold
        ? t("post.awaitingFirstAnalysis")
        : isPending
          ? t("post.waitingInteractions", { current: totalInteractions, target: verification!.nextThreshold })
        : isSuspicious
          ? isAdmin && isLabelRejected
            ? t("post.adminAiPredictedFake")
            : t("post.isSuspicious")
          : isVerified
            ? t("post.isVerified")
            : t("post.isMonitoring")
  const authorAvatar = currentUser?.id === post.author.id ? currentUser.avatar : post.author.avatar
  const authorProfilePath = currentUser?.id === post.author.id ? "/profile" : `/users/${post.author.id}`
  const interactionsLocked = isInteractionsLocked(verification)
  const canInteract = Boolean(currentUser) && !interactionsLocked
  const lockedTitle = t("post.actions.interactionsLocked")

  const toggleLike = async () => {
    if (isSavingLike || interactionsLocked) return

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
      void refetchVerification()
    } catch (error) {
      setIsLiked(previousLiked)
      setLikeCount(previousLikeCount)
      setActionError(error instanceof Error ? error.message : t("post.actions.actionError"))
    } finally {
      setIsSavingLike(false)
    }
  }

  const loadCommentsPage = async (page: number) => {
    if (isLoadingComments) return
    setIsLoadingComments(true)
    setActionError(null)
    try {
      const response = await postApi.comments(post.id, page, COMMENT_PAGE_SIZE)
      setLocalComments((comments) => {
        if (page === 0) return response.content

        const existingIds = new Set(comments.map((comment) => comment.id))
        const nextComments = response.content.filter((comment) => !existingIds.has(comment.id))
        return [...comments, ...nextComments]
      })
      setCommentPage(response.page)
      setHasMoreComments(!response.last)
      setHasLoadedComments(true)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("post.actions.actionError"))
    } finally {
      setIsLoadingComments(false)
    }
  }

  const toggleComments = async () => {
    if (interactionsLocked) return
    const nextOpen = !isCommentsOpen
    setIsCommentsOpen(nextOpen)
    if (!nextOpen || hasLoadedComments || isLoadingComments) return

    await loadCommentsPage(0)
  }

  const loadMoreComments = () => {
    if (!hasMoreComments || isLoadingComments) return
    void loadCommentsPage(commentPage + 1)
  }

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = commentDraft.trim()
    if (!text || isSubmittingComment || interactionsLocked) return

    setIsSubmittingComment(true)
    setActionError(null)
    try {
      const comment = await postApi.comment(post.id, text)
      setLocalComments((comments) => [...comments, comment])
      setCommentCount((count) => count + 1)
      setCommentDraft("")
      setIsCommentsOpen(true)
      setHasLoadedComments(true)
      void refetchVerification()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("post.actions.actionError"))
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const submitShare = async (content: string) => {
    if (!currentUser || isSharing || interactionsLocked) return

    setIsSharing(true)
    setActionError(null)
    try {
      const repost = await postApi.share(post.id, content, {
        viaShareId: post.viaShareId,
      })
      setShareCount((count) => count + 1)
      setShareText("")
      setIsShareOpen(false)
      onRepostCreated?.(repost)
      window.dispatchEvent(new Event("cybersocial:post-created"))
      void refetchVerification()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("post.actions.actionError"))
    } finally {
      setIsSharing(false)
    }
  }

  const submitInstantRepost = async () => {
    await submitShare("")
  }

  const submitShareWithComment = async () => {
    const trimmed = shareText.trim()
    if (!trimmed) return
    await submitShare(trimmed)
  }

  const copyPostLink = async () => {
    if (interactionsLocked) return
    const postId = post.sharedPost?.id ?? post.id
    const url = `${window.location.origin}/?post=${postId}`
    setActionError(null)
    try {
      await navigator.clipboard.writeText(url)
      setCopyFeedback(t("post.actions.linkCopied"))
      window.setTimeout(() => setCopyFeedback(null), 2000)
    } catch {
      setActionError(t("post.actions.actionError"))
    }
  }

  const updateDemoNumber = (key: "demoUserCount" | "shares" | "likes" | "comments" | "durationSeconds", value: string) => {
    const parsedValue = Number.parseInt(value, 10)
    setDemoForm((current) => ({
      ...current,
      [key]: Number.isNaN(parsedValue) ? 0 : parsedValue,
    }))
  }

  const submitPropagationDemo = async () => {
    if (isSimulatingDemo) return

    setIsSimulatingDemo(true)
    setActionError(null)
    setDemoResult(null)
    try {
      const result = await demoApi.simulatePropagation({
        postId: post.id,
        ...demoForm,
      })
      setLikeCount(result.totalLikes)
      setCommentCount(result.totalComments)
      setShareCount(result.totalShares)
      setLocalComments([])
      setHasLoadedComments(false)
      setCommentPage(0)
      setHasMoreComments(result.totalComments > 0)
      setDemoResult(`Created ${result.sharesCreated} shares, ${result.likesCreated} likes, ${result.commentsCreated} comments.`)
      window.dispatchEvent(new Event("cybersocial:post-created"))
      void refetchVerification()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not run propagation demo.")
    } finally {
      setIsSimulatingDemo(false)
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
        ((isAdmin && isMonitoring) || isAnalyzing) && "border-accent-blue/30"
      )}
    >
      {/* AI Header Status */}
      {showAiHeader && (
        <div className={cn(
          "px-4 py-2 border-b flex justify-between items-center text-xs font-semibold tracking-wider",
          isSuspicious ? "bg-accent-pink/10 border-accent-pink/30 text-accent-pink" :
            isVerified ? "bg-green-500/10 border-green-500/30 text-green-400" :
              isFailed ? "bg-danger/10 border-danger/30 text-danger" :
                "bg-accent-blue/10 border-accent-blue/30 text-accent-blue"
        )}>
          <div className="flex items-center gap-2 min-w-0">
            {isSuspicious && <ShieldAlert className="w-4 h-4 shrink-0" />}
            {isVerified && <ShieldCheck className="w-4 h-4 shrink-0" />}
            {(isMonitoring || isAnalyzing || isPending) && (
              isAnalyzing
                ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                : <Activity className="w-4 h-4 shrink-0 animate-pulse" />
            )}
            <span className="truncate">{headerStatusText}</span>
            {verification?.status === "COMPLETED" && verification.label && (
              <Badge variant={verification.label === "FAKE" ? "suspicious" : "verified"} className="shrink-0">
                {verification.label === "FAKE" ? t("post.labelFake") : t("post.labelReal")}
              </Badge>
            )}
            {isAdmin && isLabelRejected && (
              <span className="shrink-0 rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
                {t("post.adminRejectedLabel")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {showInteractionProgress && (
              <div className="hidden sm:flex items-center gap-2 w-32">
                <Progress value={interactionProgress} indicatorColor="bg-accent-blue" className="h-1.5" />
                <span className="font-mono text-[10px] text-muted">{interactionProgress}%</span>
              </div>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsDemoOpen(true)}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-accent-blue/40 bg-accent-blue/10 px-3 text-xs font-bold text-accent-blue transition-colors hover:bg-accent-blue/20"
                title="Demo propagation"
              >
                <FlaskConical className="h-4 w-4" />
                Demo
              </button>
            )}
          </div>
        </div>
      )}

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
          {showTrustScore && (
            <div className="text-right">
              <div className="text-xs text-muted">{t("post.trustScore")}</div>
              {postTrustScore != null ? (
                <div className={cn(
                  "font-mono font-bold",
                  postTrustScore > 80 ? "text-green-400" : postTrustScore < 50 ? "text-accent-pink" : "text-yellow-400",
                )}>
                  {postTrustScore}%
                </div>
              ) : isAnalyzing ? (
                <div className="font-mono font-bold text-accent-blue animate-pulse">...</div>
              ) : (
                <div className="font-mono font-bold text-muted" title={t("post.trustScorePending")}>—</div>
              )}
            </div>
          )}
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
              <img
                src={optimizeCloudinaryImage(post.media, 1200)}
                alt="Post media"
                loading="lazy"
                decoding="async"
                className="w-full h-auto object-cover max-h-96"
              />
            )}
            {isSuspicious && displayPost.aiAnalysis && (
              <div className="absolute inset-0 bg-accent-pink/10 pointer-events-none flex items-center justify-center">
                <div className="bg-panel/ backdrop-blur-md border border-accent-pink/50 text-accent-pink px-4 py-2 rounded-full font-bold text-sm tracking-wider uppercase flex items-center gap-2 shadow-[var(--shadow-neon-pink)]">
                  <ShieldAlert className="w-4 h-4" />
                  {t("post.fakeProbability")}: {(displayPost.aiAnalysis.fakeProbability * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        )}

        {isSuspicious && displayPost.aiAnalysis && (
          <div className="bg-accent-pink/5 border border-accent-pink/30 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-accent-pink">{t("post.riskLevel")}: {displayPost.aiAnalysis.riskLevel}</span>
              <Button variant="neon-pink" size="sm" onClick={() => onViewAnalysis(displayPost)}>
                {t("post.viewAnalysis")}
              </Button>
            </div>
            <ul className="text-xs text-muted space-y-1 list-disc pl-4">
              {displayPost.aiAnalysis.headline && (
                <li className="font-medium text-foreground list-none -ml-4 mb-1">{displayPost.aiAnalysis.headline}</li>
              )}
              {displayPost.aiAnalysis.reasons.slice(0, displayPost.aiAnalysis.headline ? 2 : 3).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {isVerified && displayPost.aiAnalysis && (
          <div className="bg-green-500/5 border border-green-500/30 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-green-400">{t("post.riskLevel")}: {displayPost.aiAnalysis.riskLevel}</span>
              <Button variant="outline" size="sm" onClick={() => onViewAnalysis(displayPost)}>
                {t("post.viewAnalysis")}
              </Button>
            </div>
          </div>
        )}

        {interactionsLocked && (
          <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
            {lockedTitle}
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
            title={interactionsLocked ? lockedTitle : isLiked ? t("post.actions.unlike") : t("post.actions.like")}
          >
            <Heart className={cn("w-5 h-5 group-hover:scale-110 transition-transform", isLiked && "fill-current")} />
            <span className="text-sm">{likeCount.toLocaleString()}</span>
          </button>
          <button
            type="button"
            onClick={toggleComments}
            disabled={interactionsLocked}
            className={cn(
              "flex items-center gap-2 transition-colors group disabled:cursor-not-allowed disabled:opacity-50",
              isCommentsOpen ? "text-accent-blue" : "hover:text-accent-blue"
            )}
            aria-expanded={isCommentsOpen}
            title={interactionsLocked ? lockedTitle : t("post.actions.comment")}
          >
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm">{commentCount.toLocaleString()}</span>
          </button>
          <button
            type="button"
            onClick={() => void submitInstantRepost()}
            disabled={!canInteract || isSharing}
            className="flex items-center gap-2 hover:text-green-400 transition-colors group disabled:cursor-not-allowed disabled:opacity-50"
            title={interactionsLocked ? lockedTitle : t("post.actions.repost")}
          >
            <Repeat2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm">{shareCount.toLocaleString()}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (interactionsLocked) return
              setActionError(null)
              setIsShareOpen(true)
            }}
            disabled={!canInteract || isSharing}
            className="flex items-center gap-2 hover:text-accent-blue transition-colors group disabled:cursor-not-allowed disabled:opacity-50"
            title={interactionsLocked ? lockedTitle : t("post.actions.share")}
          >
            <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          <button
            type="button"
            onClick={() => void copyPostLink()}
            disabled={!canInteract}
            className="flex items-center gap-2 hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            title={interactionsLocked ? lockedTitle : t("post.actions.copyLink")}
          >
            <Link2 className="w-5 h-5" />
          </button>
        </div>

        {copyFeedback && (
          <div className="mt-4 rounded-lg border border-accent-blue/40 bg-accent-blue/10 px-3 py-2 text-sm text-foreground">
            {copyFeedback}
          </div>
        )}

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
                {localComments.map((comment) => {
                  const commentAuthorProfilePath =
                    currentUser?.id === comment.author.id ? "/profile" : `/users/${comment.author.id}`
                  return (
                  <div key={comment.id} className="flex gap-3">
                    <Link
                      to={commentAuthorProfilePath}
                      className="relative shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    >
                      <Avatar src={comment.author.avatar} fallback={comment.author.username[0]} className="h-8 w-8" />
                    </Link>
                    <div className="min-w-0 flex-1 rounded-lg bg-panel px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Link
                          to={commentAuthorProfilePath}
                          className="text-sm font-bold text-foreground hover:text-accent-blue transition-colors"
                        >
                          {comment.author.username}
                        </Link>
                        <span className="text-xs text-muted">{comment.timestamp}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>
                  )
                })}
                {hasMoreComments && (
                  <button
                    type="button"
                    onClick={loadMoreComments}
                    disabled={isLoadingComments}
                    className="w-full rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm font-semibold text-accent-blue transition-colors hover:bg-panel-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoadingComments ? t("post.actions.loadingComments") : "Xem thêm bình luận"}
                  </button>
                )}
                <form onSubmit={submitComment} className="flex items-center gap-2 pt-1">
                  <Avatar src={currentUser?.avatar ?? post.author.avatar} fallback={(currentUser?.username ?? post.author.username)[0]} className="h-8 w-8" />
                  <input
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder={t("post.actions.commentPlaceholder")}
                    disabled={interactionsLocked}
                    className="h-10 flex-1 rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!commentDraft.trim() || isSubmittingComment || interactionsLocked}
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
          {isShareOpen && (
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
                  <h2 className="text-base font-bold text-foreground">{t("post.actions.shareTitle")}</h2>
                  <button
                    type="button"
                    onClick={() => setIsShareOpen(false)}
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
                      <div className="text-xs text-muted">{t("post.actions.shareAudience")}</div>
                    </div>
                  </div>
                  <textarea
                    value={shareText}
                    onChange={(event) => setShareText(event.target.value)}
                    placeholder={t("post.actions.sharePlaceholder")}
                    className="mb-4 min-h-28 w-full resize-none rounded-lg border border-border bg-panel px-3 py-3 text-sm text-foreground outline-none focus:border-accent-blue"
                  />
                  <SharedPostPreview post={post.sharedPost ?? post} />
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-border bg-panel/80 px-4 py-3">
                  <Button type="button" variant="outline" onClick={() => setIsShareOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="button" variant="neon-blue" className="gap-2" onClick={() => void submitShareWithComment()} disabled={!canInteract || isSharing || !shareText.trim()}>
                    <Share2 className="h-4 w-4" />
                    {isSharing ? `${t("post.actions.shareSubmit")}...` : t("post.actions.shareSubmit")}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isAdmin && isDemoOpen && (
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
                className="glass-panel w-full max-w-lg overflow-hidden rounded-xl border border-border shadow-[var(--shadow-neon-blue)]"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h2 className="text-base font-bold text-foreground">Propagation demo</h2>
                  <button
                    type="button"
                    onClick={() => setIsDemoOpen(false)}
                    aria-label={t("common.cancel")}
                    className="h-9 w-9 rounded-full text-muted hover:bg-panel-hover hover:text-foreground flex items-center justify-center transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 p-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">Pattern</label>
                    <select
                      value={demoForm.pattern}
                      onChange={(event) => setDemoForm((current) => ({
                        ...current,
                        pattern: event.target.value as DemoPropagationPattern,
                      }))}
                      className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent-blue"
                    >
                      <option value="VIRAL_BURST">Viral burst</option>
                      <option value="COORDINATED">Coordinated</option>
                      <option value="CHAIN">Share chain (cây phân nhánh)</option>
                      <option value="ORGANIC">Organic</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">Demo users</span>
                      <input
                        type="number"
                        min={1}
                        max={300}
                        value={demoForm.demoUserCount}
                        onChange={(event) => updateDemoNumber("demoUserCount", event.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent-blue"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">Duration</span>
                      <input
                        type="number"
                        min={1}
                        max={3600}
                        value={demoForm.durationSeconds}
                        onChange={(event) => updateDemoNumber("durationSeconds", event.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent-blue"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">Shares</span>
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={demoForm.shares}
                        onChange={(event) => updateDemoNumber("shares", event.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent-blue"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">Likes</span>
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={demoForm.likes}
                        onChange={(event) => updateDemoNumber("likes", event.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent-blue"
                      />
                    </label>
                    <label className="col-span-2 block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">Comments</span>
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={demoForm.comments}
                        onChange={(event) => updateDemoNumber("comments", event.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-accent-blue"
                      />
                    </label>
                  </div>

                  {demoResult && (
                    <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                      {demoResult}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border bg-panel/80 px-4 py-3">
                  <Button type="button" variant="outline" onClick={() => setIsDemoOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="button" variant="neon-blue" className="gap-2" onClick={submitPropagationDemo} disabled={isSimulatingDemo}>
                    <FlaskConical className="h-4 w-4" />
                    {isSimulatingDemo ? "Running..." : "Run demo"}
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
