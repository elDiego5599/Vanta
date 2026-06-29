import { memo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { VantaLogo } from './Icons'
import { CSSGrid } from './CSSGrid'
import { Reveal, PremiumEdgeWrapper, ThemeToggle } from './Primitives'
import { useTheme } from '../../lib/use-theme'
import { useScroll } from '../../lib/use-scroll'

type OSType = 'mac-arm' | 'mac-intel' | 'windows' | 'linux' | 'unknown'

async function detectOS(): Promise<OSType> {
  const ua = navigator.userAgent
  const isMac = /mac/i.test(ua)
  const isWin = /win/i.test(ua)
  const isLinux = /linux/i.test(ua)

  if (isMac) {
    try {
      const uaData = (navigator as any).userAgentData
      if (uaData?.getHighEntropyValues) {
        const values = await uaData.getHighEntropyValues(['architecture'])
        if (values.architecture?.toLowerCase() === 'arm') return 'mac-arm'
        return 'mac-intel'
      }
    } catch { }
    return /arm|aarch64/i.test(ua) ? 'mac-arm' : 'mac-intel'
  }
  if (isWin) return 'windows'
  if (isLinux) return 'linux'
  return 'unknown'
}

const PLATFORMS = [
  { id: 'mac-arm' as OSType, label: 'macOS Apple Silicon', arch: 'ARM64', file: '/downloads/vanta-macos-arm64.dmg' },
  { id: 'mac-intel' as OSType, label: 'macOS Intel', arch: 'x64', file: '/downloads/vanta-macos-x64.dmg' },
  { id: 'windows' as OSType, label: 'Windows', arch: 'amd64', file: '/downloads/vanta-windows-amd64.exe' },
  { id: 'linux' as OSType, label: 'Linux', arch: 'amd64', file: '/downloads/vanta-linux-amd64.AppImage' },
]

const DEFAULT_GLOW = { glow: 'var(--border-strong)', main: 'var(--text-muted)' }
const RECOMMENDED_GLOW = { glow: '#3b82f6', main: '#2563eb' }

function AppleIcon() {
  return (
    <svg viewBox="0 0 814 1000" fill="currentColor" className="w-6 h-6 shrink-0">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  )
}

function WindowsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0">
      <path d="M3,12V6.75L9,5.43v6.48L3,12M20,3v8.75L10,11.9V5.21L20,3M3,13l6,.09V19.9L3,18.75V13m17,.25V22L10,20.09v-7Z" />
    </svg>
  )
}

function LinuxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0">
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 0 0-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 0 0-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 0 1-.004-.021l-.004-.024a1.807 1.807 0 0 1-.15.706.953.953 0 0 1-.213.335.71.71 0 0 0-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 0 0-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 0 0-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 0 0-.205.334 1.18 1.18 0 0 0-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 0 1-.018-.2v-.02a1.772 1.772 0 0 1 .15-.768 1.08 1.08 0 0 1 .43-.533.985.985 0 0 1 .594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 0 0-.166-.267.248.248 0 0 0-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 0 0-.12.27.944.944 0 0 0-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 0 1-.131.068 2.62 2.62 0 0 1-.275-.402 1.772 1.772 0 0 1-.155-.667 1.759 1.759 0 0 1 .08-.668 1.43 1.43 0 0 1 .283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 0 1 .016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 0 1-.448-.067 3.566 3.566 0 0 1-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 0 0-.402-.533 1.45 1.45 0 0 0-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 0 0 .314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 0 1 .647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 0 1-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z" />
    </svg>
  )
}

function PlatformIcon({ id }: { id: string }) {
  if (id.startsWith('mac')) return <AppleIcon />
  if (id === 'windows') return <WindowsIcon />
  return <LinuxIcon />
}

function SyncBadgeGlow({ glowColor, mainColor }: { glowColor: string, mainColor: string }) {
  return (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 h-6 w-32">
      <div className="absolute inset-0 rounded-full overflow-hidden p-[1px]">
        <div
          className="absolute rounded-full opacity-60 pointer-events-none animate-rotate-gradient"
          style={{
            width: '600px',
            height: '600px',
            left: '50%',
            top: '68px',
            transform: 'translate(-50%, -50%)',
            background: `conic-gradient(from 0deg, transparent 0%, transparent 35%, ${glowColor} 45%, ${mainColor} 50%, ${glowColor} 55%, transparent 65%, transparent 100%)`,
            filter: 'blur(10px)'
          }}
        />
        <div className="absolute inset-[1px] bg-[var(--card-bg)] rounded-full z-10 shadow-[inset_0_1px_1px_var(--border-subtle)]" />
      </div>
      <div className="relative z-20 flex items-center justify-center h-full text-[9px] font-bold tracking-[0.2em] uppercase text-blue-400">
        Recomendado
      </div>
    </div>
  )
}

