import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { VantaLogo, IconShield, IconBrain, IconLink, IconLock } from '../Icons'

describe('Icons', () => {
  it('renders VantaLogo with default className', () => {
    const { container } = render(<VantaLogo />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders VantaLogo with custom className', () => {
    const { container } = render(<VantaLogo className="w-12 h-12" />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders all feature icons', () => {
    const { container } = render(
      <div>
        <IconShield />
        <IconBrain color="#3b82f6" />
        <IconLink color="#22c55e" />
        <IconLock color="#a78bfa" />
      </div>
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
