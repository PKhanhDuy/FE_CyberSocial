export type AIState = 'monitoring' | 'suspicious' | 'verified'

export interface User {
  id: string
  username: string
  handle: string
  avatar: string
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
  aiState: AIState
  aiAnalysis?: AIAnalysis
}

export interface AIAnalysis {
  riskLevel: 'THẤP' | 'TRUNG BÌNH' | 'CAO' | 'NGHIÊM TRỌNG'
  fakeProbability: number
  reasons: string[]
  propagationVelocity: number // nodes per second
}
