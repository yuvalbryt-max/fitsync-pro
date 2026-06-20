import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MetricCard from '@/components/dashboard/MetricCard'

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="צעדים" value="8,420" accent="blue" />)
    expect(screen.getByText('צעדים')).toBeInTheDocument()
    expect(screen.getByText('8,420')).toBeInTheDocument()
  })
  it('renders subtitle when provided', () => {
    render(<MetricCard label="צעדים" value="8,420" accent="blue" sub="יעד: 10,000" />)
    expect(screen.getByText('יעד: 10,000')).toBeInTheDocument()
  })
  it('does not render subtitle when omitted', () => {
    render(<MetricCard label="HRV" value="58" accent="blue" />)
    expect(screen.queryByText('יעד')).not.toBeInTheDocument()
  })
})
