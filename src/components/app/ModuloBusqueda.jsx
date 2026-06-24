import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumEdgeWrapper } from '../landing/Primitives';

const resultVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 },
  }),
};

const ModuloBusqueda = memo(function ModuloBusqueda() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResults([]);
      setLoading(false);
    }, 800);
  }, [query]);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[var(--text-main)] tracking-tight">Busqueda Semantica</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Busque conceptos en las transcripciones almacenadas.</p>
      </div>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar en transcripciones..."
          className="flex-1 px-4 py-3 bg-[var(--glass-bg)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-main)] placeholder-[var(--text-muted)]/50 outline-none focus:border-[var(--accent)]/50 focus:bg-[var(--glass-hover)] transition-all"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-3 bg-[var(--btn-bg)] text-[var(--btn-text)] rounded-lg text-xs font-bold tracking-wider uppercase hover:opacity-90 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 disabled:opacity-50"
          aria-label="Buscar"
        >
          {loading ? 'Buscando...' : 'Buscar Concepto'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--text-muted)] mb-3">
          Resultados {results.length > 0 && `(${results.length})`}
        </div>

        {results.length === 0 && !loading ? (
          <div className="border border-[var(--border-subtle)] rounded-lg p-12 text-center">
            <div className="text-[var(--text-muted)] text-xs">Sin resultados</div>
            <div className="text-[var(--text-muted)]/50 text-[10px] mt-1">Realice una busqueda para ver resultados</div>
          </div>
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
                  exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
                >
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
