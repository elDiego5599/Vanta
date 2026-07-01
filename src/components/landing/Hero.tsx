import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { VantaLogo } from './Icons';
import { Reveal, MagneticButton, Title25D } from './Primitives';

function AboutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--page-bg)]/60 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-[500px] bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-3xl p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[var(--accent)]/10 blur-[50px] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <VantaLogo className="w-10 h-10 text-[var(--accent)]" />
                <div>
                  <div className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">Vanta</div>
                  <div className="text-[10px] font-mono tracking-widest uppercase text-[var(--text-muted)]">Inteligencia Forense</div>
                </div>
              </div>
              <div className="space-y-4 text-[13px] leading-relaxed text-[var(--text-muted)]">
                <p>
                  Vanta es una plataforma forense de transcripción y gestión de evidencias diseñada para operaciones de inteligencia, investigación y cumplimiento legal.
                </p>
                <p>
                  Resuelve el problema de gestionar, cifrar y transcribir archivos de audio y video de forma <strong className="text-[var(--text-main)]">100% offline</strong>, eliminando la dependencia de servicios en la nube y garantizando la integridad de la cadena de custodia.
                </p>
                <p>
                  Utiliza <strong className="text-[var(--text-main)]">Whisper AI</strong> en el navegador para transcripción local con aceleración por hardware, <strong className="text-[var(--text-main)]">AES-256-GCM</strong> para cifrado en reposo, y <strong className="text-[var(--text-main)]">SHA-256</strong> para hash forense de cada evidencia.
                </p>
                <div className="pt-4 border-t border-[var(--border-subtle)]">
                  <div className="text-[10px] font-mono tracking-widest uppercase text-[var(--text-muted)]">v1.0.0 — 2026</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="mt-6 w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-[var(--glass-bg)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-main)]"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function HeroBase() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <section id="main-content" className="relative z-10 min-h-screen flex flex-col justify-center pt-24 pb-8 px-6 lg:px-12 max-w-[1200px] xl:max-w-[1300px] mx-auto overflow-hidden">
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      <div className="grid grid-cols-1 lg:grid-cols-3 items-center w-full gap-10">
        <Reveal dir="left" className="flex flex-col items-start justify-center">
          <Title25D text1="Inteligencia" text2="Forense" className="text-[clamp(3.5rem,5vw,5rem)] leading-[0.9]" />
          <div className="flex gap-4 mt-8">
            <MagneticButton>
              <Link to="/download" className="px-6 py-3.5 text-[11px] font-bold tracking-widest uppercase rounded-full text-[var(--btn-text)] bg-[var(--btn-bg)] transition-transform hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-white inline-block">
                Descargar
              </Link>
            </MagneticButton>
            <MagneticButton>
              <button
                onClick={() => setAboutOpen(true)}
                className="px-6 py-3.5 text-[11px] font-bold tracking-widest uppercase rounded-full border border-[var(--border-strong)] text-[var(--text-main)] bg-transparent hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Acerca de
              </button>
            </MagneticButton>
          </div>
        </Reveal>
        <Reveal dir="up" className="flex justify-center items-center relative h-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-[var(--text-main)] opacity-10 blur-[80px] rounded-full pointer-events-none" />
          <div className="w-56 h-56 md:w-64 md:h-64 relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.05)] text-[var(--text-main)]">
            <VantaLogo className="w-full h-full" />
          </div>
        </Reveal>
        <Reveal dir="right" className="flex flex-col items-start lg:items-end justify-center">
          <div className="flex flex-col gap-6 font-mono text-[11px] md:text-[12px] tracking-[0.15em] text-[var(--text-muted)] uppercase text-left">
            <p className="hover:text-[var(--text-main)] transition-colors cursor-default">PARA OPERACIONES ENCUBIERTAS</p>
            <p className="hover:text-[var(--text-main)] transition-colors cursor-default">MOTOR WHISPER AI NATIVO</p>
            <p className="hover:text-[var(--text-main)] transition-colors cursor-default">CUMPLIMIENTO FORENSE ESTRICTO</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export const Hero = memo(HeroBase);
