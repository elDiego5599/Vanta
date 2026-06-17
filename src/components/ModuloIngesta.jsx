import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

const MOCK_QUEUE = [
  { id: 'ev-001', nombre: 'interrogatorio_0041.wav', estado: 'transcribiendo con CPU...', progreso: 67, tamano: '48.2 MB' },
  { id: 'ev-002', nombre: 'evidencia_audio_003.mp3', estado: 'generando embeddings...', progreso: 34, tamano: '12.8 MB' },
  { id: 'ev-003', nombre: 'declaracion_testigo.pdf', estado: 'completado', progreso: 100, tamano: '2.1 MB' },
];

const ESTADO_COLORS = {
  'transcribiendo con CPU...': 'text-yellow-500',
  'generando embeddings...': 'text-blue-400',
  'completado': 'text-green-500',
};

export default function ModuloIngesta() {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState(MOCK_QUEUE);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      try {
        const result = await invoke('ingresar_archivo_evidencia', { ruta: file.name });
        setQueue((prev) => [result, ...prev]);
      } catch (err) {
        console.error('Error al ingestar archivo:', err);
      }
    }
  }, []);

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-white/90 tracking-tight">Ingesta de Evidencia</h1>
        <p className="text-xs text-[#71717a] mt-1">Arrastre archivos de audio o video para iniciar el procesamiento forense.</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border border-dashed rounded-lg p-8 mb-6
          flex flex-col items-center justify-center gap-3
          transition-all duration-300 cursor-pointer
          ${isDragging
            ? 'border-blue-500/50 bg-blue-500/5'
            : 'border-white/10 bg-white/[0.015] hover:border-white/20 hover:bg-white/[0.025]'
          }
        `}
      >
        <div className="w-12 h-12 rounded-lg border border-white/15 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(212,212,216,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="text-center">
          <div className="text-xs text-[#a1a1aa]">Arrastre archivos de evidencia aqui</div>
          <div className="text-[10px] text-[#52525b] mt-1">MP3, MP4, WAV, MOV, PDF — hasta 8 GB</div>
        </div>
      </div>

      {/* Processing Queue */}
      <div className="flex-1">
        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#71717a] mb-3">
          Cola de Procesamiento
        </div>
        <div className="border border-white/5 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_140px_100px_80px] gap-3 px-4 py-2.5 bg-white/[0.03] border-b border-white/5 text-[10px] font-semibold tracking-wider uppercase text-[#71717a]">
            <div>Archivo</div>
            <div>Estado</div>
            <div>Progreso</div>
            <div className="text-right">Tamano</div>
          </div>
          {/* Table Rows */}
          {queue.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_140px_100px_80px] gap-3 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <span className="text-xs text-white/80 truncate">{item.nombre}</span>
              </div>
              <div className={`text-xs ${ESTADO_COLORS[item.estado] || 'text-[#71717a]'}`}>
                {item.estado}
              </div>
              <div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500/70 rounded-full transition-all duration-500"
                    style={{ width: `${item.progreso}%` }}
                  />
                </div>
                <div className="text-[9px] text-[#52525b] mt-1">{item.progreso}%</div>
              </div>
              <div className="text-xs text-[#71717a] text-right">{item.tamano}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
