import { useEffect, useMemo, useState } from 'react'
import { PreferencesContext } from './contexts.js'
import { readStorage, writeStorage } from '../utils/storage.js'

const STORAGE_KEY = 'moviespot:preferences'

function getInitialPreferences() {
  const stored = readStorage(STORAGE_KEY, {})
  return {
    // O script em index.html já resolveu o tema (salvo ou do sistema operacional).
    theme: stored.theme ?? document.documentElement.dataset.theme ?? 'dark',
    shortcutsEnabled: stored.shortcutsEnabled ?? true,
  }
}

export default function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(getInitialPreferences)

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', preferences.theme === 'light' ? '#f8fafc' : '#0b0f17')
    writeStorage(STORAGE_KEY, preferences)
  }, [preferences])

  const value = useMemo(
    () => ({
      ...preferences,
      setTheme: (theme) => setPreferences((p) => ({ ...p, theme })),
      toggleTheme: () =>
        setPreferences((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' })),
      setShortcutsEnabled: (shortcutsEnabled) =>
        setPreferences((p) => ({ ...p, shortcutsEnabled })),
    }),
    [preferences],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
