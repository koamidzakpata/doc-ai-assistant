declare module '*.svelte' {
  import type { ComponentType } from 'svelte'
  const component: ComponentType
  export default component
}

type ChatSendResult =
  | { type: 'text'; text: string }
  | { type: 'document'; format: 'pdf' | 'docx' | 'txt'; filename: string; content: string }

type ExportResult =
  | { success: true; filePath: string }
  | { success: false; canceled: true }

interface ElectronAPI {
  sendChatMessage: (conversationId: string, message: string) => Promise<ChatSendResult>
  getChatStatus: () => Promise<boolean>
  selectDocuments: (conversationId: string) => Promise<{ fileName: string }[]>
  listDocuments: (conversationId: string) => Promise<string[]>
  removeDocument: (conversationId: string, fileName: string) => Promise<boolean>
  listConversations: () => Promise<import('./lib/types').Conversation[]>
  createConversation: () => Promise<import('./lib/types').Conversation>
  deleteConversation: (id: string) => Promise<boolean>
  addMessage: (conversationId: string, message: import('./lib/types').Message) => Promise<import('./lib/types').Conversation>
  getApiKey: () => Promise<string | undefined>
  setApiKey: (key: string) => Promise<boolean>
  hasApiKey: () => Promise<boolean>
  exportDocument: (format: 'pdf' | 'docx' | 'txt', filename: string, content: string) => Promise<ExportResult>
  onChatChunk: (callback: (chunk: string) => void) => () => void
  onChatDone: (callback: () => void) => () => void
}

interface Window {
  electronAPI: ElectronAPI
}