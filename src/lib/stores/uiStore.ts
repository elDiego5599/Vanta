import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TabId } from '../types'

interface UIState {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: 'casos',
      setActiveTab: (tab) => set({ activeTab: tab }),
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'vanta-ui' },
  ),
)
