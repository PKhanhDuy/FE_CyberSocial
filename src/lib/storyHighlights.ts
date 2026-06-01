export type HighlightMediaType = "image" | "video"

export interface StoryHighlightMusic {
  id: string
  title: string
  artist: string
  duration: string
  audioUrl?: string
  coverUrl?: string
}

export interface StoryHighlightItem {
  id: string
  storyId: string
  mediaUrl: string
  mediaType: HighlightMediaType
  caption: string
  createdAt: string
  addedAt: string
  music?: StoryHighlightMusic
  musicStartMs?: number
  musicDurationMs?: number
}

export interface StoryHighlight {
  id: string
  title: string
  coverUrl: string
  items: StoryHighlightItem[]
  createdAt: string
  updatedAt: string
}

export interface HighlightStoryInput {
  storyId: string
  mediaUrl: string
  mediaType: HighlightMediaType
  caption: string
  createdAt: string
  music?: StoryHighlightMusic
  musicStartMs?: number
  musicDurationMs?: number
}

export const STORY_HIGHLIGHTS_EVENT = "cybersocial:story-highlights-updated"

const STORAGE_KEY = "cybersocial_story_highlights"

const getStoryHighlightsKey = (userId?: string) => `${STORAGE_KEY}:${userId || "anonymous"}`

const createId = (prefix: string) => {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `${prefix}-${randomId}`
}

const emitHighlightsUpdated = (userId?: string) => {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(STORY_HIGHLIGHTS_EVENT, { detail: { userId } }))
}

const isStoryHighlight = (value: unknown): value is StoryHighlight => {
  if (!value || typeof value !== "object") return false
  const highlight = value as StoryHighlight
  return typeof highlight.id === "string"
    && typeof highlight.title === "string"
    && typeof highlight.coverUrl === "string"
    && Array.isArray(highlight.items)
}

export const loadStoryHighlights = (userId?: string): StoryHighlight[] => {
  if (typeof window === "undefined") return []

  try {
    const rawValue = window.localStorage.getItem(getStoryHighlightsKey(userId))
    if (!rawValue) return []

    const parsedValue = JSON.parse(rawValue)
    return Array.isArray(parsedValue) ? parsedValue.filter(isStoryHighlight) : []
  } catch {
    return []
  }
}

export const saveStoryHighlights = (userId: string | undefined, highlights: StoryHighlight[]) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(getStoryHighlightsKey(userId), JSON.stringify(highlights))
  emitHighlightsUpdated(userId)
}

export const createStoryHighlight = (
  userId: string | undefined,
  title: string,
  firstStory?: HighlightStoryInput,
) => {
  const now = new Date().toISOString()
  const item: StoryHighlightItem | undefined = firstStory
    ? {
      id: createId("highlight-item"),
      storyId: firstStory.storyId,
      mediaUrl: firstStory.mediaUrl,
      mediaType: firstStory.mediaType,
      caption: firstStory.caption,
      createdAt: firstStory.createdAt,
      addedAt: now,
      music: firstStory.music,
      musicStartMs: firstStory.musicStartMs,
      musicDurationMs: firstStory.musicDurationMs,
    }
    : undefined

  const nextHighlight: StoryHighlight = {
    id: createId("highlight"),
    title: title.trim() || "Tin nổi bật",
    coverUrl: item?.mediaUrl || "",
    items: item ? [item] : [],
    createdAt: now,
    updatedAt: now,
  }

  const highlights = [nextHighlight, ...loadStoryHighlights(userId)]
  saveStoryHighlights(userId, highlights)
  return highlights
}

export const addStoryToHighlight = (
  userId: string | undefined,
  highlightId: string,
  story: HighlightStoryInput,
) => {
  const now = new Date().toISOString()
  const highlights = loadStoryHighlights(userId).map((highlight) => {
    if (highlight.id !== highlightId) return highlight

    const existingItem = highlight.items.find((item) => item.storyId === story.storyId)
    if (existingItem) {
      return {
        ...highlight,
        coverUrl: highlight.coverUrl || story.mediaUrl,
        items: highlight.items.map((item) => (
          item.storyId === story.storyId
            ? {
              ...item,
              mediaUrl: story.mediaUrl,
              mediaType: story.mediaType,
              caption: story.caption,
              createdAt: story.createdAt,
              music: story.music,
              musicStartMs: story.musicStartMs,
              musicDurationMs: story.musicDurationMs,
            }
            : item
        )),
        updatedAt: now,
      }
    }

    const nextItem: StoryHighlightItem = {
      id: createId("highlight-item"),
      storyId: story.storyId,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption,
      createdAt: story.createdAt,
      addedAt: now,
      music: story.music,
      musicStartMs: story.musicStartMs,
      musicDurationMs: story.musicDurationMs,
    }

    return {
      ...highlight,
      coverUrl: highlight.coverUrl || story.mediaUrl,
      items: [nextItem, ...highlight.items],
      updatedAt: now,
    }
  })

  saveStoryHighlights(userId, highlights)
  return highlights
}

export const removeStoryFromHighlight = (
  userId: string | undefined,
  highlightId: string,
  itemId: string,
) => {
  const now = new Date().toISOString()
  const highlights = loadStoryHighlights(userId).map((highlight) => {
    if (highlight.id !== highlightId) return highlight

    const nextItems = highlight.items.filter((item) => item.id !== itemId)

    return {
      ...highlight,
      coverUrl: nextItems[0]?.mediaUrl || "",
      items: nextItems,
      updatedAt: now,
    }
  })

  saveStoryHighlights(userId, highlights)
  return highlights
}

export const removeStoryHighlight = (
  userId: string | undefined,
  highlightId: string,
) => {
  const highlights = loadStoryHighlights(userId).filter((highlight) => highlight.id !== highlightId)
  saveStoryHighlights(userId, highlights)
  return highlights
}
