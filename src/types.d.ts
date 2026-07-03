declare module '*.svelte' {
  import type { ComponentType } from 'svelte'
  const component: ComponentType
  export default component
}

interface ElectronAPI {
  sendChatMessage: (conversationId: string, message: string) => Promise<string>
  getChatStatus: () => Promise<boolean>
  selectDocuments: (conversationId: string) => Promise<{ fileName: string }[]>
  listDocuments: (conversationId: string) => Promise<string[]>
  removeDocument: (conversationId: string, fileName: string) => Promise<boolean>
  listConversations: () => Promise<import('./lib/types').Conversation[]>
  createConversation: () => Promise<import('./lib/types').Conversation>
  deleteConversation: (id: string) => Promise<boolean>
  addMessage: (conversationId: string, message: import('./lib/types').Message) => Promise<import('./lib/types').Conversation>
}

interface Window {
  electronAPI: ElectronAPI
}