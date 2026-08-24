import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Camera, Check, ChevronLeft, ChevronRight, ChevronUp, ImagePlus, Music2, Play, Plus, Send, Video, X } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/useAuthStore"
import { musicTrackApi, storyApi, uploadApi, type BackendMusicTrack, type BackendStory } from "@/lib/api"
import { addStoryToHighlight, createStoryHighlight, loadStoryHighlights, STORY_HIGHLIGHTS_EVENT, type StoryHighlight } from "@/lib/storyHighlights"
import { formatRelativeStoryTime } from "@/lib/relativeStoryTime"
import type { User } from "@/mocks/types"
import { useTranslation } from "react-i18next"
import { optimizeCloudinaryImage } from "@/lib/media"
type StoryMediaType = "image" | "video"

interface MusicTrack {
  id: string
  title: string
  artist: string
  duration: string
  audioUrl?: string
  coverUrl?: string
  isBackend?: boolean
}

interface Story {
  id: string
  author: Pick<User, "id" | "username" | "avatar" | "isVerified">
  mediaUrl: string
  mediaType: StoryMediaType
  mediaDurationMs?: number
  caption: string
  /** Relative display text (e.g. "5 phút") */
  createdAt: string
  /** Raw ISO timestamp from API — used when saving to highlights */
  createdAtIso?: string
  music?: MusicTrack
  musicStartMs?: number
  musicDurationMs?: number
  isOwn?: boolean
  isViewed?: boolean
  isPublishing?: boolean
  publishError?: boolean
  currentUserReaction?: string
  viewers?: StoryActivityUser[]
  reactions?: StoryReactionUser[]
}

interface StoryActivityUser {
  id: string
  username: string
  avatar: string
  viewedAt: string
}

interface StoryReactionUser extends StoryActivityUser {
  reactionType: string
}

interface StoryViewerActivity extends StoryActivityUser {
  reactionType?: string
}

const fallbackUser: Story["author"] = {
  id: "me",
  username: "Nexus Prime",
  avatar: "https://i.pravatar.cc/150?u=nexus_prime",
  isVerified: true,
}

const fallbackMusicTracks: MusicTrack[] = [
  { id: "track_1", title: "Neon Drift", artist: "Cyberwave", duration: "0:30" },
  { id: "track_2", title: "Soft Signal", artist: "Luna Byte", duration: "0:28" },
  { id: "track_3", title: "Orbit Pulse", artist: "Nexus FM", duration: "0:32" },
]

const fallbackStories: Story[] = []

const reactionOptions = ["\u2764\ufe0f", "\ud83d\ude02", "\ud83d\ude2e", "\ud83d\ude22", "\ud83d\ude21", "\ud83d\udc4f", "\ud83d\udd25"]

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds || 0)
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`
}

type Translate = ReturnType<typeof useTranslation>["t"]

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const DEFAULT_IMAGE_STORY_DURATION_MS = 20_000
const DEFAULT_MUSIC_PREVIEW_DURATION_MS = 20_000

const mapMusicTrack = (track: BackendMusicTrack): MusicTrack => ({
  id: track.id,
  title: track.title,
  artist: track.artist,
  duration: formatDuration(track.durationSeconds),
  audioUrl: track.audioUrl,
  coverUrl: track.coverUrl,
  isBackend: true,
})

const mapBackendStory = (story: BackendStory, currentUserId: string | undefined, t: Translate): Story => ({
  id: story.id,
  author: {
    id: story.author.id,
    username: story.author.displayName,
    avatar: story.author.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(story.author.id)}`,
    isVerified: false,
  },
  mediaUrl: story.media.mediaUrl,
  mediaType: story.media.mediaType === "VIDEO" ? "video" : "image",
  mediaDurationMs: story.media.durationMs,
  caption: story.caption || "",
  createdAt: formatRelativeStoryTime(story.createdAt, t),
  createdAtIso: story.createdAt,
  music: story.music ? mapMusicTrack(story.music) : undefined,
  musicStartMs: story.musicStartMs,
  musicDurationMs: story.musicDurationMs,
  isOwn: currentUserId ? story.author.id === currentUserId : false,
  isViewed: story.viewedByCurrentUser,
  currentUserReaction: story.currentUserReaction,
  viewers: story.viewers?.map((viewer) => ({
    id: viewer.userId,
    username: viewer.displayName,
    avatar: viewer.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(viewer.userId)}`,
    viewedAt: formatRelativeStoryTime(viewer.viewedAt, t),
  })) ?? [],
  reactions: story.reactions?.map((reaction) => ({
    id: reaction.userId,
    username: reaction.displayName,
    avatar: reaction.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(reaction.userId)}`,
    viewedAt: formatRelativeStoryTime(reaction.createdAt, t),
    reactionType: reaction.reactionType,
  })) ?? [],
})

