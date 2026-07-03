import { ipcMain } from 'electron'
import {
  getAllConversations,
  createConversation,
  addMessageToConversation,
  deleteConversation,
  type Message,
} from '../services/conversations.service.js'

export function registerConversationHandlers() {
  ipcMain.handle('conversations:list', async () => {
    return getAllConversations()
  })

  ipcMain.handle('conversations:create', async () => {
    return createConversation()
  })

  ipcMain.handle('conversations:delete', async (_event, id: string) => {
    deleteConversation(id)
    return true
  })

  ipcMain.handle('conversations:addMessage', async (_event, conversationId: string, message: Message) => {
    return addMessageToConversation(conversationId, message)
  })
}