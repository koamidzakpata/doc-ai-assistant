import { ipcMain, dialog, BrowserWindow } from 'electron'
import * as fs from 'fs'
import { generateDocumentFile, type DocumentFormat } from '../services/export.service.js'

const FORMAT_FILTERS: Record<DocumentFormat, { name: string; extensions: string[] }> = {
  pdf: { name: 'Fichier PDF', extensions: ['pdf'] },
  docx: { name: 'Document Word', extensions: ['docx'] },
  txt: { name: 'Fichier texte', extensions: ['txt'] },
}

export function registerExportHandlers() {
  ipcMain.handle(
    'export:download',
    async (event, format: DocumentFormat, filename: string, content: string) => {
      // 1. Génère le fichier réel dans un dossier temporaire
      const tempFilePath = await generateDocumentFile(format, filename, content)

      // 2. Demande à l'utilisateur où l'enregistrer définitivement
      const win = BrowserWindow.fromWebContents(event.sender)
      const result = await dialog.showSaveDialog(win!, {
        title: 'Enregistrer le document',
        defaultPath: `${filename}.${format}`,
        filters: [FORMAT_FILTERS[format]],
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      // 3. Copie le fichier temporaire vers l'emplacement choisi
      fs.copyFileSync(tempFilePath, result.filePath)

      return { success: true, filePath: result.filePath }
    }
  )
}