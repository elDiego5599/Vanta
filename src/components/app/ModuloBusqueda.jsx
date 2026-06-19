import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function ModuloBusqueda() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await invoke('ejecutar_busqueda_semantica', { consulta: query });
      setResults(data.resultados || []);
    } catch (err) {
      console.error('Error en busqueda:', err);
      setResults([]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-white/90 tracking-tight">Busqueda Semantica Vectorial</h1>
        <p className="text-xs text-[#71717a] mt-1">Busque conceptos dentro de las transcripciones por significado, no solo por palabras exactas.</p>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar concepto o idea..."
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/85 placeholder-[#52525b] focus:outline-none focus:border-blue-500/40 transition-colors"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase
            border border-white/20 bg-white/[0.04] text-white/80
            hover:bg-white/[0.08] hover:border-white/30
            transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Buscar Concepto'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#71717a] mb-3">
            {results.length} resultados encontrados
          </div>
          <div className="space-y-2">
            {results.map((result, i) => (
              <div
                key={i}
                className="border border-white/5 rounded-lg p-4 bg-white/[0.015] hover:bg-white/[0.025] hover:border-white/10 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-1 rounded bg-blue-500/10 text-[10px] font-bold text-blue-400 tabular-nums">
                      {result.timestamp}
                    </div>
                    <div className="text-[10px] text-[#71717a]">
                      {result.archivo}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          result.similitud >= 80 ? 'bg-green-500/70' :
                          result.similitud >= 60 ? 'bg-yellow-500/70' :
                          'bg-red-500/70'
                        }`}
                        style={{ width: `${result.similitud}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold tabular-nums ${
                      result.similitud >= 80 ? 'text-green-400' :
                      result.similitud >= 60 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {result.similitud}%
                    </span>
                  </div>
                </div>
                <div className="text-sm text-[#a1a1aa] leading-relaxed mb-2">
                  "{result.fragmento}"
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    result.hablante === 'Agente' ? 'text-[#71717a]' : 'text-blue-400/70'
                  }`}>
                    {result.hablante}
                  </span>
                  <span className="text-[10px] text-[#52525b]">·</span>
                  <span className="text-[10px] text-[#52525b]">
                    coincidencia conceptual
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg border border-white/10 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div className="text-xs text-[#71717a]">Ingrese un concepto para buscar</div>
            <div className="text-[10px] text-[#52525b] mt-1">La busqueda es semantica, no solo literal</div>
          </div>
        </div>
      )}
    </div>
  );
}
