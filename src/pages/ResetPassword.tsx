import React, { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldAlert, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { authApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import { PasswordRequirements } from "@/components/auth/PasswordRequirements"
import { isStrongPassword } from "@/lib/passwordPolicy"

type PasswordField = "next" | "confirm"

export function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const token = searchParams.get("token") ?? ""

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [visibleFields, setVisibleFields] = useState<Record<PasswordField, boolean>>({
    next: false,
    confirm: false,
  })
  const [validationError, setValidationError] = useState("")
  const [requestError, setRequestError] = useState("")
  const [isValidating, setIsValidating] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isReset, setIsReset] = useState(false)

  useEffect(() => {
    document.title = t("auth.resetPassword.documentTitle")
  }, [t])

  useEffect(() => {
    if (!token) {
      setIsValidating(false)
      setIsTokenValid(false)
      setValidationError(t("auth.resetPassword.validation.tokenMissing"))
      return
    }

    let cancelled = false
    setIsValidating(true)
    setValidationError("")
    setRequestError("")

    authApi.validateResetToken(token)
      .then(() => {
        if (!cancelled) {
          setIsTokenValid(true)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setIsTokenValid(false)
          setValidationError(error instanceof Error ? error.message : t("auth.resetPassword.validation.tokenInvalid"))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsValidating(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, t])

  const toggleVisible = (field: PasswordField) => {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setValidationError("")
    setRequestError("")

    if (!newPassword) {
      setValidationError(t("auth.resetPassword.validation.newRequired"))
      return
    }
    if (!isStrongPassword(newPassword)) {
      setValidationError(t("auth.resetPassword.validation.minLength"))
      return
    }
    if (newPassword !== confirmPassword) {
      setValidationError(t("auth.resetPassword.validation.confirmMismatch"))
      return
    }

    setIsLoading(true)
    try {
      await authApi.resetPassword(token, newPassword)
      setIsReset(true)
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : t("auth.resetPassword.error"))
    } finally {
      setIsLoading(false)
    }
  }

  const renderPasswordInput = (
    id: string,
    label: string,
    value: string,
    field: PasswordField,
    onChange: (value: string) => void
  ) => (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs uppercase tracking-widest text-muted font-bold block">
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted pointer-events-none">
          <Lock className="w-5 h-5" />
        </span>
        <input
          id={id}
          type={visibleFields[field] ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isLoading}
          className="input-modern w-full pl-11 pr-11 py-3 rounded-xl text-sm focus:border-accent-blue/80 focus:shadow-[var(--shadow-neon-blue)] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => toggleVisible(field)}
          disabled={isLoading}
          aria-label={visibleFields[field] ? t("auth.resetPassword.hidePassword") : t("auth.resetPassword.showPassword")}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted hover:text-foreground transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {visibleFields[field] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-accent-blue/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel border border-border/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden bg-surface">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-blue via-accent-pink to-accent-blue opacity-80" />

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-blue/10 border border-accent-blue/40 neon-border-blue mb-4">
              <KeyRound className="w-7 h-7 text-accent-blue" />
            </div>
            <h1 className="text-2xl font-bold tracking-wider mb-2">
              <span className="neon-text-blue text-accent-blue">{t("auth.resetPassword.titleHighlight")}</span>
              <span className="text-foreground"> {t("auth.resetPassword.titleRest")}</span>
            </h1>
            <p className="text-muted text-sm font-mono uppercase">{t("auth.resetPassword.subtitle")}</p>
          </div>

          {isValidating ? (
            <div className="py-10 flex flex-col items-center gap-3 text-muted">
              <div className="w-8 h-8 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
              <p className="text-sm">{t("auth.resetPassword.validating")}</p>
            </div>
          ) : isReset ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 border border-success/30 text-success mb-2">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("auth.resetPassword.successTitle")}</h3>
              <p className="text-muted text-sm leading-relaxed">{t("auth.resetPassword.successMessage")}</p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="btn-primary w-full py-3 rounded-xl text-sm font-bold tracking-widest cursor-pointer"
              >
                {t("auth.resetPassword.backToLogin")}
              </button>
            </motion.div>
          ) : !isTokenValid ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/40 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                <div className="text-sm text-foreground/90 font-medium">
                  {validationError || t("auth.resetPassword.validation.tokenInvalid")}
                </div>
              </div>
              <Link
                to="/forgot-password"
                className="btn-primary w-full py-3 rounded-xl text-sm font-bold tracking-widest flex items-center justify-center gap-2"
              >
                {t("auth.resetPassword.requestNewLink")}
              </Link>
            </div>
          ) : (
            <>
              {(validationError || requestError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/40 flex items-start gap-3"
                >
                  <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <div className="text-sm text-foreground/90 font-medium">
                    {validationError || requestError}
                  </div>
                </motion.div>
              )}

              <p className="text-muted text-sm leading-relaxed mb-6 text-center">
                {t("auth.resetPassword.description")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {renderPasswordInput("new-password", t("auth.resetPassword.newPassword"), newPassword, "next", setNewPassword)}
                <PasswordRequirements password={newPassword} className="rounded-lg border border-border/60 bg-panel/40 p-3" />
                {renderPasswordInput("confirm-password", t("auth.resetPassword.confirmPassword"), confirmPassword, "confirm", setConfirmPassword)}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "btn-primary w-full py-3.5 rounded-xl text-sm font-bold tracking-widest flex items-center justify-center gap-2 cursor-pointer",
                    isLoading && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("auth.resetPassword.submitting")}
                    </>
                  ) : (
                    <>
                      {t("auth.resetPassword.submit")} <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 pt-5 border-t border-border/60 text-center">
            <Link
              to="/login"
              className="text-sm text-muted hover:text-foreground transition-colors font-bold inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> {t("auth.resetPassword.backToLogin")}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
