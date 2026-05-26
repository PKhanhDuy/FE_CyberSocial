import { useState } from "react"
import { Search } from "lucide-react"
import { FeedList } from "@/components/feed/FeedList"
import type { Post } from "@/mocks/types"
import { AIAnalysisModal } from "@/components/ai/AIAnalysisModal"

export function Home() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4 sticky top-0 bg-background/ backdrop-blur-md z-10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-wider neon-text-blue">BẢNG TIN</h1>

        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm người dùng, ID, từ khóa..."
            className="input-modern block w-full pl-10 pr-3 py-2 rounded-xl text-sm placeholder-muted"
          />
        </div>
      </div>
      <FeedList searchQuery={searchQuery} onViewAnalysis={setSelectedPost} />
      {selectedPost && (
        <AIAnalysisModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  )
}
