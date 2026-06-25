import { createContext, useContext } from 'react';

export interface EvidenceItem {
  id: string;
  caseId: string;
  nombre: string;
  estado: string;
  progreso: number;
  tamano: string;
}

export interface CaseData {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppContextType {
  evidenceQueue: EvidenceItem[];
  addEvidence: (file: File, caseId: string) => Promise<void>;
  updateEvidence: (id: string, updates: Partial<EvidenceItem>) => void;
  selectedFile: EvidenceItem | null;
  selectFileForTranscription: (file: EvidenceItem) => void;
  user: { usuario: string } | null;
  cases: CaseData[];
  activeCase: CaseData | null;
  setActiveCase: (c: CaseData | null) => void;
  createCase: (name: string, description: string) => Promise<string>;
  deleteCase: (id: string) => Promise<void>;
  refreshCases: () => Promise<void>;
  refreshEvidence: () => Promise<void>;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContext.Provider');
  return ctx;
}

export default AppContext;
