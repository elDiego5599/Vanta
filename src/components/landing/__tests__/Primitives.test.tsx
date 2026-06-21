import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Reveal, Title25D, PremiumEdgeWrapper, ThemeToggle } from '../Primitives'

describe('Primitives', () => {
  it('renders Reveal with default props', () => {
    const { container } = render(
      <Reveal>
        <div>Content</div>
      </Reveal>
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders Title25D', () => {
    const { container } = render(
      <Title25D text1="Inteligencia" text2="Forense" />
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders PremiumEdgeWrapper with default glow', () => {
    const { container } = render(
      <PremiumEdgeWrapper>
        <div>Wrapped content</div>
      </PremiumEdgeWrapper>
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders PremiumEdgeWrapper with custom colors', () => {
    const { container } = render(
      <PremiumEdgeWrapper glowColor="#3b82f6" mainColor="#60a5fa">
        <div>Blue glow</div>
      </PremiumEdgeWrapper>
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders ThemeToggle in dark mode', () => {
    const { container } = render(
      <ThemeToggle theme="dark" setTheme={() => {}} />
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders ThemeToggle in light mode', () => {
    const { container } = render(
      <ThemeToggle theme="light" setTheme={() => {}} />
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
