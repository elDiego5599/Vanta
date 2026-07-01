import { useEffect, useRef } from 'react'
import { clearEncryptionKey } from './keyHolder'

const STORAGE_KEY = 'vanta-auto-lock'

export function getAutoLockTimeout(): number {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return 0
  const minutes = parseInt(raw, 10)
  if (isNaN(minutes) || minutes <= 0) return 0
  return minutes * 60 * 1000
}

export function setAutoLockTimeout(minutes: number) {
  localStorage.setItem(STORAGE_KEY, String(minutes))
}

export function useAutoLock(unlocked: boolean, onLock: () => void) {
  const lastActivity = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!unlocked) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    lastActivity.current = Date.now()
    const reset = () => { lastActivity.current = Date.now() }
    window.addEventListener('mousedown', reset, { passive: true })
    window.addEventListener('keydown', reset, { passive: true })
    window.addEventListener('touchstart', reset, { passive: true })

    intervalRef.current = setInterval(() => {
      const timeout = getAutoLockTimeout()
      if (timeout <= 0) return
      if (Date.now() - lastActivity.current > timeout) {
        clearEncryptionKey()
        onLock()
      }
    }, 5000)

    return () => {
      window.removeEventListener('mousedown', reset)
      window.removeEventListener('keydown', reset)
      window.removeEventListener('touchstart', reset)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [unlocked, onLock])
}
