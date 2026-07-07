import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  sendChatMessage: (conversationId: string, message: string) =>
    ipcRenderer.invoke('chat:send', conversationId, message),
  getChatStatus: () => ipcRenderer.invoke('chat:status'),
  selectDocuments: (conversationId: string) =>
    ipcRenderer.invoke('documents:select', conversationId),
  listDocuments: (conversationId: string) =>
    ipcRenderer.invoke('documents:list', conversationId),
  removeDocument: (conversationId: string, fileName: string) =>
    ipcRenderer.invoke('documents:remove', conversationId, fileName),
  listConversations: () => ipcRenderer.invoke('conversations:list'),
  createConversation: () => ipcRenderer.invoke('conversations:create'),
  deleteConversation: (id: string) => ipcRenderer.invoke('conversations:delete', id),
  addMessage: (conversationId: string, message: { role: 'user' | 'ai'; text: string; timestamp: number }) =>
    ipcRenderer.invoke('conversations:addMessage', conversationId, message),
  getApiKey: () => ipcRenderer.invoke('apikey:get'),
  setApiKey: (key: string) => ipcRenderer.invoke('apikey:set', key),
  hasApiKey: () => ipcRenderer.invoke('apikey:has'),
  onChatChunk: (callback: (chunk: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, chunk: string) => callback(chunk)
    ipcRenderer.on('chat:chunk', listener)
    return () => ipcRenderer.removeListener('chat:chunk', listener)
  },
  onChatDone: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('chat:done', listener)
    return () => ipcRenderer.removeListener('chat:done', listener)
  },
})