import { useState, useRef, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const STYLE_TAG = `
  :root {
    --page-bg: #030303;
    --card-bg: #050505;
    --text-main: #ffffff;
    --text-muted: #71717a;
    --border-subtle: rgba(255,255,255,0.05);
    --border-strong: rgba(255,255,255,0.08);
    --btn-bg: #ffffff;
    --btn-text: #000000;
    --input-bg: #0a0a0a;
    --chrome-1: #52525b;
    --chrome-2: #a1a1aa;
    --glow-edge: rgba(255,255,255,0.4);
    --grid-line: rgba(255,255,255,0.02);
    --glass-bg: rgba(255,255,255,0.03);
    --glass-hover: rgba(255,255,255,0.06);
  }

  .light-mode {
    --page-bg: #f4f4f5;
    --card-bg: #ffffff;
    --text-main: #09090b;
    --text-muted: #52525b;
    --border-subtle: rgba(0,0,0,0.05);
    --border-strong: rgba(0,0,0,0.1);
    --btn-bg: #09090b;
    --btn-text: #ffffff;
    --input-bg: #f4f4f5;
    --chrome-1: #a1a1aa;
    --chrome-2: #52525b;
    --glow-edge: rgba(0,0,0,0.25);
    --grid-line: rgba(0,0,0,0.03);
    --glass-bg: rgba(0,0,0,0.03);
    --glass-hover: rgba(0,0,0,0.06);
  }

  @keyframes chrome-sweep {
    0%, 100% { background-position: 0% center; }
    50%      { background-position: 200% center; }
  }

  .chrome-text {
    background: linear-gradient(90deg, var(--chrome-1) 0%, var(--chrome-2) 18%, var(--text-main) 50%, var(--chrome-2) 82%, var(--chrome-1) 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: chrome-sweep 6s ease-in-out infinite;
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus, 
  input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 30px var(--input-bg) inset !important;
      -webkit-text-fill-color: var(--text-main) !important;
      transition: background-color 5000s ease-in-out 0s;
  }
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('vanta-login-styles')) return;
  const s = document.createElement('style');
  s.id = 'vanta-login-styles';
  s.textContent = STYLE_TAG;
  document.head.appendChild(s);
}

const ULTRA_EASE = [0.16, 1, 0.3, 1];

function VantaLogo({ className = "w-8 h-8" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chromeGlowLogin2" x1="-100%" y1="-100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="var(--chrome-1)" />
          <stop offset="30%" stopColor="var(--chrome-2)" />
          <stop offset="50%" stopColor="var(--text-main)" />
          <stop offset="70%" stopColor="var(--chrome-2)" />
          <stop offset="100%" stopColor="var(--chrome-1)" />
          <animate attributeName="x1" values="-100%;200%;-100%" dur="6s" repeatCount="indefinite" />
          <animate attributeName="y1" values="-100%;200%;-100%" dur="6s" repeatCount="indefinite" />
          <animate attributeName="x2" values="0%;300%;0%" dur="6s" repeatCount="indefinite" />
          <animate attributeName="y2" values="0%;300%;0%" dur="6s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      <polygon points="10,25 40,85 55,85 25,25" fill="url(#chromeGlowLogin2)" opacity="0.95" />
      <polygon points="90,25 60,85 45,85 75,25" fill="url(#chromeGlowLogin2)" opacity="0.75" />
      <polygon points="35,25 65,25 50,55" fill="url(#chromeGlowLogin2)" opacity="0.85" />
    </svg>
  );
}

const Ico = {
  sun: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  moon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
  system: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
};

function MagneticButton({ children, className = '', disabled = false }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouse = (e) => {
    if (disabled) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    x.set((e.clientX - (left + width / 2)) * 0.2);
    y.set((e.clientY - (top + height / 2)) * 0.2);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} onMouseMove={handleMouse} onMouseLeave={handleLeave} style={{ x: springX, y: springY }} className={`inline-block w-full ${className}`}>
      {children}
    </motion.div>
  );
}

function PremiumEdgeWrapper({ children, className = '', rounded = 'rounded-[24px]' }) {
  return (
    <div className={`relative group ${className} p-[1px]`}>
      <div className={`absolute -inset-[1px] ${rounded} overflow-hidden blur-[12px] opacity-20 transition-opacity duration-700 -z-10`}>
        <div className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }} className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_0%,transparent_30%,var(--glow-edge)_45%,var(--text-main)_50%,var(--glow-edge)_55%,transparent_70%,transparent_100%)]" />
        </div>
      </div>
      <div className={`absolute -inset-[1px] ${rounded} overflow-hidden z-0`}>
        <div className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }} className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_0%,transparent_40%,var(--glow-edge)_48%,var(--text-main)_50%,var(--glow-edge)_52%,transparent_60%,transparent_100%)]" />
        </div>
      </div>
      <div className={`absolute inset-[1px] bg-[var(--card-bg)] ${rounded} z-10 transition-colors duration-700 shadow-[inset_0_1px_1px_var(--border-subtle)]`} />
      <div className="relative z-20 h-full">{children}</div>
    </div>
  );
}

function CSSGrid() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{
      backgroundImage: `linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)`,
      backgroundSize: '48px 48px'
    }} />
  );
}

function ThemeToggle({ theme, setTheme }) {
  const toggle = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <button onClick={toggle} className="absolute top-6 right-6 p-2.5 rounded-full border border-[var(--border-strong)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-lg z-50 focus:outline-none" aria-label="Cambiar Tema">
      {theme === 'dark' && Ico.moon}
      {theme === 'light' && Ico.sun}
      {theme === 'system' && Ico.system}
    </button>
  );
}

export default function LoginScreen({ onLogin }) {
  injectStyles();

  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('light-mode');
    else if (theme === 'dark') root.classList.remove('light-mode');
    else {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) root.classList.add('light-mode');
      else root.classList.remove('light-mode');
    }
  }, [theme]);

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

      <ThemeToggle theme={theme} setTheme={setTheme} />

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
                <VantaLogo className="w-8 h-8 text-[var(--text-main)]" />
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
                    className="w-full px-4 py-3.5 bg-[var(--input-bg)] border border-[var(--border-strong)] rounded-xl text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] placeholder-opacity-50 focus:outline-none focus:border-blue-500/50 focus:bg-[var(--glass-bg)] transition-all"
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
                    className="w-full px-4 py-3.5 bg-[var(--input-bg)] border border-[var(--border-strong)] rounded-xl text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] placeholder-opacity-50 focus:outline-none focus:border-blue-500/50 focus:bg-[var(--glass-bg)] transition-all"
                    disabled={cargando}
                  />
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-[10px] font-mono text-red-500 dark:text-red-400 mb-6 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg text-center tracking-widest uppercase">
                  [ERROR] {error}
                </motion.div>
              )}

              <MagneticButton disabled={cargando}>
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