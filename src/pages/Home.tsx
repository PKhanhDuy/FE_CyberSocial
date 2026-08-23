import { useState } from "react"
import { Search } from "lucide-react"
import { FeedList } from "@/components/feed/FeedList"
import type { Post } from "@/mocks/types"
import { AIAnalysisModal } from "@/components/ai/AIAnalysisModal"
import { useTranslation } from "react-i18next"
import { StoriesTray } from "@/components/stories/StoriesTray"

export function Home() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 pb-4 pt-2 backdrop-blur-md lg:top-0 lg:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-wider neon-text-blue">{t("home.post")}</h1>

        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("home.placeholder")}
            className="input-modern block w-full pl-10 pr-3 py-2 rounded-xl text-sm placeholder-muted"
          />
        </div>
      </div>
      <StoriesTray />
      <FeedList searchQuery={searchQuery} onViewAnalysis={setSelectedPost} />
      {selectedPost && (
        <AIAnalysisModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  )
}
