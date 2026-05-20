import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff, ShieldAlert, LogIn, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/useAuthStore"
import { cn } from "@/lib/utils"

export function Login() {
  const navigate = useNavigate()
  const { login, error, isLoading, clearError } = useAuthStore()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [validationError, setValidationError] = useState("")

  // Update document title for SEO
  useEffect(() => {
    document.title = "Đăng nhập | CyberSocial - Mạng xã hội tin cậy lượng tử"
    clearError()
    return () => clearError()
  }, [clearError])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")

    if (!email) {
      setValidationError("Vui lòng nhập địa chỉ email.")
      return
    }
    if (!password) {
      setValidationError("Vui lòng nhập mật khẩu.")
      return
    }

    const success = await login(email, password)
    if (success) {
      navigate("/")
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent-pink/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent-blue/10 blur-[120px] pointer-events-none animate-pulse duration-5000" />

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
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-pink via-accent-blue to-accent-pink opacity-80" />

          {/* Logo / Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-pink/10 border border-accent-pink/40 neon-border-pink mb-4">
              <span className="text-accent-pink font-extrabold text-2xl tracking-tighter">CS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-wider mb-2">
              <span className="neon-text-pink text-accent-pink">CYBER</span>
              <span className="text-foreground">SOCIAL</span>
            </h1>
            <p className="text-muted text-sm font-mono">BẢO MẬT & ĐỒNG BỘ NODE MẠNG</p>
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
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
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
                  className="input-modern w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:border-accent-blue/80 focus:shadow-[var(--shadow-neon-blue)] focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs uppercase tracking-widest text-muted font-bold">
                  Mật khẩu
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-accent-blue hover:text-accent-blue/80 transition-colors font-medium"
                >
                  Quên mật khẩu?
                </Link>
              </div>
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
                  className="input-modern w-full pl-11 pr-11 py-3 rounded-xl text-sm focus:border-accent-blue/80 focus:shadow-[var(--shadow-neon-blue)] focus:outline-none"
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

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent-blue focus:ring-accent-blue/40 bg-background/50 accent-accent-blue"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-muted font-medium select-none cursor-pointer">
                Ghi nhớ thiết bị này
              </label>
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
                  ĐANG ĐĂNG NHẬP...
                </>
              ) : (
                <>
                  ĐĂNG NHẬP <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom links */}
          <div className="mt-8 pt-6 border-t border-border/60 text-center">
            <p className="text-sm text-muted">
              Bạn chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-accent-pink hover:text-accent-pink/80 transition-colors font-bold inline-flex items-center gap-1 group"
              >
                Đăng ký ngay <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
