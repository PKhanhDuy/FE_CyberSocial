export type AIState = 'monitoring' | 'suspicious' | 'verified'

export interface User {
  id: string
  username: string
  handle: string
  avatar: string
  cover?: string
  role?: "USER" | "ADMIN"
  isVerified: boolean
  trustScore: number
  bio?: string
  hometown?: string
  maritalStatus?: string
  gender?: string
  birthday?: string
  language?: string
  nationality?: string
  school?: string
  job?: string
  educationLevel?: string
  hobbies?: string[]
  links?: string[]
  isOnline?: boolean
}

export interface Post {
  id: string
  author: User
  content: string
  media?: string
  timestamp: string
  likes: number
  comments: number
  shares: number
  isLiked?: boolean
  aiState: AIState
  aiAnalysis?: AIAnalysis
  sharedPost?: Post
}

export interface PropagationTimelineEvent {
  eventIndex: number
  eventId?: string
  parentEventId?: string | null
  depth?: number
  relativeTime: string
  eventType: string
  eventTypeLabel: string
  actorLabel: string
  tigeRemoval?: number | null
  isInfluential: boolean
}

export interface EventAttribution {
  eventIndex: number
  eventType: string
  eventTypeLabel?: string
  relativeTime?: string
  actorLabel?: string
  tigeRemoval?: number | null
  confidenceDrop?: number | null
  summary?: string
}

export interface AIAnalysis {
  riskLevel: 'THẤP' | 'TRUNG BÌNH' | 'CAO' | 'NGHIÊM TRỌNG'
  fakeProbability: number
  reasons: string[]
  propagationVelocity: number // nodes per second
  propagationTimeline: PropagationTimelineEvent[]
  eventAttributions: EventAttribution[]
}
