import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldAlert, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/store/useAuthStore"
import { cn } from "@/lib/utils"
import { PasswordRequirements } from "@/components/auth/PasswordRequirements"
import { isStrongPassword } from "@/lib/passwordPolicy"

type PasswordField = "current" | "next" | "confirm"

export function ChangePassword() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { changePassword, error, isLoading, clearError } = useAuthStore()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [visibleFields, setVisibleFields] = useState<Record<PasswordField, boolean>>({
    current: false,
    next: false,
    confirm: false,
  })
  const [validationError, setValidationError] = useState("")
  const [isChanged, setIsChanged] = useState(false)

  useEffect(() => {
    document.title = t("auth.changePassword.documentTitle")
  }, [t])

  useEffect(() => {
    clearError()
    return () => clearError()
  }, [clearError])

  const toggleVisible = (field: PasswordField) => {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setValidationError("")
    setIsChanged(false)

    if (!currentPassword) {
      setValidationError(t("auth.changePassword.validation.currentRequired"))
      return
    }
    if (!newPassword) {
      setValidationError(t("auth.changePassword.validation.newRequired"))
      return
    }
    if (!isStrongPassword(newPassword)) {
      setValidationError(t("auth.changePassword.validation.minLength"))
      return
    }
    if (newPassword === currentPassword) {
      setValidationError(t("auth.changePassword.validation.mustBeDifferent"))
      return
    }
    if (newPassword !== confirmPassword) {
      setValidationError(t("auth.changePassword.validation.confirmMismatch"))
      return
    }

    const success = await changePassword(currentPassword, newPassword)
    if (success) {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setIsChanged(true)
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
          aria-label={visibleFields[field] ? t("auth.changePassword.hidePassword") : t("auth.changePassword.showPassword")}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted hover:text-foreground transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {visibleFields[field] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-7rem)] w-full flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-accent-blue/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent-pink/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel border border-border/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden bg-surface">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-blue via-accent-pink to-accent-blue opacity-80" />

          <div className="mb-7">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors font-medium mb-5"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("auth.changePassword.backToProfile")}
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-accent-blue/10 border border-accent-blue/40 flex items-center justify-center neon-border-blue">
                <KeyRound className="w-6 h-6 text-accent-blue" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wider text-foreground">{t("auth.changePassword.title")}</h1>
                <p className="text-sm text-muted font-mono uppercase">{t("auth.changePassword.subtitle")}</p>
              </div>
            </div>
          </div>

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

          {isChanged && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 p-4 rounded-xl bg-success/10 border border-success/40 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div className="text-sm text-foreground/90 font-medium">
                {t("auth.changePassword.success")}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {renderPasswordInput("current-password", t("auth.changePassword.currentPassword"), currentPassword, "current", setCurrentPassword)}
            {renderPasswordInput("new-password", t("auth.changePassword.newPassword"), newPassword, "next", setNewPassword)}
            <PasswordRequirements password={newPassword} className="rounded-lg border border-border/60 bg-panel/40 p-3" />
            {renderPasswordInput("confirm-password", t("auth.changePassword.confirmPassword"), confirmPassword, "confirm", setConfirmPassword)}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                disabled={isLoading}
                className="px-4 py-3 rounded-xl border border-border text-sm font-bold text-muted hover:text-foreground hover:bg-panel-hover transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "btn-primary flex-1 py-3 rounded-xl text-sm font-bold tracking-widest flex items-center justify-center gap-2 cursor-pointer",
                  isLoading && "opacity-60 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("common.updating")}
                  </>
                ) : (
                  <>
                    {t("common.update")} <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
