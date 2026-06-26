import { create } from 'zustand'
import type { EvidenceItem } from '../types'
import * as db from '../db'

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
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
    const id = `ev-${Date.now()}`
    const tamano = formatSize(file.size)
    const arrayBuffer = await file.arrayBuffer()
    await db.saveEvidence(id, caseId, file.name, tamano, arrayBuffer)
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
    const savedFileRaw = localStorage.getItem('vanta_selected_file')
    let selected: EvidenceItem | null = null
    if (savedFileRaw) {
      try {
        const parsed = JSON.parse(savedFileRaw) as { id: string }
        selected = mapped.find((e) => e.id === parsed.id) ?? null
      } catch {
        localStorage.removeItem('vanta_selected_file')
      }
    }
    set({ evidenceQueue: mapped, selectedFile: selected })
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
    set((prev) => {
      const currentSelected = prev.selectedFile
      const stillExists = mapped.find((e) => e.id === currentSelected?.id)
      return {
        evidenceQueue: mapped,
        selectedFile: stillExists ?? null,
      }
    })
  },
}))
