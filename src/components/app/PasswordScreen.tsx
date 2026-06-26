import { useState, useRef, useCallback, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VantaMiniLogo } from '../landing/Icons'

const PWD_KEY = 'vanta_pwd_hash'

async function hashPassword(pwd: string): Promise<string> {
  const data = new TextEncoder().encode(pwd + ':vanta')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function getStoredHash(): string | null {
  return localStorage.getItem(PWD_KEY)
}

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

  const isSet = !!getStoredHash()

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    e?.preventDefault()
    setError('')

    if (step === 'create') {
      if (password.length < 4) {
        setError('Minimo 4 caracteres')
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
      if (!stored) {
        setStep('create')
        setPassword('')
        return
      }
      const h = await hashPassword(password)
      if (h === stored) {
        setLoading(true)
        setTimeout(() => onUnlock(), 300)
      } else {
        setError('Contraseña incorrecta')
        setPassword('')
      }
    }
  }, [step, password, confirm, onUnlock])

  const currentPwd = step === 'create' ? password : step === 'confirm' ? confirm : password
  const title = step === 'unlock' ? 'Ingrese su contraseña' : step === 'create' ? 'Cree una contraseña' : 'Confirme su contraseña'
  const subtitle = step === 'unlock' ? '' : step === 'create' ? 'Minimo 4 caracteres' : 'Repita la contraseña'

  return (
    <div className="flex h-screen bg-[var(--page-bg)] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-8 w-full max-w-sm"
      >
        <div className="flex items-center gap-3">
          <VantaMiniLogo className="w-8 h-8" />
          <div className="chrome-text text-2xl font-extrabold tracking-[0.2em] uppercase">VANTA</div>
        </div>

        <div className="w-full bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="text-[13px] font-bold text-[var(--text-main)] mb-1">{title}</div>
            {subtitle && (
              <div className="text-[11px] font-mono text-[var(--text-muted)]">{subtitle}</div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                placeholder="••••••••"
                autoFocus
                className="w-full h-12 px-4 pr-12 rounded-xl text-[15px] text-[var(--text-main)] bg-[var(--glass-bg)] border border-[var(--border-subtle)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 placeholder:text-[var(--text-muted)]/40 transition-colors"
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
              disabled={currentPwd.length < 4}
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
        </div>
      </motion.div>
    </div>
  )
}
