import { useState, useCallback, memo, KeyboardEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAppContext } from '../../lib/AppContext';
import * as db from '../../lib/db';

// ==========================================
// 1. ÍCONOS LOCALES
// ==========================================
const SearchIcon = ({ w = 24, h = 24, className = '' }) => (
  <svg width={w} height={h} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FileTextIcon = ({ w = 24, h = 24, className = '' }) => (
  <svg width={w} height={h} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const TagIcon = ({ w = 24, h = 24, className = '' }) => (
  <svg width={w} height={h} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

// ==========================================
// 2. INTERFACES Y CONSTANTES
// ==========================================
interface SearchResult {
  archivo: string;
  fragmento: string;
  hablante: string;
  timestamp: string;
  etiquetas?: string[];
}

// FIX TYPESCRIPT: Tipado estricto para las variantes
const resultVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      delay: i * 0.05
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
const ModuloBusqueda = memo(function ModuloBusqueda() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null); // null = sin buscar, [] = no hay resultados

  const { activeCase, cases } = useAppContext();

  // Lógica de Búsqueda
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
          const evName = evMap.get(tx.evidenceId) || 'Evidencia Desconocida';

          for (const line of tx.lines) {
            const speaker = (line as { speaker?: string }).speaker || 'Agente';
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

      // Simulamos latencia premium para que la UI se luzca
      await new Promise(r => setTimeout(r, 600));
      setResults(allResults);
    } catch (error) {
      console.error("Error buscando:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, activeCase, cases]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  return (
    <div className="absolute inset-0 flex flex-col bg-[var(--page-bg)]">
      {/* Estilos globales inyectados (Caret Color) */}
      <style>{`
        input { caret-color: var(--text-main); }
      `}</style>

      {/* CABECERA */}
      <div className="flex-none p-6 lg:px-10 lg:pt-10 lg:pb-6 border-b border-[var(--border-subtle)] bg-[var(--card-bg)]/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-3 text-[11px] font-mono tracking-widest uppercase text-[var(--accent)] mb-2">
          <SearchIcon w={14} h={14} />
          {activeCase ? `Alcance: Expediente "${activeCase.name}"` : 'Alcance: Base de Datos Global'}
        </div>
        <div className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
          Inteligencia de Búsqueda
        </div>
        <div className="text-[13px] mt-1 text-[var(--text-muted)]">
          Rastreo semántico y de palabras clave en todas las transcripciones procesadas.
        </div>
      </div>

      {/* CONTENEDOR FLEXIBLE CON SCROLL */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-4xl mx-auto p-6 lg:p-10 flex flex-col gap-8 pb-20">

          {/* BARRA DE BÚSQUEDA (Estilo Raycast / Command Palette) */}
          <div className="relative group">
            {/* Glow trasero que reacciona al hover/focus */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)]/0 via-[var(--accent)]/20 to-[var(--accent)]/0 rounded-[24px] blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

            <div className="relative flex items-center bg-[var(--card-bg)] border border-[var(--border-subtle)] focus-within:border-[var(--accent)]/50 rounded-2xl shadow-lg transition-all duration-300 p-2 pl-4">
              <SearchIcon w={20} h={20} className="text-[var(--text-muted)] shrink-0" />

              <input
                type="text"
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ingrese términos, nombres o frases..."
                className="flex-1 px-4 py-3 bg-transparent text-[15px] font-medium text-[var(--text-main)] placeholder-[var(--text-muted)]/60 outline-none w-full"
                autoFocus
              />

              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:brightness-110 active:scale-95 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando
                  </>
                ) : (
                  'Buscar'
                )}
              </button>
            </div>
          </div>

          {/* ÁREA DE RESULTADOS */}
          <div className="flex flex-col flex-1">
            {/* ESTADOS VACÍOS O DE INICIO */}
            {results === null && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-60">
                <SearchIcon w={48} h={48} className="text-[var(--text-muted)] mb-4" />
                <div className="text-[14px] font-bold text-[var(--text-main)]">Motor de búsqueda en espera</div>
                <div className="text-[12px] font-mono text-[var(--text-muted)] mt-1">Escriba un concepto y presione Enter</div>
              </div>
            )}

            {results !== null && results.length === 0 && !loading && (
              <div className="w-full rounded-3xl border border-[var(--border-subtle)] bg-[var(--glass-bg)] p-12 flex flex-col items-center justify-center text-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-[60px] pointer-events-none bg-[var(--accent)]/10" />
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-sm relative z-10 text-[var(--text-muted)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <div className="text-[15px] font-bold text-[var(--text-main)] relative z-10">Cero Coincidencias</div>
                <div className="text-[12px] font-mono text-[var(--text-muted)] mt-1 relative z-10">No se encontraron rastros de "{query}" en los registros.</div>
              </div>
            )}

            {/* LISTA DE RESULTADOS */}
            {results !== null && results.length > 0 && !loading && (
              <div className="flex flex-col">
                <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--text-muted)] mb-5 px-2">
                  Coincidencias Encontradas: <span className="text-[var(--accent)]">{results.length}</span>
                </h2>

                <div className="flex flex-col gap-4">
                  <AnimatePresence mode="popLayout">
                    {results.map((r, idx) => (
                      <motion.div
                        key={idx}
                        custom={idx}
                        variants={resultVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="group flex flex-col p-5 rounded-2xl bg-[#000000] border border-[var(--border-strong)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-[var(--text-muted)] transition-colors duration-300"
                      >
                        {/* Cabecera del Resultado (Archivo y Tiempo) */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/[0.08]">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-white uppercase tracking-wider truncate">
                            <FileTextIcon w={14} h={14} className="text-[var(--accent)]" />
                            {r.archivo}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-1 rounded border border-white/10 shrink-0">
                            {r.timestamp}
                          </div>
                        </div>

                        {/* Texto del Fragmento Encontrado */}
                        <div className="text-[14px] leading-relaxed text-zinc-300 mb-4 group-hover:text-white transition-colors">
                          "{r.fragmento}"
                        </div>

                        {/* Footer del Resultado (Orador y Etiquetas) */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Insignia del Orador (Diarización) */}
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${r.hablante === 'Agente'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            {r.hablante}
                          </div>

                          {/* Etiquetas del Caso (Tags) */}
                          {r.etiquetas?.map((tag, ti) => (
                            <div key={ti} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-mono text-zinc-400 bg-white/5 border border-white/10 uppercase tracking-widest truncate max-w-[200px]">
                              <TagIcon w={10} h={10} />
                              {tag}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* LOADER (SKELETON) MIENTRAS BUSCA */}
            {loading && (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col p-5 rounded-2xl bg-[#000000] border border-[var(--border-subtle)] opacity-50">
                    <div className="flex justify-between mb-4 border-b border-white/[0.08] pb-3">
                      <div className="w-32 h-3 bg-white/10 rounded animate-pulse" />
                      <div className="w-16 h-3 bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="w-full h-4 bg-white/10 rounded animate-pulse mb-2" />
                    <div className="w-2/3 h-4 bg-white/10 rounded animate-pulse mb-4 delay-75" />
                    <div className="flex gap-2">
                      <div className="w-16 h-5 bg-white/10 rounded animate-pulse delay-150" />
                      <div className="w-24 h-5 bg-white/10 rounded animate-pulse delay-200" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
});

export default ModuloBusqueda;