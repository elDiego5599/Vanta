import { useState, useRef, useCallback, useEffect, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VantaMiniLogo } from '../landing/Icons'
import { CSSGrid } from '../landing/CSSGrid'
import { useTheme } from '../../lib/use-theme'
import { createVerifier, verifyPassword as verifyCrypto, verifyToken, reEncryptEntropy } from '../../lib/crypto'
import { setEncryptionKey } from '../../lib/keyHolder'

const STORAGE_KEY = 'vanta_crypto_verifier'
const LOCKOUT_KEY = 'vanta_lockout'
const FAIL_KEY = 'vanta_fail_count'
const DB_NAME = 'vanta'

function resetApp() {
  const theme = localStorage.getItem('vanta-theme')
  localStorage.clear()
  if (theme) localStorage.setItem('vanta-theme', theme)
  indexedDB.deleteDatabase(DB_NAME)
  window.location.reload()
}

function getStoredVerifier() {
  return localStorage.getItem(STORAGE_KEY)
}

function readLockout() {
  try { return JSON.parse(localStorage.getItem(LOCKOUT_KEY) || 'null') as { stage: number; until: number } | null }
  catch { return null }
}

function writeLockout(data: { stage: number; until: number }) {
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(data))
}

function clearLockout() {
  localStorage.removeItem(LOCKOUT_KEY)
  localStorage.removeItem(FAIL_KEY)
}

function getFailCount() {
  return parseInt(localStorage.getItem(FAIL_KEY) || '0', 10) || 0
}

function incFailCount() {
  const next = getFailCount() + 1
  localStorage.setItem(FAIL_KEY, String(next))
  return next
}

function applyFailedAttempt() {
  const total = incFailCount()
  const existing = readLockout()
  if (existing && Date.now() < existing.until) return { locked: true, until: existing.until } as const
  const currentStage = existing ? existing.stage : 0
  const nextStage = currentStage + 1
  const threshold = 5 + 3 * Math.max(0, nextStage - 1)
  if (total >= threshold) {
    const duration = (() => {
      if (nextStage === 1) return 5 * 60 * 1000
      if (nextStage === 2) return 30 * 60 * 1000
      if (nextStage === 3) return 2 * 60 * 60 * 1000
      return 2 * 60 * 60 * 1000 * Math.pow(4, nextStage - 3)
    })()
    const until = Date.now() + duration
    writeLockout({ stage: nextStage, until })
    return { locked: true, until } as const
  }
  return { locked: false, until: 0 } as const
}

