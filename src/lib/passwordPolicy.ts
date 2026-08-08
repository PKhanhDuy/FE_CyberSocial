export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

export type PasswordRule =
  | "minLength"
  | "maxLength"
  | "uppercase"
  | "lowercase"
  | "digit"
  | "special"

export const PASSWORD_RULES: PasswordRule[] = [
  "minLength",
  "uppercase",
  "lowercase",
  "digit",
  "special",
]

export function getPasswordValidationErrors(password: string): PasswordRule[] {
  const errors: PasswordRule[] = []

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push("minLength")
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push("maxLength")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("uppercase")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("lowercase")
  }
  if (!/\d/.test(password)) {
    errors.push("digit")
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("special")
  }

  return errors
}

export function isStrongPassword(password: string): boolean {
  return getPasswordValidationErrors(password).length === 0
}

export function getPasswordValidationMessage(
  rule: PasswordRule,
  translate: (key: string) => string,
): string {
  return translate(`auth.passwordPolicy.${rule}`)
}

export function getFirstPasswordValidationMessage(
  password: string,
  translate: (key: string) => string,
): string | null {
  const errors = getPasswordValidationErrors(password)
  if (errors.length === 0) {
    return null
  }
  return getPasswordValidationMessage(errors[0], translate)
}
