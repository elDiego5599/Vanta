import { useState, useCallback, useEffect, memo, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { reEncryptWithPassword, verifyPassword } from '../../lib/crypto'
import { setEncryptionKey } from '../../lib/keyHolder'
import { getAutoLockTimeout, setAutoLockTimeout } from '../../lib/useAutoLock'
import { resetModel } from '../../lib/whisper'
import { estimateStorageUsage } from '../../lib/db'
import { resetApp } from '../../lib/resetApp'

const GearIcon = ({ w = 20, h = 20 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const LockIcon = ({ w = 18, h = 18 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)



const STORAGE_KEY = 'vanta_crypto_verifier'

type SettingsTab = 'seguridad' | 'transcripcion' | 'almacenamiento'

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: 'seguridad', label: 'Seguridad' },
  { id: 'transcripcion', label: 'Transcripción' },
  { id: 'almacenamiento', label: 'Almacenamiento' },
]

const TextFileIcon = ({ w = 18, h = 18 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

const DatabaseIcon = ({ w = 18, h = 18 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
)

function SectionCard({ title, desc, icon, children }: { title: string; desc: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[var(--accent)]/5 blur-[50px] pointer-events-none rounded-full" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--glass-bg)] flex items-center justify-center text-[var(--text-muted)]">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-main)] tracking-tight">{title}</h2>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">{desc}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

function AutoLockSelector() {
  const [value, setValue] = useState(() => {
    const ms = getAutoLockTimeout()
    return ms > 0 ? String(ms / 60000) : '0'
  })

  const options = [
    { value: '5', label: '5 min' },
    { value: '15', label: '15 min' },
    { value: '30', label: '30 min' },
    { value: '60', label: '1 hora' },
    { value: '0', label: 'Nunca' },
  ]

  const handleChange = useCallback((v: string) => {
    setValue(v)
    setAutoLockTimeout(parseInt(v, 10))
  }, [])

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleChange(opt.value)}
            className={`px-4 py-2.5 rounded-xl text-[11px] font-mono font-bold tracking-wide transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              isActive
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'bg-[var(--glass-bg)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function ChangePasswordForm() {
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const [success, setSuccess] = useState('')

  const hasUpper = (s: string) => /[A-Z]/.test(s)
  const hasDigit = (s: string) => /\d/.test(s)
  const hasSpecial = (s: string) => /[^A-Za-z0-9]/.test(s)

  const requirements = [
    { label: 'Mínimo 8 caracteres', met: newPwd.length >= 8 },
    { label: 'Una mayúscula', met: hasUpper(newPwd) },
    { label: 'Un número', met: hasDigit(newPwd) },
    { label: 'Un carácter especial', met: hasSpecial(newPwd) },
  ]
  const allMet = requirements.every(r => r.met)

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPwd) { setError('Ingrese su contraseña actual'); return }
    if (!allMet) { setError('Cumpla todos los requisitos de seguridad'); return }
    if (newPwd !== confirmPwd) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    try {
      const result = await reEncryptWithPassword(currentPwd, newPwd)
      localStorage.setItem(STORAGE_KEY, result.stored)
      const key = await verifyPassword(newPwd, result.stored)
      if (key) {
        setEncryptionKey(key)
        setToken(result.token)
        setSuccess('')
        setCurrentPwd('')
        setNewPwd('')
        setConfirmPwd('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }, [currentPwd, newPwd, confirmPwd, allMet])

  if (token) {
    return <TokenDisplay token={token} onDismiss={() => setToken('')} />
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">Contraseña actual</label>
        <input
          type="password"
          value={currentPwd}
          onChange={(e) => setCurrentPwd(e.target.value)}
          placeholder="••••••••"
          disabled={loading}
          className="w-full h-12 px-4 rounded-xl text-[13px] font-medium text-[var(--text-main)] bg-[var(--glass-bg)] border border-[var(--border-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 placeholder:text-[var(--text-muted)]/50 transition-all"
        />
      </div>

      <div>
        <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">Nueva contraseña</label>
        <input
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          placeholder="Nueva contraseña"
          disabled={loading}
          className="w-full h-12 px-4 rounded-xl text-[13px] font-medium text-[var(--text-main)] bg-[var(--glass-bg)] border border-[var(--border-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 placeholder:text-[var(--text-muted)]/50 transition-all"
        />
        <AnimatePresence>
          {newPwd.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-1.5 mt-2 bg-[var(--page-bg)]/50 rounded-xl p-3 border border-[var(--border-subtle)]"
            >
              {requirements.map((req) => (
                <div key={req.label} className={`flex items-center gap-2 text-[10px] font-mono transition-colors ${req.met ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    {req.met ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="9" strokeWidth="1.5" />}
                  </svg>
                  {req.label}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">Confirmar nueva contraseña</label>
        <input
          type="password"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          placeholder="Repita la contraseña"
          disabled={loading}
          className="w-full h-12 px-4 rounded-xl text-[13px] font-medium text-[var(--text-main)] bg-[var(--glass-bg)] border border-[var(--border-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 placeholder:text-[var(--text-muted)]/50 transition-all"
        />
      </div>

      <div className="h-4 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-[11px] font-mono text-red-500 font-semibold"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-[11px] font-mono text-green-500 font-semibold"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        disabled={loading || !allMet || !currentPwd}
        className="w-full py-3 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all bg-[var(--accent)] text-white disabled:opacity-40 disabled:bg-[var(--border-strong)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Cambiando...
          </span>
        ) : 'Cambiar Contraseña'}
      </button>
    </form>
  )
}

function TokenDisplay({ token, onDismiss }: { token: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
        <div className="text-[10px] font-mono text-amber-500 font-bold mb-1 uppercase tracking-wider">Contraseña cambiada — Guarde este token</div>
        <p className="text-[10px] font-mono text-[var(--text-muted)] leading-relaxed">
          Es su única copia. No volverá a mostrarse.
        </p>
      </div>
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="text-[10px] font-mono text-green-500 text-center font-semibold pb-1">
              Copiado al portapapeles
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2 bg-[var(--page-bg)]/50 rounded-xl p-4 border border-[var(--border-subtle)]">
        <code className="flex-1 text-[12px] font-mono text-[var(--text-main)] break-all select-all">{token}</code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(token)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="shrink-0 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
          title="Copiar al portapapeles"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
      <div className="bg-[var(--glass-bg)] rounded-xl p-3 border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          </svg>
          Si pierde este token, perderá el acceso a todos sus datos permanentemente.
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="w-full py-3 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all bg-[var(--accent)] text-white hover:brightness-110 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm"
      >
        Token guardado
      </button>
    </div>
  )
}

function WhisperModelSelector() {
  const [value, setValue] = useState(() => localStorage.getItem('vanta-whisper-model') || 'small')
  const [showWarning, setShowWarning] = useState(false)
  const [needsInternet, setNeedsInternet] = useState(false)

  const options = [
    { value: 'tiny', label: 'Tiny', desc: 'Rápido, menor precisión' },
    { value: 'base', label: 'Base', desc: 'Equilibrado' },
    { value: 'small', label: 'Small', desc: 'Preciso (recomendado)' },
    { value: 'medium', label: 'Medium', desc: 'Muy preciso, más recursos' },
    { value: 'large', label: 'Large', desc: 'Máxima precisión, pesado' },
  ]

  const handleChange = useCallback((v: string) => {
    if (v === value) return
    if (!navigator.onLine) {
      setNeedsInternet(true)
      setTimeout(() => setNeedsInternet(false), 5000)
      return
    }
    setValue(v)
    localStorage.setItem('vanta-whisper-model', v)
    resetModel()
    setShowWarning(true)
    setTimeout(() => setShowWarning(false), 4000)
  }, [value])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChange(opt.value)}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-mono font-bold tracking-wide transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                isActive
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'bg-[var(--glass-bg)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {options.find(o => o.value === value) && (
        <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
          {options.find(o => o.value === value)!.desc}
        </div>
      )}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mt-2">
              <div className="text-[10px] font-mono text-amber-500 font-semibold text-center">
                Se recargará el motor Whisper al iniciar la próxima transcripción
              </div>
            </div>
          </motion.div>
        )}
        {needsInternet && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-2">
              <div className="text-[10px] font-mono text-red-500 font-semibold text-center">
                Sin conexión — necesita internet para descargar el nuevo modelo
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LanguageSelector() {
  const [value, setValue] = useState(() => localStorage.getItem('vanta-whisper-language') || 'es')

  const options = [
    { value: 'auto', label: 'Auto-detectar' },
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'Inglés' },
    { value: 'fr', label: 'Francés' },
    { value: 'pt', label: 'Portugués' },
    { value: 'de', label: 'Alemán' },
    { value: 'it', label: 'Italiano' },
  ]

  const handleChange = useCallback((v: string) => {
    setValue(v)
    localStorage.setItem('vanta-whisper-language', v)
  }, [])

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleChange(opt.value)}
            className={`px-4 py-2.5 rounded-xl text-[11px] font-mono font-bold tracking-wide transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              isActive
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'bg-[var(--glass-bg)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function DefaultSpeakerInput() {
  const [value, setValue] = useState(() => localStorage.getItem('vanta-default-speaker') || 'Agente')

  const handleChange = useCallback((v: string) => {
    setValue(v)
    localStorage.setItem('vanta-default-speaker', v)
  }, [])

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Ej: Agente"
      className="w-full h-12 px-4 rounded-xl text-[13px] font-medium text-[var(--text-main)] bg-[var(--glass-bg)] border border-[var(--border-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 placeholder:text-[var(--text-muted)]/50 transition-all"
    />
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function StorageStats() {
  const [stats, setStats] = useState<{ cases: number; evidence: number; transcriptions: number; totalBytes: number } | null>(null)

  useEffect(() => {
    estimateStorageUsage().then(setStats)
  }, [])

  const maxBytes = 2 * 1024 ** 3
  const pct = stats ? Math.min((stats.totalBytes / maxBytes) * 100, 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--glass-bg)] border border-[var(--border-subtle)] rounded-xl p-4 text-center">
          <div className="text-[20px] font-bold text-[var(--text-main)] tabular-nums">{stats?.cases ?? '—'}</div>
          <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">Casos</div>
        </div>
        <div className="bg-[var(--glass-bg)] border border-[var(--border-subtle)] rounded-xl p-4 text-center">
          <div className="text-[20px] font-bold text-[var(--text-main)] tabular-nums">{stats?.evidence ?? '—'}</div>
          <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">Archivos</div>
        </div>
        <div className="bg-[var(--glass-bg)] border border-[var(--border-subtle)] rounded-xl p-4 text-center">
          <div className="text-[20px] font-bold text-[var(--text-main)] tabular-nums">{stats?.transcriptions ?? '—'}</div>
          <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">Transcripciones</div>
        </div>
      </div>

      <div className="bg-[var(--glass-bg)] border border-[var(--border-subtle)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">Espacio usado</span>
          <span className="text-[11px] font-mono font-bold text-[var(--text-main)] tabular-nums">
            {stats ? formatBytes(stats.totalBytes) : '—'}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--glass-bg)] border border-[var(--border-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--accent), #a78bfa)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function ResetAppButton() {
  const [confirming, setConfirming] = useState(false)

  const handleFirst = useCallback(() => setConfirming(true), [])

  const handleConfirm = useCallback(() => {
    resetApp()
  }, [])

  const handleCancel = useCallback(() => setConfirming(false), [])

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-mono text-red-500/70 leading-relaxed">
        Elimina todos los casos, evidencias, transcripciones y configuración. Esta acción no se puede deshacer.
      </p>
      {confirming ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-red-500 shadow-sm"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-3 rounded-xl text-[11px] font-mono font-bold tracking-wide transition-all bg-[var(--glass-bg)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleFirst}
          className="w-full py-3 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-red-500 shadow-sm"
        >
          Restablecer aplicación
        </button>
      )}
    </div>
  )
}

function ModuloAjustesBase() {
  const [tab, setTab] = useState<SettingsTab>('seguridad')

  return (
    <div className="absolute inset-0 flex flex-col bg-[var(--page-bg)] p-6 md:p-8">
      <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0">
        <div className="max-w-[800px] mx-auto w-full min-w-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass-bg)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
              <GearIcon w={20} h={20} />
            </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight">Ajustes</h1>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">Configuracion de la aplicacion</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 p-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass-bg)] w-fit">
          {SETTINGS_TABS.map((t) => {
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-mono font-bold tracking-wide transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'seguridad' && (
          <SectionCard
            title="Seguridad"
            desc="Cierre de sesion automatico y cambio de contraseña"
            icon={<LockIcon w={18} h={18} />}
          >
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-bold text-[var(--text-main)] mb-3 tracking-tight">Bloqueo automático</div>
                <p className="text-[10px] font-mono text-[var(--text-muted)] mb-3 leading-relaxed">
                  Bloquea la aplicacion tras un periodo de inactividad.
                </p>
                <AutoLockSelector />
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
              <div>
                <div className="text-[11px] font-bold text-[var(--text-main)] mb-3 tracking-tight">Cambiar contraseña</div>
                <p className="text-[10px] font-mono text-[var(--text-muted)] mb-3 leading-relaxed">
                  Al cambiar la contraseña se generará un nuevo token de recuperación que deberá guardar.
                </p>
                <ChangePasswordForm />
              </div>
            </div>
          </SectionCard>
        )}
        {tab === 'transcripcion' && (
          <SectionCard
            title="Transcripción"
            desc="Modelo Whisper, idioma y altavoz por defecto"
            icon={<TextFileIcon w={18} h={18} />}
          >
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-bold text-[var(--text-main)] mb-3 tracking-tight">Modelo Whisper</div>
                <p className="text-[10px] font-mono text-[var(--text-muted)] mb-3 leading-relaxed">
                  Modelos más grandes ofrecen mayor precisión pero requieren más recursos.
                </p>
                <WhisperModelSelector />
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
              <div>
                <div className="text-[11px] font-bold text-[var(--text-main)] mb-3 tracking-tight">Idioma</div>
                <p className="text-[10px] font-mono text-[var(--text-muted)] mb-3 leading-relaxed">
                  Seleccione el idioma de los audios o use detección automática.
                </p>
                <LanguageSelector />
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
              <div>
                <div className="text-[11px] font-bold text-[var(--text-main)] mb-3 tracking-tight">Altavoz por defecto</div>
                <p className="text-[10px] font-mono text-[var(--text-muted)] mb-3 leading-relaxed">
                  Nombre que se asignará por defecto a cada línea de transcripción.
                </p>
                <DefaultSpeakerInput />
              </div>
            </div>
          </SectionCard>
        )}
        {tab === 'almacenamiento' && (
          <SectionCard
            title="Almacenamiento"
            desc="Espacio utilizado y restablecer aplicación"
            icon={<DatabaseIcon w={18} h={18} />}
          >
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-bold text-[var(--text-main)] mb-3 tracking-tight">Espacio utilizado</div>
                <StorageStats />
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
              <div>
                <div className="text-[11px] font-bold text-[var(--text-main)] mb-3 tracking-tight">Restablecer aplicación</div>
                <ResetAppButton />
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  </div>
  )
}

export default memo(ModuloAjustesBase)
