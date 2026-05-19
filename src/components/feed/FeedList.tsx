import { MOCK_POSTS } from "@/mocks/data"
import { PostCard } from "./PostCard"
import type { Post } from "@/mocks/types"

interface FeedListProps {
  onViewAnalysis: (post: Post) => void
}

export function FeedList({ onViewAnalysis }: FeedListProps) {
  return (
    <div className="space-y-2 mt-6 pb-20">
      {MOCK_POSTS.map((post) => (
        <PostCard key={post.id} post={post} onViewAnalysis={onViewAnalysis} />
      ))}
    </div>
  )
}
