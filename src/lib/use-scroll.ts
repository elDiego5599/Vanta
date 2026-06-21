import { useState, useEffect, useRef } from 'react'

interface UseScrollOptions {
  threshold?: number
}

export function useScroll({ threshold = 40 }: UseScrollOptions = {}) {
  const [scrolled, setScrolled] = useState(false)
  const rafId = useRef(0)

  useEffect(() => {
    let isScrolled = false
    const onScroll = () => {
      if (rafId.current) return
      rafId.current = requestAnimationFrame(() => {
        rafId.current = 0
        const currentScrolled = window.scrollY > threshold
        if (currentScrolled !== isScrolled) {
          isScrolled = currentScrolled
          setScrolled(isScrolled)
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [threshold])

  return { scrolled }
}
