import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ReadinessRing from '@/components/dashboard/ReadinessRing'

describe('ReadinessRing', () => {
  it('displays the score number', () => {
    render(<ReadinessRing score={78} />)
    expect(screen.getByText('78')).toBeInTheDocument()
  })
  it('displays default READINESS label', () => {
    render(<ReadinessRing score={78} />)
    expect(screen.getByText('READINESS')).toBeInTheDocument()
  })
  it('displays custom label', () => {
    render(<ReadinessRing score={50} label="SCORE" />)
    expect(screen.getByText('SCORE')).toBeInTheDocument()
  })
})
