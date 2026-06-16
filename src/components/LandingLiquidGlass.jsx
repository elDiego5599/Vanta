import { useRef, useEffect, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from 'framer-motion';

/* ────────────────────────────────────────────────────────────────────────────
   Injected keyframe animations
   ──────────────────────────────────────────────────────────────────────────── */
const STYLE_TAG = `
  @keyframes chrome-sweep {
    0%, 100% { background-position: 0% center; }
    50%      { background-position: 200% center; }
  }
  @keyframes chrome-sweep-reverse {
    0%, 100% { background-position: 200% center; }
    50%      { background-position: 0% center; }
  }
  @keyframes scroll-hint {
    0%, 100% { opacity: 0.4; transform: translateY(0); }
    50%      { opacity: 0.9; transform: translateY(8px); }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.0); }
    50%      { box-shadow: 0 0 30px rgba(59,130,246,0.15); }
  }
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('vanta-landing-styles')) return;
  const s = document.createElement('style');
  s.id = 'vanta-landing-styles';
  s.textContent = STYLE_TAG;
  document.head.appendChild(s);
}

/* ────────────────────────────────────────────────────────────────────────────
   Chrome text style helper
   ──────────────────────────────────────────────────────────────────────────── */
const CHROME_STYLE = {
  background:
    'linear-gradient(90deg, #52525b 0%, #71717a 18%, #a1a1aa 33%, #d4d4d8 47%, #ffffff 50%, #d4d4d8 53%, #a1a1aa 67%, #71717a 82%, #52525b 100%)',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  animation: 'chrome-sweep 6s ease-in-out infinite',
};

const CHROME_STYLE_SLOW = {
  ...CHROME_STYLE,
  animation: 'chrome-sweep-reverse 8s ease-in-out infinite',
};

/* ════════════════════════════════════════════════════════════════════════════
   GridCanvas — coordinate grid with animated colour wave
   ════════════════════════════════════════════════════════════════════════════ */
function GridCanvas() {
  const ref = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const CELL = 40;
    let lastTime = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(
        document.documentElement.scrollHeight,
        window.innerHeight
      );
    }

    function draw(timestamp) {
      if (timestamp - lastTime < 33) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      lastTime = timestamp;

      const t = timestamp * 0.001;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      /* Wave moves diagonally in a slow figure-eight */
      const waveX = (Math.sin(t * 0.18) * 0.45 + 0.5) * W;
      const waveY = (Math.cos(t * 0.13) * 0.45 + 0.5) * H;
      const WAVE_R = 350;
      const WAVE_R2 = WAVE_R * WAVE_R;

      /* --- horizontal lines -------------------------------------------- */
      for (let y = 0; y <= H; y += CELL) {
        const dy = y - waveY;
        const raw = Math.max(0, 1 - (dy * dy) / WAVE_R2);
        const intensity = raw * raw * (3 - 2 * raw);

        const alpha = (0.09 + intensity * 0.18).toFixed(3);
        const blue = Math.round(70 + intensity * 50);

        ctx.strokeStyle = `rgba(80,80,${blue},${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      /* --- vertical lines ---------------------------------------------- */
      for (let x = 0; x <= W; x += CELL) {
        const dx = x - waveX;
        const raw = Math.max(0, 1 - (dx * dx) / WAVE_R2);
        const intensity = raw * raw * (3 - 2 * raw);

        const alpha = (0.09 + intensity * 0.18).toFixed(3);
        const blue = Math.round(70 + intensity * 50);

        ctx.strokeStyle = `rgba(80,80,${blue},${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    resize();
    animRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
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

/* ════════════════════════════════════════════════════════════════════════════
   Spotlight — radial gradient that follows the cursor
   ════════════════════════════════════════════════════════════════════════════ */
function Spotlight() {
  const rawX = useMotionValue(-800);
  const rawY = useMotionValue(-800);
  const x = useSpring(rawX, { stiffness: 100, damping: 24, mass: 0.8 });
  const y = useSpring(rawY, { stiffness: 100, damping: 24, mass: 0.8 });

  useEffect(() => {
    const onMove = (e) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [rawX, rawY]);

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 700,
        height: 700,
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.025) 40%, transparent 70%)',
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

/* ════════════════════════════════════════════════════════════════════════════
   Waveform — simulated audio waveform bars
   ════════════════════════════════════════════════════════════════════════════ */
function Waveform() {
  const bars = Array.from({ length: 52 }, (_, i) => {
    const h =
      6 +
      Math.abs(Math.sin(i * 0.52 + 1.3) * 40) +
      Math.abs(Math.sin(i * 0.21) * 18);
    return h;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 60 }}>
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
            background: `rgba(59,130,246,${0.5 + (i % 3) * 0.15})`,
            transformOrigin: 'center',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MockupUI — inner application mockup
   ════════════════════════════════════════════════════════════════════════════ */
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
          width: 190,
          flexShrink: 0,
          background: '#060606',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
          gap: 2,
        }}
      >
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
              color: item.active
                ? 'rgba(255,255,255,0.92)'
                : 'rgba(113,113,122,0.7)',
              background: item.active
                ? 'rgba(255,255,255,0.06)'
                : 'transparent',
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
          gap: 14,
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
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.88)',
              letterSpacing: '-0.01em',
            }}
          >
            Caso #2024-0471
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 6px rgba(34,197,94,0.8)',
              }}
            />
            <span
              style={{
                fontSize: 9,
                color: 'rgba(113,113,122,0.8)',
                letterSpacing: '0.08em',
              }}
            >
              MODO OFFLINE
            </span>
          </div>
        </div>

        {/* Drop zone */}
        <div
          style={{
            border: '1px dashed rgba(255,255,255,0.14)',
            borderRadius: 8,
            padding: '16px 20px',
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
              <path
                d="M7 2v8M3 6l4-4 4 4"
                stroke="rgba(212,212,216,0.7)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1 11h12"
                stroke="rgba(212,212,216,0.4)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: 'rgba(113,113,122,0.8)',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}
          >
            Arrastre archivos de evidencia aqui
          </div>
          <div
            style={{
              fontSize: 8.5,
              color: 'rgba(63,63,70,0.9)',
              letterSpacing: '0.04em',
            }}
          >
            MP3, MP4, WAV, MOV — hasta 8 GB
          </div>
        </div>

        {/* Waveform section */}
        <div
          style={{
            borderRadius: 8,
            border: '1px solid rgba(59,130,246,0.12)',
            background: 'rgba(59,130,246,0.03)',
            padding: '10px 14px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 8.5,
              color: 'rgba(113,113,122,0.7)',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Forma de onda — interrogatorio_0041.wav
          </div>
          <Waveform />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
            }}
          >
            <span style={{ fontSize: 8, color: 'rgba(63,63,70,0.9)' }}>
              00:00:00
            </span>
            <span style={{ fontSize: 8, color: 'rgba(59,130,246,0.8)' }}>
              REPRODUCIENDO
            </span>
            <span style={{ fontSize: 8, color: 'rgba(63,63,70,0.9)' }}>
              01:24:38
            </span>
          </div>
        </div>

        {/* Transcript lines */}
        <div
          style={{
            flex: 1,
            overflowY: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          {[
            {
              t: '00:00:14',
              s: 'Agente',
              txt: 'Por favor, indique su nombre completo para el registro.',
            },
            {
              t: '00:00:22',
              s: 'Testigo',
              txt: 'Mi nombre es Carlos Ramirez Vega.',
            },
            {
              t: '00:00:31',
              s: 'Agente',
              txt: 'Confirme la fecha y lugar de los hechos.',
            },
            {
              t: '00:00:48',
              s: 'Testigo',
              txt: 'El dieciseis de marzo, en la calle Constitucion 204.',
            },
          ].map((line, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                padding: '5px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <span
                style={{
                  fontSize: 8,
                  color: 'rgba(63,63,70,0.9)',
                  flexShrink: 0,
                  width: 48,
                }}
              >
                {line.t}
              </span>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color:
                    line.s === 'Agente'
                      ? 'rgba(212,212,216,0.7)'
                      : 'rgba(59,130,246,0.8)',
                  flexShrink: 0,
                  width: 48,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {line.s}
              </span>
              <span
                style={{
                  fontSize: 8.5,
                  color: 'rgba(161,161,170,0.75)',
                  lineHeight: 1.5,
                }}
              >
                {line.txt}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FeatureCard — bento feature card
   ════════════════════════════════════════════════════════════════════════════ */
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
    accent: true,
  },
];

function FeatureCard({ title, body, accent, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.08,
      }}
      style={{
        borderRadius: 10,
        border: accent
          ? '1px solid rgba(59,130,246,0.25)'
          : '1px solid rgba(255,255,255,0.07)',
        background: accent
          ? 'rgba(59,130,246,0.04)'
          : 'rgba(255,255,255,0.02)',
        padding: '26px 24px',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}
      whileHover={{
        borderColor: accent
          ? 'rgba(59,130,246,0.45)'
          : 'rgba(255,255,255,0.18)',
        boxShadow: accent
          ? '0 0 30px rgba(59,130,246,0.08)'
          : '0 0 30px rgba(255,255,255,0.03)',
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: accent
            ? 'rgba(147,197,253,0.92)'
            : 'rgba(255,255,255,0.88)',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.7,
          color: 'rgba(113,113,122,0.85)',
          fontWeight: 400,
        }}
      >
        {body}
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Section wrapper — fades in on scroll
   ════════════════════════════════════════════════════════════════════════════ */
function Section({ children, style, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
        delay,
      }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Main landing component
   ════════════════════════════════════════════════════════════════════════════ */
function LandingLiquidGlass() {
  injectStyles();

  const { scrollY } = useScroll();
  const [vh, setVh] = useState(
    () => (typeof window !== 'undefined' ? window.innerHeight : 960)
  );

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ---- scroll ranges -------------------------------------------------- */
  const STICKY_H = vh * 2.2;   // total scroll container height
  const SCROLL = vh * 1.2;     // scroll distance within the sticky zone

  // Hero fades out early
  const heroOpacity = useTransform(scrollY, [0, SCROLL * 0.3], [1, 0]);
  const heroY = useTransform(scrollY, [0, SCROLL * 0.3], [0, -60]);

  // Mockup — visible from start, animates dramatically
  const mScale = useTransform(scrollY, [0, SCROLL * 0.65], [0.6, 1.0]);
  const mRotateX = useTransform(scrollY, [0, SCROLL * 0.65], [22, 0]);
  const mRotateY = useTransform(scrollY, [0, SCROLL * 0.65], [-10, 0]);
  const mY = useTransform(scrollY, [0, SCROLL * 0.65], [160, 0]);
  const mOpacity = useTransform(scrollY, [0, SCROLL * 0.1], [0.3, 1]);

  // Scroll hint
  const hintOpacity = useTransform(scrollY, [0, SCROLL * 0.06], [1, 0]);

  // Nav
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    return scrollY.on('change', (v) => setScrolled(v > 40));
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

      {/* ──────────── Fixed header ──────────── */}
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
          height: 64,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid transparent',
          background: scrolled ? 'rgba(3,3,3,0.8)' : 'transparent',
          transition: 'background 0.5s ease, border-color 0.5s ease',
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: '1.15rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            ...CHROME_STYLE,
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
                transition: 'color 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.92)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(113,113,122,0.80)';
              }}
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
              borderRadius: 6,
              padding: '7px 18px',
              transition: 'border-color 0.25s ease, background 0.25s ease',
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

      {/* ──────────── Scroll container ──────────── */}
      <div style={{ height: STICKY_H, position: 'relative' }}>
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
          {/* ── Hero text ── */}
          <motion.div
            style={{
              textAlign: 'center',
              padding: '0 24px',
              marginBottom: 48,
              position: 'relative',
              zIndex: 2,
              opacity: heroOpacity,
              y: heroY,
            }}
          >
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
                fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                maxWidth: 820,
                margin: '0 auto 24px',
                ...CHROME_STYLE,
              }}
            >
              Tu proximo analisis forense comienza aqui.
            </h1>

            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
                color: 'rgba(113,113,122,0.85)',
                maxWidth: 480,
                margin: '0 auto 40px',
                lineHeight: 1.8,
                fontWeight: 400,
              }}
            >
              Forense de datos local. 100% offline. Disenado para privacidad
              absoluta.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 14,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                style={{
                  padding: '12px 28px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.35)',
                  background:
                    'linear-gradient(135deg,rgba(255,255,255,0.10) 0%,rgba(255,255,255,0.03) 100%)',
                  color: 'rgba(255,255,255,0.92)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(12px)',
                  transition:
                    'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.70)';
                  e.currentTarget.style.boxShadow =
                    '0 0 30px rgba(255,255,255,0.10)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Descargar para Windows / macOS
              </button>
              <button
                style={{
                  padding: '12px 28px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(113,113,122,0.85)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition:
                    'border-color 0.25s ease, color 0.25s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
                  e.currentTarget.style.color = 'rgba(212,212,216,0.90)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(113,113,122,0.85)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Ver Documentacion
              </button>
            </div>
          </motion.div>

          {/* ── Scroll hint ── */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              zIndex: 3,
              opacity: hintOpacity,
            }}
          >
            <span
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(113,113,122,0.5)',
              }}
            >
              Scroll
            </span>
            <div
              style={{
                width: 1,
                height: 28,
                background:
                  'linear-gradient(180deg, rgba(113,113,122,0.4) 0%, transparent 100%)',
                animation: 'scroll-hint 2s ease-in-out infinite',
              }}
            />
          </motion.div>

          {/* ── 3D Mockup ── */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              perspective: '1400px',
              perspectiveOrigin: '50% 40%',
            }}
          >
            <motion.div
              style={{
                width: 'min(860px, 90vw)',
                height: 'min(520px, 55vw)',
                scale: mScale,
                rotateX: mRotateX,
                rotateY: mRotateY,
                y: mY,
                opacity: mOpacity,
                transformStyle: 'preserve-3d',
                borderRadius: 14,
                boxShadow:
                  '0 50px 140px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07)',
              }}
            >
              <MockupUI />
            </motion.div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
         Features bento grid
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10 }}>
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            padding: '100px 24px 120px',
          }}
        >
          <Section style={{ textAlign: 'center', marginBottom: 60 }}>
            <div
              style={{
                display: 'inline-block',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 100,
                padding: '4px 16px',
                marginBottom: 22,
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
                letterSpacing: '-0.03em',
                maxWidth: 580,
                margin: '0 auto',
                lineHeight: 1.12,
                ...CHROME_STYLE_SLOW,
              }}
            >
              Ingenieria forense sin compromisos.
            </h2>
          </Section>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: 16,
            }}
          >
            {FEATURES.map((feat, i) => (
              <FeatureCard key={feat.title} {...feat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
         Como Funciona — 3 steps
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10 }}>
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            padding: '80px 24px 120px',
          }}
        >
          <Section style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                letterSpacing: '-0.03em',
                maxWidth: 520,
                margin: '0 auto',
                lineHeight: 1.12,
                ...CHROME_STYLE,
              }}
            >
              Tres pasos. Cero complicaciones.
            </h2>
          </Section>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 24,
            }}
          >
            {[
              {
                step: '01',
                title: 'Importar',
                desc: 'Arrastre archivos de audio o video directamente a la aplicacion. Soporta MP3, MP4, WAV, MOV y FLAC. El hashing SHA-256 se ejecuta automaticamente al momento de la ingesta.',
              },
              {
                step: '02',
                title: 'Analizar',
                desc: 'El motor de IA local transcribe cada archivo con precision profesional. Diarizacion de hablantes, marcas de tiempo y busqueda de texto completo en segundos.',
              },
              {
                step: '03',
                title: 'Exportar',
                desc: 'Genere informes PDF o DOCX con sello de tiempo, firma digital y cadena de custodia completa. Listo para presentacion ante cualquier autoridad judicial.',
              },
            ].map((item, i) => (
              <Section key={item.step} delay={i * 0.1}>
                <div
                  style={{
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '36px 28px',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: 'rgba(59,130,246,0.7)',
                      marginBottom: 16,
                    }}
                  >
                    PASO {item.step}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.9)',
                      marginBottom: 12,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: 'rgba(113,113,122,0.85)',
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
         Privacidad Total
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10 }}>
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            padding: '80px 24px 120px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 48,
              alignItems: 'center',
            }}
          >
            <Section>
              <div
                style={{
                  display: 'inline-block',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 100,
                  padding: '4px 14px',
                  marginBottom: 20,
                }}
              >
                <span
                  style={{
                    fontSize: '0.64rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(113,113,122,0.7)',
                    fontWeight: 600,
                  }}
                >
                  Privacidad
                </span>
              </div>
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.12,
                  marginBottom: 20,
                  ...CHROME_STYLE_SLOW,
                }}
              >
                Disenado para la
                <br />
                privacidad absoluta.
              </h2>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: 'rgba(113,113,122,0.85)',
                  maxWidth: 420,
                }}
              >
                En un mundo donde los datos sensibles viajan por servidores de
                terceros, Vanta toma la postura opuesta: cada byte permanece en
                su maquina. Sin conexiones a internet, sin actualizaciones
                automaticas, sin excepciones.
              </p>
            </Section>

            <Section delay={0.15}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  {
                    label: 'Sin conexion a internet',
                    detail:
                      'La aplicacion nunca establishce comunicacion con servidores externos.',
                  },
                  {
                    label: 'Cifrado en reposo',
                    detail:
                      'Todos los proyectos se almacenan con AES-256. Solo usted tiene la clave.',
                  },
                  {
                    label: 'Sin telemetria',
                    detail:
                      'Zero datos de uso, diagnosticos o analytics. No hay nada que enviar.',
                  },
                  {
                    label: 'Auditoria completa',
                    detail:
                      'Cada accion queda registrada con hash inmutable para revision forense.',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '18px 20px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.88)',
                        marginBottom: 4,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        lineHeight: 1.6,
                        color: 'rgba(113,113,122,0.8)',
                      }}
                    >
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
         Formatos de evidencia
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10 }}>
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            padding: '80px 24px 120px',
            textAlign: 'center',
          }}
        >
          <Section>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                letterSpacing: '-0.03em',
                maxWidth: 600,
                margin: '0 auto 16px',
                lineHeight: 1.12,
                ...CHROME_STYLE,
              }}
            >
              Formatos de evidencia soportados.
            </h2>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                color: 'rgba(113,113,122,0.8)',
                maxWidth: 520,
                margin: '0 auto 48px',
              }}
            >
              Compatibilidad nativa con los formatos mas utilizados en entornos
              judiciales y de investigacion forense.
            </p>
          </Section>

          <Section delay={0.1}>
            <div
              style={{
                display: 'flex',
                gap: 14,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {[
                { ext: 'MP3', type: 'Audio' },
                { ext: 'WAV', type: 'Audio' },
                { ext: 'FLAC', type: 'Audio' },
                { ext: 'MP4', type: 'Video' },
                { ext: 'MOV', type: 'Video' },
              ].map((fmt, i) => (
                <motion.div
                  key={fmt.ext}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    padding: '20px 28px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.025)',
                    minWidth: 100,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      color: 'rgba(255,255,255,0.9)',
                      marginBottom: 4,
                    }}
                  >
                    {fmt.ext}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(113,113,122,0.65)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {fmt.type}
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
         Para profesionales
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10 }}>
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            padding: '80px 24px 120px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            <Section>
              <div
                style={{
                  padding: '36px 28px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.02)',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: 'rgba(59,130,246,0.7)',
                    marginBottom: 16,
                    textTransform: 'uppercase',
                  }}
                >
                  Fuerzas del orden
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: 10,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Investigaciones que requieren sigilo total.
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.75,
                    color: 'rgba(113,113,122,0.85)',
                  }}
                >
                  Procese interrogatorios, vigilancias y grabaciones de campo
                  sin riesgo de filtracion. Todo queda dentro de su
                  institucion.
                </div>
              </div>
            </Section>

            <Section delay={0.08}>
              <div
                style={{
                  padding: '36px 28px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.02)',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: 'rgba(59,130,246,0.7)',
                    marginBottom: 16,
                    textTransform: 'uppercase',
                  }}
                >
                  Equipos legales
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: 10,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Preparacion de casos con evidencia audiovisual.
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.75,
                    color: 'rgba(113,113,122,0.85)',
                  }}
                >
                  Transcriba deposiciones, generen informes con sello de tiempo
                  y presenten evidencia con cadena de custodia verificable.
                </div>
              </div>
            </Section>

            <Section delay={0.16}>
              <div
                style={{
                  padding: '36px 28px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.02)',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: 'rgba(59,130,246,0.7)',
                    marginBottom: 16,
                    textTransform: 'uppercase',
                  }}
                >
                  Investigadores privados
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: 10,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Herramienta profesional sin suscripcion.
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.75,
                    color: 'rgba(113,113,122,0.85)',
                  }}
                >
                  Compra unica, sin costos recurrentes. Procese entrevistas,
                  grabaciones encubiertas y audio de campo de forma segura.
                </div>
              </div>
            </Section>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
         CTA final
         ════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10 }}>
        <div
          style={{
            maxWidth: 700,
            margin: '0 auto',
            padding: '80px 24px 120px',
            textAlign: 'center',
          }}
        >
          <Section>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
                marginBottom: 20,
                ...CHROME_STYLE,
              }}
            >
              Su evidencia merece
              <br />
              la mejor herramienta.
            </h2>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.75,
                color: 'rgba(113,113,122,0.8)',
                maxWidth: 440,
                margin: '0 auto 36px',
              }}
            >
              Descargue Vanta hoy. Sin suscripcion, sin nube, sin compromisos
              de privacidad.
            </p>
            <button
              style={{
                padding: '14px 36px',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.35)',
                background:
                  'linear-gradient(135deg,rgba(255,255,255,0.10) 0%,rgba(255,255,255,0.03) 100%)',
                color: 'rgba(255,255,255,0.92)',
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                transition:
                  'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.70)';
                e.currentTarget.style.boxShadow =
                  '0 0 40px rgba(255,255,255,0.10)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Descargar Vanta
            </button>
          </Section>
        </div>
      </section>

      {/* ──────────── Footer ──────────── */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '28px 52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          position: 'relative',
          zIndex: 10,
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
