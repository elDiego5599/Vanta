import { create } from 'zustand'
import type { CaseData } from '../types'
import * as db from '../db'
import { encrypt, decrypt } from '../crypto'
import { getEncryptionKey } from '../keyHolder'

interface CaseState {
  cases: CaseData[]
  activeCase: CaseData | null
  isLoading: boolean
  setActiveCase: (c: CaseData | null) => void
  createCase: (name: string, description: string) => Promise<string>
  updateCase: (id: string, name: string, description: string) => Promise<void>
  deleteCase: (id: string) => Promise<void>
  refreshCases: () => Promise<void>
  initialize: () => Promise<void>
}

async function decryptStr(val: string): Promise<string> {
  const key = getEncryptionKey()
  if (!key) return val
  try { return await decrypt(val, key) } catch { return val }
}

async function decryptCase(c: CaseData): Promise<CaseData> {
  const [name, description] = await Promise.all([decryptStr(c.name), decryptStr(c.description)])
  return { ...c, name, description }
}

function assertKey(): CryptoKey {
  const key = getEncryptionKey()
  if (!key) throw new Error('Encryption key not available')
  return key
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
    const key = assertKey()
    const [encName, encDesc] = await Promise.all([encrypt(name, key), encrypt(description, key)])
    const id = await db.createCase(encName, encDesc)
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

  updateCase: async (id, name, description) => {
    const key = assertKey()
    const [encName, encDesc] = await Promise.all([encrypt(name, key), encrypt(description, key)])
    await db.updateCase(id, encName, encDesc)
    set((s) => ({
      cases: s.cases.map((c) => c.id === id ? { ...c, name, description, updatedAt: Date.now() } : c),
      activeCase: s.activeCase?.id === id ? { ...s.activeCase, name, description, updatedAt: Date.now() } : s.activeCase,
    }))
  },

  refreshCases: async () => {
    const stored = await db.getCases()
    const decrypted = await Promise.all(stored.map(decryptCase))
    set((s) => {
      const stillExists = decrypted.find((c) => c.id === s.activeCase?.id)
      return {
        cases: decrypted,
        activeCase: stillExists ?? decrypted[0] ?? null,
      }
    })
  },

  initialize: async () => {
    const stored = await db.getCases()
    const decrypted = await Promise.all(stored.map(decryptCase))
    const savedId = localStorage.getItem('vanta_active_case_id')
    const target = decrypted.find((c) => c.id === savedId) ?? decrypted[0] ?? null
    set({ cases: decrypted, activeCase: target, isLoading: false })
  },
}))
