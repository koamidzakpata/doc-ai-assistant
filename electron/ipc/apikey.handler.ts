import { ipcMain } from 'electron'
import { getApiKey, setApiKey, hasApiKey } from '../store.js'

export function registerApiKeyHandlers() {
  ipcMain.handle('apikey:get', async () => {
    return getApiKey()
  })

  ipcMain.handle('apikey:set', async (_event, key: string) => {
    setApiKey(key)
    return true
  })

  ipcMain.handle('apikey:has', async () => {
    return hasApiKey()
  })
}