import { useState, useRef, useCallback, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VantaMiniLogo } from '../landing/Icons'
import { CSSGrid } from '../landing/CSSGrid'
import { useTheme } from '../../lib/use-theme'

const PWD_KEY = 'vanta_pwd_hash'

async function hashPassword(pwd: string): Promise<string> {
  const data = new TextEncoder().encode(pwd + ':vanta')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function getStoredHash(): string | null {
  return localStorage.getItem(PWD_KEY)
}

const hasUpper = (s: string) => /[A-Z]/.test(s)
const hasDigit = (s: string) => /\d/.test(s)
const hasSpecial = (s: string) => /[^A-Za-z0-9]/.test(s)

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
)

const MonitorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

interface Props {
  onUnlock: () => void
}

export default function PasswordScreen({ onUnlock }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState<'create' | 'confirm' | 'unlock'>(
    getStoredHash() ? 'unlock' : 'create'
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { theme, setTheme } = useTheme()

  const isSet = !!getStoredHash()

  const requirements = [
    { label: 'Minimo 8 caracteres', met: password.length >= 8 },
    { label: 'Una mayuscula', met: hasUpper(password) },
    { label: 'Un numero', met: hasDigit(password) },
    { label: 'Un caracter especial', met: hasSpecial(password) },
  ]

  const allMet = requirements.every(r => r.met)

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    e?.preventDefault()
    setError('')

    if (step === 'create') {
      if (!allMet) {
        setError('Cumpla todos los requisitos de seguridad')
        return
      }
      setStep('confirm')
      return
    }

    if (step === 'confirm') {
      if (password !== confirm) {
        setError('Las contraseñas no coinciden')
        setConfirm('')
        return
      }
      const h = await hashPassword(password)
      localStorage.setItem(PWD_KEY, h)
      setLoading(true)
      setTimeout(() => onUnlock(), 300)
      return
    }

    if (step === 'unlock') {
      const stored = getStoredHash()
      if (!stored) { setStep('create'); setPassword(''); return }
      const h = await hashPassword(password)
      if (h === stored) {
        setLoading(true)
        setTimeout(() => onUnlock(), 300)
      } else {
        setError('Contraseña incorrecta')
        setPassword('')
      }
    }
  }, [step, password, confirm, allMet, onUnlock])

  const currentPwd = step === 'create' ? password : step === 'confirm' ? confirm : password

  const title = step === 'unlock' ? 'Ingrese su contraseña'
    : step === 'create' ? 'Cree una contraseña'
    : 'Confirme su contraseña'

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

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <VantaMiniLogo className="w-7 h-7" />
          <div className="chrome-text text-xl font-extrabold tracking-[0.25em] uppercase">VANTA</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)]"
        >
          <div className="text-center mb-7">
            <div className="text-[13px] font-bold text-[var(--text-main)]">{title}</div>
            {step === 'create' && (
              <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">Minimo 8 caracteres, 1 mayuscula, 1 numero, 1 especial</div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="relative">
              <input
                ref={inputRef}
                type={visible ? 'text' : 'password'}
                value={currentPwd}
                onChange={(e) => {
                  setError('')
                  if (step === 'create') setPassword(e.target.value)
                  else if (step === 'confirm') setConfirm(e.target.value)
                  else setPassword(e.target.value)
                }}
                placeholder="Contraseña"
                autoFocus
                className="w-full h-12 px-4 pr-12 rounded-xl text-[14px] text-[var(--text-main)] bg-[var(--glass-bg)] border border-[var(--border-subtle)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 placeholder:text-[var(--text-muted)]/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setVisible(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
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
            </div>

            {step === 'create' && (
              <div className="flex flex-col gap-1.5">
                {requirements.map((req) => (
                  <div
                    key={req.label}
                    className={`flex items-center gap-2 text-[10px] font-mono transition-colors ${req.met ? 'text-green-500' : 'text-[var(--text-muted)]'}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      {req.met ? (
                        <polyline points="20 6 9 17 4 12" />
                      ) : (
                        <circle cx="12" cy="12" r="10" />
                      )}
                    </svg>
                    {req.label}
                  </div>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-[11px] font-mono text-red-500 text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={step === 'create' ? !allMet : currentPwd.length < 4}
              className="w-full py-3 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all bg-[var(--accent)] text-white disabled:opacity-30 hover:brightness-110 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : (
                step === 'create' ? 'Continuar' : step === 'confirm' ? 'Establecer Contraseña' : 'Entrar'
              )}
            </button>
          </form>

          {step === 'create' && isSet && (
            <button
              onClick={() => { setStep('unlock'); setPassword(''); setError('') }}
              className="mt-4 w-full text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              Ya tengo una contraseña
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
