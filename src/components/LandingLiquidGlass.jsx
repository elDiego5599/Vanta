import { useRef, useEffect, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from 'framer-motion';

/* ════════════════════════════════════════════════════════════════════════════
   0. INJECTED STYLES
   ════════════════════════════════════════════════════════════════════════════ */
const STYLE_TAG = `
  @keyframes chrome-sweep {
    0%, 100% { background-position: 0% center; }
    50%      { background-position: 200% center; }
  }
  @keyframes scroll-bounce {
    0%, 100% { opacity: 0.35; transform: translateY(0); }
    50%      { opacity: 0.8;  transform: translateY(6px); }
  }
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('vanta-styles')) return;
  const s = document.createElement('style');
  s.id = 'vanta-styles';
  s.textContent = STYLE_TAG;
  document.head.appendChild(s);
}

/* ════════════════════════════════════════════════════════════════════════════
   1. DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */
const C = {
  bg: '#09090b',
  card: 'rgba(255,255,255,0.025)',
  cardHover: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.14)',
  text: '#fafafa',
  text2: '#a1a1aa',
  text3: '#71717a',
  accent: '#3b82f6',
  accentDim: 'rgba(59,130,246,0.12)',
  accentText: 'rgba(147,197,253,0.9)',
};

const CHROME = {
  background:
    'linear-gradient(90deg,#52525b 0%,#71717a 18%,#a1a1aa 33%,#d4d4d8 47%,#ffffff 50%,#d4d4d8 53%,#a1a1aa 67%,#71717a 82%,#52525b 100%)',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  animation: 'chrome-sweep 6s ease-in-out infinite',
};

const EASE = [0.22, 1, 0.36, 1];

/* ════════════════════════════════════════════════════════════════════════════
   2. SVG ICONS
   ════════════════════════════════════════════════════════════════════════════ */
const Ico = {
  shield: (c = C.text2) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  brain: (c = C.text2) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 1 4.5 2.8A4 4 0 0 1 20 8a4 4 0 0 1-1.8 3.3A4.5 4.5 0 0 1 17 14a4 4 0 0 1-3 3.9V22h-4v-4.1A4 4 0 0 1 7 14a4.5 4.5 0 0 1-1.2-2.7A4 4 0 0 1 4 8a4 4 0 0 1 3.5-3.2A5 5 0 0 1 12 2z" />
      <path d="M12 2v8" />
    </svg>
  ),
  link: (c = C.text2) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  file: (c = C.text2) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  doc: (c = C.text2) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  lock: (c = C.text2) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  upload: (c = C.text2) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  search: (c = C.text2) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  download: (c = C.text2) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  music: (c = C.text2) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  film: (c = C.text2) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
      <line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  ),
  check: (c = C.accent) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

/* ════════════════════════════════════════════════════════════════════════════
   3. GRID CANVAS — static, drawn once
   ════════════════════════════════════════════════════════════════════════════ */
function GridCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const CELL = 48;
    function draw() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(50,50,62,0.07)';
      for (let y = 0; y <= H; y += CELL) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      for (let x = 0; x <= W; x += CELL) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
    }
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);
  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   4. SPOTLIGHT — cursor-following radial gradient
   ════════════════════════════════════════════════════════════════════════════ */
function Spotlight() {
  const rawX = useMotionValue(-800);
  const rawY = useMotionValue(-800);
  const x = useSpring(rawX, { stiffness: 80, damping: 22, mass: 1 });
  const y = useSpring(rawY, { stiffness: 80, damping: 22, mass: 1 });
  useEffect(() => {
    const onMove = (e) => { rawX.set(e.clientX); rawY.set(e.clientY); };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [rawX, rawY]);
  return (
    <motion.div
      style={{
        position: 'fixed', top: 0, left: 0, width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, rgba(59,130,246,0.02) 40%, transparent 70%)',
        pointerEvents: 'none', zIndex: 1, translateX: x, translateY: y, x: '-50%', y: '-50%',
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   5. WAVEFORM — animated audio bars
   ════════════════════════════════════════════════════════════════════════════ */
function Waveform() {
  const bars = Array.from({ length: 52 }, (_, i) =>
    6 + Math.abs(Math.sin(i * 0.52 + 1.3) * 40) + Math.abs(Math.sin(i * 0.21) * 18)
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 56 }}>
      {bars.map((h, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0.3 }}
          animate={{ scaleY: [0.3, 1, 0.5, 0.85, 0.3] }}
          transition={{ duration: 2.4 + (i % 5) * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.04 }}
          style={{ width: 2, height: h, borderRadius: 1, background: `rgba(59,130,246,${0.45 + (i % 3) * 0.15})`, transformOrigin: 'center', flexShrink: 0 }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   6. MOCKUP UI — application preview
   ════════════════════════════════════════════════════════════════════════════ */
function MockupUI() {
  const sideItems = [
    { label: 'Casos Activos', active: true },
    { label: 'Evidencias', active: false },
    { label: 'Transcripciones', active: false },
    { label: 'Informes', active: false },
    { label: 'Configuracion', active: false },
  ];
  const transcript = [
    { t: '00:00:14', s: 'Agente', txt: 'Por favor, indique su nombre completo para el registro.' },
    { t: '00:00:22', s: 'Testigo', txt: 'Mi nombre es Carlos Ramirez Vega.' },
    { t: '00:00:31', s: 'Agente', txt: 'Confirme la fecha y lugar de los hechos.' },
    { t: '00:00:48', s: 'Testigo', txt: 'El dieciseis de marzo, en la calle Constitucion 204.' },
  ];
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0a0a0a', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Sidebar */}
      <div style={{ width: 185, flexShrink: 0, background: '#060606', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', padding: '20px 0', gap: 2 }}>
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>Vanta</div>
          <div style={{ fontSize: 9, color: C.text3, marginTop: 3, letterSpacing: '0.06em' }}>v3.0.0 — offline</div>
        </div>
        {sideItems.map((item) => (
          <div key={item.label} style={{
            padding: '7px 16px', fontSize: 10.5, fontWeight: item.active ? 600 : 400,
            color: item.active ? 'rgba(255,255,255,0.92)' : C.text3,
            background: item.active ? 'rgba(255,255,255,0.06)' : 'transparent',
            borderLeft: item.active ? '2px solid rgba(255,255,255,0.75)' : '2px solid transparent',
            letterSpacing: '0.04em', cursor: 'default',
          }}>{item.label}</div>
        ))}
      </div>
      {/* Main panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, gap: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em' }}>Caso #2024-0471</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />
            <span style={{ fontSize: 9, color: C.text3, letterSpacing: '0.08em' }}>MODO OFFLINE</span>
          </div>
        </div>
        <div style={{ border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 8, padding: '14px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(255,255,255,0.015)', flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2v8M3 6l4-4 4 4" stroke="rgba(212,212,216,0.6)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 11h12" stroke="rgba(212,212,216,0.35)" strokeWidth="1.2" strokeLinecap="round" /></svg>
          </div>
          <div style={{ fontSize: 9.5, color: C.text3, letterSpacing: '0.05em', textAlign: 'center' }}>Arrastre archivos de evidencia aqui</div>
          <div style={{ fontSize: 8.5, color: 'rgba(63,63,70,0.9)', letterSpacing: '0.04em' }}>MP3, MP4, WAV, MOV — hasta 8 GB</div>
        </div>
        <div style={{ borderRadius: 8, border: '1px solid rgba(59,130,246,0.1)', background: 'rgba(59,130,246,0.025)', padding: '10px 14px', flexShrink: 0 }}>
          <div style={{ fontSize: 8.5, color: C.text3, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8 }}>Forma de onda — interrogatorio_0041.wav</div>
          <Waveform />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 8, color: 'rgba(63,63,70,0.9)' }}>00:00:00</span>
            <span style={{ fontSize: 8, color: C.accent }}>REPRODUCIENDO</span>
            <span style={{ fontSize: 8, color: 'rgba(63,63,70,0.9)' }}>01:24:38</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {transcript.map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: 8, color: 'rgba(63,63,70,0.9)', flexShrink: 0, width: 46 }}>{line.t}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: line.s === 'Agente' ? 'rgba(212,212,216,0.65)' : C.accent, flexShrink: 0, width: 46, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{line.s}</span>
              <span style={{ fontSize: 8.5, color: 'rgba(161,161,170,0.7)', lineHeight: 1.5 }}>{line.txt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   7. ANIMATED NUMBER — counts up on scroll into view
   ════════════════════════════════════════════════════════════════════════════ */
function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !done.current) {
          done.current = true;
          const t0 = performance.now();
          const dur = 1400;
          (function tick(now) {
            const p = Math.min((now - t0) / dur, 1);
            setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * value));
            if (p < 1) requestAnimationFrame(tick);
          })(t0);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);
  return <span ref={ref}>{display}{suffix}</span>;
}

/* ════════════════════════════════════════════════════════════════════════════
   8. SECTION — scroll-triggered fade-in wrapper
   ════════════════════════════════════════════════════════════════════════════ */
function Section({ children, style, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, ease: EASE, delay }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   9. DATA
   ════════════════════════════════════════════════════════════════════════════ */
const FEATURES = [
  { icon: 'shield',  title: '100% Offline',           body: 'Ninguna evidencia abandona la maquina. Sin nube, sin telemetria, sin servidores de terceros.', accent: false },
  { icon: 'brain',   title: 'Transcripcion con IA',   body: 'Motor Whisper embebido de alta precision. CPU/GPU local sin dependencias externas.', accent: true },
  { icon: 'link',    title: 'Cadena de Custodia',     body: 'Hashing SHA-256 automatico de cada archivo. Registro forense inmutable e inalterable.', accent: false },
  { icon: 'file',    title: 'Formatos de Evidencia',  body: 'MP3, MP4, WAV, MOV, FLAC y formatos de intercambio judicial estandar.', accent: false },
  { icon: 'doc',     title: 'Informes Exportables',   body: 'PDF y DOCX con sello de tiempo y firma digital, listos para presentacion judicial.', accent: false },
  { icon: 'lock',    title: 'Cifrado AES-256',        body: 'Proyectos cifrados en reposo. Acceso protegido por contrasena maestra.', accent: true },
];

const STEPS = [
  { num: '01', icon: 'upload', title: 'Importar', desc: 'Arrastre archivos de audio o video. El hashing SHA-256 se ejecuta automaticamente al momento de la ingesta.' },
  { num: '02', icon: 'search', title: 'Analizar', desc: 'El motor de IA local transcribe con precision profesional. Diarizacion, marcas de tiempo y busqueda de texto completo.' },
  { num: '03', icon: 'download', title: 'Exportar', desc: 'Informes PDF o DOCX con sello de tiempo, firma digital y cadena de custodia completa.' },
];

const STATS = [
  { value: 100, suffix: '%', label: 'Offline', sub: 'Sin conexion a internet' },
  { value: 256, suffix: '',  label: 'AES',     sub: 'Cifrado en reposo' },
  { value: 2,   suffix: 's', label: 'Transcripcion', sub: 'Promedio por minuto de audio' },
  { value: 0,   suffix: '',  label: 'Datos salen', sub: 'Zero telemetria' },
];

const FORMATS = [
  { ext: 'MP3', type: 'Audio',  icon: 'music' },
  { ext: 'WAV', type: 'Audio',  icon: 'music' },
  { ext: 'FLAC', type: 'Audio', icon: 'music' },
  { ext: 'MP4', type: 'Video',  icon: 'film' },
  { ext: 'MOV', type: 'Video',  icon: 'film' },
];

/* ════════════════════════════════════════════════════════════════════════════
   10. MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */
function LandingLiquidGlass() {
  injectStyles();
  const { scrollY } = useScroll();
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 960));
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ── scroll ranges ── */
  const CONTAINER_H = vh * 3.5;
  const S = vh * 2.5;

  const heroOp  = useTransform(scrollY, [0, S * 0.22], [1, 0]);
  const heroY   = useTransform(scrollY, [0, S * 0.22], [0, -80]);
  const hintOp  = useTransform(scrollY, [0, S * 0.05], [1, 0]);
  const mOp     = useTransform(scrollY, [S * 0.06, S * 0.18, S * 0.82, S], [0, 1, 1, 0]);
  const mY      = useTransform(scrollY, [S * 0.06, S * 0.3], [180, 0]);
  const mScale  = useTransform(scrollY, [S * 0.06, S * 0.3], [0.94, 1]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => scrollY.on('change', (v) => setScrolled(v > 40)), [scrollY]);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Inter',sans-serif", overflowX: 'hidden' }}>
      <GridCanvas />
      <Spotlight />

      {/* ────────── HEADER ────────── */}
      <motion.header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 52px', height: 64,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        background: scrolled ? 'rgba(9,9,11,0.82)' : 'transparent',
        transition: 'background 0.5s ease, border-color 0.5s ease',
      }}>
        <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '0.18em', textTransform: 'uppercase', ...CHROME }}>Vanta</span>
        <nav style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {['Caracteristicas', 'Documentacion', 'Privacidad'].map((item) => (
            <a key={item} href="#" style={{ color: C.text3, textDecoration: 'none', fontSize: '0.73rem', letterSpacing: '0.09em', textTransform: 'uppercase', fontWeight: 500, transition: 'color 0.25s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.text3; }}
            >{item}</a>
          ))}
          <a href="#" style={{
            fontSize: '0.73rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.88)', textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.16)', borderRadius: 6, padding: '7px 18px',
            background: 'rgba(255,255,255,0.04)',
            transition: 'border-color 0.25s, background 0.25s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >Descargar</a>
        </nav>
      </motion.header>

      {/* ────────── SCROLL CONTAINER (hero + mockup) ────────── */}
      <div style={{ height: CONTAINER_H, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 10 }}>

          {/* ── HERO ── */}
          <motion.div style={{ textAlign: 'center', padding: '0 24px', marginBottom: 44, position: 'relative', zIndex: 2, opacity: heroOp, y: heroY }}>
            <div style={{ display: 'inline-block', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '5px 18px', marginBottom: 30, background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}>
              <span style={{ fontSize: '0.66rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text3, fontWeight: 600 }}>v3.0 — Ahora disponible</span>
            </div>
            <h1 style={{
              fontWeight: 800, fontSize: 'clamp(2.8rem, 6.5vw, 5.2rem)', lineHeight: 1.05,
              letterSpacing: '-0.04em', maxWidth: 860, margin: '0 auto 20px', ...CHROME,
            }}>Tu proximo analisis forense comienza aqui.</h1>
            <p style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)', color: C.text2, maxWidth: 480, margin: '0 auto 38px', lineHeight: 1.8 }}>
              Analisis forense de datos local. 100% offline. Disenado para privacidad absoluta.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
              <button style={{
                padding: '13px 30px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', color: 'rgba(255,255,255,0.92)',
                background: 'linear-gradient(135deg,rgba(255,255,255,0.09) 0%,rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(12px)',
                transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >Descargar para Windows / macOS</button>
              <button style={{
                padding: '13px 30px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: C.text2,
                background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)',
                transition: 'border-color 0.25s, color 0.25s, transform 0.15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(212,212,216,0.9)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text2; e.currentTarget.style.transform = 'translateY(0)'; }}
              >Ver Documentacion</button>
            </div>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Offline', 'IA Local', 'Cifrado AES-256'].map((f) => (
                <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: C.text3, letterSpacing: '0.04em' }}>
                  {Ico.check(C.accent)} {f}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 3, opacity: hintOp }}>
            <span style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3 }}>Scroll</span>
            <div style={{ width: 1, height: 24, background: 'linear-gradient(180deg, rgba(113,113,122,0.35) 0%, transparent 100%)', animation: 'scroll-bounce 2s ease-in-out infinite' }} />
          </motion.div>

          {/* ── MOCKUP ── */}
          <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <motion.div style={{
              width: 'min(960px, 94vw)', height: 'min(580px, 58vw)',
              scale: mScale, y: mY, opacity: mOp,
              borderRadius: 14, boxShadow: '0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.07)',
            }}>
              <MockupUI />
            </motion.div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
         FEATURES BENTO GRID
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '140px 24px 160px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <Section style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 100, padding: '4px 16px', marginBottom: 22 }}>
              <span style={{ fontSize: '0.64rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text3, fontWeight: 600 }}>Capacidades tecnicas</span>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.7rem, 3.5vw, 2.6rem)', letterSpacing: '-0.03em', maxWidth: 520, margin: '0 auto', lineHeight: 1.12, color: C.text }}>Ingenieria forense sin compromisos.</h2>
          </Section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.55, ease: EASE, delay: i * 0.07 }}
                whileHover={{ borderColor: f.accent ? 'rgba(59,130,246,0.35)' : C.borderHover, background: f.accent ? 'rgba(59,130,246,0.04)' : C.cardHover }}
                style={{
                  borderRadius: 12, padding: '28px 24px',
                  border: f.accent ? '1px solid rgba(59,130,246,0.15)' : `1px solid ${C.border}`,
                  background: f.accent ? 'rgba(59,130,246,0.03)' : C.card,
                  display: 'flex', flexDirection: 'column', gap: 12,
                  transition: 'border-color 0.3s, background 0.3s', cursor: 'default',
                }}
              >
                <div style={{ color: f.accent ? C.accent : C.text3 }}>{Ico[f.icon](f.accent ? C.accent : C.text3)}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: f.accent ? C.accentText : C.text, letterSpacing: '-0.01em' }}>{f.title}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.7, color: C.text2 }}>{f.body}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
         COMO FUNCIONA — 3 steps
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '0 24px 160px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <Section style={{ textAlign: 'center', marginBottom: 72 }}>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.7rem, 3.5vw, 2.6rem)', letterSpacing: '-0.03em', maxWidth: 520, margin: '0 auto', lineHeight: 1.12, color: C.text }}>Tres pasos. Cero complicaciones.</h2>
          </Section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, position: 'relative' }}>
            {STEPS.map((step, i) => (
              <Section key={step.num} delay={i * 0.1}>
                <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, padding: '40px 28px', height: '100%', position: 'relative' }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: 'rgba(255,255,255,0.04)', position: 'absolute', top: 20, right: 24, letterSpacing: '-0.04em', lineHeight: 1 }}>{step.num}</div>
                  <div style={{ color: C.accent, marginBottom: 20 }}>{step.icon === 'upload' && Ico.upload(C.accent)}{step.icon === 'search' && Ico.search(C.accent)}{step.icon === 'download' && Ico.download(C.accent)}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 10, letterSpacing: '-0.02em' }}>{step.title}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.75, color: C.text2 }}>{step.desc}</div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
         STATS — social proof
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '0 24px 160px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            {STATS.map((s, i) => (
              <Section key={s.label} delay={i * 0.08}>
                <div style={{ textAlign: 'center', padding: '32px 16px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.card }}>
                  <div style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 6 }}>
                    <AnimatedNumber value={s.value} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text2, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: C.text3 }}>{s.sub}</div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
         PRIVACIDAD — split layout
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '0 24px 160px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 56, alignItems: 'center' }}>
          <Section>
            <div style={{ display: 'inline-block', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 100, padding: '4px 14px', marginBottom: 20 }}>
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, fontWeight: 600 }}>Privacidad</span>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.7rem, 3.5vw, 2.5rem)', letterSpacing: '-0.03em', lineHeight: 1.12, marginBottom: 20, color: C.text }}>Disenado para la<br />privacidad absoluta.</h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: C.text2, maxWidth: 420 }}>En un mundo donde los datos sensibles viajan por servidores de terceros, Vanta toma la postura opuesta: cada byte permanece en su maquina. Sin conexiones, sin actualizaciones automaticas, sin excepciones.</p>
          </Section>
          <Section delay={0.12}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { t: 'Sin conexion a internet', d: 'La aplicacion nunca establishce comunicacion con servidores externos.' },
                { t: 'Cifrado en reposo', d: 'AES-256 en todos los proyectos. Solo usted tiene la clave.' },
                { t: 'Sin telemetria', d: 'Zero datos de uso, diagnosticos o analytics.' },
                { t: 'Auditoria completa', d: 'Cada accion registrada con hash inmutable para revision forense.' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '18px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>{Ico.check(C.accent)}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{item.t}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: C.text3 }}>{item.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
         FORMATOS
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '0 24px 160px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <Section>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.7rem, 3.5vw, 2.6rem)', letterSpacing: '-0.03em', maxWidth: 560, margin: '0 auto 16px', lineHeight: 1.12, color: C.text }}>Formatos de evidencia soportados.</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: C.text2, maxWidth: 480, margin: '0 auto 48px' }}>Compatibilidad nativa con los formatos mas utilizados en investigacion forense.</p>
          </Section>
          <Section delay={0.08}>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              {FORMATS.map((f, i) => (
                <motion.div key={f.ext}
                  initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
                  style={{ padding: '22px 28px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, minWidth: 105, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                >
                  <div style={{ color: C.text3 }}>{Ico[f.icon](C.text3)}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.06em', color: C.text }}>{f.ext}</div>
                  <div style={{ fontSize: 11, color: C.text3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{f.type}</div>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
         PROFESIONALES
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '0 24px 160px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <Section style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.7rem, 3.5vw, 2.6rem)', letterSpacing: '-0.03em', maxWidth: 560, margin: '0 auto', lineHeight: 1.12, color: C.text }}>Hecho para profesionales.</h2>
          </Section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { tag: 'Fuerzas del orden', title: 'Investigaciones que requieren sigilo total.', desc: 'Procese interrogatorios, vigilancias y grabaciones de campo sin riesgo de filtracion.', accent: C.accent },
              { tag: 'Equipos legales', title: 'Preparacion de casos con evidencia audiovisual.', desc: 'Transcriba deposiciones, genere informes con sello de tiempo y cadena de custodia verificable.', accent: '#8b5cf6' },
              { tag: 'Investigadores privados', title: 'Herramienta profesional sin suscripcion.', desc: 'Compra unica, sin costos recurrentes. Procese entrevistas y audio de campo de forma segura.', accent: '#22c55e' },
            ].map((card, i) => (
              <Section key={card.tag} delay={i * 0.08}>
                <div style={{ padding: '36px 28px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, height: '100%', transition: 'border-color 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = card.accent + '33'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
                >
                  <div style={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.12em', color: card.accent, marginBottom: 16, textTransform: 'uppercase' }}>{card.tag}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.3 }}>{card.title}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.75, color: C.text2 }}>{card.desc}</div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
         CTA FINAL
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '0 24px 160px' }}>
        <Section>
          <div style={{
            maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: '80px 40px',
            borderRadius: 16, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.015)',
          }}>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: 20, color: C.text }}>Su evidencia merece<br />la mejor herramienta.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: C.text2, maxWidth: 440, margin: '0 auto 36px' }}>Descargue Vanta hoy. Sin suscripcion, sin nube, sin compromisos de privacidad.</p>
            <button style={{
              padding: '15px 40px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', color: 'rgba(255,255,255,0.92)',
              background: 'linear-gradient(135deg,rgba(255,255,255,0.10) 0%,rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(12px)',
              transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >Descargar Vanta</button>
            <div style={{ marginTop: 16, fontSize: '0.7rem', color: C.text3, letterSpacing: '0.06em' }}>Sin tarjeta de credito. Compra unica.</div>
          </div>
        </Section>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
         FOOTER
         ════════════════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '60px 52px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text, marginBottom: 12 }}>VANTA</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: C.text3, maxWidth: 280 }}>Software de analisis forense local. Privacidad por diseno.</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 16 }}>Producto</div>
              {['Caracteristicas', 'Descargar', 'Changelog'].map((l) => (
                <div key={l} style={{ fontSize: 13, color: C.text2, marginBottom: 10, cursor: 'default', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.text2; }}
                >{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 16 }}>Recursos</div>
              {['Documentacion', 'Privacidad', 'Seguridad'].map((l) => (
                <div key={l} style={{ fontSize: 13, color: C.text2, marginBottom: 10, cursor: 'default', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.text2; }}
                >{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 16 }}>Legal</div>
              {['Terminos', 'Licencia'].map((l) => (
                <div key={l} style={{ fontSize: 13, color: C.text2, marginBottom: 10, cursor: 'default', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.text2; }}
                >{l}</div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: '0.7rem', color: C.text3, letterSpacing: '0.06em' }}>&copy; 2024 Vanta. Todos los derechos reservados.</span>
            <span style={{ fontSize: '0.7rem', color: C.text3, letterSpacing: '0.06em' }}>Hecho con discrecion.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingLiquidGlass;
