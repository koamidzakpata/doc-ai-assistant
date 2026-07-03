import { writable } from 'svelte/store'

type Theme = 'dark' | 'light'

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || saved === 'light') return saved
  return 'dark'
}

function createThemeStore() {
  const { subscribe, set, update } = writable<Theme>(getInitialTheme())

  return {
    subscribe,
    toggle: () =>
      update((current) => {
        const next: Theme = current === 'dark' ? 'light' : 'dark'
        localStorage.setItem('theme', next)
        applyTheme(next)
        return next
      }),
    init: () => {
      const theme = getInitialTheme()
      applyTheme(theme)
      set(theme)
    },
  }
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const theme = createThemeStore()