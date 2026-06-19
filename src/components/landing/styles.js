export const STYLE_TAG = `
  :root {
    --page-bg: #000000;
    --card-bg: #050505;
    --text-main: #ffffff;
    --text-muted: #a1a1aa;
    --border-subtle: rgba(255,255,255,0.05);
    --border-strong: rgba(255,255,255,0.2);
    --btn-bg: #ffffff;
    --btn-text: #000000;
    --btn-hover: #e4e4e7;
    --chrome-1: #52525b;
    --chrome-2: #a1a1aa;
    --grid-line: rgba(255,255,255,0.03);
    --text-3d-1: #18181b;
    --text-3d-2: #09090b;
    --text-3d-shadow: rgba(0,0,0,0.8);
    --glow-edge: rgba(255,255,255,0.4);
    --glass-bg: rgba(255,255,255,0.03);
  }

  .light-mode {
    --page-bg: #f4f4f5;
    --card-bg: #ffffff;
    --text-main: #09090b;
    --text-muted: #71717a;
    --border-subtle: rgba(0,0,0,0.08);
    --border-strong: rgba(0,0,0,0.2);
    --btn-bg: #09090b;
    --btn-text: #ffffff;
    --btn-hover: #27272a;
    --chrome-1: #a1a1aa;
    --chrome-2: #52525b;
    --grid-line: rgba(0,0,0,0.05);
    --text-3d-1: #e4e4e7;
    --text-3d-2: #d4d4d8;
    --text-3d-shadow: rgba(0,0,0,0.15);
    --glow-edge: rgba(0,0,0,0.25);
    --glass-bg: rgba(0,0,0,0.02);
  }

  @keyframes chrome-sweep {
    0%, 100% { background-position: 0% center; }
    50%      { background-position: 200% center; }
  }

  html, body, *, *::before, *::after {
    cursor: none !important;
  }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: var(--page-bg); }
  ::-webkit-scrollbar-thumb { background: var(--text-muted); border-radius: 4px; }

  .chrome-text {
    background: linear-gradient(90deg, var(--chrome-1) 0%, var(--chrome-2) 18%, var(--text-main) 50%, var(--chrome-2) 82%, var(--chrome-1) 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: chrome-sweep 6s ease-in-out infinite;
  }

  .text-25d {
    text-shadow:
      0px 1px 1px var(--border-strong),
      0px 1px 0px var(--text-3d-1),
      0px 2px 0px var(--text-3d-1),
      0px 3px 0px var(--text-3d-2),
      0px 4px 0px var(--text-3d-2),
      0px 10px 15px var(--text-3d-shadow),
      0px 20px 40px rgba(59,130,246,0.1);
  }
`;

export const ULTRA_EASE = [0.16, 1, 0.3, 1];

export function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('vanta-styles')) return;
  const s = document.createElement('style');
  s.id = 'vanta-styles';
  s.textContent = STYLE_TAG;
  document.head.appendChild(s);
}
