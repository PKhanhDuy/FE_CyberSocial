import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { adminApi, type AdminUser } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { PageHeader, AdminCard, AdminPagination, StatusPill } from "@/components/admin/AdminBits"
import { AdminReasonModal } from "@/components/admin/AdminReasonModal"

type StatusFilter = "all" | "active" | "locked"

const USERS_PAGE_SIZE = 20

const LOCK_REASONS = [
  "Vi phạm tiêu chuẩn cộng đồng",
  "Spam / lạm dụng",
  "Mạo danh",
  "Phát tán tin giả",
]

const initials = (name: string) => name.slice(0, 2).toUpperCase()
const formatDate = (value: string) => new Date(value).toLocaleDateString("vi-VN")

export function AdminUsers() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [page, setPage] = useState(0)
  const [target, setTarget] = useState<AdminUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  const enabledParam = status === "all" ? undefined : status === "active"

  useEffect(() => {
    setPage(0)
  }, [query, status])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-users", query, status, page],
    queryFn: () => adminApi.listUsers({ query, enabled: enabledParam, page, size: USERS_PAGE_SIZE }),
  })

  const mutation = useMutation({
    mutationFn: ({ userId, enabled, reason }: { userId: string; enabled: boolean; reason: string }) =>
      adminApi.updateUserStatus(userId, enabled, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
      setTarget(null)
      setError(null)
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Thao tác thất bại"),
  })

  const users = data?.content ?? []
  const locking = useMemo(() => target?.enabled ?? true, [target])

  return (
    <div>
      <PageHeader
        title="Quản lý người dùng"
        description="Tìm kiếm, lọc và khóa/mở khóa tài khoản. Khóa sẽ đăng xuất người dùng và ghi nhật ký."
      />

      <AdminCard>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên hoặc email…"
              className="w-full rounded-lg border border-border bg-panel py-2 pl-9 pr-3 text-sm text-foreground focus:border-accent-blue focus:outline-none"
            />
          </div>
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            {(["all", "active", "locked"] as StatusFilter[]).map((value) => (
              <button
                key={value}
                onClick={() => setStatus(value)}
                className={cn(
                  "px-3 py-2 text-sm",
                  status === value ? "bg-accent-blue/10 text-accent-blue" : "text-muted hover:text-foreground"
                )}
              >
                {value === "all" ? "Tất cả" : value === "active" ? "Hoạt động" : "Đã khóa"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="bg-background/40 px-4 py-3 font-semibold">Người dùng</th>
                <th className="bg-background/40 px-4 py-3 font-semibold">Vai trò</th>
                <th className="bg-background/40 px-4 py-3 font-semibold">Trạng thái</th>
                <th className="bg-background/40 px-4 py-3 font-semibold">Ngày tạo</th>
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
                users.map((user) => {
                  const isSelf = user.id === currentUser?.id
                  return (
                    <tr key={user.id} className="border-t border-border hover:bg-panel-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-blue/20 text-xs font-bold text-accent-blue">
                            {initials(user.displayName || user.email)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {user.displayName} {isSelf && <span className="text-xs text-muted">(bạn)</span>}
                            </div>
                            <div className="font-mono text-xs text-muted">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded border px-2 py-0.5 font-mono text-xs",
                            user.role === "ADMIN"
                              ? "border-accent-blue/40 text-accent-blue"
                              : "border-border text-muted"
                          )}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill on={user.enabled} labelOn="Hoạt động" labelOff="Đã khóa" />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {user.enabled ? (
                          <Button
                            variant="neon-pink"
                            size="sm"
                            disabled={isSelf}
                            title={isSelf ? "Không thể tự khóa tài khoản" : undefined}
                            onClick={() => {
                              setError(null)
                              setTarget(user)
                            }}
                          >
                            Khóa
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              mutation.mutate({ userId: user.id, enabled: true, reason: "" })
                            }
                          >
                            Mở khóa
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Không có người dùng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={data?.page ?? page}
          totalPages={data?.totalPages ?? 0}
          totalElements={data?.totalElements ?? 0}
          pageSize={USERS_PAGE_SIZE}
          onPageChange={setPage}
          disabled={isLoading || isFetching}
        />
      </AdminCard>

      <AdminReasonModal
        open={target !== null && locking}
        title="Khóa tài khoản"
        description={`Khóa "${target?.displayName ?? ""}". Người dùng sẽ bị đăng xuất và không thể đăng nhập lại.`}
        reasonOptions={LOCK_REASONS}
        reasonLabel="Lý do khóa"
        confirmLabel="Khóa tài khoản"
        tone="danger"
        loading={mutation.isPending}
        error={error}
        onCancel={() => setTarget(null)}
        onConfirm={(reason) =>
          target && mutation.mutate({ userId: target.id, enabled: false, reason })
        }
      />
    </div>
  )
}
