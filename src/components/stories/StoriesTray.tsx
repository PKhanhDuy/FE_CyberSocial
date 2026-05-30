import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Camera, ChevronLeft, ChevronRight, ChevronUp, ImagePlus, Music2, Play, Plus, Send, Video, X } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/useAuthStore"
import { musicTrackApi, storyApi, uploadApi, type BackendMusicTrack, type BackendStory } from "@/lib/api"
import type { User } from "@/mocks/types"

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
  caption: string
  createdAt: string
  music?: MusicTrack
  isOwn?: boolean
  isViewed?: boolean
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

const fallbackStories: Story[] = [
  {
    id: "story_1",
    author: {
      id: "u_2",
      username: "Glitch_Walker",
      avatar: "https://i.pravatar.cc/150?u=glitch_walker",
      isVerified: false,
    },
    mediaUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&q=80&w=900",
    mediaType: "image",
    caption: "Dang quet cac tin hieu bat thuong trong thanh pho.",
    createdAt: "12 phut",
  },
  {
    id: "story_2",
    author: {
      id: "u_3",
      username: "Cipher_Null",
      avatar: "https://i.pravatar.cc/150?u=cipher_00",
      isVerified: false,
    },
    mediaUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&q=80&w=900",
    mediaType: "image",
    caption: "Mot lat yen tinh truoc khi dong bo node moi.",
    createdAt: "25 phut",
    isViewed: true,
  },
  {
    id: "story_3",
    author: {
      id: "u_4",
      username: "Neon Sentinel",
      avatar: "https://i.pravatar.cc/150?u=neon_sentinel",
      isVerified: true,
    },
    mediaUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=900",
    mediaType: "image",
    caption: "Doi kiem duyet dang truc he thong.",
    createdAt: "41 phut",
  },
]

const reactionOptions = ["\u2764\ufe0f", "\ud83d\ude02", "\ud83d\ude2e", "\ud83d\ude22", "\ud83d\ude21", "\ud83d\udc4f", "\ud83d\udd25"]

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds || 0)
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`
}

const relativeStoryTime = (value: string) => {
  const then = new Date(value).getTime()
  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSeconds < 60) return "Vua xong"
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} phut`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} gio`
  return `${Math.floor(diffHours / 24)} ngay`
}

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const mapMusicTrack = (track: BackendMusicTrack): MusicTrack => ({
  id: track.id,
  title: track.title,
  artist: track.artist,
  duration: formatDuration(track.durationSeconds),
  audioUrl: track.audioUrl,
  coverUrl: track.coverUrl,
  isBackend: true,
})

const mapBackendStory = (story: BackendStory, currentUserId?: string): Story => ({
  id: story.id,
  author: {
    id: story.author.id,
    username: story.author.displayName,
    avatar: story.author.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(story.author.id)}`,
    isVerified: false,
  },
  mediaUrl: story.media.mediaUrl,
  mediaType: story.media.mediaType === "VIDEO" ? "video" : "image",
  caption: story.caption || "",
  createdAt: relativeStoryTime(story.createdAt),
  music: story.music ? mapMusicTrack(story.music) : undefined,
  isOwn: currentUserId ? story.author.id === currentUserId : false,
  isViewed: story.viewedByCurrentUser,
  currentUserReaction: story.currentUserReaction,
  viewers: story.viewers?.map((viewer) => ({
    id: viewer.userId,
    username: viewer.displayName,
    avatar: viewer.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(viewer.userId)}`,
    viewedAt: relativeStoryTime(viewer.viewedAt),
  })) ?? [],
  reactions: story.reactions?.map((reaction) => ({
    id: reaction.userId,
    username: reaction.displayName,
    avatar: reaction.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(reaction.userId)}`,
    viewedAt: relativeStoryTime(reaction.createdAt),
    reactionType: reaction.reactionType,
  })) ?? [],
})

