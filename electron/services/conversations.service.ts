import Store from 'electron-store'
import type { ParsedDocument } from './document-parser.service.js'

export interface Message {
  role: 'user' | 'ai'
  text: string
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  documents: ParsedDocument[]
  createdAt: number
  updatedAt: number
}

interface StoreSchema {
  conversations: Conversation[]
}

const store = new Store<StoreSchema>({
  defaults: {
    conversations: [],
  },
})

export function getAllConversations(): Conversation[] {
  return store.get('conversations')
}

export function getConversation(id: string): Conversation | undefined {
  return getAllConversations().find((c) => c.id === id)
}

export function createConversation(): Conversation {
  const conversation: Conversation = {
    id: String(Date.now()),
    title: 'Nouvelle conversation',
    messages: [],
    documents: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const conversations = getAllConversations()
  store.set('conversations', [conversation, ...conversations])
  return conversation
}

export function addMessageToConversation(
  conversationId: string,
  message: Message
): Conversation | undefined {
  const conversations = getAllConversations()
  const index = conversations.findIndex((c) => c.id === conversationId)

  if (index === -1) return undefined

  conversations[index].messages.push(message)
  conversations[index].updatedAt = Date.now()

  if (conversations[index].messages.length === 1 && message.role === 'user') {
    conversations[index].title = message.text.slice(0, 40) + (message.text.length > 40 ? '...' : '')
  }

  store.set('conversations', conversations)
  return conversations[index]
}

export function deleteConversation(id: string): void {
  const conversations = getAllConversations().filter((c) => c.id !== id)
  store.set('conversations', conversations)
}

export function addDocumentToConversation(
  conversationId: string,
  document: ParsedDocument
): Conversation | undefined {
  const conversations = getAllConversations()
  const index = conversations.findIndex((c) => c.id === conversationId)

  if (index === -1) return undefined

  if (!conversations[index].documents) {
    conversations[index].documents = []
  }

  const alreadyExists = conversations[index].documents.some((d) => d.fileName === document.fileName)
  if (!alreadyExists) {
    conversations[index].documents.push(document)
    conversations[index].updatedAt = Date.now()
    store.set('conversations', conversations)
  }

  return conversations[index]
}

export function removeDocumentFromConversation(
  conversationId: string,
  fileName: string
): Conversation | undefined {
  const conversations = getAllConversations()
  const index = conversations.findIndex((c) => c.id === conversationId)

  if (index === -1) return undefined

  conversations[index].documents = (conversations[index].documents ?? []).filter(
    (d) => d.fileName !== fileName
  )
  conversations[index].updatedAt = Date.now()
  store.set('conversations', conversations)

  return conversations[index]
}

export function getConversationDocuments(conversationId: string): ParsedDocument[] {
  return getConversation(conversationId)?.documents ?? []
}