import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminApi, type AdminPost } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { PageHeader, AdminCard, StatusPill } from "@/components/admin/AdminBits"
import { AdminReasonModal } from "@/components/admin/AdminReasonModal"

type HiddenFilter = "all" | "visible" | "hidden"

const HIDE_REASONS = ["Ngôn từ thù ghét", "Bạo lực", "Bản quyền", "Thông tin sai lệch"]
const DELETE_REASONS = ["Vi phạm nghiêm trọng", "Nội dung bất hợp pháp", "Tin giả đã xác nhận"]

const formatDate = (value: string) => new Date(value).toLocaleDateString("vi-VN")

type Pending =
  | { kind: "hide"; post: AdminPost }
  | { kind: "delete"; post: AdminPost }
  | null

export function AdminPosts() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<HiddenFilter>("all")
  const [pending, setPending] = useState<Pending>(null)
  const [error, setError] = useState<string | null>(null)

  const hiddenParam = filter === "all" ? undefined : filter === "hidden"

  const { data, isLoading } = useQuery({
    queryKey: ["admin-posts", query, filter],
    queryFn: () => adminApi.listPosts({ query, hidden: hiddenParam, size: 50 }),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-posts"] })
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
  }

  const hideMutation = useMutation({
    mutationFn: ({ postId, hidden, reason }: { postId: string; hidden: boolean; reason?: string }) =>
      adminApi.updatePostHidden(postId, hidden, reason),
    onSuccess: () => {
      invalidate()
      setPending(null)
      setError(null)
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Thao tác thất bại"),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: string }) => adminApi.deletePost(postId, reason),
    onSuccess: () => {
      invalidate()
      setPending(null)
      setError(null)
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Xóa thất bại"),
  })

  const posts = data?.content ?? []
  const busy = hideMutation.isPending || deleteMutation.isPending

  return (
    <div>
      <PageHeader
        title="Quản lý bài viết"
        description="Kiểm duyệt nội dung: ẩn (soft-hide) hoặc xóa vĩnh viễn bài viết vi phạm."
      />

      <AdminCard>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm nội dung bài viết…"
            className="min-w-[220px] flex-1 rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
          />
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            {(["all", "visible", "hidden"] as HiddenFilter[]).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "px-3 py-2 text-sm",
                  filter === value ? "bg-accent-blue/10 text-accent-blue" : "text-muted hover:text-foreground"
                )}
              >
                {value === "all" ? "Tất cả" : value === "visible" ? "Hiển thị" : "Đã ẩn"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="min-w-[280px] bg-background/40 px-4 py-3 font-semibold">Nội dung</th>
                <th className="bg-background/40 px-4 py-3 font-semibold">Tác giả</th>
                <th className="bg-background/40 px-4 py-3 font-semibold">Hiển thị</th>
                <th className="bg-background/40 px-4 py-3 font-semibold">Tương tác</th>
                <th className="bg-background/40 px-4 py-3 text-right font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Đang tải…
                  </td>
                </tr>
              )}
              {!isLoading &&
                posts.map((post) => (
                  <tr key={post.id} className="border-t border-border hover:bg-panel-hover">
                    <td className="px-4 py-3">
                      <div className="line-clamp-2 max-w-md text-foreground">{post.content}</div>
                      <div className="mt-1 font-mono text-xs text-muted">
                        {formatDate(post.createdAt)} · {post.visibility}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{post.authorDisplayName}</td>
                    <td className="px-4 py-3">
                      <StatusPill on={!post.hidden} labelOn="Hiển thị" labelOff="Đã ẩn" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      ♥ {post.likeCount} · 💬 {post.commentCount} · ↻ {post.shareCount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {post.hidden ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => hideMutation.mutate({ postId: post.id, hidden: false })}
                          >
                            Bỏ ẩn
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setError(null)
                              setPending({ kind: "hide", post })
                            }}
                          >
                            Ẩn
                          </Button>
                        )}
                        <Button
                          variant="neon-pink"
                          size="sm"
                          onClick={() => {
                            setError(null)
                            setPending({ kind: "delete", post })
                          }}
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Không có bài viết phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminReasonModal
        open={pending?.kind === "hide"}
        title="Ẩn bài viết"
        description="Ẩn bài viết khỏi bảng tin công khai. Bài vẫn được lưu trong hệ thống."
        reasonOptions={HIDE_REASONS}
        reasonLabel="Tiêu chuẩn bị vi phạm"
        confirmLabel="Ẩn bài viết"
        tone="danger"
        loading={busy}
        error={error}
        onCancel={() => setPending(null)}
        onConfirm={(reason) =>
          pending?.kind === "hide" &&
          hideMutation.mutate({ postId: pending.post.id, hidden: true, reason })
        }
      />

      <AdminReasonModal
        open={pending?.kind === "delete"}
        title="Xóa bài viết"
        description="Xóa vĩnh viễn bài viết này. Không thể hoàn tác."
        reasonOptions={DELETE_REASONS}
        reasonLabel="Lý do xóa"
        confirmLabel="Xóa vĩnh viễn"
        tone="danger"
        loading={busy}
        error={error}
        onCancel={() => setPending(null)}
        onConfirm={(reason) =>
          pending?.kind === "delete" && deleteMutation.mutate({ postId: pending.post.id, reason })
        }
      />
    </div>
  )
}
