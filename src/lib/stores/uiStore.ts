import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TabId } from '../types'

interface UIState {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  _lockFn: (() => void) | null
  setLockFn: (fn: (() => void) | null) => void
  lock: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      activeTab: 'casos',
      setActiveTab: (tab) => set({ activeTab: tab }),
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      _lockFn: null,
      setLockFn: (fn) => set({ _lockFn: fn }),
      lock: () => { get()._lockFn?.() },
    }),
    { name: 'vanta-ui' },
  ),
)
