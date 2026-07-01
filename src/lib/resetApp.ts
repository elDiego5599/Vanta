export const DB_NAME = 'vanta'

export function resetApp() {
  const theme = localStorage.getItem('vanta-theme')
  localStorage.clear()
  if (theme) localStorage.setItem('vanta-theme', theme)
  indexedDB.deleteDatabase(DB_NAME)
  window.location.reload()
}