const DownloadPageBase = memo(function DownloadPageBase() {
  const [detected, setDetected] = useState<OSType | null>(null)
  const { scrolled } = useScroll()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    detectOS().then(setDetected)
  }, [])

  return (
    <div className="bg-[var(--page-bg)] text-[var(--text-main)] font-sans overflow-x-clip relative transition-colors duration-700">
      <CSSGrid />

      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 h-20 backdrop-blur-[24px] transition-all duration-500 border-b',
          scrolled ? 'border-[var(--border-subtle)] bg-[var(--page-bg)]/80' : 'border-transparent bg-transparent',
        )}
      >
        <Link to="/" className="flex items-center gap-3 select-none chrome-text outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg">
          <VantaLogo className="w-7 h-7 text-[var(--text-main)]" />
          <span className="font-extrabold text-xl tracking-[0.2em] uppercase mt-0.5">Vanta</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className="px-3 py-2 text-[var(--text-muted)] text-[11px] tracking-[0.1em] uppercase font-semibold transition-colors hover:text-[var(--text-main)] font-mono"
          >
            Inicio
          </Link>
          <div className="w-[1px] h-4 bg-[var(--border-strong)]" />
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </nav>
      </header>

      <section className="relative z-10 pt-32 pb-24 px-6 lg:px-12 max-w-[1200px] mx-auto w-full">
        <Reveal dir="up" className="text-center mb-16">
          <h1 className="chrome-text font-extrabold tracking-tight text-[clamp(3.5rem,5vw,5.5rem)] leading-[1.1] pb-2">
            Descargar
          </h1>
          <p className="text-[13px] font-mono text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed mt-6">
            Selecciona tu plataforma. La aplicaci&oacute;n es 100% local, no requiere conexi&oacute;n a internet ni registro.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
          {PLATFORMS.map((p, i) => {
            const isRecomendado = detected === p.id
            const colors = isRecomendado ? RECOMMENDED_GLOW : DEFAULT_GLOW

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
              >
                <PremiumEdgeWrapper
                  rounded="rounded-2xl"
                  className={cn(
                    "h-full group cursor-pointer relative rounded-2xl", // ¡ACÁ ESTÁ LA CORRECCIÓN CLAVE!
                    isRecomendado && "shadow-[0_0_28px_rgba(59,130,246,0.15)]"
                  )}
                  glowColor={colors.glow}
                  mainColor={colors.main}
                >
                  <Link to={p.file} className="block h-full relative z-10">

                    {isRecomendado && (
                      <SyncBadgeGlow glowColor={colors.glow} mainColor={colors.main} />
                    )}

                    <div className="p-8 h-full flex items-start gap-5">
                      <motion.div
                        className={cn(
                          "w-12 h-12 rounded-xl bg-[var(--card-bg)] flex items-center justify-center shrink-0 transition-all ring-1 ring-inset overflow-hidden",
                          isRecomendado
                            ? "ring-blue-500/30 group-hover:ring-blue-500/60 shadow-sm"
                            : "ring-[var(--border-subtle)] group-hover:ring-[var(--border-strong)]"
                        )}
                        whileHover={{ y: -1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      >
                        <PlatformIcon id={p.id} />
                      </motion.div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[15px] font-bold text-[var(--text-main)]">{p.label}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: colors.main }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span className={cn(
                            "text-[11px] font-mono transition-colors",
                            isRecomendado
                              ? "text-blue-500"
                              : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]"
                          )}>
                            Descargar
                          </span>
                          <span className="text-[9px] font-mono text-[var(--text-muted)] tracking-widest">&middot; {p.arch}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </PremiumEdgeWrapper>
              </motion.div>
            )
          })}
        </div>

        <Reveal dir="up" className="text-center mt-12">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-muted)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Todos los binarios est&aacute;n firmados y verificados. C&oacute;digo abierto bajo licencia MIT.
          </div>
        </Reveal>
      </section>

      <footer className="relative z-10 border-t border-[var(--border-subtle)] bg-[var(--card-bg)]">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-20">
          <div className="flex items-center gap-3 mb-14 chrome-text">
            <VantaLogo className="w-6 h-6 text-[var(--text-main)]" />
            <div className="font-extrabold text-xl tracking-[0.2em] uppercase text-[var(--text-main)]">VANTA</div>
          </div>
          <div className="border-t border-[var(--border-subtle)] pt-8 flex justify-between items-center flex-wrap gap-4">
            <span className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-widest">&copy; 2026 Vanta Systems.</span>
            <Link to="/" className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors uppercase tracking-widest">
              Inicio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
})

export default DownloadPageBase