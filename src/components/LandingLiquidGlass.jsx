import { useRef, useEffect, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from 'framer-motion';

// ---------------------------------------------------------------------------
// Coordinate grid background rendered on a canvas for performance
// ---------------------------------------------------------------------------
function GridCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const CELL = 40;

    function draw() {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(63,63,70,0.18)';
      ctx.lineWidth = 0.5;

      for (let x = 0; x <= canvas.width; x += CELL) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += CELL) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Cursor spotlight — radial gradient that follows the mouse
// ---------------------------------------------------------------------------
function Spotlight() {
  const rawX = useMotionValue(-800);
  const rawY = useMotionValue(-800);
  const x = useSpring(rawX, { stiffness: 120, damping: 28, mass: 0.6 });
  const y = useSpring(rawY, { stiffness: 120, damping: 28, mass: 0.6 });

  useEffect(() => {
    function onMove(e) {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    }
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [rawX, rawY]);

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(59,130,246,0.07) 0%, rgba(59,130,246,0.03) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1,
        translateX: x,
        translateY: y,
        x: '-50%',
        y: '-50%',
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Simulated waveform bars inside the mockup
// ---------------------------------------------------------------------------
function Waveform() {
  const bars = Array.from({ length: 48 }, (_, i) => {
    const h = 6 + Math.abs(Math.sin(i * 0.52 + 1.3) * 38) + Math.abs(Math.sin(i * 0.21) * 18);
    return h;
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: 64,
      }}
    >
      {bars.map((h, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0.3 }}
          animate={{ scaleY: [0.3, 1, 0.5, 0.85, 0.3] }}
          transition={{
            duration: 2.4 + (i % 5) * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.04,
          }}
          style={{
            width: 2,
            height: h,
            borderRadius: 1,
            background: `rgba(59,130,246,${0.55 + (i % 3) * 0.15})`,
            transformOrigin: 'center',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// App mockup inner UI
// ---------------------------------------------------------------------------
function MockupUI() {
  const sideItems = [
    { label: 'Casos Activos', active: true },
    { label: 'Evidencias', active: false },
    { label: 'Transcripciones', active: false },
    { label: 'Informes', active: false },
    { label: 'Configuracion', active: false },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#0a0a0a',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          background: '#060606',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
          gap: 2,
        }}
      >
        {/* Logo area */}
        <div
          style={{
            padding: '0 16px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 700,
            }}
          >
            Vanta
          </div>
          <div
            style={{
              fontSize: 9,
              color: 'rgba(113,113,122,0.7)',
              marginTop: 3,
              letterSpacing: '0.06em',
            }}
          >
            v2.4.1 — offline
          </div>
        </div>

        {sideItems.map((item) => (
          <div
            key={item.label}
            style={{
              padding: '7px 16px',
              fontSize: 10.5,
              fontWeight: item.active ? 600 : 400,
              color: item.active ? 'rgba(255,255,255,0.92)' : 'rgba(113,113,122,0.7)',
              background: item.active ? 'rgba(255,255,255,0.06)' : 'transparent',
              borderLeft: item.active
                ? '2px solid rgba(255,255,255,0.75)'
                : '2px solid transparent',
              letterSpacing: '0.04em',
              cursor: 'default',
            }}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 20,
          gap: 16,
          overflow: 'hidden',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em' }}>
            Caso #2024-0471
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 6px rgba(34,197,94,0.8)',
              }}
            />
            <span style={{ fontSize: 9, color: 'rgba(113,113,122,0.8)', letterSpacing: '0.08em' }}>
              MODO OFFLINE
            </span>
          </div>
        </div>

        {/* Drop zone */}
        <div
          style={{
            border: '1px dashed rgba(255,255,255,0.14)',
            borderRadius: 8,
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.015)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v8M3 6l4-4 4 4" stroke="rgba(212,212,216,0.7)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 11h12" stroke="rgba(212,212,216,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 9.5, color: 'rgba(113,113,122,0.8)', letterSpacing: '0.05em', textAlign: 'center' }}>
            Arrastre archivos de evidencia aqui
          </div>
          <div style={{ fontSize: 8.5, color: 'rgba(63,63,70,0.9)', letterSpacing: '0.04em' }}>
            MP3, MP4, WAV, MOV — hasta 8 GB
          </div>
        </div>

        {/* Waveform section */}
        <div
          style={{
            borderRadius: 8,
            border: '1px solid rgba(59,130,246,0.12)',
            background: 'rgba(59,130,246,0.03)',
            padding: '12px 16px',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 8.5, color: 'rgba(113,113,122,0.7)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 10 }}>
            Forma de onda — interrogatorio_0041.wav
          </div>
          <Waveform />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 8, color: 'rgba(63,63,70,0.9)' }}>00:00:00</span>
            <span style={{ fontSize: 8, color: 'rgba(59,130,246,0.8)' }}>REPRODUCIENDO</span>
            <span style={{ fontSize: 8, color: 'rgba(63,63,70,0.9)' }}>01:24:38</span>
          </div>
        </div>

        {/* Transcript lines */}
        <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { t: '00:00:14', s: 'Agente', txt: 'Por favor, indique su nombre completo para el registro.' },
            { t: '00:00:22', s: 'Testigo', txt: 'Mi nombre es Carlos Ramirez Vega.' },
            { t: '00:00:31', s: 'Agente', txt: 'Confirme la fecha y lugar de los hechos.' },
            { t: '00:00:48', s: 'Testigo', txt: 'El dieciseis de marzo, en la calle Constitucion 204.' },
          ].map((line, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                padding: '6px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <span style={{ fontSize: 8, color: 'rgba(63,63,70,0.9)', flexShrink: 0, width: 52 }}>{line.t}</span>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: line.s === 'Agente' ? 'rgba(212,212,216,0.7)' : 'rgba(59,130,246,0.8)',
                  flexShrink: 0,
                  width: 52,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {line.s}
              </span>
              <span style={{ fontSize: 8.5, color: 'rgba(161,161,170,0.75)', lineHeight: 1.5 }}>{line.txt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bento feature cards
// ---------------------------------------------------------------------------
const FEATURES = [
  {
    title: '100% Offline',
    body: 'Ninguna evidencia abandona el perimetro de la maquina. Sin nube, sin telemetria, sin servidores de terceros.',
    accent: false,
  },
  {
    title: 'Transcripcion Local con IA',
    body: 'Motor Whisper embebido de alta precision. Procesamiento en CPU/GPU local sin dependencias externas.',
    accent: true,
  },
  {
    title: 'Cadena de Custodia Digital',
    body: 'Hashing SHA-256 automatico de cada archivo ingestado. Registro forense inmutable e inalterable.',
    accent: false,
  },
  {
    title: 'Formatos de Evidencia',
    body: 'Compatibilidad nativa con MP3, MP4, WAV, MOV, FLAC y formatos de intercambio judicial estandar.',
    accent: false,
  },
  {
    title: 'Informes Exportables',
    body: 'Generacion de documentos PDF y DOCX con sello de tiempo y firma digital lista para presentacion judicial.',
    accent: false,
  },
  {
    title: 'Cifrado AES-256',
    body: 'Todos los proyectos se almacenan cifrados en reposo. Acceso protegido por contrasena maestra.',
    accent: false,
  },
];

function FeatureCard({ title, body, accent, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 }}
      style={{
        borderRadius: 8,
        border: accent
          ? '1px solid rgba(59,130,246,0.28)'
          : '1px solid rgba(255,255,255,0.07)',
        background: accent
          ? 'rgba(59,130,246,0.05)'
          : 'rgba(255,255,255,0.025)',
        padding: '24px 22px',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: accent ? 'rgba(147,197,253,0.92)' : 'rgba(255,255,255,0.88)',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.65,
          color: 'rgba(113,113,122,0.85)',
          fontWeight: 400,
        }}
      >
        {body}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main landing page component
// ---------------------------------------------------------------------------
// Scroll range: the sticky zone spans 1.2 * window height (220vh total, ~120vh of active animation)
const SCROLL_END = typeof window !== 'undefined' ? window.innerHeight * 1.2 : 960;

function LandingLiquidGlass() {
  const { scrollY } = useScroll();

  // All transforms derived directly from scrollY absolute pixel values
  const scale      = useTransform(scrollY, [0, SCROLL_END * 0.5], [0.78, 1.0]);
  const rotateX    = useTransform(scrollY, [0, SCROLL_END * 0.5], [14, 0]);
  const rotateY    = useTransform(scrollY, [0, SCROLL_END * 0.5], [-9, 0]);
  const translateY = useTransform(scrollY, [0, SCROLL_END * 0.5], [140, 0]);
  const opacity    = useTransform(scrollY, [0, SCROLL_END * 0.1], [0.7, 1]);
  const cardsOpacity = useTransform(scrollY, [SCROLL_END * 0.45, SCROLL_END * 0.65], [0, 1]);

  // Nav background on scroll
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const unsub = scrollY.on('change', (v) => setScrolled(v > 12));
    return unsub;
  }, [scrollY]);

  return (
    <div
      style={{
        background: '#030303',
        minHeight: '100vh',
        color: '#fff',
        fontFamily: "'Inter', sans-serif",
        overflowX: 'hidden',
      }}
    >
      <GridCanvas />
      <Spotlight />

      {/* Fixed navigation */}
      <motion.header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 52px',
          height: 60,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: scrolled
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid transparent',
          background: scrolled ? 'rgba(3,3,3,0.75)' : 'transparent',
          transition: 'background 0.4s ease, border-color 0.4s ease',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: '0.88rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            background: 'linear-gradient(90deg,#a1a1aa 0%,#ffffff 50%,#a1a1aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Vanta
        </span>
        <nav style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {['Caracteristicas', 'Documentacion', 'Privacidad'].map((item) => (
            <a
              key={item}
              href="#"
              style={{
                color: 'rgba(113,113,122,0.80)',
                textDecoration: 'none',
                fontSize: '0.75rem',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                fontWeight: 500,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.90)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(113,113,122,0.80)'; }}
            >
              {item}
            </a>
          ))}
          <a
            href="#"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.88)',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 4,
              padding: '6px 16px',
              transition: 'border-color 0.2s ease, background 0.2s ease',
              background: 'rgba(255,255,255,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
          >
            Descargar
          </a>
        </nav>
      </motion.header>

      {/* Scroll container — defines the scroll length */}
      <div
        style={{ height: '220vh', position: 'relative' }}
      >
        {/* Sticky section that pins while scrolling */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          {/* Hero text */}
          <motion.div
            style={{
              textAlign: 'center',
              padding: '0 24px',
              marginBottom: 52,
              position: 'relative',
              zIndex: 2,
            }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            {/* Classification pill */}
            <div
              style={{
                display: 'inline-block',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 100,
                padding: '5px 18px',
                marginBottom: 28,
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span
                style={{
                  fontSize: '0.68rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(161,161,170,0.75)',
                  fontWeight: 600,
                }}
              >
                Analisis forense digital de nueva generacion
              </span>
            </div>

            <h1
              style={{
                fontWeight: 800,
                fontSize: 'clamp(2.6rem, 6vw, 5rem)',
                lineHeight: 1.06,
                letterSpacing: '-0.035em',
                maxWidth: 780,
                margin: '0 auto 22px',
                background:
                  'linear-gradient(180deg, #ffffff 0%, #f4f4f5 30%, #a1a1aa 75%, #71717a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Tu proximo analisis forense comienza aqui.
            </h1>

            <p
              style={{
                fontSize: 'clamp(0.9rem, 1.4vw, 1.05rem)',
                color: 'rgba(113,113,122,0.85)',
                maxWidth: 460,
                margin: '0 auto 38px',
                lineHeight: 1.75,
                fontWeight: 400,
              }}
            >
              Forense de datos local. 100% offline. Diseñado para privacidad absoluta.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                style={{
                  padding: '11px 26px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.35)',
                  background:
                    'linear-gradient(135deg,rgba(255,255,255,0.09) 0%,rgba(255,255,255,0.03) 100%)',
                  color: 'rgba(255,255,255,0.92)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(12px)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.70)';
                  e.currentTarget.style.boxShadow = '0 0 22px rgba(255,255,255,0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Descargar para Windows / macOS
              </button>
              <button
                style={{
                  padding: '11px 26px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(113,113,122,0.85)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'border-color 0.2s ease, color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
                  e.currentTarget.style.color = 'rgba(212,212,216,0.90)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(113,113,122,0.85)';
                }}
              >
                Ver Documentacion
              </button>
            </div>
          </motion.div>

          {/* 3D Mockup — scroll-driven transforms */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              perspective: '1200px',
              perspectiveOrigin: '50% 40%',
            }}
          >
            <motion.div
              style={{
                width: 'min(820px, 90vw)',
                height: 'min(500px, 55vw)',
                scale,
                rotateX,
                rotateY,
                y: translateY,
                opacity,
                transformStyle: 'preserve-3d',
                borderRadius: 12,
                boxShadow: '0 40px 120px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07)',
              }}
            >
              <MockupUI />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Feature bento grid — appears after mockup is flat */}
      <motion.section
        style={{ opacity: cardsOpacity }}
        transition={{ duration: 0.6 }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            padding: '80px 24px 120px',
          }}
        >
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <div
              style={{
                display: 'inline-block',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 100,
                padding: '4px 16px',
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontSize: '0.66rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(113,113,122,0.75)',
                  fontWeight: 600,
                }}
              >
                Capacidades tecnicas
              </span>
            </div>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                letterSpacing: '-0.025em',
                background:
                  'linear-gradient(180deg,#ffffff 0%,#71717a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                maxWidth: 560,
                margin: '0 auto',
                lineHeight: 1.12,
              }}
            >
              Ingeneria forense sin compromisos.
            </h2>
          </motion.div>

          {/* Bento grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {FEATURES.map((feat, i) => (
              <FeatureCard key={feat.title} {...feat} index={i} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '28px 52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: '0.70rem',
            color: 'rgba(63,63,70,0.9)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Vanta &mdash; Software forense local. Privacidad por diseno.
        </span>
        <span
          style={{
            fontSize: '0.70rem',
            color: 'rgba(63,63,70,0.9)',
            letterSpacing: '0.06em',
          }}
        >
          Todos los derechos reservados.
        </span>
      </footer>
    </div>
  );
}

export default LandingLiquidGlass;
