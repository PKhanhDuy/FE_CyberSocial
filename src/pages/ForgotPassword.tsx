import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Mail, ShieldAlert, ArrowLeft, Send, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/useAuthStore"
import { cn } from "@/lib/utils"

export function ForgotPassword() {
  const { forgotPassword, error, isLoading, clearError } = useAuthStore()

  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [validationError, setValidationError] = useState("")

  // Update title for SEO
  useEffect(() => {
    document.title = "Khôi phục Mật mã | CyberSocial"
    clearError()
    return () => clearError()
  }, [clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")

    if (!email.trim()) {
      setValidationError("Vui long nhap email da dang ky.")
      return
    }

    const success = await forgotPassword(email)
    if (success) {
      setIsSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-accent-blue/10 blur-[120px] pointer-events-none animate-pulse" />

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
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-pink/10 border border-accent-pink/40 neon-border-pink mb-4">
              <span className="text-accent-pink font-extrabold text-2xl tracking-tighter">CS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-wider mb-2">
              <span className="neon-text-pink text-accent-pink">KHÔI PHỤC</span>
              <span className="text-foreground"> TÀI KHOẢN</span>
            </h1>
            <p className="text-muted text-sm font-mono">THIẾT LẬP LẠI MẬT KHẨU ĐĂNG NHẬP</p>
          </div>

          {!isSubmitted ? (
            <>
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

              <p className="text-muted text-sm leading-relaxed mb-6 text-center">
                Nhập email đã đăng ký tài khoản. Hệ thống sẽ gửi link đặt lại mật khẩu tới email đó.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="email-da-dang-ky@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      ĐANG YÊU CẦU...
                    </>
                  ) : (
                    <>
                      GỬI YÊU CẦU <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 border border-success/30 text-success mb-2">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Gửi Yêu Cầu Thành Công</h3>
              <p className="text-muted text-sm leading-relaxed">
                Nếu email này đã đăng ký, hệ thống đã gửi link đặt lại mật khẩu đến <strong className="text-foreground">{email.trim().toLowerCase()}</strong>. Vui lòng kiểm tra hộp thư đến hoặc spam. Link có hiệu lực trong 30 phút.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-xs text-accent-blue hover:underline cursor-pointer block mx-auto pt-2"
              >
                Nhap email khac
              </button>
            </motion.div>
          )}

          {/* Back to Login */}
          <div className="mt-8 pt-5 border-t border-border/60 text-center">
            <Link
              to="/login"
              className="text-sm text-muted hover:text-foreground transition-colors font-bold inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
