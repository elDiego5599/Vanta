import { useState } from 'react';
import { ScrollFeature } from './ScrollFeature';
import { DetailedMockupUI } from './DetailedMockupUI';
import { PremiumEdgeWrapper } from './PremiumEdgeWrapper';
import { FEATURES } from '../../constants';
import { motion } from 'framer-motion';

export default function ScrollytellingSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="docs" className="relative z-10 w-full max-w-[1800px] mx-auto px-6 lg:pl-16 lg:pr-0 pt-20 pb-[100px]">
      <div className="flex flex-col lg:flex-row relative items-start gap-10 lg:gap-0">
        <div className="w-full lg:w-4/12 relative z-20 pb-[30vh]">
          {FEATURES.map((feat, i) => (
            <ScrollFeature key={feat.id} feature={feat} index={i} setActiveIndex={setActiveIndex} />
          ))}
        </div>
        <div className="w-full lg:w-8/12 sticky top-[10vh] h-[60vh] lg:h-[80vh] flex items-center justify-end z-10">
          <motion.div
            className="relative w-full max-w-[1100px] lg:translate-x-[15%]"
            animate={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
          >
            <PremiumEdgeWrapper rounded="rounded-[24px]">
              <div className="relative aspect-[16/10]">
                <DetailedMockupUI activeIndex={activeIndex} />
              </div>
            </PremiumEdgeWrapper>
          </motion.div>
        </div>
      </div>
    </section>
  );
}