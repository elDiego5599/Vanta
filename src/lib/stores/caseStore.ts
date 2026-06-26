import { create } from 'zustand'
import type { CaseData } from '../types'
import * as db from '../db'

interface CaseState {
  cases: CaseData[]
  activeCase: CaseData | null
  isLoading: boolean
  setActiveCase: (c: CaseData | null) => void
  createCase: (name: string, description: string) => Promise<string>
  deleteCase: (id: string) => Promise<void>
  refreshCases: () => Promise<void>
  initialize: () => Promise<void>
}

export const useCaseStore = create<CaseState>()((set) => ({
  cases: [],
  activeCase: null,
  isLoading: true,

  setActiveCase: (c) => {
    set({ activeCase: c })
    if (c) localStorage.setItem('vanta_active_case_id', c.id)
    else localStorage.removeItem('vanta_active_case_id')
  },

  createCase: async (name, description) => {
    const id = await db.createCase(name, description)
    const now = Date.now()
    const newCase: CaseData = { id, name, description, createdAt: now, updatedAt: now }
    set((s) => ({ cases: [...s.cases, newCase], activeCase: newCase }))
    return id
  },

  deleteCase: async (id) => {
    await db.deleteCase(id)
    set((s) => {
      const filtered = s.cases.filter((c) => c.id !== id)
      const wasActive = s.activeCase?.id === id
      return {
        cases: filtered,
        activeCase: wasActive ? (filtered[0] ?? null) : s.activeCase,
      }
    })
  },

  refreshCases: async () => {
    const stored = await db.getCases()
    set((s) => {
      const stillExists = stored.find((c) => c.id === s.activeCase?.id)
      return {
        cases: stored,
        activeCase: stillExists ?? stored[0] ?? null,
      }
    })
  },

  initialize: async () => {
    const stored = await db.getCases()
    const savedId = localStorage.getItem('vanta_active_case_id')
    const target = stored.find((c) => c.id === savedId) ?? stored[0] ?? null
    set({ cases: stored, activeCase: target, isLoading: false })
  },
}))
