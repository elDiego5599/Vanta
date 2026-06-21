import { lazy, Suspense } from 'react';
import { useScroll } from '../lib/use-scroll';
import CustomCursor from './landing/Cursor';
import { CSSGrid } from './landing/CSSGrid';
import { Header } from './landing/Header';
import { Hero } from './landing/Hero';
import { SkeletonSection } from './landing/SkeletonSection';
import ErrorBoundary from './landing/ErrorBoundary';

const BentoGrid = lazy(() => import('./landing/BentoGrid').then(m => ({ default: m.BentoGrid })));
const ScrollytellingSection = lazy(() => import('./landing/Scrollytelling'));
const MegaCTA = lazy(() => import('./landing/MegaCTA').then(m => ({ default: m.MegaCTA })));
const Footer = lazy(() => import('./landing/Footer').then(m => ({ default: m.Footer })));

export default function LandingLiquidGlass() {
  const { scrolled } = useScroll();

  return (
    <div className="bg-[var(--page-bg)] text-[var(--text-main)] min-h-screen font-sans overflow-x-clip relative selection:bg-blue-500/30 transition-colors duration-700">
      <CSSGrid />
      <CustomCursor />
      <Header scrolled={scrolled} />
      <Hero />
      <ErrorBoundary>
        <Suspense fallback={<SkeletonSection className="h-[400px]" />}>
          <BentoGrid />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SkeletonSection className="h-[600px]" />}>
          <ScrollytellingSection />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SkeletonSection className="h-[500px]" />}>
          <MegaCTA />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SkeletonSection className="h-[300px]" />}>
          <Footer />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
