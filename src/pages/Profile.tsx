import { useEffect, useRef, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ShieldCheck, Activity, Settings, MapPin, Link as LinkIcon, Edit2, UserCircle, Heart, Briefcase, GraduationCap, Globe, Languages, Cake, Camera, HelpCircle, Moon, Sun, LogOut, ChevronLeft, ChevronRight, KeyRound, Check, Images, Music2, Plus, Play, Trash2, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { PostCard } from "@/components/feed/PostCard"
import { AIAnalysisModal } from "@/components/ai/AIAnalysisModal"
import type { Post } from "@/mocks/types"
import { postApi, uploadApi, followApi, type FollowUser } from "@/lib/api"
import { createStoryHighlight, loadStoryHighlights, removeStoryFromHighlight, removeStoryHighlight, STORY_HIGHLIGHTS_EVENT, type StoryHighlight } from "@/lib/storyHighlights"
import { formatRelativeStoryTime } from "@/lib/relativeStoryTime"
import { useAuthStore } from "@/store/useAuthStore"
import { useThemeStore } from "@/store/useThemeStore"
import { useLanguageStore } from "@/store/useLanguageStore"
import { optimizeCloudinaryImage } from "@/lib/media"
import { Avatar } from "@/components/ui/Avatar"

type SettingsMenuView = "main" | "privacy" | "language"

const DEFAULT_HIGHLIGHT_MUSIC_DURATION_MS = 20_000
const DEFAULT_HIGHLIGHT_IMAGE_DURATION_MS = 20_000

export function Profile() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("activity")
  const [aboutTab, setAboutTab] = useState("overview")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false)
  const [settingsMenuView, setSettingsMenuView] = useState<SettingsMenuView>("main")
  const currentUser = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { isDarkMode, toggleTheme } = useThemeStore()
  const { language, setLanguage } = useLanguageStore()
  const updateDisplayName = useAuthStore((state) => state.updateDisplayName)
  const updateAvatar = useAuthStore((state) => state.updateAvatar)
  const updateCover = useAuthStore((state) => state.updateCover)
  const refreshCurrentUser = useAuthStore((state) => state.refreshCurrentUser)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [postsError, setPostsError] = useState<string | null>(null)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [showFollowersList, setShowFollowersList] = useState(false)
  const [showFollowingList, setShowFollowingList] = useState(false)
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)
  const [followersError, setFollowersError] = useState<string | null>(null)
  const [followingError, setFollowingError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [storyHighlights, setStoryHighlights] = useState<StoryHighlight[]>([])
  const [isCreatingHighlight, setIsCreatingHighlight] = useState(false)
  const [newHighlightTitle, setNewHighlightTitle] = useState("")
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
  const [selectedHighlightItemIndex, setSelectedHighlightItemIndex] = useState(0)
  const [highlightItemProgress, setHighlightItemProgress] = useState(0)
  const [highlightMusicError, setHighlightMusicError] = useState<string | null>(null)
  const [pendingDeleteHighlightId, setPendingDeleteHighlightId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const settingsMenuRef = useRef<HTMLDivElement>(null)
  const highlightAudioRef = useRef<HTMLAudioElement>(null)
  const highlightVideoRef = useRef<HTMLVideoElement>(null)

  const TABS = [
    { id: "activity", label: t("profile.activity"), icon: Activity },
    { id: "about", label: t("profile.introduction"), icon: UserCircle }
  ]

  const ABOUT_SIDEBAR = [
    { id: "overview", label: t("profile.introductions.overview") },
    { id: "work_education", label: t("profile.introductions.education") },
    { id: "contact_basic", label: t("profile.introductions.contact") },
    { id: "details", label: t("profile.introductions.details") }
  ]

  const [userProfile, setUserProfile] = useState<any>({
    cover: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1600",
    ...(currentUser || {})
  })

  useEffect(() => {
    if (currentUser) {
      setUserProfile((prev: any) => ({ ...prev, ...currentUser }))
    }
  }, [currentUser])

  useEffect(() => {
    refreshCurrentUser().catch(() => {
      setProfileError("Khong tai duoc ho so tai khoan")
    })
  }, [refreshCurrentUser])

  useEffect(() => {
    const loadHighlights = () => {
      setStoryHighlights(loadStoryHighlights(currentUser?.id))
    }

    loadHighlights()
    window.addEventListener(STORY_HIGHLIGHTS_EVENT, loadHighlights)
    return () => window.removeEventListener(STORY_HIGHLIGHTS_EVENT, loadHighlights)
  }, [currentUser?.id])

  useEffect(() => {
    if (!isSettingsMenuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (settingsMenuRef.current?.contains(event.target as Node)) return
      setIsSettingsMenuOpen(false)
      setSettingsMenuView("main")
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSettingsMenuOpen(false)
        setSettingsMenuView("main")
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isSettingsMenuOpen])

  useEffect(() => {
    const loadUserPosts = async () => {
      setPostsError(null)
      try {
        if (!currentUser?.id) {
          setUserPosts([])
          return
        }
        const response = await postApi.byAuthor(currentUser.id)
        setUserPosts(response.content)
      } catch (error) {
        setPostsError(error instanceof Error ? error.message : "Khong tai duoc bai viet")
      }
    }

    loadUserPosts()
    window.addEventListener("cybersocial:post-created", loadUserPosts)
    return () => window.removeEventListener("cybersocial:post-created", loadUserPosts)
  }, [currentUser?.id])

  useEffect(() => {
    const loadFollowCounts = async () => {
      if (!currentUser?.id) {
        setFollowerCount(0)
        setFollowingCount(0)
        return
      }

      try {
        const [followersResponse, followingResponse] = await Promise.all([
          followApi.countFollowers(currentUser.id),
          followApi.countFollowing(currentUser.id),
        ])
        setFollowerCount(followersResponse.count)
        setFollowingCount(followingResponse.count)
      } catch {
        setFollowerCount(0)
        setFollowingCount(0)
      }
    }

    loadFollowCounts()
  }, [currentUser?.id])

  useEffect(() => {
    const loadFollowers = async () => {
      if (!showFollowersList || !currentUser?.id) return

      setFollowersLoading(true)
      setFollowersError(null)
      try {
        const response = await followApi.getFollowers(currentUser.id, 0, 50)
        setFollowers(response.content)
      } catch (error) {
        setFollowersError(error instanceof Error ? error.message : "Khong tai duoc danh sach nguoi theo doi")
        setFollowers([])
      } finally {
        setFollowersLoading(false)
      }
    }

    loadFollowers()
  }, [currentUser?.id, showFollowersList])

  useEffect(() => {
    const loadFollowing = async () => {
      if (!showFollowingList || !currentUser?.id) return

      setFollowingLoading(true)
      setFollowingError(null)
      try {
        const response = await followApi.getFollowing(currentUser.id, 0, 50)
        setFollowing(response.content)
      } catch (error) {
        setFollowingError(error instanceof Error ? error.message : "Khong tai duoc danh sach dang theo doi")
        setFollowing([])
      } finally {
        setFollowingLoading(false)
      }
    }

    loadFollowing()
  }, [currentUser?.id, showFollowingList])

  const handleFollowersToggle = () => {
    setShowFollowingList(false)
    setShowFollowersList((current) => !current)
  }

  const handleFollowingToggle = () => {
    setShowFollowersList(false)
    setShowFollowingList((current) => !current)
  }

  const renderFollowUserList = (users: FollowUser[]) => (
    users.map((user) => (
      <Link
        key={user.id}
        to={user.id === currentUser?.id ? "/profile" : `/users/${user.id}`}
        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-panel/60 hover:border-accent-blue/40 transition-colors"
      >
        <Avatar
          src={user.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email || user.id)}`}
          fallback={user.displayName[0] || "U"}
          className="h-11 w-11"
        />
        <div className="min-w-0">
          <div className="font-bold text-foreground truncate">{user.displayName}</div>
          <div className="text-xs text-muted font-mono truncate">{user.email}</div>
        </div>
      </Link>
    ))
  )

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setProfileError(null)
      const uploaded = await uploadApi.image(file)
      const saved = await updateAvatar(uploaded.url)
      if (!saved) {
        setProfileError("Khong cap nhat duoc anh dai dien")
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Khong upload duoc anh dai dien")
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setProfileError(null)
      const uploaded = await uploadApi.image(file)
      const saved = await updateCover(uploaded.url)
      if (!saved) {
        setProfileError("Khong cap nhat duoc anh bia")
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Khong upload duoc anh bia")
    } finally {
      if (coverInputRef.current) {
        coverInputRef.current.value = ""
      }
    }
  }

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>("")

  const startEdit = (field: string, currentValue: any) => {
    setEditingField(field)
    if (Array.isArray(currentValue)) {
      setEditValue(currentValue.join(", "))
    } else {
      setEditValue(currentValue || "")
    }
  }

  const saveEdit = async (field: string) => {
    let finalValue: any = editValue;
    if (field === 'hobbies' && typeof editValue === 'string') {
      finalValue = editValue.split(',').map(s => s.trim()).filter(s => s !== "");
    }
    if (field === "username") {
      const saved = await updateDisplayName(String(finalValue))
      if (!saved) return
    }
    setUserProfile((prev: any) => ({ ...prev, [field]: finalValue }))
    setEditingField(null)
  }

  const cancelEdit = () => {
    setEditingField(null)
  }

  const handleLogout = async () => {
    setIsSettingsMenuOpen(false)
    setSettingsMenuView("main")
    await logout()
    navigate("/login", { replace: true })
  }

  const getSettingsMenuTransform = () => {
    if (settingsMenuView === "privacy") return "translateX(-33.3333%)"
    if (settingsMenuView === "language") return "translateX(-66.6667%)"
    return "translateX(0)"
  }

  const handleLanguageChange = (nextLanguage: "vi" | "en") => {
    setLanguage(nextLanguage)
    setIsSettingsMenuOpen(false)
    setSettingsMenuView("main")
  }

  const handleCreateHighlightGroup = () => {
    setStoryHighlights(createStoryHighlight(currentUser?.id, newHighlightTitle || "Tin nổi bật"))
    setNewHighlightTitle("")
    setIsCreatingHighlight(false)
  }

  const selectedHighlight = storyHighlights.find((highlight) => highlight.id === selectedHighlightId)
  const selectedHighlightItem = selectedHighlight?.items[selectedHighlightItemIndex]

  useEffect(() => {
    const audio = highlightAudioRef.current
    if (!audio) return

    audio.pause()
    audio.currentTime = 0
    setHighlightMusicError(null)

    if (!selectedHighlightItem?.music?.audioUrl) return

    audio.src = selectedHighlightItem.music.audioUrl
    audio.currentTime = (selectedHighlightItem.musicStartMs ?? 0) / 1000
    const timeoutId = window.setTimeout(() => {
      audio.pause()
    }, selectedHighlightItem.musicDurationMs ?? DEFAULT_HIGHLIGHT_MUSIC_DURATION_MS)

    audio.play().catch(() => {
      setHighlightMusicError("Không phát được nhạc của tin này")
    })

    return () => {
      window.clearTimeout(timeoutId)
      audio.pause()
      audio.currentTime = 0
    }
  }, [selectedHighlightItem?.id, selectedHighlightItem?.music?.audioUrl, selectedHighlightItem?.musicStartMs, selectedHighlightItem?.musicDurationMs])

  const openHighlightViewer = (highlight: StoryHighlight) => {
    if (highlight.items.length === 0) {
      setIsCreatingHighlight(true)
      return
    }

    setSelectedHighlightId(highlight.id)
    setSelectedHighlightItemIndex(0)
  }

  const closeHighlightViewer = () => {
    highlightAudioRef.current?.pause()
    highlightVideoRef.current?.pause()
    setSelectedHighlightId(null)
    setSelectedHighlightItemIndex(0)
    setHighlightItemProgress(0)
  }

  const showPreviousHighlightItem = () => {
    if (!selectedHighlight) return
    setSelectedHighlightItemIndex((currentIndex) => (
      currentIndex === 0 ? selectedHighlight.items.length - 1 : currentIndex - 1
    ))
  }

  const showNextHighlightItem = () => {
    if (!selectedHighlight) return
    if (selectedHighlightItemIndex >= selectedHighlight.items.length - 1) {
      closeHighlightViewer()
      return
    }

    setSelectedHighlightItemIndex((currentIndex) => Math.min(currentIndex + 1, selectedHighlight.items.length - 1))
  }

  const removeCurrentHighlightItem = () => {
    if (!selectedHighlight || !selectedHighlightItem) return

    const nextHighlights = removeStoryFromHighlight(currentUser?.id, selectedHighlight.id, selectedHighlightItem.id)
    const updatedHighlight = nextHighlights.find((highlight) => highlight.id === selectedHighlight.id)
    setStoryHighlights(nextHighlights)

    if (!updatedHighlight || updatedHighlight.items.length === 0) {
      closeHighlightViewer()
      return
    }

    setSelectedHighlightItemIndex((currentIndex) => (
      Math.min(currentIndex, updatedHighlight.items.length - 1)
    ))
    setHighlightItemProgress(0)
  }

  const removeHighlightGroup = (highlightId: string) => {
    const nextHighlights = removeStoryHighlight(currentUser?.id, highlightId)
    setStoryHighlights(nextHighlights)
    setPendingDeleteHighlightId(null)

    if (selectedHighlightId === highlightId) {
      closeHighlightViewer()
    }
  }

  const updateHighlightVideoProgress = () => {
    const video = highlightVideoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration === 0) return
    setHighlightItemProgress(Math.min(100, (video.currentTime / video.duration) * 100))
  }

  useEffect(() => {
    setHighlightItemProgress(0)
    if (!selectedHighlightItem || selectedHighlightItem.mediaType === "video") return

    const durationMs = selectedHighlightItem.musicDurationMs ?? DEFAULT_HIGHLIGHT_IMAGE_DURATION_MS
    const startedAt = Date.now()
    const intervalId = window.setInterval(() => {
      setHighlightItemProgress(Math.min(100, ((Date.now() - startedAt) / durationMs) * 100))
    }, 100)
    const timeoutId = window.setTimeout(() => {
      showNextHighlightItem()
    }, durationMs)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [selectedHighlightItem?.id, selectedHighlightItem?.mediaType, selectedHighlightItem?.musicDurationMs])

  const renderField = (field: string, label: string, icon: React.ReactNode, type: string = "text", options?: string[]) => {
    const isEditing = editingField === field;
    const rawValue = userProfile[field];
    const displayValue = Array.isArray(rawValue) ? rawValue.join(", ") : rawValue;

    return (
      <div className="flex items-start gap-4 p-4 hover:bg-panel rounded-xl transition-colors group">
        <div className="mt-1 text-muted">
          {icon}
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <span className="text-xs text-accent-blue uppercase tracking-wider font-bold">{label}</span>
              {options ? (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-background border border-accent-blue rounded-lg px-3 py-2 text-foreground outline-none focus:shadow-[var(--shadow-neon-blue)] transition-shadow"
                >
                  <option value="">{label.toLowerCase()}</option>
                  {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : type === "textarea" ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-background border border-accent-blue rounded-lg px-3 py-2 text-foreground outline-none focus:shadow-[var(--shadow-neon-blue)] min-h-[80px]"
                  placeholder={`Nhập ${label.toLowerCase()}...`}
                />
              ) : (
                <input
                  type={type}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-background border border-accent-blue rounded-lg px-3 py-2 text-foreground outline-none focus:shadow-[var(--shadow-neon-blue)]"
                  placeholder={`Nhập ${label.toLowerCase()}...`}
                />
              )}
              <div className="flex gap-2 mt-2">
                <button onClick={() => saveEdit(field)} className="px-4 py-1.5 bg-accent-blue text-black hover:bg-white rounded text-sm font-bold transition-colors shadow-[var(--shadow-neon-blue)]">{t("profile.settings.save")}</button>
                <button onClick={cancelEdit} className="px-4 py-1.5 bg-[#2a2a40] text-muted hover:bg-red-500/20 hover:text-red-500 rounded text-sm font-bold transition-colors">{t("profile.settings.cancel")}</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted uppercase tracking-wider">{label}</span>
                <button
                  onClick={() => startEdit(field, rawValue)}
                  className="text-muted hover:text-accent-blue opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 text-xs bg-background px-2 py-1 rounded border border-border hover:border-accent-blue"
                >
                  <Edit2 className="w-3 h-3" /> {t("profile.settings.modify")}
                </button>
              </div>
              <div className="text-foreground mt-1 font-medium leading-relaxed">
                {displayValue || <span className="text-muted italic font-normal">{t("profile.introductions.overviewContent.noInfo")}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header/Cover Section */}
      <div className="relative rounded-2xl overflow-hidden glass-panel border border-border">
        {/* Cover Image with cyber gradient overlay */}
        <div
          className="h-48 relative overflow-hidden cursor-pointer group"
          onClick={() => coverInputRef.current?.click()}
          title="Thay đổi ảnh bìa"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 to-accent-pink/20 mix-blend-overlay z-10" />
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-300 group-hover:scale-[1.02]"
            style={{ backgroundImage: `url(${optimizeCloudinaryImage(userProfile.cover, 1600)})` }}
          />
          {/* Cyber grid effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(96,165,250,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.1)_1px,transparent_1px)] bg-[size:20px_20px] z-10 opacity-30 pointer-events-none" />

          {/* Edit Cover Overlay */}
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center gap-2 text-white font-bold tracking-wider">
            <Camera className="w-5 h-5 text-accent-blue animate-pulse" />
            <span className="text-xs font-mono">THAY ĐỔI ẢNH BÌA</span>
          </div>

          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 relative z-20">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="Thay đổi ảnh đại diện"
            >
              <div className="w-32 h-32 rounded-xl border-2 border-accent-blue p-1 bg-background neon-border-blue relative overflow-hidden">
                <img
                  src={optimizeCloudinaryImage(userProfile.avatar, 320)}
                  alt={userProfile.username}
                  decoding="async"
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                  <Camera className="w-6 h-6 text-accent-blue" />
                  <span className="text-[10px] font-bold tracking-widest font-mono">THAY ĐỔI</span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 border border-border z-10">
                <div className="bg-accent-blue p-1.5 rounded-full shadow-[var(--shadow-neon-blue)]">
                  <ShieldCheck className="w-4 h-4 text-black" />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="relative flex items-center gap-2" ref={settingsMenuRef}>
              <button
                onClick={() => {
                  setActiveTab("about");
                  setAboutTab("overview");
                  setTimeout(() => {
                    const tabs = document.getElementById("profile-tabs");
                    if (tabs) {
                      // Scroll to tabs with a small offset for smooth UX
                      const y = tabs.getBoundingClientRect().top + window.scrollY - 20;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-panel border border-border hover:bg-panel-hover hover:border-accent-blue/50 transition-colors text-sm font-medium text-foreground shadow-lg group"
              >
                <Edit2 className="w-4 h-4 group-hover:text-accent-blue transition-colors" />
                {t("profile.editProfile")}
              </button>

              <button
                type="button"
                aria-label={t("profile.settings.menuLabel")}
                aria-expanded={isSettingsMenuOpen}
                onClick={() => {
                  setSettingsMenuView("main")
                  setIsSettingsMenuOpen((isOpen) => !isOpen)
                }}
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-lg bg-panel border border-border hover:bg-panel-hover hover:border-accent-blue/50 transition-colors text-muted hover:text-accent-blue shadow-lg",
                  isSettingsMenuOpen && "border-accent-blue/60 text-accent-blue bg-accent-blue/10"
                )}
              >
                <Settings className="w-5 h-5" />
              </button>

              {isSettingsMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border shadow-2xl z-50 overflow-hidden"
                  style={{ backgroundColor: isDarkMode ? "#12181a" : "#ffffff" }}
                >
                  <div
                    className="flex w-[300%] transition-transform duration-300 ease-out"
                    style={{ transform: getSettingsMenuTransform() }}
                  >
                    <div className="w-1/3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSettingsMenuView("privacy")}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-panel-hover hover:text-accent-blue transition-colors cursor-pointer"
                      >
                        <Settings className="w-5 h-5 text-accent-blue group-hover:scale-105 transition-transform" />
                        <span className="font-medium">{t("profile.settings.title")}</span>
                      </button>
                      <button
                        type="button"
                        className="group w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-panel-hover hover:text-accent-blue transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-5 h-5 text-accent-blue group-hover:scale-105 transition-transform" />
                        <span className="font-medium">{t("profile.settings.help")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-panel-hover hover:text-accent-blue transition-colors cursor-pointer"
                      >
                        {isDarkMode ? <Sun className="w-5 h-5 text-accent-blue group-hover:scale-105 transition-transform" /> : <Moon className="w-5 h-5 text-accent-blue group-hover:scale-105 transition-transform" />}
                        <span className="font-medium">{isDarkMode ? t("profile.settings.lightMode") : t("profile.settings.darkMode")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-danger hover:bg-danger/10 transition-colors border-t border-border cursor-pointer"
                      >
                        <LogOut className="w-5 h-5 group-hover:scale-105 transition-transform" />
                        <span className="font-medium">{t("profile.settings.logout")}</span>
                      </button>
                    </div>

                    <div className="w-1/3 shrink-0">
                      <div className="flex items-center gap-2 border-b border-border px-2 py-2">
                        <button
                          type="button"
                          aria-label={t("common.back")}
                          onClick={() => setSettingsMenuView("main")}
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-muted hover:bg-panel-hover hover:text-accent-blue transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-bold text-foreground">{t("profile.settings.title")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingsMenuOpen(false)
                          setSettingsMenuView("main")
                          navigate("/change-password")
                        }}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-panel-hover hover:text-accent-blue transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-5 h-5 text-accent-blue group-hover:scale-105 transition-transform" />
                        <span className="font-medium">{t("profile.settings.changePassword")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsMenuView("language")}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-panel-hover hover:text-accent-blue transition-colors cursor-pointer"
                      >
                        <Languages className="w-5 h-5 text-accent-blue group-hover:scale-105 transition-transform" />
                        <span className="font-medium">{t("profile.settings.language")}</span>
                      </button>
                    </div>

                    <div className="w-1/3 shrink-0">
                      <div className="flex items-center gap-2 border-b border-border px-2 py-2">
                        <button
                          type="button"
                          aria-label={t("common.back")}
                          onClick={() => setSettingsMenuView("privacy")}
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-muted hover:bg-panel-hover hover:text-accent-blue transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-bold text-foreground">{t("profile.settings.languageTitle")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLanguageChange("vi")}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-panel-hover hover:text-accent-blue transition-colors cursor-pointer"
                      >
                        <Languages className="w-5 h-5 text-accent-blue group-hover:scale-105 transition-transform" />
                        <span className="font-medium flex-1">{t("profile.settings.vietnamese")}</span>
                        {language === "vi" && <Check className="w-4 h-4 text-accent-blue" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLanguageChange("en")}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-panel-hover hover:text-accent-blue transition-colors cursor-pointer"
                      >
                        <Languages className="w-5 h-5 text-accent-blue group-hover:scale-105 transition-transform" />
                        <span className="font-medium flex-1">{t("profile.settings.english")}</span>
                        {language === "en" && <Check className="w-4 h-4 text-accent-blue" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-wider">
                {userProfile.username}
                {userProfile.isVerified && (
                  <span className="text-xs bg-accent-blue/10 text-accent-blue border border-accent-blue/30 px-2 py-0.5 rounded uppercase tracking-widest font-mono">
                    {t("profile.verified")}
                  </span>
                )}
              </h1>
              <p className="text-accent-blue font-mono text-sm">{userProfile.handle}</p>
            </div>

            <p className="text-muted max-w-2xl leading-relaxed">
              {userProfile.bio}
            </p>

            {/* Quick Summary based on userProfile */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted font-mono">
              {userProfile.hometown && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {userProfile.hometown}
                </div>
              )}
              {userProfile.maritalStatus && (
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  {userProfile.maritalStatus}
                </div>
              )}
              {userProfile.school && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {userProfile.school}
                </div>
              )}
              {userProfile.links && userProfile.links[0] && (
                <div className="flex items-center gap-2 hover:text-accent-blue cursor-pointer transition-colors">
                  <LinkIcon className="w-4 h-4" />
                  {userProfile.links[0]}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex gap-8 pt-4 border-t border-border">
              <div>
                <div className="text-xl font-bold text-foreground tracking-wider">{userPosts.length}</div>
                <div className="text-xs text-muted uppercase tracking-widest">{t("profile.postsCount")}</div>
              </div>
              <button
                type="button"
                onClick={handleFollowersToggle}
                className={cn(
                  "text-left transition-colors rounded-lg px-1 -mx-1",
                  showFollowersList ? "text-accent-blue" : "hover:text-accent-blue"
                )}
              >
                <div className="text-xl font-bold tracking-wider">{followerCount}</div>
                <div className="text-xs text-muted uppercase tracking-widest">{t("profile.followersCount")}</div>
              </button>
              <button
                type="button"
                onClick={handleFollowingToggle}
                className={cn(
                  "text-left transition-colors rounded-lg px-1 -mx-1",
                  showFollowingList ? "text-accent-blue" : "hover:text-accent-blue"
                )}
              >
                <div className="text-xl font-bold tracking-wider">{followingCount}</div>
                <div className="text-xs text-muted uppercase tracking-widest">{t("profile.followingCount")}</div>
              </button>
              <div>
                <div className="text-xl font-bold text-accent-blue tracking-wider">{userProfile.trustScore}%</div>
                <div className="text-xs text-muted uppercase tracking-widest">{t("profile.trustRate")}</div>
              </div>
            </div>

            {showFollowersList && (
              <div className="pt-4 border-t border-border space-y-3">
                {followersLoading && (
                  <div className="text-sm text-muted font-mono">{t("notifications.async")}</div>
                )}
                {followersError && (
                  <div className="text-sm text-danger">{followersError}</div>
                )}
                {!followersLoading && !followersError && followers.length === 0 && (
                  <div className="text-sm text-muted font-mono">{t("profile.noFollowers")}</div>
                )}
                {!followersLoading && renderFollowUserList(followers)}
              </div>
            )}

            {showFollowingList && (
              <div className="pt-4 border-t border-border space-y-3">
                {followingLoading && (
                  <div className="text-sm text-muted font-mono">{t("notifications.async")}</div>
                )}
                {followingError && (
                  <div className="text-sm text-danger">{followingError}</div>
                )}
                {!followingLoading && !followingError && following.length === 0 && (
                  <div className="text-sm text-muted font-mono">{t("profile.noFollowing")}</div>
                )}
                {!followingLoading && renderFollowUserList(following)}
              </div>
            )}
          </div>
        </div>
      </div>

      {profileError && (
        <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-sm text-foreground">
          {profileError}
        </div>
      )}

      <section className="glass-panel border border-border rounded-xl p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Images className="h-5 w-5 text-accent-blue" />
            <h2 className="text-lg font-bold text-foreground">{t("profile.highlightStory")}</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatingHighlight((current) => !current)}
            className="h-10 rounded-lg border border-border bg-panel px-3 text-sm font-bold text-foreground hover:border-accent-blue/50 hover:bg-panel-hover transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4 text-accent-blue" />
            {t("profile.createGroup")}
          </button>
        </div>

        {isCreatingHighlight && (
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={newHighlightTitle}
              onChange={(event) => setNewHighlightTitle(event.target.value)}
              placeholder={t("profile.createGroupPlaceholder")}
              className="h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent-blue"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateHighlightGroup}
                className="h-11 rounded-lg bg-accent-blue px-4 text-sm font-bold text-black hover:bg-white transition-colors"
              >
                {t("profile.save")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingHighlight(false)
                  setNewHighlightTitle("")
                }}
                className="h-11 rounded-lg border border-border bg-panel px-4 text-sm font-bold text-muted hover:bg-panel-hover hover:text-foreground transition-colors"
              >
                {t("profile.cancel")}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
          {storyHighlights.map((highlight) => {
            const coverItem = highlight.items[0]
            return (
              <div
                key={highlight.id}
                className="group relative w-28 shrink-0 text-center"
              >
                <button
                  type="button"
                  onClick={() => openHighlightViewer(highlight)}
                  className="w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
                  title={highlight.title}
                >
                  <div className="relative h-36 overflow-hidden rounded-lg border border-border bg-panel-hover">
                    {highlight.coverUrl ? (
                      <img src={optimizeCloudinaryImage(highlight.coverUrl, 320)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted">
                        <Images className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/75" />
                    {coverItem?.mediaType === "video" && (
                      <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/55 text-white backdrop-blur flex items-center justify-center">
                        <Play className="h-4 w-4 fill-current" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-1 text-xs font-bold text-white backdrop-blur">
                      + {Math.max(highlight.items.length, 0)}
                    </div>
                  </div>
                  <div className="mt-2 truncate text-sm font-bold text-foreground">{highlight.title}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteHighlightId(highlight.id)}
                  aria-label="Xóa nhóm tin nổi bật"
                  title={t("profile.deleteGroup")}
                  className="absolute right-1.5 top-1.5 h-6 w-6 rounded-full border border-white/20 bg-black/65 text-white/75 opacity-0 shadow-lg backdrop-blur transition-all hover:border-red-300/60 hover:bg-red-500/25 hover:text-white focus:opacity-100 group-hover:opacity-100 flex items-center justify-center"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {pendingDeleteHighlightId === highlight.id && (
                  <div className="absolute right-0 top-8 z-30 w-28 rounded-lg border border-red-400/40 bg-black/90 p-2 text-white shadow-2xl backdrop-blur">
                    <div className="mb-2 text-center text-xs font-bold">{t("profile.deleteGroup")}?</div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => removeHighlightGroup(highlight.id)}
                        className="h-7 flex-1 rounded-md bg-red-500/90 text-[11px] font-bold text-white hover:bg-red-400 transition-colors"
                      >
                        {t("profile.delete")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteHighlightId(null)}
                        className="h-7 flex-1 rounded-md bg-white/10 text-[11px] font-bold text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                      >
                        {t("profile.cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <button
            type="button"
            onClick={() => setIsCreatingHighlight(true)}
            className="w-28 shrink-0 rounded-lg border border-dashed border-border bg-panel/50 p-3 text-center text-muted hover:border-accent-blue/60 hover:text-accent-blue transition-colors"
          >
            <div className="mx-auto mb-2 h-11 w-11 rounded-full bg-accent-blue/15 text-accent-blue flex items-center justify-center">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold">{t("profile.newGroup")}</span>
          </button>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div id="profile-tabs" className="flex gap-2 border-b border-border sticky top-0 bg-background/ backdrop-blur-md z-10 pt-2 overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center text-sm gap-2 px-6 py-3 border-b-2 transition-all font-bold tracking-wider shrink-0",
              activeTab === tab.id
                ? "border-accent-blue text-accent-blue"
                : "border-transparent text-muted hover:text-foreground hover:bg-panel/"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === "activity" && (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <PostCard key={post.id} post={post} onViewAnalysis={setSelectedPost} />
            ))}
            {postsError && (
              <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-sm text-foreground">
                {postsError}
              </div>
            )}
            {!postsError && userPosts.length === 0 && (
              <div className="text-center py-8 text-muted font-mono">
                Chua co bai viet nao.
              </div>
            )}
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === "about" && (
          <div className="flex flex-col md:flex-row gap-6">
            {/* About Sidebar */}
            <div className="w-full md:w-64 shrink-0 glass-panel border border-border rounded-xl p-2 h-fit space-y-1">
              {ABOUT_SIDEBAR.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAboutTab(tab.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg transition-colors font-bold tracking-wider text-sm flex items-center justify-between group",
                    aboutTab === tab.id
                      ? "bg-accent-blue/10 text-accent-blue border-l-2 border-accent-blue"
                      : "text-muted hover:text-foreground hover:bg-panel border-l-2 border-transparent"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* About Content */}
            <div className="flex-1 glass-panel border border-border rounded-xl p-2 sm:p-6 min-h-[400px]">
              {aboutTab === "overview" && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2 px-4">{t("profile.introductions.overview")}</h3>
                  {renderField("job", t("profile.introductions.overviewContent.work"), <Briefcase className="w-5 h-5" />)}
                  {renderField("school", t("profile.introductions.overviewContent.school"), <GraduationCap className="w-5 h-5" />)}
                  {renderField("hometown", t("profile.introductions.overviewContent.location"), <MapPin className="w-5 h-5" />)}
                  {renderField("maritalStatus", t("profile.introductions.overviewContent.status"), <Heart className="w-5 h-5" />, "text", Object.values(t("profile.introductions.overviewContent.statusOptions", { returnObjects: true })))}
                </div>
              )}

              {aboutTab === "work_education" && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2 px-4">{t("profile.introductions.education")}</h3>
                  {renderField("job", t("profile.introductions.educationContent.job"), <Briefcase className="w-5 h-5" />)}
                  {renderField("educationLevel", t("profile.introductions.educationContent.educationLevel"), <GraduationCap className="w-5 h-5" />, "text", Object.values(t("profile.introductions.educationContent.levelOptions", { returnObjects: true })))}
                  {renderField("school", t("profile.introductions.educationContent.school"), <GraduationCap className="w-5 h-5" />)}
                </div>
              )}

              {aboutTab === "contact_basic" && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2 px-4">{t("profile.introductions.contact")}</h3>
                  {renderField("gender", t("profile.introductions.contactContent.gender"), <UserCircle className="w-5 h-5" />, "text", Object.values(t("profile.introductions.contactContent.genderOptions", { returnObjects: true })))}
                  {renderField("birthday", t("profile.introductions.contactContent.birthday"), <Cake className="w-5 h-5" />, "date")}
                  {renderField("language", t("profile.introductions.contactContent.language"), <Languages className="w-5 h-5" />)}
                  {renderField("nationality", t("profile.introductions.contactContent.nationlity"), <Globe className="w-5 h-5" />)}
                </div>
              )}

              {aboutTab === "details" && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2 px-4">{t("profile.introductions.details")}</h3>
                  {renderField("bio", t("profile.introductions.detailsContent.bio"), <UserCircle className="w-5 h-5" />, "textarea")}
                  {renderField("hobbies", t("profile.introductions.detailsContent.favorite"), <Heart className="w-5 h-5" />)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedPost && (
        <AIAnalysisModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}

      {selectedHighlight && selectedHighlightItem && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <audio
            ref={highlightAudioRef}
            preload="metadata"
            className="hidden"
            onError={() => setHighlightMusicError("Không phát được nhạc của tin này")}
          />

          {selectedHighlight.items.length > 1 && (
            <button
              type="button"
              onClick={showPreviousHighlightItem}
              aria-label="Tin nổi bật trước"
              className="fixed left-4 sm:left-[calc(50%-270px)] top-1/2 z-[10000] h-12 w-12 -translate-y-1/2 rounded-full border border-white/30 bg-black/80 text-white shadow-lg backdrop-blur hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <div className="relative w-full max-w-[360px]">
            <div className="absolute -right-2 -top-14 z-[10000] flex items-center gap-2 sm:-right-14 sm:top-0 sm:flex-col">
              <button
                type="button"
                onClick={closeHighlightViewer}
                aria-label="Đóng tin nổi bật"
                title="Đóng"
                className="h-11 w-11 rounded-full border border-white/30 bg-black/80 text-white shadow-lg backdrop-blur hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={removeCurrentHighlightItem}
                aria-label="Xóa tin khỏi nhóm nổi bật"
                title="Xóa khỏi nhóm"
                className="h-11 w-11 rounded-full border border-red-400/50 bg-black/80 text-red-200 shadow-lg backdrop-blur hover:bg-red-500/20 hover:text-white transition-colors flex items-center justify-center"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            <div className="relative h-[82vh] max-h-[760px] w-full overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl">
              {selectedHighlightItem.mediaType === "video" ? (
                <video
                  ref={highlightVideoRef}
                  src={selectedHighlightItem.mediaUrl}
                  autoPlay
                  controls
                  playsInline
                  onLoadedMetadata={updateHighlightVideoProgress}
                  onTimeUpdate={updateHighlightVideoProgress}
                  onEnded={showNextHighlightItem}
                  className="h-full w-full object-contain"
                />
              ) : (
                <img src={optimizeCloudinaryImage(selectedHighlightItem.mediaUrl, 1200)} alt="" decoding="async" className="h-full w-full object-cover" />
              )}

              <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-4">
                <div className="mb-4 flex gap-1">
                  {selectedHighlight.items.map((item, index) => (
                    <div key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                      <div
                        className="h-full rounded-full bg-white transition-[width] duration-150"
                        style={{
                          width: index < selectedHighlightItemIndex
                            ? "100%"
                            : index === selectedHighlightItemIndex
                              ? `${highlightItemProgress}%`
                              : "0%",
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={optimizeCloudinaryImage(userProfile.avatar, 160)}
                    alt={userProfile.username}
                    decoding="async"
                    className="h-10 w-10 rounded-full border border-white/40 object-cover"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-bold text-white">{selectedHighlight.title}</div>
                    <div className="truncate text-xs font-mono text-white/65">
                      {selectedHighlightItemIndex + 1}/{selectedHighlight.items.length} tin
                    </div>
                  </div>
                </div>
              </div>

              {(selectedHighlightItem.caption || selectedHighlightItem.createdAt || selectedHighlightItem.music || highlightMusicError) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5">
                  {selectedHighlightItem.music && (
                    <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 py-2 text-white backdrop-blur">
                      <Music2 className="w-4 h-4 text-accent-pink shrink-0" />
                      <span className="text-xs font-bold truncate">{selectedHighlightItem.music.title}</span>
                      <span className="text-xs text-white/60 truncate">- {selectedHighlightItem.music.artist}</span>
                    </div>
                  )}
                  {highlightMusicError && selectedHighlightItem.music && (
                    <div className="mb-3 rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-xs text-white/80 backdrop-blur">
                      {highlightMusicError}
                    </div>
                  )}
                  {selectedHighlightItem.caption && (
                    <p className="text-sm leading-relaxed text-white">{selectedHighlightItem.caption}</p>
                  )}
                  {selectedHighlightItem.createdAt && (
                    <div className="mt-2 text-xs font-mono text-white/60">
                      {formatRelativeStoryTime(selectedHighlightItem.createdAt, t)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedHighlight.items.length > 1 && (
            <button
              type="button"
              onClick={showNextHighlightItem}
              aria-label="Tin nổi bật tiếp theo"
              className="fixed right-4 sm:right-[calc(50%-270px)] top-1/2 z-[10000] h-12 w-12 -translate-y-1/2 rounded-full border border-white/30 bg-black/80 text-white shadow-lg backdrop-blur hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
