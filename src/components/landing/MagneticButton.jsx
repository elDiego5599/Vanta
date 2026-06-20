import { memo } from 'react';
import { useMagnetic } from '../../hooks/useMagnetic';

export const MagneticButton = memo(function MagneticButton({ children, className = '', strength = 0.2 }) {
  const { ref, springX, springY, handleMouse, handleLeave } = useMagnetic(strength);
  return (
    <div ref={ref} onMouseMove={handleMouse} onMouseLeave={handleLeave} style={{ x: springX, y: springY }} className={`inline-block ${className}`}>
      {children}
    </div>
  );
});