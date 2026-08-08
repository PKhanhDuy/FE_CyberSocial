import { useTranslation } from "react-i18next"

/**
 * Hiển thị trong lúc silent refresh dựng lại phiên sau khi tải trang.
 * Nhờ chưa render router, URL người dùng đang truy cập không bị guard đẩy về /login.
 */
export function SessionBootstrapScreen() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-pink/10 border border-accent-pink/40 neon-border-pink">
          <span className="text-accent-pink font-extrabold text-2xl tracking-tighter">CS</span>
        </div>
        <div className="w-8 h-8 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
        <p className="text-muted text-sm font-mono uppercase tracking-widest">{t("auth.session.restoring")}</p>
      </div>
    </div>
  )
}
