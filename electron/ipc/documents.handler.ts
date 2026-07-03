import { ipcMain, dialog } from 'electron'
import { parseDocument } from '../services/document-parser.service.js'
import {
  addDocumentToConversation,
  removeDocumentFromConversation,
  getConversationDocuments,
} from '../services/conversations.service.js'

export function registerDocumentHandlers() {
  ipcMain.handle('documents:select', async (_event, conversationId: string) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Documents', extensions: ['pdf', 'txt', 'docx'] },
      ],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return []
    }

    const addedDocs: { fileName: string }[] = []

    for (const filePath of result.filePaths) {
      try {
        const parsed = await parseDocument(filePath)
        addDocumentToConversation(conversationId, parsed)
        addedDocs.push({ fileName: parsed.fileName })
      } catch (error) {
        console.error(`Erreur lors du parsing de ${filePath}:`, error)
      }
    }

    return addedDocs
  })

  ipcMain.handle('documents:list', async (_event, conversationId: string) => {
    return getConversationDocuments(conversationId).map((d) => d.fileName)
  })

  ipcMain.handle('documents:remove', async (_event, conversationId: string, fileName: string) => {
    removeDocumentFromConversation(conversationId, fileName)
    return true
  })
}