import { memo } from 'react';
import { Reveal } from './Reveal';
import { PremiumEdgeWrapper } from './PremiumEdgeWrapper';
import { Ico } from './Icons';
import { BENTO_CARDS } from '../../constants';

export const BentoGrid = memo(function BentoGrid() {
  return (
    <section id="caracteristicas" className="relative z-10 px-6 lg:px-12 py-16">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {BENTO_CARDS.map((card, i) => (
          <Reveal key={i} dir="up" delay={(i + 1) * 0.1}>
            <PremiumEdgeWrapper rounded="rounded-2xl" className="h-full">
              <div className="p-8 h-full flex flex-col justify-between min-h-[200px]">
                <div className="text-[var(--text-main)] mb-4">{Ico[card.icon]()}</div>
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
});