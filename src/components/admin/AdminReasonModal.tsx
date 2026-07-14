import { useEffect, useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

export interface AdminReasonModalProps {
  open: boolean
  title: string
  description?: string
  /** Danh mục lý do gợi ý; nếu rỗng thì ẩn ô chọn. */
  reasonOptions?: string[]
  reasonLabel?: string
  /** Bắt buộc nhập/chọn lý do trước khi xác nhận. */
  reasonRequired?: boolean
  confirmLabel: string
  tone?: "danger" | "primary"
  loading?: boolean
  error?: string | null
  onCancel: () => void
  onConfirm: (reason: string) => void
}

const MAX_LEN = 500

export function AdminReasonModal({
  open,
  title,
  description,
  reasonOptions = [],
  reasonLabel = "Lý do",
  reasonRequired = true,
  confirmLabel,
  tone = "danger",
  loading = false,
  error,
  onCancel,
  onConfirm,
}: AdminReasonModalProps) {
  const [category, setCategory] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (open) {
      setCategory("")
      setNote("")
    }
  }, [open])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel()
    }
    if (open) window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onCancel])

  if (!open) return null

  const composedReason = [category, note.trim()].filter(Boolean).join(" — ")
  const canConfirm = !reasonRequired || composedReason.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md glass-panel rounded-xl border border-border shadow-2xl">
        <div className="flex items-start gap-3 p-5 pb-3">
          <div
            className={cn(
              "flex h-10 w-10 flex-none items-center justify-center rounded-lg",
              tone === "danger" ? "bg-danger/15 text-danger" : "bg-accent-blue/15 text-accent-blue"
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button onClick={onCancel} className="text-muted hover:text-foreground" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-2">
          {reasonOptions.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                {reasonLabel} {reasonRequired && <span className="text-danger">*</span>}
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
              >
                <option value="">— Chọn lý do —</option>
                {reasonOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Ghi chú chi tiết{" "}
              {reasonRequired && reasonOptions.length === 0 && <span className="text-danger">*</span>}
            </label>
            <textarea
              value={note}
              maxLength={MAX_LEN}
              rows={3}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Mô tả chi tiết (tối đa 500 ký tự)…"
              className="w-full resize-none rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
            />
            <div className="mt-1 text-right font-mono text-xs text-muted">
              {note.length} / {MAX_LEN}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-4">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant={tone === "danger" ? "neon-pink" : "neon-blue"}
            disabled={!canConfirm || loading}
            onClick={() => onConfirm(composedReason)}
          >
            {loading ? "Đang xử lý…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