function formatLockoutTime(ms: number) {
  const totalSec = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  if (hours > 0) return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const hasUpper = (s: string) => /[A-Z]/.test(s)
const hasDigit = (s: string) => /\d/.test(s)
const hasSpecial = (s: string) => /[^A-Za-z0-9]/.test(s)

interface Props {
  onUnlock: () => void
}

export default function PasswordScreen({ onUnlock }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState<'create' | 'confirm' | 'show_phrase' | 'unlock' | 'recover' | 'set_new_password' | 'reset_done'>(
    getStoredVerifier() ? 'unlock' : 'create'
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')

  const [lockRemaining, setLockRemaining] = useState(() => {
    const data = readLockout()
    if (!data) return 0
    const remaining = data.until - Date.now()
    return remaining > 0 ? remaining : 0
  })

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const { theme, setTheme } = useTheme()
  const isSet = !!getStoredVerifier()

  const requirements = [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: 'Una mayúscula', met: hasUpper(password) },
    { label: 'Un número', met: hasDigit(password) },
    { label: 'Un carácter especial', met: hasSpecial(password) },
  ]
  const allMet = requirements.every(r => r.met)
  const isLocked = lockRemaining > 0

  const refreshLockout = useCallback(() => {
    const data = readLockout()
    if (!data) { setLockRemaining(0); return }
    const remaining = data.until - Date.now()
    if (remaining <= 0) { localStorage.removeItem(LOCKOUT_KEY); setLockRemaining(0) }
    else setLockRemaining(remaining)
  }, [])

  useEffect(() => {
    if (!isLocked) return
    const id = setInterval(refreshLockout, 1000)
    return () => clearInterval(id)
  }, [refreshLockout, isLocked])

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    e?.preventDefault()
    setError('')

    if (step === 'create') {
      if (!allMet) { setError('Cumpla todos los requisitos de seguridad'); return }
      setStep('confirm')
      inputRef.current?.focus()
      return
    }

    if (step === 'confirm') {
      if (password !== confirm) {
        setError('Las contraseñas no coinciden')
        setConfirm('')
        inputRef.current?.focus()
        return
      }
      setLoading(true)
      const result = await createVerifier(password)
      localStorage.setItem(STORAGE_KEY, result.stored)
      setToken(result.token)
      setLoading(false)
      setStep('show_phrase')
      return
    }

    if (step === 'unlock') {
      const stored = getStoredVerifier()
      if (!stored) { setStep('create'); setPassword(''); return }
      if (isLocked) return
      setLoading(true)
      const key = await verifyCrypto(password, stored)
      if (key) {
        clearLockout()
        setEncryptionKey(key)
        onUnlock()
      } else {
        setLoading(false)
        const result = applyFailedAttempt()
        if (result.locked) setLockRemaining(result.until - Date.now())
        setError('Contraseña incorrecta')
        setPassword('')
        inputRef.current?.focus()
      }
      return
    }

    if (step === 'recover') {
      const stored = getStoredVerifier()
      if (!stored) { setStep('create'); return }
      setLoading(true)
      const key = await verifyToken(token, stored)
      if (key) {
        setStep('set_new_password')
        setPassword('')
        setConfirm('')
        setLoading(false)
      } else {
        setLoading(false)
        setError('Token inválido')
      }
      return
    }

    if (step === 'set_new_password') {
      if (!allMet) { setError('Cumpla todos los requisitos de seguridad'); return }
      if (password !== confirm) {
        setError('Las contraseñas no coinciden')
        setConfirm('')
        inputRef.current?.focus()
        return
      }
      setLoading(true)
      try {
        const newStored = await reEncryptEntropy(token, password)
        localStorage.setItem(STORAGE_KEY, newStored)
        const key = await verifyCrypto(password, newStored)
        if (key) {
          clearLockout()
          setEncryptionKey(key)
          setStep('reset_done')
          setTimeout(() => onUnlock(), 1500)
        }
      } catch {
        setError('Error al cambiar la contraseña')
        setLoading(false)
      }
      return
    }
  }, [step, password, confirm, allMet, token, isLocked, onUnlock])

  const currentPwd = step === 'create' ? password : step === 'confirm' || step === 'set_new_password' ? confirm : password

  const title = step === 'unlock' ? 'Iniciar Sesión'
    : step === 'create' ? 'Crear Contraseña'
      : step === 'confirm' ? 'Confirmar Contraseña'
        : step === 'show_phrase' ? 'Token de Recuperación'
          : step === 'recover' ? 'Recuperar Acceso'
            : step === 'set_new_password' ? 'Nueva Contraseña'
              : 'Contraseña Restablecida'

  const noTitle = step === 'show_phrase' || step === 'reset_done' || isLocked

  return (
    <div className="flex h-screen bg-[var(--page-bg)] items-center justify-center p-6 relative overflow-hidden">
      <CSSGrid />

      <div className="fixed top-5 right-5 z-20">
        <button
          onClick={() => {
            if (theme === 'dark') setTheme('light')
            else if (theme === 'light') setTheme('system')
            else setTheme('dark')
          }}
          className="p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          title={`Tema: ${theme}`}
        >
          {theme === 'dark' && <MoonIcon />}
          {theme === 'light' && <SunIcon />}
          {theme === 'system' && <MonitorIcon />}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="w-full bg-[var(--card-bg)]/80 backdrop-blur-2xl border border-[var(--border-subtle)] rounded-[24px] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[var(--accent)]/10 blur-[50px] pointer-events-none rounded-full" />
          <div className="absolute inset-0 rounded-[24px] pointer-events-none shadow-[inset_0_1px_1px_var(--border-subtle)]" />

          <div className="flex flex-col items-center relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] flex items-center justify-center mb-4 shadow-sm text-[var(--text-main)]">
              <VantaMiniLogo className="w-7 h-7" />
            </div>
            <div className="chrome-text text-[15px] font-extrabold tracking-[0.25em] uppercase">VANTA</div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent my-6 relative z-10 opacity-50" />

          {!noTitle && (
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-[18px] font-bold text-[var(--text-main)] tracking-tight">{title}</h2>
              <p className="text-[13px] font-mono text-[var(--text-muted)] mt-1.5">
                {step === 'recover' ? 'Ingrese su token de recuperación' : 'Ingrese su contraseña para continuar'}
              </p>
            </div>
          )}

          {isLocked ? (
            <LockoutCard remaining={lockRemaining} />
          ) : step === 'show_phrase' ? (
            <TokenCard token={token} password={password} onUnlock={onUnlock} />
          ) : step === 'reset_done' ? (
            <ResetDoneCard />
          ) : (
            <FormCard
              step={step}
              password={password}
              token={token}
              visible={visible}
              loading={loading}
              error={error}
              allMet={allMet}
              isSet={isSet}
              requirements={requirements}
              currentPwd={currentPwd}
              onPasswordChange={setPassword}
              onConfirmChange={setConfirm}
              onTokenChange={setToken}
              onVisibilityToggle={() => setVisible(v => !v)}
              onSubmit={handleSubmit}
              onBack={() => {
                if (step === 'confirm') { setStep('create'); setConfirm(''); setError('') }
                else if (step === 'create') { setStep('unlock'); setPassword(''); setError('') }
                else if (step === 'recover') { setStep('unlock'); setToken(''); setError('') }
                else if (step === 'set_new_password') { setStep('recover'); setPassword(''); setConfirm(''); setToken(''); setError('') }
              }}
              onForgot={() => { setStep('recover'); setToken(''); setError(''); setPassword('') }}
              inputRef={inputRef as React.Ref<HTMLInputElement | HTMLTextAreaElement>}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function LockoutCard({ remaining }: { remaining: number }) {
  return (
    <div className="flex flex-col items-center gap-5 relative z-10">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500/70">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div className="text-center">
        <h2 className="text-[18px] font-bold text-[var(--text-main)] tracking-tight mb-1">Acceso Bloqueado</h2>
        <p className="text-[13px] font-mono text-[var(--text-muted)] leading-relaxed">Demasiados intentos fallidos.<br />Espere antes de intentarlo de nuevo.</p>
      </div>
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-8 py-4 text-center">
        <div className="text-[32px] font-bold text-red-500 tabular-nums tracking-tight leading-none">{formatLockoutTime(remaining)}</div>
      </div>
    </div>
  )
}

function TokenCard({ token, password, onUnlock }: { token: string; password: string; onUnlock: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex flex-col gap-5 relative z-10">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
        <div className="text-[11px] font-mono text-amber-500 font-bold mb-1 uppercase tracking-wider">Guarde este token en un lugar seguro</div>
        <p className="text-[11px] font-mono text-[var(--text-muted)] leading-relaxed">
          Sin este token no podrá recuperar el acceso si olvida su contraseña. Se muestra una única vez.
        </p>
      </div>
      <div className="flex items-center gap-2 bg-[var(--page-bg)]/50 rounded-xl p-4 border border-[var(--border-subtle)]">
        <code className="flex-1 text-[13px] font-mono text-[var(--text-main)] break-all select-all">{token}</code>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(token)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="shrink-0 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
          title="Copiar al portapapeles"
        >
          {copied ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
      {copied && (
        <div className="text-[11px] font-mono text-green-500 text-center font-semibold">¡Copiado al portapapeles!</div>
      )}
      <div className="bg-[var(--glass-bg)] rounded-xl p-3 border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          </svg>
          Si pierde este token, perderá el acceso a todos sus datos permanentemente.
        </div>
      </div>
      <button
        onClick={() => {
          const stored = getStoredVerifier()
          if (!stored) return
          verifyCrypto(password, stored).then(key => {
            if (key) { setEncryptionKey(key); onUnlock() }
          })
        }}
        className="w-full py-3.5 rounded-xl text-[12px] font-bold tracking-widest uppercase transition-all bg-[var(--accent)] text-white hover:brightness-110 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm"
      >
        Ya lo guardé, continuar
      </button>
    </div>
  )
}

function ResetDoneCard() {
  return (
    <div className="flex flex-col items-center gap-4 relative z-10">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <div className="text-center">
        <h2 className="text-[18px] font-bold text-[var(--text-main)] tracking-tight mb-1">Contraseña Restablecida</h2>
        <p className="text-[13px] font-mono text-[var(--text-muted)]">Accediendo a su instancia...</p>
      </div>
    </div>
  )
}

interface FormCardProps {
  step: string
  password: string
  token: string
  visible: boolean
  loading: boolean
  error: string
  allMet: boolean
  isSet: boolean
  requirements: { label: string; met: boolean }[]
  currentPwd: string
  onPasswordChange: (v: string) => void
  onConfirmChange: (v: string) => void
  onTokenChange: (v: string) => void
  onVisibilityToggle: () => void
  onSubmit: (e?: FormEvent) => void
  onBack: () => void
  onForgot: () => void
  inputRef: React.Ref<HTMLInputElement | HTMLTextAreaElement>
}

function FormCard({
  step, password, token, visible, loading, error, allMet, isSet, requirements, currentPwd,
  onPasswordChange, onConfirmChange, onTokenChange, onVisibilityToggle,
  onSubmit, onBack, onForgot, inputRef,
}: FormCardProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 relative z-10">

      {(step === 'create' || step === 'set_new_password') && (
        <div className="relative">
          <input
            ref={inputRef as unknown as React.Ref<HTMLInputElement>}
            type={visible ? 'text' : 'password'}
            value={password}
            onChange={(e) => { onPasswordChange(e.target.value) }}
            placeholder="Nueva contraseña"
            autoFocus
            disabled={loading}
            className="w-full h-14 px-5 pr-12 rounded-xl text-[14px] font-medium text-[var(--text-main)] bg-[var(--glass-bg)] border border-[var(--border-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 placeholder:text-[var(--text-muted)]/50 transition-all shadow-sm"
          />
          <VisToggle visible={visible} onClick={onVisibilityToggle} loading={loading} />
        </div>
      )}

      {(step === 'confirm' || step === 'unlock') && (
        <div className="relative">
          <input
            ref={inputRef as unknown as React.Ref<HTMLInputElement>}
            type={visible ? 'text' : 'password'}
            value={currentPwd}
            onChange={(e) => {
              if (step === 'confirm') onConfirmChange(e.target.value)
              else onPasswordChange(e.target.value)
            }}
            placeholder={step === 'confirm' ? 'Repita la contraseña' : 'Contraseña'}
            autoFocus
            disabled={loading}
            className="w-full h-14 px-5 pr-12 rounded-xl text-[14px] font-medium text-[var(--text-main)] bg-[var(--glass-bg)] border border-[var(--border-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 placeholder:text-[var(--text-muted)]/50 transition-all shadow-sm"
          />
          <VisToggle visible={visible} onClick={onVisibilityToggle} loading={loading} />
        </div>
      )}

      {step === 'recover' && (
        <div className="relative">
          <textarea
            ref={inputRef as unknown as React.Ref<HTMLTextAreaElement>}
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            placeholder=""
            rows={3}
            disabled={loading}
            className="w-full px-5 py-3 rounded-xl text-[13px] font-mono text-[var(--text-main)] bg-[var(--glass-bg)] border border-[var(--border-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 placeholder:text-[var(--text-muted)]/50 transition-all shadow-sm resize-none"
          />
        </div>
      )}

      {(step === 'create' || step === 'set_new_password') && (
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col gap-2 bg-[var(--page-bg)]/50 rounded-xl p-4 border border-[var(--border-subtle)]"
          >
            {requirements.map((req) => (
              <div key={req.label} className={`flex items-center gap-2.5 text-[11px] font-mono transition-colors duration-300 ${req.met ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  {req.met ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="9" strokeWidth="1.5" />}
                </svg>
                {req.label}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <div className="h-4 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-[12px] font-mono text-red-500 font-semibold"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={loading || ((step === 'create' || step === 'set_new_password')
            ? !allMet
            : step === 'recover'
              ? !token.trim()
              : currentPwd.length < 4)}
          className="w-full py-3.5 rounded-xl text-[12px] font-bold tracking-widest uppercase transition-all bg-[var(--accent)] text-white disabled:opacity-40 disabled:bg-[var(--border-strong)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Autenticando...
            </span>
          ) : (
            step === 'create' ? 'Continuar'
              : step === 'confirm' ? 'Establecer Contraseña'
                : step === 'unlock' ? 'Iniciar Sesión'
                  : step === 'recover' ? 'Verificar Token'
                    : step === 'set_new_password' ? 'Restablecer Contraseña'
                      : null
          )}
        </button>

        <AnimatePresence mode="wait">
          {step === 'confirm' && (
            <BackButton key="bc" label="← Volver a escribir" onClick={onBack} />
          )}
          {step === 'create' && isSet && (
            <BackButton key="bs" label="Ya tengo una contraseña" onClick={onBack} />
          )}
          {step === 'unlock' && (
            <BackButton key="bf" label="¿Olvidó su contraseña?" onClick={onForgot} />
          )}
          {step === 'recover' && (
            <BackButton key="br" label="← Volver a inicio de sesión" onClick={onBack} />
          )}
          {step === 'set_new_password' && (
            <BackButton key="bn" label="← Usar otro token" onClick={onBack} />
          )}
        </AnimatePresence>

        {step === 'unlock' && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Se borrarán todos los datos cifrados de esta aplicación. ¿Está seguro?')) {
                resetApp()
              }
            }}
            className="text-[10px] font-mono text-red-500/50 hover:text-red-500 transition-colors mt-1"
          >
            Restablecer aplicación
          </button>
        )}
      </div>

    </form>
  )
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      type="button"
      onClick={onClick}
      className="w-full py-2 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
    >
      {label}
    </motion.button>
  )
}

function VisToggle({ visible, onClick, loading }: { visible: boolean; onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors disabled:opacity-50"
      tabIndex={-1}
    >
      {visible ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
)
const MonitorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)
