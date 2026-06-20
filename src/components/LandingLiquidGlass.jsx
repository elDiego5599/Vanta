import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import '../../styles/global.css';
import { CSSGrid } from './landing/CSSGrid';
import { CustomCursor } from './landing/CustomCursor';
import { Header } from './landing/Header';
import { Hero } from './landing/Hero';
import { BentoGrid } from './landing/BentoGrid';
import { ScrollytellingSection } from './landing/ScrollytellingSection';
import { MegaCTA } from './landing/MegaCTA';
import { Footer } from './landing/Footer';
import { useTheme } from '../../hooks/useTheme';

export default function LandingLiquidGlass() {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState('system');

  useTheme(theme);

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