export function StoriesTray() {
  const currentUser = useAuthStore((state) => state.user)
  const storyOwner = currentUser ?? fallbackUser
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
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; emoji: string }>>([])
  const [isReacting, setIsReacting] = useState(false)
  const [isViewerListOpen, setIsViewerListOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const storyVideoRef = useRef<HTMLVideoElement>(null)
  const [storyVideoProgress, setStoryVideoProgress] = useState(0)

  const selectedStory = selectedStoryIndex === null ? null : stories[selectedStoryIndex]
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
    }
  }, [draftMedia?.url])

  useEffect(() => {
    let isMounted = true

    storyApi.list()
      .then((response) => {
        if (isMounted) setStories(response.content.map((story) => mapBackendStory(story, currentUser?.id)))
      })
      .catch(() => {
        if (isMounted) setStories(fallbackStories)
      })

    return () => {
      isMounted = false
    }
  }, [currentUser?.id])

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
    if (selectedStory?.mediaType !== "video") return

    window.setTimeout(() => {
      void storyVideoRef.current?.play()
    }, 0)
  }, [selectedStory?.id, selectedStory?.mediaType])

  useEffect(() => {
    if (!selectedStory || selectedStory.mediaType === "video") return

    setStoryVideoProgress(0)
    const durationMs = 5000
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
  }, [selectedStory?.id, selectedStory?.mediaType])

  const openFilePicker = (accept: string) => {
    if (!fileInputRef.current) return
    fileInputRef.current.accept = accept
    fileInputRef.current.click()
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
    setSubmitError(null)
    setIsComposerOpen(true)
    event.target.value = ""
  }

  const closeComposer = () => {
    if (draftMedia?.url) URL.revokeObjectURL(draftMedia.url)
    setDraftMedia(null)
    setDraftCaption("")
    setSelectedMusic(null)
    setIsMusicPickerOpen(false)
    setSubmitError(null)
    setIsPublishing(false)
    setIsComposerOpen(false)
  }

  const publishStory = async () => {
    if (!draftMedia) return

    setIsPublishing(true)
    setSubmitError(null)
    try {
      const uploaded = draftMedia.type === "video"
        ? await uploadApi.video(draftMedia.file)
        : await uploadApi.image(draftMedia.file)
      const createdStory = await storyApi.create({
        caption: draftCaption.trim() || undefined,
        visibility: "FRIENDS",
        media: {
          mediaType: draftMedia.type === "video" ? "VIDEO" : "IMAGE",
          mediaUrl: uploaded.url,
        },
        musicTrackId: draftMedia.type === "image" && selectedMusic?.isBackend ? selectedMusic.id : undefined,
      })

      setStories((currentStories) => [mapBackendStory(createdStory, currentUser?.id), ...currentStories])
      setDraftMedia(null)
      setDraftCaption("")
      setSelectedMusic(null)
      setIsMusicPickerOpen(false)
      setIsComposerOpen(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Khong tao duoc story")
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
          currentStory.id === updatedStory.id ? mapBackendStory(updatedStory, currentUser?.id) : currentStory
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

  return (
    <section className="relative">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setIsComposerOpen(true)}
          className="snap-start shrink-0 w-32 sm:w-36 h-52 rounded-lg overflow-hidden border border-border bg-panel relative group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          <div className="h-45 bg-panel-hover overflow-hidden -mt-16">
            <img src={storyOwner.avatar} alt="" className="h-full w-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="absolute top-24 left-1/2 -translate-x-1/2 h-11 w-11 rounded-full bg-background border-4 border-panel flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-accent-blue text-black flex items-center justify-center shadow-[var(--shadow-neon-blue)]">
              <Plus className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3 pt-8 bg-panel text-center">
            <div className="text-sm font-bold text-foreground line-clamp-2">Tao tin</div>
          </div>
        </button>

        {stories.map((story, index) => (
          <button
            key={story.id}
            type="button"
            onClick={() => selectStory(index)}
            className="snap-start shrink-0 w-32 sm:w-36 h-52 rounded-lg overflow-hidden border border-border bg-panel relative text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            {story.mediaType === "video" ? (
              <video src={story.mediaUrl} muted playsInline className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <img src={story.mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/80" />
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

      {typeof document !== "undefined" && createPortal(
        <>
          <AnimatePresence>
            {isComposerOpen && (
              <motion.div
                className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.98 }}
                  className="w-full max-w-[680px] max-h-[92vh] overflow-hidden rounded-lg border border-border bg-background shadow-2xl grid md:grid-cols-[minmax(0,440px)_220px]"
                >
                  <div className="relative bg-black min-h-[380px] flex items-center justify-center">
                    {draftMedia?.type === "video" ? (
                      <video src={draftMedia.url} controls className="max-h-[72vh] w-full object-contain" />
                    ) : draftMedia ? (
                      <>
                        <img src={draftMedia.url} alt="" className="max-h-[72vh] w-full object-contain" />
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
                              className="absolute right-4 top-4 w-72 rounded-lg border border-white/15 bg-black/80 p-3 text-white shadow-2xl backdrop-blur"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-sm font-bold">
                                  <Music2 className="w-4 h-4 text-accent-pink" />
                                  Chon nhac
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
                              <div className="space-y-2">
                                {musicTracks.length === 0 && (
                                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-4 text-center text-sm text-white/60">
                                    Chua co bai nhac nao.
                                  </div>
                                )}
                                {musicTracks.map((track) => (
                                  <button
                                    key={track.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedMusic(track)
                                      setIsMusicPickerOpen(false)
                                    }}
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
                        <div className="text-white font-bold text-lg">Tao story moi</div>
                        <div className="text-white/60 text-sm mt-2">Chon anh hoac video de xem truoc khi dang.</div>
                        <div className="mt-6 mx-auto max-w-56 space-y-3">
                          <button
                            type="button"
                            onClick={() => openFilePicker("image/*")}
                            className="h-12 w-full rounded-lg border border-accent-blue/40 bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 transition-colors flex items-center justify-center gap-2 font-bold"
                          >
                            <ImagePlus className="w-5 h-5" />
                            Anh
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

                  <div className="p-4 flex flex-col min-h-[360px]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={storyOwner.avatar} fallback={storyOwner.username[0]} />
                        <div>
                          <div className="font-bold text-foreground">{storyOwner.username}</div>
                          <div className="text-xs text-muted font-mono">Tin cua ban</div>
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
                      placeholder="Them mo ta cho story..."
                      className="min-h-20 resize-none rounded-lg border border-border bg-panel px-3 py-3 text-sm text-foreground outline-none focus:border-accent-blue"
                    />

                    <div className="space-y-2 pt-3">
                      <button
                        type="button"
                        onClick={() => openFilePicker("image/*")}
                        className="h-10 w-full rounded-lg border border-border text-accent-blue hover:border-accent-blue/50 hover:bg-accent-blue/10 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
                      >
                        <ImagePlus className="w-4 h-4" />
                        Chon anh
                      </button>
                      <button
                        type="button"
                        onClick={() => openFilePicker("video/*")}
                        className="h-10 w-full rounded-lg border border-border text-accent-pink hover:border-accent-pink/50 hover:bg-accent-pink/10 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
                      >
                        <Video className="w-4 h-4" />
                        Chon video
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
                          {selectedMusic ? "Doi nhac" : "Chon nhac"}
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
                              onClick={() => setSelectedMusic(null)}
                              aria-label="Bo nhac"
                              className="h-7 w-7 rounded-full text-muted hover:bg-panel-hover hover:text-foreground transition-colors flex items-center justify-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {draftMedia?.type === "video" && (
                      <div className="pt-4 text-xs text-muted">
                        Chen nhac chi ap dung cho story hinh anh.
                      </div>
                    )}

                    {submitError && (
                      <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-foreground">
                        {submitError}
                      </div>
                    )}

                    <div className="mt-auto flex gap-3 pt-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={closeComposer} disabled={isPublishing}>
                        Huy
                      </Button>
                      <Button type="button" variant="neon-blue" className="flex-1 gap-2" onClick={publishStory} disabled={!draftMedia || isPublishing}>
                        {isPublishing ? "Dang..." : "Dang"} <Send className="w-4 h-4" />
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
                  aria-label="Thoat xem story"
                  className="fixed top-5 right-5 lg:right-[21rem] z-[10000] h-11 rounded-full border border-white/30 bg-black/80 px-4 text-sm font-bold text-white shadow-lg backdrop-blur hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={showPreviousStory}
                  aria-label="Story truoc"
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
                    <img src={selectedStory.mediaUrl} alt="" className="h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/75 to-transparent">
                    <div className="h-1 rounded-full bg-white/25 overflow-hidden mb-4">
                      <div
                        className="h-full bg-white transition-[width] duration-150"
                        style={{ width: `${storyVideoProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar src={selectedStory.author.avatar} fallback={selectedStory.author.username[0]} className="h-10 w-10 border-white/40" />
                      <div>
                        <div className="text-white font-bold">{selectedStory.author.username}</div>
                        <div className="text-xs text-white/70 font-mono">{selectedStory.createdAt}</div>
                      </div>
                    </div>
                  </div>
                  {(selectedStory.caption || selectedStory.music) && (
                    <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/85 to-transparent">
                      {selectedStory.music && (
                        <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 py-2 text-white backdrop-blur">
                          <Music2 className="w-4 h-4 text-accent-pink shrink-0" />
                          <span className="text-xs font-bold truncate">{selectedStory.music.title}</span>
                          <span className="text-xs text-white/60 truncate">- {selectedStory.music.artist}</span>
                        </div>
                      )}
                      {selectedStory.caption && <p className="text-white text-sm leading-relaxed">{selectedStory.caption}</p>}
                    </div>
                  )}

                  {selectedStory.isOwn && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsViewerListOpen((current) => !current)}
                        aria-expanded={isViewerListOpen}
                        aria-label="Xem danh sach nguoi da xem story"
                        className="absolute bottom-3 left-4 z-20 text-left text-white drop-shadow-2xl"
                      >
                        <ChevronUp className={cn("mb-0.5 h-4 w-4 transition-transform", isViewerListOpen && "rotate-180")} />
                        <span className="block border-b border-white/80 pb-0.5 text-sm font-extrabold leading-none">
                          {selectedStoryViewerActivities.length} nguoi xem
                        </span>
                      </button>

                      <AnimatePresence>
                        {isViewerListOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 14 }}
                            className="absolute inset-x-3 bottom-12 z-30 rounded-lg border border-white/15 bg-black/85 p-3 text-white shadow-2xl backdrop-blur"
                          >
                            <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
                              <div className="text-sm font-bold">{selectedStoryViewerActivities.length} nguoi xem</div>
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
                                  Chua co ai xem story nay.
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
                    </>
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
                  aria-label="Story tiep theo"
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