export function StoriesTray() {
  const currentUser = useAuthStore((state) => state.user)
  const storyOwner = currentUser ?? fallbackUser
  const highlightOwnerId = currentUser?.id || storyOwner.id
  const [stories, setStories] = useState<Story[]>([])
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([])
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [draftCaption, setDraftCaption] = useState("")
  const [draftMedia, setDraftMedia] = useState<{ file: File; type: StoryMediaType; url: string } | null>(null)
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null)
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [musicPlaybackError, setMusicPlaybackError] = useState<string | null>(null)
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; emoji: string }>>([])
  const [isReacting, setIsReacting] = useState(false)
  const [isViewerListOpen, setIsViewerListOpen] = useState(false)
  const [highlightGroups, setHighlightGroups] = useState<StoryHighlight[]>([])
  const [isHighlightPickerOpen, setIsHighlightPickerOpen] = useState(false)
  const [newHighlightTitle, setNewHighlightTitle] = useState("")
  const [highlightMessage, setHighlightMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const storyVideoRef = useRef<HTMLVideoElement>(null)
  const storyAudioRef = useRef<HTMLAudioElement>(null)
  const composerAudioRef = useRef<HTMLAudioElement>(null)
  const musicPreviewTimeoutRef = useRef<number | null>(null)
  const [storyVideoProgress, setStoryVideoProgress] = useState(0)
  const { t } = useTranslation()
  const selectedStory = selectedStoryIndex === null ? null : stories[selectedStoryIndex]
  const isSelectedStoryInAnyHighlight = selectedStory
    ? highlightGroups.some((highlight) => highlight.items.some((item) => item.storyId === selectedStory.id))
    : false
  const selectedStoryViewerActivities: StoryViewerActivity[] = selectedStory
    ? (() => {
      const reactionByUser = new Map((selectedStory.reactions ?? []).map((reaction) => [reaction.id, reaction]))
      const viewedUserIds = new Set<string>()
      const viewers = (selectedStory.viewers ?? []).map((viewer) => {
        viewedUserIds.add(viewer.id)
        return {
          ...viewer,
          reactionType: reactionByUser.get(viewer.id)?.reactionType,
        }
      })
      const reactedOnlyUsers = (selectedStory.reactions ?? [])
        .filter((reaction) => !viewedUserIds.has(reaction.id))
        .map((reaction) => ({
          id: reaction.id,
          username: reaction.username,
          avatar: reaction.avatar,
          viewedAt: reaction.viewedAt,
          reactionType: reaction.reactionType,
        }))

      return [...viewers, ...reactedOnlyUsers]
    })()
    : []

  useEffect(() => {
    return () => {
      if (draftMedia?.url) URL.revokeObjectURL(draftMedia.url)
      composerAudioRef.current?.pause()
      storyAudioRef.current?.pause()
      if (musicPreviewTimeoutRef.current !== null) window.clearTimeout(musicPreviewTimeoutRef.current)
    }
  }, [draftMedia?.url])

  useEffect(() => {
    let isMounted = true

    storyApi.list()
      .then((response) => {
        if (isMounted) setStories(response.content.map((story) => mapBackendStory(story, currentUser?.id, t)))
      })
      .catch(() => {
        if (isMounted) setStories(fallbackStories)
      })

    return () => {
      isMounted = false
    }
  }, [currentUser?.id, t])

  useEffect(() => {
    let isMounted = true

    musicTrackApi.list()
      .then((tracks) => {
        if (isMounted) setMusicTracks(tracks.map(mapMusicTrack))
      })
      .catch(() => {
        if (isMounted) setMusicTracks(fallbackMusicTracks)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setStoryVideoProgress(0)
    setIsViewerListOpen(false)
    setIsHighlightPickerOpen(false)
    setHighlightMessage(null)
    if (selectedStory?.mediaType !== "video") return

    window.setTimeout(() => {
      void storyVideoRef.current?.play()
    }, 0)
  }, [selectedStory?.id, selectedStory?.mediaType])

  useEffect(() => {
    const loadHighlights = () => {
      setHighlightGroups(loadStoryHighlights(highlightOwnerId))
    }

    loadHighlights()
    window.addEventListener(STORY_HIGHLIGHTS_EVENT, loadHighlights)
    return () => window.removeEventListener(STORY_HIGHLIGHTS_EVENT, loadHighlights)
  }, [highlightOwnerId])

  useEffect(() => {
    if (!selectedStory || selectedStory.mediaType === "video") return

    setStoryVideoProgress(0)
    const durationMs = selectedStory.mediaDurationMs ?? selectedStory.musicDurationMs ?? DEFAULT_IMAGE_STORY_DURATION_MS
    const startedAt = Date.now()
    const intervalId = window.setInterval(() => {
      setStoryVideoProgress(Math.min(100, ((Date.now() - startedAt) / durationMs) * 100))
    }, 100)
    const timeoutId = window.setTimeout(() => {
      advanceStory()
    }, durationMs)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [selectedStory?.id, selectedStory?.mediaType, selectedStory?.mediaDurationMs, selectedStory?.musicDurationMs])

  useEffect(() => {
    const audio = storyAudioRef.current
    if (!audio) return

    audio.pause()
    audio.currentTime = 0
    setMusicPlaybackError(null)

    if (!selectedStory?.music?.audioUrl) return

    audio.src = selectedStory.music.audioUrl
    audio.currentTime = (selectedStory.musicStartMs ?? 0) / 1000
    const durationMs = selectedStory.musicDurationMs ?? DEFAULT_IMAGE_STORY_DURATION_MS
    const timeoutId = window.setTimeout(() => {
      audio.pause()
    }, durationMs)

    audio.play().catch(() => {
      setMusicPlaybackError(t("stories.musicError"))
    })

    return () => {
      window.clearTimeout(timeoutId)
      audio.pause()
      audio.currentTime = 0
    }
  }, [selectedStory?.id, selectedStory?.music?.audioUrl, selectedStory?.musicStartMs, selectedStory?.musicDurationMs])

  const openFilePicker = (accept: string) => {
    if (!fileInputRef.current) return
    fileInputRef.current.accept = accept
    fileInputRef.current.click()
  }

  const stopComposerAudio = () => {
    const audio = composerAudioRef.current
    if (musicPreviewTimeoutRef.current !== null) {
      window.clearTimeout(musicPreviewTimeoutRef.current)
      musicPreviewTimeoutRef.current = null
    }
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
  }

  const previewMusic = (track: MusicTrack) => {
    setSelectedMusic(track)
    setIsMusicPickerOpen(false)
    setMusicPlaybackError(null)

    const audio = composerAudioRef.current
    if (!audio || !track.audioUrl) {
      setMusicPlaybackError(t("stories.musicPlaybackError"))
      return
    }

    audio.pause()
    audio.src = track.audioUrl
    audio.currentTime = 0
    audio.play().catch(() => {
      setMusicPlaybackError(t("stories.musicReviewError"))
    })

    if (musicPreviewTimeoutRef.current !== null) {
      window.clearTimeout(musicPreviewTimeoutRef.current)
    }
    musicPreviewTimeoutRef.current = window.setTimeout(() => {
      audio.pause()
      musicPreviewTimeoutRef.current = null
    }, DEFAULT_MUSIC_PREVIEW_DURATION_MS)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (draftMedia?.url) URL.revokeObjectURL(draftMedia.url)
    const mediaType = file.type.startsWith("video/") ? "video" : "image"
    setDraftMedia({
      file,
      type: mediaType,
      url: URL.createObjectURL(file),
    })
    setSelectedMusic(null)
    setIsMusicPickerOpen(false)
    stopComposerAudio()
    setSubmitError(null)
    setMusicPlaybackError(null)
    setIsComposerOpen(true)
    event.target.value = ""
  }

  const closeComposer = () => {
    if (draftMedia?.url) URL.revokeObjectURL(draftMedia.url)
    setDraftMedia(null)
    setDraftCaption("")
    setSelectedMusic(null)
    setIsMusicPickerOpen(false)
    stopComposerAudio()
    setSubmitError(null)
    setMusicPlaybackError(null)
    setIsPublishing(false)
    setIsComposerOpen(false)
  }

  const publishStory = async () => {
    if (!draftMedia) return

    const mediaToPublish = draftMedia
    const captionToPublish = draftCaption.trim()
    const musicToPublish = selectedMusic
    const optimisticStoryId = `publishing-${Date.now()}`
    const optimisticMediaUrl = URL.createObjectURL(mediaToPublish.file)
    const optimisticStory: Story = {
      id: optimisticStoryId,
      author: storyOwner,
      mediaUrl: optimisticMediaUrl,
      mediaType: mediaToPublish.type,
      mediaDurationMs: mediaToPublish.type === "image" ? DEFAULT_IMAGE_STORY_DURATION_MS : undefined,
      caption: captionToPublish,
      createdAt: t("stories.uploading"),
      music: mediaToPublish.type === "image" ? musicToPublish ?? undefined : undefined,
      musicStartMs: mediaToPublish.type === "image" && musicToPublish ? 0 : undefined,
      musicDurationMs: mediaToPublish.type === "image" && musicToPublish ? DEFAULT_IMAGE_STORY_DURATION_MS : undefined,
      isOwn: true,
      isPublishing: true,
    }

    setIsPublishing(true)
    setSubmitError(null)
    setMusicPlaybackError(null)
    setStories((currentStories) => [optimisticStory, ...currentStories])
    setDraftMedia(null)
    setDraftCaption("")
    setSelectedMusic(null)
    setIsMusicPickerOpen(false)
    stopComposerAudio()
    setIsComposerOpen(false)

    try {
      const uploaded = mediaToPublish.type === "video"
        ? await uploadApi.video(mediaToPublish.file)
        : await uploadApi.image(mediaToPublish.file)
      const createdStory = await storyApi.create({
        caption: captionToPublish || undefined,
        visibility: "FRIENDS",
        media: {
          mediaType: mediaToPublish.type === "video" ? "VIDEO" : "IMAGE",
          mediaUrl: uploaded.url,
          durationMs: mediaToPublish.type === "image" ? DEFAULT_IMAGE_STORY_DURATION_MS : undefined,
        },
        musicTrackId: mediaToPublish.type === "image" && musicToPublish?.isBackend ? musicToPublish.id : undefined,
        musicStartMs: mediaToPublish.type === "image" && musicToPublish?.isBackend ? 0 : undefined,
        musicDurationMs: mediaToPublish.type === "image" && musicToPublish?.isBackend ? DEFAULT_IMAGE_STORY_DURATION_MS : undefined,
      })

      setStories((currentStories) => currentStories.map((story) => (
        story.id === optimisticStoryId ? mapBackendStory(createdStory, currentUser?.id, t) : story
      )))
      URL.revokeObjectURL(optimisticMediaUrl)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("stories.createError"))
      setStories((currentStories) => currentStories.map((story) => (
        story.id === optimisticStoryId
          ? { ...story, isPublishing: false, publishError: true, createdAt: t("stories.uploadError") }
          : story
      )))
      window.setTimeout(() => {
        setStories((currentStories) => currentStories.filter((story) => story.id !== optimisticStoryId))
        URL.revokeObjectURL(optimisticMediaUrl)
      }, 4500)
    } finally {
      setIsPublishing(false)
    }
  }

  const selectStory = (index: number) => {
    setSelectedStoryIndex(index)
    const story = stories[index]
    if (!story || story.isViewed || !isUuid(story.id)) return

    storyApi.markViewed(story.id)
      .then((updatedStory) => {
        setStories((currentStories) => currentStories.map((currentStory) => (
          currentStory.id === updatedStory.id ? mapBackendStory(updatedStory, currentUser?.id, t) : currentStory
        )))
      })
      .catch(() => {
        setStories((currentStories) => currentStories.map((currentStory) => (
          currentStory.id === story.id ? { ...currentStory, isViewed: true } : currentStory
        )))
      })
  }

  const showPreviousStory = () => {
    if (selectedStoryIndex === null || stories.length === 0) return
    selectStory(selectedStoryIndex === 0 ? stories.length - 1 : selectedStoryIndex - 1)
  }

  const showNextStory = () => {
    if (selectedStoryIndex === null || stories.length === 0) return
    advanceStory()
  }

  const advanceStory = () => {
    if (selectedStoryIndex === null || stories.length === 0) return
    if (selectedStoryIndex >= stories.length - 1) {
      setSelectedStoryIndex(null)
      return
    }
    selectStory(selectedStoryIndex + 1)
  }

  const updateStoryVideoProgress = () => {
    const video = storyVideoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration === 0) return
    setStoryVideoProgress(Math.min(100, (video.currentTime / video.duration) * 100))
  }

  const toggleStoryVideoPlayback = () => {
    const video = storyVideoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }

  const reactToStory = (emoji: string) => {
    if (!selectedStory || selectedStory.isOwn || selectedStoryIndex === null || isReacting) return

    const reactionId = `${Date.now()}-${Math.random()}`
    setFloatingReactions((current) => [...current, { id: reactionId, emoji }])
    window.setTimeout(() => {
      setFloatingReactions((current) => current.filter((reaction) => reaction.id !== reactionId))
    }, 1200)

    setStories((currentStories) => currentStories.map((story, index) => (
      index === selectedStoryIndex ? { ...story, currentUserReaction: emoji } : story
    )))

    if (!isUuid(selectedStory.id)) return

    setIsReacting(true)
    storyApi.react(selectedStory.id, emoji)
      .catch(() => undefined)
      .finally(() => setIsReacting(false))
  }

  const getHighlightStoryInput = (story: Story) => ({
    storyId: story.id,
    mediaUrl: story.mediaUrl,
    mediaType: story.mediaType,
    caption: story.caption,
    createdAt: story.createdAtIso || new Date().toISOString(),
    music: story.music,
    musicStartMs: story.musicStartMs,
    musicDurationMs: story.musicDurationMs,
  })

  const handleAddStoryToHighlight = (highlightId: string) => {
    if (!selectedStory) return
    const targetHighlight = highlightGroups.find((highlight) => highlight.id === highlightId)

    if (targetHighlight?.items.some((item) => item.storyId === selectedStory.id)) {
      setHighlightGroups(addStoryToHighlight(highlightOwnerId, highlightId, getHighlightStoryInput(selectedStory)))
      setHighlightMessage(`Tin này đã có trong "${targetHighlight.title}"`)
      return
    }

    setHighlightGroups(addStoryToHighlight(highlightOwnerId, highlightId, getHighlightStoryInput(selectedStory)))
    setHighlightMessage("Đã thêm vào tin nổi bật")
    setIsHighlightPickerOpen(false)
  }

  const handleCreateHighlightFromStory = () => {
    if (!selectedStory) return

    setHighlightGroups(createStoryHighlight(highlightOwnerId, newHighlightTitle, getHighlightStoryInput(selectedStory)))
    setNewHighlightTitle("")
    setHighlightMessage("Đã tạo nhóm tin nổi bật")
    setIsHighlightPickerOpen(false)
  }

  return (
    <section className="relative">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setIsComposerOpen(true)}
          className="snap-start shrink-0 w-32 sm:w-33 h-52 rounded-lg overflow-hidden border border-border bg-panel relative group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          <div className="h-45 bg-panel-hover overflow-hidden -mt-16">
            <img src={optimizeCloudinaryImage(storyOwner.avatar, 320)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="absolute top-24 left-1/2 -translate-x-1/2 h-11 w-11 rounded-full bg-background border-4 border-panel flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-accent-blue text-black flex items-center justify-center shadow-[var(--shadow-neon-blue)]">
              <Plus className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3 pt-8 bg-panel text-center">
            <div className="text-sm font-bold text-foreground line-clamp-2">{t("stories.create")}</div>
          </div>
        </button>

        {stories.map((story, index) => (
          <button
            key={story.id}
            type="button"
            disabled={story.isPublishing || story.publishError}
            onClick={() => selectStory(index)}
            className={cn(
              "snap-start shrink-0 w-32 sm:w-33 h-52 rounded-lg overflow-hidden border border-border bg-panel relative text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue",
              story.isPublishing && "cursor-wait",
              story.publishError && "cursor-not-allowed border-danger/50"
            )}
          >
            {story.mediaType === "video" ? (
              <video src={story.mediaUrl} muted playsInline className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <img src={optimizeCloudinaryImage(story.mediaUrl, 400)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/80" />
            {(story.isPublishing || story.publishError) && (
              <div className="absolute inset-0 z-10 bg-black/55 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 text-white">
                {story.isPublishing ? (
                  <>
                    <div className="h-11 w-11 rounded-full border-2 border-white/30 border-t-accent-blue animate-spin" />
                    <div className="text-xs font-bold tracking-wider">{t("stories.uploading")}</div>
                  </>
                ) : (
                  <>
                    <div className="h-11 w-11 rounded-full border border-danger/60 bg-danger/20 flex items-center justify-center">
                      <X className="h-5 w-5 text-danger" />
                    </div>
                    <div className="text-xs font-bold tracking-wider text-danger">{t("stories.uploadError")}</div>
                  </>
                )}
              </div>
            )}
            <div className="absolute top-3 left-3">
              <div className={cn("rounded-full p-0.5", story.isViewed ? "bg-border" : "bg-gradient-to-br from-accent-blue to-accent-pink")}>
                <Avatar src={story.author.avatar} fallback={story.author.username[0]} className="h-9 w-9 border-2 border-background" />
              </div>
            </div>
            {story.mediaType === "video" && (
              <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
                <Play className="w-4 h-4 fill-current" />
              </div>
            )}
            {story.music && (
              <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white">
                <Music2 className="w-4 h-4" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="text-sm font-bold text-white leading-tight line-clamp-2">{story.author.username}</div>
              <div className="text-[11px] text-white/70 font-mono mt-1">{story.createdAt}</div>
            </div>
          </button>
        ))}
      </div>

      {submitError && !isComposerOpen && (
        <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-foreground">
          {submitError}
        </div>
      )}

      {typeof document !== "undefined" && createPortal(
        <>
          <audio
            ref={composerAudioRef}
            preload="metadata"
            className="hidden"
            onError={() => setMusicPlaybackError(t("stories.musicReviewError"))}
          />
          <audio
            ref={storyAudioRef}
            preload="metadata"
            className="hidden"
            onError={() => setMusicPlaybackError(t("stories.musicReviewError"))}
          />
          <AnimatePresence>
            {isComposerOpen && (
              <motion.div
                className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-start md:items-center justify-center overflow-y-auto p-3 sm:p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.98 }}
                  className="my-3 sm:my-4 w-full max-w-[680px] max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto md:overflow-hidden rounded-lg border border-border bg-background shadow-2xl grid md:grid-cols-[minmax(0,440px)_220px]"
                >
                  <div className="relative bg-black min-h-[320px] sm:min-h-[380px] flex items-center justify-center">
                    {draftMedia?.type === "video" ? (
                      <video src={draftMedia.url} controls className="max-h-[72vh] w-full object-contain" />
                    ) : draftMedia ? (
                      <>
                        <img src={draftMedia.url} alt="" decoding="async" className="max-h-[72vh] w-full object-contain" />
                        {selectedMusic && (
                          <div className="absolute left-5 right-5 bottom-5 rounded-full border border-white/20 bg-black/65 px-4 py-3 text-white backdrop-blur flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-accent-pink/20 text-accent-pink flex items-center justify-center">
                              <Music2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold truncate">{selectedMusic.title}</div>
                              <div className="text-xs text-white/65 truncate">{selectedMusic.artist}</div>
                            </div>
                          </div>
                        )}
                        <AnimatePresence>
                          {isMusicPickerOpen && (
                            <motion.div
                              initial={{ opacity: 0, x: 16 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 16 }}
                              className="absolute right-3 top-3 flex max-h-[calc(100%-1.5rem)] w-[min(18rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-lg border border-white/15 bg-black/80 p-3 text-white shadow-2xl backdrop-blur sm:right-4 sm:top-4 sm:max-h-[calc(100%-2rem)] sm:w-72"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-sm font-bold">
                                  <Music2 className="w-4 h-4 text-accent-pink" />
                                  {t("stories.selectMusic")}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setIsMusicPickerOpen(false)}
                                  className="h-7 w-7 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center"
                                  aria-label="Dong danh sach nhac"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
                                {musicTracks.length === 0 && (
                                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-4 text-center text-sm text-white/60">
                                    {t("stories.noMusic")}
                                  </div>
                                )}
                                {musicTracks.map((track) => (
                                  <button
                                    key={track.id}
                                    type="button"
                                    onClick={() => previewMusic(track)}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:border-accent-pink/50 hover:bg-accent-pink/10 transition-colors flex items-center gap-3"
                                  >
                                    <div className="h-8 w-8 rounded-full bg-accent-pink/20 text-accent-pink flex items-center justify-center shrink-0">
                                      <Music2 className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-bold truncate">{track.title}</div>
                                      <div className="text-xs text-white/55 truncate">{track.artist}</div>
                                    </div>
                                    <span className="text-xs font-mono text-white/45">{track.duration}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <div className="w-full max-w-sm px-6 text-center">
                        <div className="mx-auto mb-5 h-16 w-16 rounded-full border border-white/20 bg-white/10 text-white/70 flex items-center justify-center">
                          <Camera className="w-8 h-8" />
                        </div>
                        <div className="text-white font-bold text-lg">{t("stories.createNew")}</div>
                        <div className="text-white/60 text-sm mt-2">{t("stories.description")}</div>
                        <div className="mt-6 mx-auto max-w-56 space-y-3">
                          <button
                            type="button"
                            onClick={() => openFilePicker("image/*")}
                            className="h-12 w-full rounded-lg border border-accent-blue/40 bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 transition-colors flex items-center justify-center gap-2 font-bold"
                          >
                            <ImagePlus className="w-5 h-5" />
                            {t("stories.image")}
                          </button>
                          <button
                            type="button"
                            onClick={() => openFilePicker("video/*")}
                            className="h-12 w-full rounded-lg border border-accent-pink/40 bg-accent-pink/15 text-accent-pink hover:bg-accent-pink/25 transition-colors flex items-center justify-center gap-2 font-bold"
                          >
                            <Video className="w-5 h-5" />
                            Video
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="min-h-[360px] p-4 flex flex-col md:max-h-[92vh] md:overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={storyOwner.avatar} fallback={storyOwner.username[0]} />
                        <div>
                          <div className="font-bold text-foreground">{storyOwner.username}</div>
                          <div className="text-xs text-muted font-mono">{t("stories.yourStory")}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={closeComposer}
                        aria-label="Dong tao story"
                        className="h-9 w-9 rounded-full hover:bg-panel-hover text-muted hover:text-foreground transition-colors flex items-center justify-center"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <textarea
                      value={draftCaption}
                      onChange={(event) => setDraftCaption(event.target.value)}
                      placeholder={t("stories.descriptionPlaceholder")}
                      className="min-h-20 resize-none rounded-lg border border-border bg-panel px-3 py-3 text-sm text-foreground outline-none focus:border-accent-blue"
                    />

                    <div className="space-y-2 pt-3">
                      <button
                        type="button"
                        onClick={() => openFilePicker("image/*")}
                        className="h-10 w-full rounded-lg border border-border text-accent-blue hover:border-accent-blue/50 hover:bg-accent-blue/10 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
                      >
                        <ImagePlus className="w-4 h-4" />
                        {t("stories.selectImage")}
                      </button>
                      <button
                        type="button"
                        onClick={() => openFilePicker("video/*")}
                        className="h-10 w-full rounded-lg border border-border text-accent-pink hover:border-accent-pink/50 hover:bg-accent-pink/10 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
                      >
                        <Video className="w-4 h-4" />
                        {t("stories.selectVideo")}
                      </button>
                    </div>

                    {draftMedia?.type === "image" && (
                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() => setIsMusicPickerOpen(true)}
                          className="h-10 w-full rounded-lg border border-border text-accent-pink hover:border-accent-pink/50 hover:bg-accent-pink/10 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
                        >
                          <Music2 className="w-4 h-4 text-accent-pink" />
                          {selectedMusic ? t("stories.changeMusic") : t("stories.selectMusic")}
                        </button>
                        {selectedMusic && (
                          <div className="mt-2 rounded-lg border border-accent-pink/30 bg-accent-pink/10 p-2 flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-accent-pink/20 text-accent-pink flex items-center justify-center shrink-0">
                              <Music2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-foreground truncate">{selectedMusic.title}</div>
                              <div className="text-[11px] text-muted truncate">{selectedMusic.artist}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMusic(null)
                                setMusicPlaybackError(null)
                                stopComposerAudio()
                              }}
                              aria-label={t("stories.removeMusic")}
                              className="h-7 w-7 rounded-full text-muted hover:bg-panel-hover hover:text-foreground transition-colors flex items-center justify-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {musicPlaybackError && (
                          <div className="mt-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-foreground">
                            {musicPlaybackError}
                          </div>
                        )}
                      </div>
                    )}

                    {draftMedia?.type === "video" && (
                      <div className="pt-4 text-xs text-muted">
                        {t("stories.videoMusicNote")}
                      </div>
                    )}

                    {submitError && (
                      <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-foreground">
                        {submitError}
                      </div>
                    )}

                    <div className="mt-auto flex gap-3 pt-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={closeComposer} disabled={isPublishing}>
                        {t("stories.cancel")}
                      </Button>
                      <Button type="button" variant="neon-blue" className="flex-1 gap-2" onClick={publishStory} disabled={!draftMedia || isPublishing}>
                        {isPublishing ? `${t("stories.enter")}...` : t("stories.enter")} <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedStory && (
              <motion.div
                className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedStoryIndex(null)}
                  aria-label="Exit story"
                  className="fixed top-5 right-5 lg:right-[21rem] z-[10000] h-11 rounded-full border border-white/30 bg-black/80 px-4 text-sm font-bold text-white shadow-lg backdrop-blur hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={showPreviousStory}
                  aria-label="Story previous"
                  className="fixed left-4 sm:left-[calc(50%-270px)] top-1/2 z-[10000] h-12 w-12 -translate-y-1/2 rounded-full border border-white/30 bg-black/80 text-white shadow-lg backdrop-blur hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <motion.div
                  key={selectedStory.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="relative w-full max-w-[320px] h-[78vh] max-h-[760px] overflow-hidden rounded-lg border border-white/15 bg-black"
                >
                  {selectedStory.mediaType === "video" ? (
                    <video
                      ref={storyVideoRef}
                      src={selectedStory.mediaUrl}
                      autoPlay
                      playsInline
                      onClick={toggleStoryVideoPlayback}
                      onLoadedMetadata={updateStoryVideoProgress}
                      onTimeUpdate={updateStoryVideoProgress}
                      onEnded={advanceStory}
                      className="h-full w-full object-contain cursor-pointer"
                    />
                  ) : (
                    <img src={optimizeCloudinaryImage(selectedStory.mediaUrl, 1200)} alt="" decoding="async" className="h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/75 to-transparent">
                    <div className="h-1 rounded-full bg-white/25 overflow-hidden mb-4">
                      <div
                        className="h-full bg-white transition-[width] duration-150"
                        style={{ width: `${storyVideoProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar src={selectedStory.author.avatar} fallback={selectedStory.author.username[0]} className="h-10 w-10 border-white/40" />
                        <div className="min-w-0">
                          <div className="truncate text-white font-bold">{selectedStory.author.username}</div>
                          <div className="text-xs text-white/70 font-mono">{selectedStory.createdAt}</div>
                        </div>
                      </div>
                      {selectedStory.isOwn && !selectedStory.isPublishing && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsHighlightPickerOpen((current) => !current)
                            setHighlightMessage(null)
                          }}
                          aria-label="Thêm vào tin nổi bật"
                          title="Thêm vào tin nổi bật"
                          className={cn(
                            "h-10 w-10 shrink-0 rounded-full border shadow-lg backdrop-blur transition-colors flex items-center justify-center",
                            isSelectedStoryInAnyHighlight
                              ? "border-accent-blue/70 bg-accent-blue text-black"
                              : "border-white/30 bg-black/55 text-white hover:bg-white/20"
                          )}
                        >
                          {isSelectedStoryInAnyHighlight ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedStory.isOwn && (
                    <>
                      <AnimatePresence>
                        {isHighlightPickerOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="absolute right-4 top-24 z-40 w-[min(18rem,calc(100%-2rem))] rounded-lg border border-white/15 bg-black/85 p-3 text-white shadow-2xl backdrop-blur"
                          >
                            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                              <div className="text-sm font-bold">Chọn nhóm tin nổi bật</div>
                              <button
                                type="button"
                                onClick={() => setIsHighlightPickerOpen(false)}
                                aria-label="Đóng chọn tin nổi bật"
                                className="h-7 w-7 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                              {highlightGroups.length === 0 && (
                                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/60">
                                  Chưa có nhóm tin nổi bật.
                                </div>
                              )}
                              {highlightGroups.map((highlight) => {
                                const isAddedToHighlight = highlight.items.some((item) => item.storyId === selectedStory.id)

                                return (
                                  <button
                                    key={highlight.id}
                                    type="button"
                                    onClick={() => handleAddStoryToHighlight(highlight.id)}
                                    className={cn(
                                      "w-full rounded-lg border px-3 py-2 text-left transition-colors flex items-center gap-3",
                                      isAddedToHighlight
                                        ? "border-accent-blue/55 bg-accent-blue/15"
                                        : "border-white/10 bg-white/5 hover:border-accent-blue/60 hover:bg-accent-blue/15"
                                    )}
                                  >
                                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-white/10 shrink-0">
                                      {highlight.coverUrl ? (
                                        <img src={optimizeCloudinaryImage(highlight.coverUrl, 160)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                      ) : (
                                        <div className="h-full w-full flex items-center justify-center text-white/45">
                                          <Plus className="h-4 w-4" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-sm font-bold">{highlight.title}</div>
                                      <div className="text-xs text-white/45">
                                        {isAddedToHighlight ? "Đã thêm" : `${highlight.items.length} tin`}
                                      </div>
                                    </div>
                                    {isAddedToHighlight && (
                                      <div className="h-8 w-8 rounded-full bg-accent-blue text-black flex items-center justify-center">
                                        <Check className="h-4 w-4" />
                                      </div>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                            <div className="mt-3 border-t border-white/10 pt-3">
                              <input
                                value={newHighlightTitle}
                                onChange={(event) => setNewHighlightTitle(event.target.value)}
                                placeholder="Tên nhóm mới"
                                className="h-10 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-accent-blue"
                              />
                              <button
                                type="button"
                                onClick={handleCreateHighlightFromStory}
                                className="mt-2 h-10 w-full rounded-lg bg-accent-blue text-black font-bold hover:bg-white transition-colors flex items-center justify-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Tạo nhóm và thêm
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {highlightMessage && (
                        <div className="absolute right-4 top-24 z-30 rounded-full border border-white/15 bg-black/75 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur">
                          {highlightMessage}
                        </div>
                      )}
                    </>
                  )}
                  {(selectedStory.caption || selectedStory.music || selectedStory.isOwn) && (
                    <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col">
                      {selectedStory.isOwn && (
                        <AnimatePresence>
                          {isViewerListOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 14 }}
                              className="mx-3 mb-2 rounded-lg border border-white/15 bg-black/85 p-3 text-white shadow-2xl backdrop-blur"
                            >
                              <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
                                <div className="text-sm font-bold">{selectedStoryViewerActivities.length} {t("stories.viewer")}</div>
                                <button
                                  type="button"
                                  onClick={() => setIsViewerListOpen(false)}
                                  aria-label="Dong danh sach nguoi xem"
                                  className="h-7 w-7 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="max-h-[36vh] space-y-2 overflow-y-auto pr-1">
                                {selectedStoryViewerActivities.length === 0 && (
                                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/55">
                                    {t("stories.noViewer")}
                                  </div>
                                )}
                                {selectedStoryViewerActivities.map((viewer) => (
                                  <div key={viewer.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                                    <Avatar src={viewer.avatar} fallback={viewer.username[0]} className="h-8 w-8" />
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-sm font-bold">{viewer.username}</div>
                                      <div className="text-xs text-white/45">{viewer.viewedAt}</div>
                                    </div>
                                    {viewer.reactionType && <div className="text-xl leading-none">{viewer.reactionType}</div>}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                      <div className="space-y-2 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-8">
                        {selectedStory.music && (
                          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 py-2 text-white backdrop-blur">
                            <Music2 className="w-4 h-4 text-accent-pink shrink-0" />
                            <span className="text-xs font-bold truncate">{selectedStory.music.title}</span>
                            <span className="text-xs text-white/60 truncate">- {selectedStory.music.artist}</span>
                          </div>
                        )}
                        {musicPlaybackError && selectedStory.music && (
                          <div className="rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-xs text-white/80 backdrop-blur">
                            {musicPlaybackError}
                          </div>
                        )}
                        {selectedStory.caption && (
                          <p className="text-white text-sm leading-relaxed">{selectedStory.caption}</p>
                        )}
                        {selectedStory.isOwn && (
                          <button
                            type="button"
                            onClick={() => setIsViewerListOpen((current) => !current)}
                            aria-expanded={isViewerListOpen}
                            aria-label="Xem danh sach nguoi da xem story"
                            className="text-left text-white drop-shadow-2xl"
                          >
                            <ChevronUp className={cn("mb-0.5 h-4 w-4 transition-transform", isViewerListOpen && "rotate-180")} />
                            <span className="block w-fit border-b border-white/80 pb-0.5 text-sm font-extrabold leading-none">
                              {selectedStoryViewerActivities.length} {t("stories.viewer")}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>

                {!selectedStory.isOwn && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 18 }}
                      className="fixed bottom-5 left-1/2 z-[10000] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/80 p-2 shadow-2xl backdrop-blur"
                    >
                      {reactionOptions.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => reactToStory(emoji)}
                          disabled={isReacting}
                          aria-label={`React ${emoji}`}
                          className={cn(
                            "h-10 w-10 rounded-full text-xl leading-none transition-transform hover:scale-125 disabled:cursor-not-allowed disabled:opacity-60",
                            selectedStory.currentUserReaction === emoji ? "bg-white text-black shadow-lg" : "bg-white/10"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>

                    <AnimatePresence>
                      {floatingReactions.map((reaction, index) => (
                        <motion.div
                          key={reaction.id}
                          className="pointer-events-none fixed bottom-20 left-1/2 z-[10001] text-5xl drop-shadow-2xl"
                          initial={{ opacity: 0, y: 0, x: -20 + index * 12, scale: 0.7, rotate: -10 }}
                          animate={{ opacity: [0, 1, 1, 0], y: -170, scale: [0.7, 1.25, 1], rotate: 8 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.1, ease: "easeOut" }}
                        >
                          {reaction.emoji}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </>
                )}
                <button
                  type="button"
                  onClick={showNextStory}
                  aria-label="Story next"
                  className="fixed right-4 sm:right-[calc(50%-270px)] top-1/2 z-[10000] h-12 w-12 -translate-y-1/2 rounded-full border border-white/30 bg-black/80 text-white shadow-lg backdrop-blur hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </section>
  )
}
