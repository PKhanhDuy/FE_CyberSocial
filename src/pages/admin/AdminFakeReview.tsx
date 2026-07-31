import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Zap } from "lucide-react"
import { adminApi, type AdminFakePost, type AdminVerdictDecision } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { PageHeader, AdminCard, AdminPagination, RiskBadge } from "@/components/admin/AdminBits"
import { AdminReasonModal } from "@/components/admin/AdminReasonModal"
import { AdminPostPreviewModal } from "@/components/admin/AdminPostPreviewModal"
import { AIAnalysisModal } from "@/components/ai/AIAnalysisModal"
import type { Post } from "@/mocks/types"

const CONFIRM_REASONS = ["Sai sự thật", "Chưa kiểm chứng", "Gây hiểu nhầm"]
const REJECT_REASONS = ["AI nhận định sai", "Nguồn đã xác thực", "Nội dung châm biếm/giải trí"]
const FAKE_POSTS_PAGE_SIZE = 15

const riskTone: Record<string, string> = { HIGH: "text-danger", MEDIUM: "text-warning", LOW: "text-success" }
const stripeTone: Record<string, string> = { HIGH: "bg-danger", MEDIUM: "bg-warning", LOW: "bg-success" }

type Pending = { decision: AdminVerdictDecision; post: AdminFakePost } | null

export function AdminFakeReview() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [pending, setPending] = useState<Pending>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewingPostId, setViewingPostId] = useState<string | null>(null)
  const [analysisPost, setAnalysisPost] = useState<Post | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-fake-posts", page],
    queryFn: () => adminApi.listFakePosts({ page, size: FAKE_POSTS_PAGE_SIZE }),
  })

  const mutation = useMutation({
    mutationFn: ({ postId, decision, note }: { postId: string; decision: AdminVerdictDecision; note: string }) =>
      adminApi.applyVerdict(postId, decision, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-fake-posts"] })
      setPending(null)
      setError(null)
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Xử lý thất bại"),
  })

  const posts = data?.content ?? []

  return (
    <div>
      <PageHeader
        title="Giám sát tin giả"
        description="Duyệt bài bị AI gán nhãn nghi vấn. Xác nhận (dán nhãn cảnh báo công khai) hoặc bác bỏ nhãn."
      />

      <AdminCard>
        {isLoading && <div className="p-8 text-center text-muted">Đang tải…</div>}
        {!isLoading && posts.length === 0 && (
          <div className="p-8 text-center text-muted">Không có bài nào bị gắn nhãn tin giả.</div>
        )}
        {!isLoading && posts.length > 0 && (
          <div className="space-y-4 p-4">
            {posts.map((post) => {
              const level = post.riskLevel ?? "MEDIUM"
              const pct = Math.round((post.fakeProbability ?? 0) * 100)
              return (
                <div key={post.postId} className="flex overflow-hidden rounded-xl border border-border bg-background">
                  <div className={cn("w-1.5 flex-none", stripeTone[level])} />
                  <div className="flex-1 p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className={cn("font-mono text-lg font-bold", riskTone[level])}>{pct}%</span>
                      <RiskBadge risk={level} probability={post.fakeProbability} />
                      <span className="rounded border border-danger/40 px-2 py-0.5 font-mono text-xs text-danger">
                        {post.label ?? "FAKE"}
                      </span>
                      {post.publicLabel && (
                        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                          Đã dán nhãn công khai
                        </span>
                      )}
                      {post.adminDecision === "REJECT_LABEL" && (
                        <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                          Đã bác bỏ nhãn
                        </span>
                      )}
                      {post.reviewedAt && (
                        <span className="ml-auto text-xs text-muted">
                          duyệt {new Date(post.reviewedAt).toLocaleString("vi-VN")}
                        </span>
                      )}
                    </div>

                    <p className="mb-3 text-sm text-foreground">
                      "{post.contentPreview}" — <span className="text-muted">{post.authorDisplayName}</span>
                    </p>

                    <div className="mb-3 flex items-center gap-2 text-xs text-muted">
                      <Zap className="h-3.5 w-3.5 text-accent-blue" />
                      Phân tích TGNN{" "}
                      {post.lastAnalyzedAt && `· ${new Date(post.lastAnalyzedAt).toLocaleDateString("vi-VN")}`}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-dashed border-border pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingPostId(post.postId)}
                      >
                        Xem
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setError(null)
                          setPending({ decision: "REJECT_LABEL", post })
                        }}
                      >
                        Bác bỏ nhãn
                      </Button>
                      <Button
                        variant="neon-pink"
                        size="sm"
                        onClick={() => {
                          setError(null)
                          setPending({ decision: "CONFIRM_FAKE", post })
                        }}
                      >
                        Xác nhận tin giả
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <AdminPagination
          page={data?.page ?? page}
          totalPages={data?.totalPages ?? 0}
          totalElements={data?.totalElements ?? 0}
          pageSize={FAKE_POSTS_PAGE_SIZE}
          onPageChange={setPage}
          disabled={isLoading || isFetching}
        />
      </AdminCard>

      <AdminReasonModal
        open={pending?.decision === "CONFIRM_FAKE"}
        title="Xác nhận tin giả"
        description='Đồng ý với AI: dán nhãn cảnh báo công khai "Thông tin chưa kiểm chứng", giữ hiển thị bài viết.'
        reasonOptions={CONFIRM_REASONS}
        reasonLabel="Kết luận"
        confirmLabel="Dán nhãn cảnh báo"
        tone="danger"
        loading={mutation.isPending}
        error={error}
        onCancel={() => setPending(null)}
        onConfirm={(note) =>
          pending && mutation.mutate({ postId: pending.post.postId, decision: "CONFIRM_FAKE", note })
        }
      />

      <AdminReasonModal
        open={pending?.decision === "REJECT_LABEL"}
        title="Bác bỏ nhãn AI"
        description="Xác định đây là tin chuẩn: gỡ nhãn nghi vấn, trả bài về hiển thị bình thường."
        reasonOptions={REJECT_REASONS}
        reasonLabel="Lý do bác bỏ"
        confirmLabel="Gỡ nhãn nghi vấn"
        tone="primary"
        loading={mutation.isPending}
        error={error}
        onCancel={() => setPending(null)}
        onConfirm={(note) =>
          pending && mutation.mutate({ postId: pending.post.postId, decision: "REJECT_LABEL", note })
        }
      />

      <AdminPostPreviewModal
        postId={viewingPostId}
        onClose={() => setViewingPostId(null)}
        onViewAnalysis={setAnalysisPost}
      />

      {analysisPost && (
        <AIAnalysisModal post={analysisPost} onClose={() => setAnalysisPost(null)} />
      )}
    </div>
  )
}
