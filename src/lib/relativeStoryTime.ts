type TranslateFn = (key: string, options?: Record<string, unknown>) => string

/** Formats an ISO timestamp as relative story time. Returns the input as-is if not a valid date. */
export const formatRelativeStoryTime = (value: string, t: TranslateFn) => {
  const then = new Date(value).getTime()
  if (!Number.isFinite(then)) return value

  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSeconds < 60) return t("stories.time.justNow")
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return t("stories.time.minute", { count: diffMinutes })
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return t("stories.time.hour", { count: diffHours })
  return t("stories.time.day", { count: Math.floor(diffHours / 24) })
}
