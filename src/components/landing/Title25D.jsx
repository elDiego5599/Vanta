import { memo } from 'react';

export const Title25D = memo(function Title25D({ text1, text2, className = 'text-[clamp(3.5rem,5vw,5.5rem)]' }) {
  return (
    <div className="mb-6 w-fit cursor-none">
      <h1 className={`font-extrabold leading-[0.95] tracking-tighter text-[var(--text-main)] text-25d ${className}`}>
        {text1} <br />
        <span className="chrome-text pb-2">{text2}</span>
      </h1>
    </div>
  );
});