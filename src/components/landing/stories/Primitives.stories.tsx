import type { Meta, StoryObj } from '@storybook/react'
import { Reveal, MagneticButton, Title25D, PremiumEdgeWrapper, ThemeToggle } from '../Primitives'

const meta: Meta<typeof Reveal> = {
  title: 'Landing/Primitives',
}

export default meta
type Story = StoryObj<typeof Reveal>

export const RevealLeft: Story = {
  render: () => (
    <Reveal dir="left">
      <div className="p-8 bg-white/5 rounded-xl border border-white/10 text-white">
        Revealed from left
      </div>
    </Reveal>
  ),
}

export const RevealRight: Story = {
  render: () => (
    <Reveal dir="right">
      <div className="p-8 bg-white/5 rounded-xl border border-white/10 text-white">
        Revealed from right
      </div>
    </Reveal>
  ),
}

export const MagneticBtn: Story = {
  render: () => (
    <MagneticButton>
      <button className="px-6 py-3 bg-white text-black rounded-full font-bold text-sm">
        Hover me
      </button>
    </MagneticButton>
  ),
}

export const Title: Story = {
  render: () => (
    <div className="p-12 bg-black">
      <Title25D text1="Inteligencia" text2="Forense" />
    </div>
  ),
}

export const GlowingCard: Story = {
  render: () => (
    <div className="p-12 bg-black">
      <PremiumEdgeWrapper className="w-80">
        <div className="p-8 bg-[#050505]">
          <h3 className="text-white font-bold text-lg mb-2">Glowing Card</h3>
          <p className="text-zinc-400 text-sm font-mono">This card has a premium rotating glow border.</p>
        </div>
      </PremiumEdgeWrapper>
    </div>
  ),
}

export const GlowingCardBlue: Story = {
  render: () => (
    <div className="p-12 bg-black">
      <PremiumEdgeWrapper className="w-80" glowColor="rgba(59,130,246,0.4)" mainColor="#3b82f6">
        <div className="p-8 bg-[#050505]">
          <h3 className="text-white font-bold text-lg mb-2">Blue Glow</h3>
          <p className="text-zinc-400 text-sm font-mono">Custom glow color variant.</p>
        </div>
      </PremiumEdgeWrapper>
    </div>
  ),
}

export const ThemeToggleDark: Story = {
  render: () => (
    <div className="p-8 bg-black">
      <ThemeToggle theme="dark" setTheme={() => {}} />
    </div>
  ),
}

export const ThemeToggleLight: Story = {
  render: () => (
    <div className="p-8 bg-white">
      <ThemeToggle theme="light" setTheme={() => {}} />
    </div>
  ),
}
