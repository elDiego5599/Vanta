import { useState, useCallback, memo, KeyboardEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumEdgeWrapper, MagneticButton } from '../landing/Primitives';
import { useAppContext } from '../../lib/AppContext';
import * as db from '../../lib/db';

interface SearchResult {
  archivo: string;
  fragmento: string;
  hablante: string;
  timestamp: string;
  etiquetas?: string[];
}

const resultVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.06 },
  }),
};

const ModuloBusqueda = memo(function ModuloBusqueda() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const { activeCase, cases } = useAppContext();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const allResults: SearchResult[] = [];
      const casesToSearch = activeCase ? [activeCase] : cases;
      
      for (const c of casesToSearch) {
        const txs = await db.getTranscriptionsByCase(c.id);
        if (!txs.length) continue;
        
        const evidences = await db.getEvidenceByCase(c.id);
        const evMap = new Map(evidences.map(e => [e.id, e.nombre]));
        
        for (const tx of txs) {
          const evName = evMap.get(tx.evidenceId) || 'Desconocido';
          
          for (const line of tx.lines) {
            const speaker = (line as any).speaker || 'Agente';
            const textToSearch = `${line.text} ${speaker}`.toLowerCase();
            if (textToSearch.includes(query.toLowerCase())) {
              allResults.push({
                archivo: evName,
                fragmento: line.text,
                hablante: speaker,
                timestamp: line.t,
                etiquetas: [c.name]
              });
            }
          }
        }
      }
      
      setResults(allResults);
    } catch (error) {
      console.error("Error buscando:", error);
    } finally {
      setLoading(false);
    }
  }, [query, activeCase, cases]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4">
        <p className="text-[10px] text-[var(--text-muted)] tracking-[0.06em] font-mono">
          Busque conceptos en las transcripciones almacenadas {activeCase ? `del caso: ${activeCase.name}` : '(Búsqueda Global)'}.
        </p>
      </div>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar en transcripciones..."
          className="flex-1 px-4 py-3 bg-[var(--glass-bg)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-main)] placeholder-[var(--text-muted)]/50 outline-none focus:border-[var(--accent)]/50 focus:bg-[var(--glass-hover)] transition-all"
        />
        <MagneticButton>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-[var(--btn-bg)] text-[var(--btn-text)] rounded-lg text-xs font-bold tracking-wider uppercase hover:opacity-90 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 disabled:opacity-50"
            aria-label="Buscar"
          >
            {loading ? 'Buscando...' : 'Buscar Concepto'}
          </button>
        </MagneticButton>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h2 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--text-muted)] mb-3">
          Resultados {results.length > 0 && `(${results.length})`}
        </h2>

        {results.length === 0 && !loading ? (
          <PremiumEdgeWrapper rounded="rounded-lg">
            <div className="px-12 py-14 text-center relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--accent)', opacity: 0.06 }} />
              <motion.div
                className="w-10 h-10 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'var(--glass-bg)' }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </motion.div>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Sin resultados</div>
              <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Realice una busqueda para ver resultados</div>
            </div>
          </PremiumEdgeWrapper>
        ) : (
          <motion.div
            className="space-y-3"
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {results.map((r, idx) => (
                <motion.div
                  key={idx}
                  custom={idx}
                  variants={resultVariants}
                  whileHover={{ y: -2, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                  exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
                  className="relative"
                >
                  <div
                    className="absolute -inset-2 z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)',
                      filter: 'blur(16px)',
                    }}
                  />
                  <div className="group">
                  <PremiumEdgeWrapper rounded="rounded-lg">
                    <div className="p-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 cursor-pointer">
                      <div className="text-xs text-[var(--text-muted)] mb-2">{r.archivo}</div>
                      <div className="text-sm text-[var(--text-muted)] leading-relaxed mb-3">
                        {r.fragmento}
                      </div>
                      <div className="flex items-center gap-4 text-[10px]">
                        <span className="text-[var(--accent-text)] font-mono">{r.hablante}</span>
                        <span className="text-[var(--text-muted)]">{r.timestamp}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {r.etiquetas?.map((tag, ti) => (
                          <span key={ti} className="px-2 py-0.5 rounded-md bg-[var(--glass-bg)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </PremiumEdgeWrapper>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
});

export default ModuloBusqueda;
