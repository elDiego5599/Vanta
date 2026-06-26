import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VantaMiniLogo } from '../landing/Icons'

const PIN_KEY = 'vanta_pin_hash'

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin + ':vanta')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function getStoredHash(): string | null {
  return localStorage.getItem(PIN_KEY)
}

interface Props {
  onUnlock: () => void
}

export default function PinScreen({ onUnlock }: Props) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'create' | 'confirm' | 'unlock'>(
    getStoredHash() ? 'unlock' : 'create'
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isSet = !!getStoredHash()

  const handleDigit = useCallback((d: string) => {
    setError('')
    if (step === 'create' && pin.length < 6) {
      setPin(p => p + d)
    } else if (step === 'confirm' && confirmPin.length < 6) {
      setConfirmPin(p => p + d)
    } else if (step === 'unlock' && pin.length < 6) {
      setPin(p => p + d)
    }
  }, [step, pin.length, confirmPin.length])

  const handleDelete = useCallback(() => {
    setError('')
    if (step === 'create') setPin(p => p.slice(0, -1))
    else if (step === 'confirm') setConfirmPin(p => p.slice(0, -1))
    else if (step === 'unlock') setPin(p => p.slice(0, -1))
  }, [step])

  const handleSubmit = useCallback(async () => {
    setError('')

    if (step === 'create') {
      if (pin.length < 4) {
        setError('Minimo 4 digitos')
        return
      }
      setStep('confirm')
      return
    }

    if (step === 'confirm') {
      if (pin !== confirmPin) {
        setError('Los PIN no coinciden')
        setConfirmPin('')
        return
      }
      const h = await hashPin(pin)
      localStorage.setItem(PIN_KEY, h)
      setLoading(true)
      setTimeout(() => onUnlock(), 300)
      return
    }

    if (step === 'unlock') {
      const stored = getStoredHash()
      if (!stored) {
        setStep('create')
        setPin('')
        return
      }
      const h = await hashPin(pin)
      if (h === stored) {
        setLoading(true)
        setTimeout(() => onUnlock(), 300)
      } else {
        setError('PIN incorrecto')
        setPin('')
      }
    }
  }, [step, pin, confirmPin, onUnlock])

  const handleReset = useCallback(() => {
    localStorage.removeItem(PIN_KEY)
    setPin('')
    setConfirmPin('')
    setStep('create')
    setError('')
  }, [])

  const currentPin = step === 'create' ? pin : step === 'confirm' ? confirmPin : pin
  const title = step === 'unlock' ? 'Ingrese su PIN' : step === 'create' ? 'Cree un PIN' : 'Confirme su PIN'
  const subtitle = step === 'unlock' ? '' : step === 'create' ? 'Minimo 4 digitos' : 'Repita el PIN'

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

          <div className="flex justify-center gap-3 mb-8">
            {Array.from({ length: step === 'confirm' ? confirmPin.length : pin.length }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-3 h-3 rounded-full bg-[var(--accent)]"
              />
            ))}
            {Array.from({
              length: 6 - (step === 'confirm' ? confirmPin.length : pin.length)
            }).map((_, i) => (
              <div key={`empty-${i}`} className="w-3 h-3 rounded-full bg-[var(--border-subtle)]" />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-[11px] font-mono text-red-500 text-center mb-4"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
              <button
                key={d}
                onClick={() => handleDigit(String(d))}
                className="h-14 rounded-xl text-[18px] font-bold text-[var(--text-main)] bg-[var(--glass-bg)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                {d}
              </button>
            ))}
            <button
              onClick={isSet ? () => step === 'create' ? setStep('unlock') : handleReset() : undefined}
              className="h-14 rounded-xl text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {isSet ? 'Reset' : ''}
            </button>
            <button
              onClick={() => handleDigit('0')}
              className="h-14 rounded-xl text-[18px] font-bold text-[var(--text-main)] bg-[var(--glass-bg)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-14 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={currentPin.length < 4}
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
              step === 'create' ? 'Continuar' : step === 'confirm' ? 'Establecer PIN' : 'Entrar'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
