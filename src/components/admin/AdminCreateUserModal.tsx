import { useEffect, useState } from "react"
import { ShieldPlus, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { PasswordRequirements } from "@/components/auth/PasswordRequirements"
import { isStrongPassword } from "@/lib/passwordPolicy"

export interface AdminCreateUserModalProps {
  open: boolean
  loading?: boolean
  error?: string | null
  onCancel: () => void
  onConfirm: (payload: { email: string; displayName: string; password: string }) => void
}

const WEAK_PASSWORD_MESSAGE = "Mật khẩu chưa đủ mạnh. Cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt."

export function AdminCreateUserModal({
  open,
  loading = false,
  error,
  onCancel,
  onConfirm,
}: AdminCreateUserModalProps) {
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setEmail("")
      setDisplayName("")
      setPassword("")
      setConfirmPassword("")
      setValidationError(null)
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

  const submit = () => {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = displayName.trim()

    if (!normalizedEmail || !normalizedName || !password) {
      setValidationError("Vui lòng điền đầy đủ thông tin.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setValidationError("Email không hợp lệ.")
      return
    }
    if (normalizedName.length < 2) {
      setValidationError("Tên hiển thị phải có ít nhất 2 ký tự.")
      return
    }
    if (!isStrongPassword(password)) {
      setValidationError(WEAK_PASSWORD_MESSAGE)
      return
    }
    if (password !== confirmPassword) {
      setValidationError("Mật khẩu xác nhận không khớp.")
      return
    }

    setValidationError(null)
    onConfirm({ email: normalizedEmail, displayName: normalizedName, password })
  }

  const message = validationError ?? error

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md glass-panel rounded-xl border border-border shadow-2xl">
        <div className="flex items-start gap-3 p-5 pb-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent-blue/15 text-accent-blue">
            <ShieldPlus className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">Tạo tài khoản quản trị</h3>
            <p className="mt-1 text-sm text-muted">
              Tài khoản mới sẽ có quyền ADMIN và truy cập được toàn bộ trang quản trị.
            </p>
          </div>
          <button onClick={onCancel} className="text-muted hover:text-foreground" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={email}
              autoComplete="off"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@cybersocial.vn"
              className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Tên hiển thị <span className="text-danger">*</span>
            </label>
            <input
              value={displayName}
              maxLength={120}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Quản trị viên"
              className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Mật khẩu <span className="text-danger">*</span>
            </label>
            <input
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mật khẩu mạnh"
              className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
            />
            <PasswordRequirements password={password} className="mt-2 rounded-lg border border-border/60 bg-panel/40 p-3" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Xác nhận mật khẩu <span className="text-danger">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
            />
          </div>

          {message && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {message}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-4">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button variant="neon-blue" disabled={loading} onClick={submit}>
            {loading ? "Đang tạo…" : "Tạo tài khoản"}
          </Button>
        </div>
      </div>
    </div>
  )
}
