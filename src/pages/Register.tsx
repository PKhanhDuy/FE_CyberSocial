import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, User, Eye, EyeOff, ShieldAlert, Check, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/useAuthStore"
import { cn } from "@/lib/utils"

export function Register() {
  const navigate = useNavigate()
  const { register, error, isLoading, clearError } = useAuthStore()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState("")

  // Update title for SEO
  useEffect(() => {
    document.title = "Kích hoạt Node Mạng (Đăng ký) | CyberSocial"
    clearError()
    return () => clearError()
  }, [clearError])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")

    if (!username) {
      setValidationError("Vui lòng điền Tên định danh.")
      return
    }
    if (!email) {
      setValidationError("Vui lòng điền Địa chỉ Email.")
      return
    }
    if (!password) {
      setValidationError("Vui lòng đặt Mật mã xác thực.")
      return
    }
    if (password.length < 8) {
      setValidationError("Mật mã phải chứa ít nhất 6 ký tự.")
      return
    }
    if (password !== confirmPassword) {
      setValidationError("Mật mã xác nhận không trùng khớp.")
      return
    }

    const success = await register(username, email, password)
    if (success) {
      navigate("/")
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-accent-blue/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-accent-pink/10 blur-[120px] pointer-events-none animate-pulse duration-5000" />

      {/* Cyber Grid Background lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Auth Glass Card */}
        <div className="glass-panel border border-border/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden bg-surface">
          {/* Top accent glow line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-blue via-accent-pink to-accent-blue opacity-80" />

          {/* Logo / Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-blue/10 border border-accent-blue/40 neon-border-blue mb-4">
              <span className="text-accent-blue font-extrabold text-2xl tracking-tighter">CS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-wider mb-2">
              <span className="neon-text-blue text-accent-blue">KÍCH HOẠT</span>
              <span className="text-foreground"> NODE</span>
            </h1>
            <p className="text-muted text-sm font-mono">THIẾT LẬP THÔNG TIN TRUY CẬP</p>
          </div>

          {/* Error Message */}
          {(error || validationError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/40 flex items-start gap-3"
            >
              <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <div className="text-sm text-foreground/90 font-medium">
                {validationError || error}
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs uppercase tracking-widest text-muted font-bold block">
                Tên người dùng (Username)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted pointer-events-none">
                  <User className="w-5 h-5" />
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="ví dụ: neo_cyber"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="input-modern w-full pl-11 pr-4 py-2.5 rounded-xl text-sm focus:border-accent-blue/80 focus:shadow-[var(--shadow-neon-blue)] focus:outline-none"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs uppercase tracking-widest text-muted font-bold block">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted pointer-events-none">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="nhap-email@cybersocial.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="input-modern w-full pl-11 pr-4 py-2.5 rounded-xl text-sm focus:border-accent-blue/80 focus:shadow-[var(--shadow-neon-blue)] focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs uppercase tracking-widest text-muted font-bold block">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted pointer-events-none">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="input-modern w-full pl-11 pr-11 py-2.5 rounded-xl text-sm focus:border-accent-blue/80 focus:shadow-[var(--shadow-neon-blue)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs uppercase tracking-widest text-muted font-bold block">
                Xác Nhận Mật Khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted pointer-events-none">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="input-modern w-full pl-11 pr-4 py-2.5 rounded-xl text-sm focus:border-accent-blue/80 focus:shadow-[var(--shadow-neon-blue)] focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "btn-primary w-full py-3.5 rounded-xl text-sm font-bold tracking-widest flex items-center justify-center gap-2 cursor-pointer mt-4",
                isLoading && "opacity-60 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ĐANG KHỞI TẠO TÀI KHOẢN...
                </>
              ) : (
                <>
                  TẠO TÀI KHOẢN <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom links */}
          <div className="mt-6 pt-5 border-t border-border/60 text-center">
            <p className="text-sm text-muted">
              Đã kích hoạt Node từ trước?{" "}
              <Link
                to="/login"
                className="text-accent-blue hover:text-accent-blue/80 transition-colors font-bold inline-flex items-center gap-1 group"
              >
                Đăng nhập ngay <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
