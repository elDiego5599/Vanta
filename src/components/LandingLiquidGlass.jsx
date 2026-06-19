import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { injectStyles } from './landing/styles';
import { VantaLogo, Ico } from './landing/Icons';
import { Reveal, MagneticButton, Title25D, PremiumEdgeWrapper, ThemeToggle } from './landing/Primitives';
import CustomCursor from './landing/Cursor';
import ScrollytellingSection from './landing/Scrollytelling';

function CSSGrid() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)`,
        backgroundSize: '64px 64px',
      }}
    />
  );
}

function Header({ scrolled, theme, setTheme }) {
  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 h-20 backdrop-blur-[24px] transition-all duration-500 border-b ${
        scrolled
          ? 'border-[var(--border-subtle)] bg-[var(--page-bg)]/80'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="flex items-center gap-3 select-none chrome-text" data-cursor="button">
        <VantaLogo className="w-7 h-7 text-[var(--text-main)]" />
        <span className="font-extrabold text-xl tracking-[0.2em] uppercase">Vanta</span>
      </div>
      <nav className="hidden md:flex gap-6 lg:gap-10 items-center">
        {[
          { href: '#caracteristicas', label: 'Características' },
          { href: '#docs', label: 'Docs' },
          { href: '#privacidad', label: 'Privacidad' },
        ].map((link) => (
          <MagneticButton key={link.href}>
            <a
              href={link.href}
              className="px-4 py-2 text-[var(--text-muted)] text-xs tracking-[0.1em] uppercase font-semibold transition-colors hover:text-[var(--text-main)] font-mono"
            >
              {link.label}
            </a>
          </MagneticButton>
        ))}
        <div className="w-[1px] h-4 bg-[var(--border-strong)] ml-2" />
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <MagneticButton>
          <button className="text-xs font-bold tracking-widest uppercase text-[var(--btn-text)] border border-transparent rounded-full px-6 py-2.5 bg-[var(--btn-bg)] transition-colors hover:bg-[var(--btn-hover)] shadow-lg">
            Descargar
          </button>
        </MagneticButton>
      </nav>
    </motion.header>
  );
}

function Hero() {
  return (
    <section className="relative z-10 min-h-screen flex flex-col justify-between pt-32 pb-8 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-between w-full gap-16 lg:gap-8">
        <Reveal dir="left" className="flex flex-col items-start w-full lg:w-1/3">
          <Title25D text1="Inteligencia" text2="Forense." />
          <p className="text-base text-[var(--text-muted)] max-w-sm mb-8 leading-relaxed font-mono">
            Motor Whisper embebido y cadena de custodia inmutable. Totalmente Offline.
          </p>
          <MagneticButton>
            <button className="px-8 py-4 text-xs font-bold tracking-widest uppercase rounded-full border border-[var(--border-strong)] text-[var(--text-main)] bg-[var(--glass-bg)] backdrop-blur-md transition-all hover:bg-[var(--glass-hover)]">
              Para Mac / Win
            </button>
          </MagneticButton>
        </Reveal>

        <Reveal dir="up" className="flex justify-center relative w-full lg:w-1/3">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-[var(--text-main)] opacity-10 blur-[80px] rounded-full pointer-events-none" />
          <div className="w-48 h-48 md:w-64 md:h-64 relative z-10 drop-shadow-2xl text-[var(--text-main)]">
            <VantaLogo className="w-full h-full" />
          </div>
        </Reveal>

        <Reveal dir="right" className="flex flex-col items-start lg:items-end w-full lg:w-1/3 text-left lg:text-right">
          <div className="flex flex-col gap-8 font-mono text-xs tracking-[0.15em] text-[var(--text-muted)] uppercase">
            <div>
              <span className="text-[var(--text-main)] font-bold block mb-1">Cifrado de Reposo</span>
              AES-256 Estándar Militar
            </div>
            <div>
              <span className="text-[var(--text-main)] font-bold block mb-1">Cadena de Custodia</span>
              Hashing SHA-256 Local
            </div>
            <div>
              <span className="text-[var(--text-main)] font-bold block mb-1">Transcripción</span>
              Zero Latency IA Local
            </div>
          </div>
        </Reveal>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="w-full pt-8 border-t border-[var(--border-subtle)] overflow-hidden shrink-0 mt-10"
      >
        <div className="flex gap-12 text-[11px] tracking-[0.2em] font-mono text-[var(--text-muted)] uppercase whitespace-nowrap opacity-80">
          <span>Diseñado para Operaciones Encubiertas</span>
          <span>•</span>
          <span>Zero Telemetría</span>
          <span>•</span>
          <span>Cumplimiento Forense Estricto</span>
          <span>•</span>
          <span>Independencia de Nube Absoluta</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Whisper AI Native</span>
        </div>
      </motion.div>
    </section>
  );
}

const BENTO_CARDS = [
  { icon: <>{Ico.brain()}</>, title: 'Hardware Optimizado', desc: 'Diarización y procesamiento Whisper usando toda la potencia de Apple Silicon y GPUs dedicadas.' },
  { icon: <>{Ico.lock()}</>, title: 'Bóveda Criptográfica', desc: 'Volúmenes locales sellados bajo AES-256. Su evidencia permanece completamente inalcanzable.' },
  { icon: <>{Ico.upload()}</>, title: 'Flujo Forense', desc: 'Arraste formatos estándar y exporte documentos listos para su uso judicial inmediato.' },
];

function BentoGrid() {
  return (
    <section id="caracteristicas" className="relative z-10 px-6 lg:px-12 py-16">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {BENTO_CARDS.map((card, i) => (
          <Reveal key={i} dir="up" delay={(i + 1) * 0.1}>
            <PremiumEdgeWrapper rounded="rounded-2xl" className="h-full">
              <div className="p-8 h-full flex flex-col justify-between min-h-[200px]">
                <div className="text-[var(--text-main)] mb-4">{card.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight mb-2">{card.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] font-mono">{card.desc}</p>
                </div>
              </div>
            </PremiumEdgeWrapper>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function MegaCTA() {
  return (
    <section id="privacidad" className="relative z-10 px-6 lg:px-12 pt-[100px] pb-[160px]">
      <div className="max-w-[1400px] mx-auto">
        <Reveal dir="up">
          <PremiumEdgeWrapper rounded="rounded-[32px]">
            <div className="p-14 md:p-24 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[var(--card-bg)] rounded-[31px]">
              <div>
                <Title25D text1="El análisis" text2="comienza aquí." className="text-[clamp(3.5rem,6vw,5.5rem)]" />
                <p className="text-[var(--text-muted)] text-sm md:text-base font-mono max-w-xl leading-relaxed">
                  Sin suscripciones recurrentes. Compra única para la herramienta forense definitiva.
                </p>
              </div>
              <div className="flex flex-col items-start lg:items-center gap-4 mt-6 lg:mt-0 shrink-0">
                <MagneticButton>
                  <button className="px-10 py-5 text-sm font-bold tracking-widest uppercase rounded-full bg-[var(--btn-bg)] text-[var(--btn-text)] transition-transform hover:scale-105">
                    Descargar Vanta
                  </button>
                </MagneticButton>
                <span className="text-xs text-[var(--text-muted)] font-mono tracking-widest uppercase">
                  Mac & Windows
                </span>
              </div>
            </div>
          </PremiumEdgeWrapper>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] relative z-10 bg-[var(--card-bg)]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24">
        <div className="flex items-center gap-3 mb-16 chrome-text">
          <VantaLogo className="w-6 h-6 text-[var(--text-main)]" />
          <div className="font-extrabold text-xl tracking-[0.2em] uppercase text-[var(--text-main)]">VANTA</div>
        </div>
        <div className="border-t border-[var(--border-subtle)] pt-10 flex justify-between items-center flex-wrap gap-4">
          <span className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-widest">© 2026 Vanta Systems.</span>
          <span className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-widest">Hecho con discreción.</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingLiquidGlass() {
  injectStyles();
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-[var(--page-bg)] text-[var(--text-main)] min-h-screen font-sans overflow-x-clip relative selection:bg-blue-500/30 transition-colors duration-700">
      <CSSGrid />
      <CustomCursor />
      <Header scrolled={scrolled} theme={theme} setTheme={setTheme} />
      <Hero />
      <BentoGrid />
      <ScrollytellingSection />
      <MegaCTA />
      <Footer />
    </div>
  );
}
