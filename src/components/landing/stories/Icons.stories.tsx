import type { Meta, StoryObj } from '@storybook/react'
import { VantaLogo, IconShield, IconBrain, IconLink, IconLock, IconUpload, IconSun, IconMoon, IconSystem } from '../Icons'

const meta: Meta<typeof VantaLogo> = {
  title: 'Landing/Icons',
  component: VantaLogo,
}

export default meta
type Story = StoryObj<typeof VantaLogo>

export const Logo: Story = {
  args: {
    className: 'w-16 h-16',
  },
}

export const LogoSmall: Story = {
  args: {
    className: 'w-8 h-8',
  },
}

export const LogoLarge: Story = {
  args: {
    className: 'w-32 h-32',
  },
}

export const AllFeatureIcons: Story = {
  render: () => (
    <div className="flex gap-8 items-center p-8 bg-black">
      <IconShield color="#ffffff" />
      <IconBrain color="#3b82f6" />
      <IconLink color="#22c55e" />
      <IconLock color="#a78bfa" />
      <IconUpload color="#f59e0b" />
    </div>
  ),
}

export const ThemeIcons: Story = {
  render: () => (
    <div className="flex gap-6 items-center p-8 bg-black">
      <IconSun />
      <IconMoon />
      <IconSystem />
    </div>
  ),
}
