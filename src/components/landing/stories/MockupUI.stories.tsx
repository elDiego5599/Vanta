import type { Meta, StoryObj } from '@storybook/react'
import DetailedMockupUI from '../MockupUI'

const meta: Meta<typeof DetailedMockupUI> = {
  title: 'Landing/MockupUI',
  component: DetailedMockupUI,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof DetailedMockupUI>

export const Status: Story = {
  args: {
    activeIndex: 0,
  },
}

export const Transcription: Story = {
  args: {
    activeIndex: 1,
  },
}

export const Chain: Story = {
  args: {
    activeIndex: 2,
  },
}

export const Crypto: Story = {
  args: {
    activeIndex: 3,
  },
}
