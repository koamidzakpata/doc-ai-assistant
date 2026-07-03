export interface Message {
  role: 'user' | 'ai'
  text: string
  timestamp: number
}

export interface ParsedDocument {
  fileName: string
  content: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  documents: ParsedDocument[]
  createdAt: number
  updatedAt: number
}