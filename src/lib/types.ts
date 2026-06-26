// ==========================================
// Shared types for Vanta
// ==========================================

export type TabId = 'casos' | 'ingesta' | 'transcripcion';

export interface EvidenceItem {
  id: string;
  caseId: string;
  nombre: string;
  estado: string;
  progreso: number;
  tamano: string;
  isTranscribed?: boolean;
}

export interface CaseData {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface TranscriptLine {
  t: string;
  text: string;
  start: number;
  end: number;
  speaker?: 'Agente' | 'Testigo';
}

export interface ChunkResult {
  text: string;
  timestamp: [number, number];
}

export interface ProgressData {
  status: string;
  file: string;
  progress: number;
}

export interface TranscribeOptions {
  onChunk?: (chunk: ChunkResult) => void;
  chunkLengthSec?: number;
}
