import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Activity, Briefcase, Cake, GraduationCap, Globe, Heart, Languages, Link as LinkIcon, MapPin, ShieldCheck, UserCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AIAnalysisModal } from "@/components/ai/AIAnalysisModal"
import { PostCard } from "@/components/feed/PostCard"
import { cn } from "@/lib/utils"
import { postApi, userApi } from "@/lib/api"
import type { Post, User } from "@/mocks/types"
import { useAuthStore } from "@/store/useAuthStore"

const DEFAULT_COVER = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1600"

export function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const currentUser = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState("activity")
  const [profile, setProfile] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tabs = [
    { id: "activity", label: t("profile.activity"), icon: Activity },
    { id: "about", label: t("profile.introduction"), icon: UserCircle },
  ]

  useEffect(() => {
    if (!userId) return
    if (currentUser?.id === userId) {
      navigate("/profile", { replace: true })
    }
  }, [currentUser?.id, navigate, userId])

  useEffect(() => {
    if (!userId || currentUser?.id === userId) return

    const loadProfile = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [user, userPosts] = await Promise.all([
          userApi.get(userId),
          postApi.byAuthor(userId),
        ])
        setProfile(user)
        setPosts(userPosts.content)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Khong tai duoc ho so")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [currentUser?.id, userId])

  const renderInfoRow = (label: string, value: unknown, icon: ReactNode) => {
    const displayValue = Array.isArray(value) ? value.join(", ") : value

    return (
      <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-panel transition-colors">
        <div className="mt-1 text-muted">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
          <div className="text-foreground mt-1 font-medium leading-relaxed break-words">
            {displayValue ? String(displayValue) : <span className="text-muted italic font-normal">{t("profile.introductions.overviewContent.noInfo")}</span>}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl border border-border p-8 text-center text-muted font-mono">
        Dang tai ho so...
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="glass-panel rounded-xl border border-danger/40 bg-danger/10 p-8 text-center text-foreground">
        {error || "Khong tim thay ho so"}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="relative rounded-2xl overflow-hidden glass-panel border border-border">
        <div className="h-48 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 to-accent-pink/20 mix-blend-overlay z-10" />
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.cover || DEFAULT_COVER})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(96,165,250,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.1)_1px,transparent_1px)] bg-[size:20px_20px] z-10 opacity-30 pointer-events-none" />
        </div>

        <div className="px-6 pb-6 relative z-20">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-xl border-2 border-accent-blue p-1 bg-background neon-border-blue relative overflow-hidden">
                <img
                  src={profile.avatar}
                  alt={profile.username}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 border border-border z-10">
                <div className="bg-accent-blue p-1.5 rounded-full shadow-[var(--shadow-neon-blue)]">
                  <ShieldCheck className="w-4 h-4 text-black" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-wider">
                {profile.username}
                {profile.isVerified && (
                  <span className="text-xs bg-accent-blue/10 text-accent-blue border border-accent-blue/30 px-2 py-0.5 rounded uppercase tracking-widest font-mono">
                    {t("profile.verified")}
                  </span>
                )}
              </h1>
              <p className="text-accent-blue font-mono text-sm">{profile.handle}</p>
            </div>

            <p className="text-muted max-w-2xl leading-relaxed">
              {profile.bio || "Thanh vien CyberSocial."}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted font-mono">
              {profile.hometown && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {profile.hometown}
                </div>
              )}
              {profile.maritalStatus && (
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  {profile.maritalStatus}
                </div>
              )}
              {profile.school && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {profile.school}
                </div>
              )}
              {profile.links?.[0] && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  {profile.links[0]}
                </div>
              )}
            </div>

            <div className="flex gap-8 pt-4 border-t border-border">
              <div>
                <div className="text-xl font-bold text-foreground tracking-wider">{posts.length}</div>
                <div className="text-xs text-muted uppercase tracking-widest">{t("home.post")}</div>
              </div>
              <div>
                <div className="text-xl font-bold text-accent-blue tracking-wider">{profile.trustScore}%</div>
                <div className="text-xs text-muted uppercase tracking-widest">{t("post.trustScore")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="profile-tabs" className="flex gap-2 border-b border-border sticky top-0 bg-background/ backdrop-blur-md z-10 pt-2 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
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

      <div className="min-h-[400px]">
        {activeTab === "activity" && (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onViewAnalysis={setSelectedPost} />
            ))}
            {posts.length === 0 && (
              <div className="text-center py-8 text-muted font-mono">
                Chua co bai viet nao.
              </div>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="glass-panel border border-border rounded-xl p-2 sm:p-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2 px-4">{t("profile.introductions.overview")}</h3>
              {renderInfoRow(t("profile.introductions.overviewContent.work"), profile.job, <Briefcase className="w-5 h-5" />)}
              {renderInfoRow(t("profile.introductions.overviewContent.school"), profile.school, <GraduationCap className="w-5 h-5" />)}
              {renderInfoRow(t("profile.introductions.overviewContent.location"), profile.hometown, <MapPin className="w-5 h-5" />)}
              {renderInfoRow(t("profile.introductions.overviewContent.status"), profile.maritalStatus, <Heart className="w-5 h-5" />)}
              {renderInfoRow(t("profile.introductions.contactContent.gender"), profile.gender, <UserCircle className="w-5 h-5" />)}
              {renderInfoRow(t("profile.introductions.contactContent.birthday"), profile.birthday, <Cake className="w-5 h-5" />)}
              {renderInfoRow(t("profile.introductions.contactContent.language"), profile.language, <Languages className="w-5 h-5" />)}
              {renderInfoRow(t("profile.introductions.contactContent.nationlity"), profile.nationality, <Globe className="w-5 h-5" />)}
              {renderInfoRow(t("profile.introductions.detailsContent.bio"), profile.bio, <UserCircle className="w-5 h-5" />)}
              {renderInfoRow(t("profile.introductions.detailsContent.favorite"), profile.hobbies, <Heart className="w-5 h-5" />)}
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
