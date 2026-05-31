import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ShieldCheck, Network, Activity, Settings, MapPin, Link as LinkIcon, Edit2, UserCircle, Heart, Briefcase, GraduationCap, Globe, Languages, Cake, Camera, HelpCircle, Moon, Sun, LogOut, ChevronLeft, KeyRound, Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { PostCard } from "@/components/feed/PostCard"
import { AIAnalysisModal } from "@/components/ai/AIAnalysisModal"
import type { Post } from "@/mocks/types"
import { Progress } from "@/components/ui/Progress"
import { postApi, uploadApi } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore"
import { useThemeStore } from "@/store/useThemeStore"
import { useLanguageStore } from "@/store/useLanguageStore"

type SettingsMenuView = "main" | "privacy" | "language"


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
  const [profileError, setProfileError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const settingsMenuRef = useRef<HTMLDivElement>(null)

  const TABS = [
    { id: "activity", label: t("profile.activity"), icon: Activity },
    { id: "about", label: t("profile.introduction"), icon: UserCircle },
    { id: "network", label: t("profile.network"), icon: Network },
    { id: "diagnostics", label: t("profile.predictions"), icon: ShieldCheck },
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
            style={{ backgroundImage: `url(${userProfile.cover})` }}
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
                  src={userProfile.avatar}
                  alt={userProfile.username}
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
                <div className="text-xl font-bold text-foreground tracking-wider">8,492</div>
                <div className="text-xs text-muted uppercase tracking-widest">Node mạng</div>
              </div>
              <div>
                <div className="text-xl font-bold text-foreground tracking-wider">1.2M</div>
                <div className="text-xs text-muted uppercase tracking-widest">Lưu lượng dữ liệu</div>
              </div>
              <div>
                <div className="text-xl font-bold text-accent-blue tracking-wider">{userProfile.trustScore}%</div>
                <div className="text-xs text-muted uppercase tracking-widest">Chỉ số tin cậy</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {profileError && (
        <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-sm text-foreground">
          {profileError}
        </div>
      )}

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

        {activeTab === "network" && (
          <div className="glass-panel border border-border p-8 flex flex-col items-center justify-center text-center rounded-xl h-64">
            <Network className="w-12 h-12 text-accent-blue mb-4 opacity-50" />
            <h3 className="text-lg font-bold tracking-widest text-foreground mb-2">{t("profile.networkContent.title")}</h3>
            <p className="text-muted max-w-md">
              {t("profile.networkContent.description")}
            </p>
          </div>
        )}

        {activeTab === "diagnostics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System Integrity */}
            <div className="bg-panel border border-border rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <Settings className="w-5 h-5 text-accent-blue" />
                <h3 className="font-bold tracking-wider text-foreground">{t("profile.predictionsContent.systemIntegrity")}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1 text-muted">
                    <span>Xác minh danh tính</span>
                    <span className="text-accent-blue font-mono">99.9%</span>
                  </div>
                  <Progress value={99.9} indicatorColor="bg-accent-blue" className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1 text-muted">
                    <span>Khả năng chống Deepfake</span>
                    <span className="text-accent-blue font-mono">94.2%</span>
                  </div>
                  <Progress value={94.2} indicatorColor="bg-accent-blue" className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1 text-muted">
                    <span>Sự can thiệp của Bot</span>
                    <span className="text-accent-pink font-mono">2.1%</span>
                  </div>
                  <Progress value={2.1} indicatorColor="bg-accent-pink" className="h-1.5" />
                </div>
              </div>
            </div>

            {/* Clearance Level */}
            <div className="bg-panel border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
                <ShieldCheck className="w-5 h-5 text-accent-blue" />
                <h3 className="font-bold tracking-wider text-foreground">{t("profile.predictionsContent.accessProtocol")}</h3>
              </div>

              <div className="space-y-3">
                {['Cấp 1: Truy cập Node cơ bản', 'Cấp 2: Tích hợp bảng tin quỹ đạo', 'Cấp 3: Khai thác dữ liệu sâu', 'Cấp 4: Ghi đè giao thức (Bị hạn chế)'].map((protocol, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                    <span className="text-sm text-muted">{protocol}</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded font-mono uppercase",
                      i < 3 ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/30" : "bg-red-500/10 text-red-500 border border-red-500/30"
                    )}>
                      {i < 3 ? 'Cấp quyền' : 'Từ chối'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedPost && (
        <AIAnalysisModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  )
}
