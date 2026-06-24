import { createContext, useContext } from 'react';

export interface EvidenceItem {
  id: string;
  file: File;
  nombre: string;
  estado: string;
  progreso: number;
  tamano: string;
}

export interface AppContextType {
  evidenceQueue: EvidenceItem[];
  addEvidence: (file: File) => void;
  updateEvidence: (id: string, updates: Partial<EvidenceItem>) => void;
  selectedFile: EvidenceItem | null;
  selectFileForTranscription: (file: EvidenceItem) => void;
  user: { usuario: string } | null;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContext.Provider');
  return ctx;
}

export default AppContext;
