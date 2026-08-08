import { Check, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { getPasswordValidationErrors, PASSWORD_RULES } from "@/lib/passwordPolicy"

interface PasswordRequirementsProps {
  password: string
  className?: string
}

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
  const { t } = useTranslation()
  const failedRules = new Set(getPasswordValidationErrors(password))
  const hasInput = password.length > 0

  return (
    <ul className={cn("space-y-1 text-xs", className)}>
      {PASSWORD_RULES.map((rule) => {
        const passed = hasInput && !failedRules.has(rule)
        return (
          <li
            key={rule}
            className={cn(
              "flex items-center gap-2",
              !hasInput ? "text-muted" : passed ? "text-green-400" : "text-muted",
            )}
          >
            {passed ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0 opacity-60" />}
            <span>{t(`auth.passwordPolicy.${rule}`)}</span>
          </li>
        )
      })}
    </ul>
  )
}
