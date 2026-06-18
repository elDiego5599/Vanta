import { useState } from 'react';

export default function LoginScreen({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!usuario.trim()) {
      setError('Ingrese un usuario');
      return;
    }

    setCargando(true);
    setTimeout(() => {
      onLogin({ usuario: usuario.trim() });
      setCargando(false);
    }, 600);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white/90 tracking-tight">VANTA</h1>
          <p className="text-[10px] text-[#52525b] mt-2 tracking-[0.2em] uppercase">Forensic Audio Analysis</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 mb-6">
            <div>
              <label className="text-[10px] text-[#71717a] tracking-wider uppercase mb-1.5 block">Usuario</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingrese su usuario"
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-md text-xs text-white/80 placeholder-[#3f3f46] focus:outline-none focus:border-blue-500/40 transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] text-[#71717a] tracking-wider uppercase mb-1.5 block">Contrasena</label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Ingrese su contrasena"
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-md text-xs text-white/80 placeholder-[#3f3f46] focus:outline-none focus:border-blue-500/40 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="text-[10px] text-red-400 mb-4">{error}</div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 bg-blue-500/20 border border-blue-500/30 rounded-md text-xs font-medium text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="text-center mt-8">
          <div className="text-[9px] text-[#3f3f46] tracking-wider">v0.1.0 — 100% Offline</div>
        </div>
      </div>
    </div>
  );
}
