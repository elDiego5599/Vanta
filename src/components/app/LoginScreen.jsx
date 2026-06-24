import { useState } from 'react';
import { motion } from 'framer-motion';
import { MagneticButton, PremiumEdgeWrapper, ThemeToggle } from '../landing/Primitives';
import { VantaLogo } from '../landing/Icons';
import { CSSGrid } from '../landing/CSSGrid';
import { useTheme } from '../../lib/use-theme';

const ULTRA_EASE = [0.16, 1, 0.3, 1];

export default function LoginScreen({ onLogin }) {
  const { theme, setTheme } = useTheme();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!usuario.trim()) {
      setError('INGRESE UN USUARIO VÁLIDO');
      return;
    }

    setCargando(true);
    setTimeout(() => {
      onLogin({ usuario: usuario.trim() });
      setCargando(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[var(--page-bg)] transition-colors duration-700 overflow-hidden relative selection:bg-blue-500/30 font-sans text-[var(--text-main)]">

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      <CSSGrid />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--text-main)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: ULTRA_EASE }}
        className="relative z-10 w-full max-w-sm px-4 md:px-0"
      >
        <PremiumEdgeWrapper rounded="rounded-[32px]">
          <div className="p-10 md:p-12 flex flex-col items-center w-full">

            <div className="text-center mb-10 w-full flex flex-col items-center">
              <div className="w-16 h-16 rounded-[20px] border border-[var(--border-strong)] bg-[var(--glass-bg)] flex items-center justify-center mb-5 shadow-[inset_0_1px_1px_var(--border-subtle)]">
                <VantaLogo className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-[0.2em] uppercase chrome-text select-none">
                VANTA
              </h1>
              <p className="text-[9px] text-[var(--text-muted)] mt-2.5 tracking-[0.25em] uppercase font-mono">
                Forensic Audio Analysis
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full">
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] font-mono tracking-widest uppercase mb-2 block ml-1">
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="ID de Agente"
                    className="w-full px-4 py-3.5 bg-[var(--input-bg)] border border-[var(--border-strong)] rounded-xl text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] placeholder:opacity-50 focus:outline-none focus:border-[var(--accent)]/50 focus:bg-[var(--glass-bg)] transition-all"
                    autoFocus
                    disabled={cargando}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] font-mono tracking-widest uppercase mb-2 block ml-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    placeholder="Clave de Acceso"
                    className="w-full px-4 py-3.5 bg-[var(--input-bg)] border border-[var(--border-strong)] rounded-xl text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] placeholder:opacity-50 focus:outline-none focus:border-[var(--accent)]/50 focus:bg-[var(--glass-bg)] transition-all"
                    disabled={cargando}
                  />
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-[10px] font-mono text-red-500 mb-6 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg text-center tracking-widest uppercase">
                  [ERROR] {error}
                </motion.div>
              )}

              <MagneticButton disabled={cargando} className="w-full">
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-4 bg-[var(--btn-bg)] text-[var(--btn-text)] rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_var(--border-strong)] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                  {cargando ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-[var(--btn-text)]/20 border-t-[var(--btn-text)] rounded-full" />
                      <span>Desencriptando...</span>
                    </>
                  ) : (
                    'Ingresar'
                  )}
                </button>
              </MagneticButton>
            </form>

            <div className="text-center mt-8 w-full border-t border-[var(--border-subtle)] pt-6">
              <div className="flex items-center justify-center gap-2 text-[9px] text-[var(--text-muted)] tracking-widest font-mono uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)] animate-pulse" />
                v3.0.0 — Offline
              </div>
            </div>

          </div>
        </PremiumEdgeWrapper>
      </motion.div>
    </div>
  );
}
