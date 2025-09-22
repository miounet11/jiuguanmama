import type { Character } from './character'
import type { User } from './user'

export interface ChatSession {
  id: string
  userId: string
  title: string | null
  characterIds: string[]
  characters?: Character[]
  model: string
  presetId?: string
  worldInfoId?: string
  lastMessageAt: string | null
  messageCount: number
  totalTokens: number
  isArchived: boolean
  metadata?: any
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  sessionId: string
  userId?: string
  characterId?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens: number
  edited: boolean
  deleted: boolean
  metadata?: any
  user?: User
  character?: Character
  imageUrl?: string
  imagePrompt?: string
  createdAt: string
  updatedAt: string
}

export interface ChatSettings {
  model: string
  temperature: number
  maxTokens: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  systemPrompt?: string
}

export interface GenerationOptions {
  streaming: boolean
  stopSequences?: string[]
  maxRetries?: number
}

export interface ChatStats {
  totalSessions: number
  totalMessages: number
  totalTokens: number
  activeCharacters: number
}