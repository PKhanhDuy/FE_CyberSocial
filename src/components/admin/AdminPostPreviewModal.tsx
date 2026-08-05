import { useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { PostCard } from "@/components/feed/PostCard"
import { usePostVerification } from "@/hooks/usePostVerification"
import { postApi } from "@/lib/api"
import { buildPostWithVerification } from "@/lib/postVerification"
import type { Post } from "@/mocks/types"

interface AdminPostPreviewModalProps {
  postId: string | null
  onClose: () => void
  onViewAnalysis?: (post: Post) => void
}

function AdminPostPreviewContent({
  postId,
  onViewAnalysis,
}: {
  postId: string
  onViewAnalysis?: (post: Post) => void
}) {
  const { data: post, isLoading, error } = useQuery({
    queryKey: ["admin-post-preview", postId],
    queryFn: () => postApi.get(postId),
  })

  const totalInteractions = post ? post.likes + post.comments + post.shares : 0
  const { verification } = usePostVerification(postId, totalInteractions)

  const displayPost = useMemo(
    () => (post ? buildPostWithVerification(post, verification) : null),
    [post, verification],
  )

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-panel px-4 py-8 text-center text-sm text-muted">
        Đang tải bài viết…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-8 text-center text-sm text-danger">
        {error instanceof Error ? error.message : "Không tải được bài viết."}
      </div>
    )
  }

  if (!displayPost) {
    return null
  }

  return (
    <PostCard
      post={displayPost}
      onViewAnalysis={onViewAnalysis ?? (() => {})}
    />
  )
}

export function AdminPostPreviewModal({
  postId,
  onClose,
  onViewAnalysis,
}: AdminPostPreviewModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    if (postId) window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [postId, onClose])

  if (typeof document === "undefined" || !postId) {
    return null
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          className="relative z-10 flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-base font-bold text-foreground">Xem bài viết</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-panel-hover hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-4">
            <AdminPostPreviewContent postId={postId} onViewAnalysis={onViewAnalysis} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}
