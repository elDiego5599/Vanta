import { useState, useCallback } from 'react';
import { useAppContext } from '../lib/AppContext';

export default function ModuloIngesta() {
  const { evidenceQueue, addEvidence, selectFileForTranscription } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type.startsWith('audio/') || file.name.match(/\.(wav|mp3|ogg|flac|m4a|opus|wma|aac|mp4|webm)$/i)) {
        addEvidence(file);
      }
    }
  }, [addEvidence]);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      addEvidence(file);
    }
    e.target.value = '';
  }, [addEvidence]);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-white/90 tracking-tight">Ingesta de Evidencia</h1>
        <p className="text-xs text-[#71717a] mt-1">Arrastre archivos de audio para transcripcion local con Whisper.</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border border-dashed rounded-lg p-8 mb-6
          flex flex-col items-center justify-center gap-3
          transition-all duration-300
          ${isDragging
            ? 'border-blue-500/50 bg-blue-500/5'
            : 'border-white/10 bg-white/[0.015] hover:border-white/20 hover:bg-white/[0.025]'
          }
        `}
      >
        <input
          type="file"
          accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a,.opus,.wma,.aac"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-12 h-12 rounded-lg border border-white/15 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(212,212,216,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="text-center">
          <div className="text-xs text-[#a1a1aa]">Arrastre archivos de audio aqui</div>
          <div className="text-[10px] text-[#52525b] mt-1">WAV, MP3, OGG, FLAC, M4A</div>
        </div>
      </div>

      {/* Queue */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#71717a] mb-3">
          Archivos Cargados
        </div>

        {evidenceQueue.length === 0 ? (
          <div className="border border-white/5 rounded-lg p-12 text-center">
            <div className="text-[#52525b] text-xs">No hay archivos</div>
            <div className="text-[#3f3f46] text-[10px] mt-1">Arrastre o seleccione archivos de audio</div>
          </div>
        ) : (
          <div className="space-y-2">
            {evidenceQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-white/5 bg-white/[0.015] hover:bg-white/[0.025] transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white/80 truncate">{item.nombre}</div>
                  <div className="text-[10px] text-[#52525b]">{item.tamano}</div>
                </div>
                <button
                  onClick={() => selectFileForTranscription(item)}
                  className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-md text-[10px] font-medium text-blue-400 hover:bg-blue-500/30 transition-colors flex-shrink-0"
                >
                  Transcribir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
