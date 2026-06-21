import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DetailedMockupUI from '../MockupUI'

describe('MockupUI', () => {
  it('renders status view (activeIndex=0)', () => {
    const { container } = render(<DetailedMockupUI activeIndex={0} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders transcription view (activeIndex=1)', () => {
    const { container } = render(<DetailedMockupUI activeIndex={1} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders chain view (activeIndex=2)', () => {
    const { container } = render(<DetailedMockupUI activeIndex={2} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders crypto view (activeIndex=3)', () => {
    const { container } = render(<DetailedMockupUI activeIndex={3} />)
    expect(container.firstChild).toMatchSnapshot()
  })
})
