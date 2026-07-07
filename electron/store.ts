import Store from 'electron-store'

interface StoreSchema {
  groqApiKey?: string
}

const store = new Store<StoreSchema>({
  name: 'api-config',
})

export function getApiKey(): string | undefined {
  return store.get('groqApiKey')
}

export function setApiKey(key: string): void {
  store.set('groqApiKey', key)
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}