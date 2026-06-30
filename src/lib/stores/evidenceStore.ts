import { create } from 'zustand'
import type { EvidenceItem } from '../types'
import * as db from '../db'
import { encrypt, decrypt } from '../crypto'
import { getEncryptionKey } from '../keyHolder'

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function assertKey(): CryptoKey {
  const key = getEncryptionKey()
  if (!key) throw new Error('Encryption key not available')
  return key
}

async function decryptEv(e: EvidenceItem): Promise<EvidenceItem> {
  const key = getEncryptionKey()
  if (!key) return e
  try {
    const nombre = await decrypt(e.nombre, key)
    return { ...e, nombre }
  } catch {
    return e
  }
}

interface EvidenceState {
  evidenceQueue: EvidenceItem[]
  selectedFile: EvidenceItem | null
  selectFileForTranscription: (file: EvidenceItem) => void
  addEvidence: (file: File, caseId: string) => Promise<void>
  updateEvidence: (id: string, updates: Partial<EvidenceItem>) => void
  clearSelectedFile: () => void
  clearEvidence: () => void
  initialize: (caseId: string) => Promise<void>
  refreshEvidence: (caseId: string) => Promise<void>
}

export const useEvidenceStore = create<EvidenceState>()((set) => ({
  evidenceQueue: [],
  selectedFile: null,

  selectFileForTranscription: (file) => {
    set({ selectedFile: file })
    localStorage.setItem('vanta_selected_file', JSON.stringify({ id: file.id, caseId: file.caseId }))
  },

  clearSelectedFile: () => {
    set({ selectedFile: null })
    localStorage.removeItem('vanta_selected_file')
  },

  clearEvidence: () => {
    set({ evidenceQueue: [], selectedFile: null })
    localStorage.removeItem('vanta_selected_file')
  },

  addEvidence: async (file, caseId) => {
    const key = assertKey()
    const id = `ev-${Date.now()}`
    const tamano = formatSize(file.size)
    const encNombre = await encrypt(file.name, key)
    const arrayBuffer = await file.arrayBuffer()
    await db.saveEvidence(id, caseId, encNombre, tamano, arrayBuffer)
    const item: EvidenceItem = { id, caseId, nombre: file.name, estado: 'listo', progreso: 0, tamano }
    set((prev) => ({ evidenceQueue: [item, ...prev.evidenceQueue] }))
  },

  updateEvidence: (id, updates) => {
    set((prev) => ({
      evidenceQueue: prev.evidenceQueue.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
      selectedFile:
        prev.selectedFile?.id === id
          ? { ...prev.selectedFile, ...updates }
          : prev.selectedFile,
    }))
    if (updates.estado !== undefined || updates.progreso !== undefined || updates.isTranscribed !== undefined) {
      db.updateEvidenceStatus(id, updates.estado ?? 'listo', updates.progreso ?? 0, updates.isTranscribed)
    }
  },

  initialize: async (caseId) => {
    const evs = await db.getEvidenceByCaseWithStatus(caseId)
    const mapped = evs.map((e) => ({
      id: e.id,
      caseId: e.caseId,
      nombre: e.nombre,
      estado: e.estado,
      progreso: e.progreso,
      tamano: e.tamano,
      isTranscribed: e.isTranscribed,
    }))
    const decrypted = await Promise.all(mapped.map(decryptEv))
    const savedFileRaw = localStorage.getItem('vanta_selected_file')
    let selected: EvidenceItem | null = null
    if (savedFileRaw) {
      try {
        const parsed = JSON.parse(savedFileRaw) as { id: string }
        selected = decrypted.find((e) => e.id === parsed.id) ?? null
      } catch {
        localStorage.removeItem('vanta_selected_file')
      }
    }
    set({ evidenceQueue: decrypted, selectedFile: selected })
  },

  refreshEvidence: async (caseId) => {
    const evs = await db.getEvidenceByCaseWithStatus(caseId)
    const mapped = evs.map((e) => ({
      id: e.id,
      caseId: e.caseId,
      nombre: e.nombre,
      estado: e.estado,
      progreso: e.progreso,
      tamano: e.tamano,
      isTranscribed: e.isTranscribed,
    }))
    const decrypted = await Promise.all(mapped.map(decryptEv))
    set((prev) => {
      const currentSelected = prev.selectedFile
      const stillExists = decrypted.find((e) => e.id === currentSelected?.id)
      return {
        evidenceQueue: decrypted,
        selectedFile: stillExists ?? null,
      }
    })
  },
}))
