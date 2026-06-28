import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AppHeader } from '@/components/v0-ui/app-header'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

describe('AppHeader', () => {
  it('renders the title', () => {
    render(<AppHeader title="לוח הבריאות שלי" />)
    expect(screen.getByText('לוח הבריאות שלי')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<AppHeader title="תזונה" subtitle="היום" />)
    expect(screen.getByText('היום')).toBeInTheDocument()
  })

  it('does not render subtitle when omitted', () => {
    render(<AppHeader title="אימונים" />)
    expect(screen.queryByText('היום')).not.toBeInTheDocument()
  })

  it('renders profile avatar with accessible role', () => {
    render(<AppHeader title="כותרת" />)
    expect(screen.getByRole('img', { name: 'אווטאר פרופיל' })).toBeInTheDocument()
  })

  it('renders as a header landmark', () => {
    render(<AppHeader title="כותרת" />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders badge when provided', () => {
    render(<AppHeader title="כותרת" badge={<span>NEW</span>} />)
    expect(screen.getByText('NEW')).toBeInTheDocument()
  })

  it('does not render badge when omitted', () => {
    render(<AppHeader title="כותרת" />)
    expect(screen.queryByText('NEW')).not.toBeInTheDocument()
  })

  it('does not render a notification bell (removed — no backend)', () => {
    render(<AppHeader title="כותרת" />)
    expect(screen.queryByRole('button', { name: 'התראות' })).not.toBeInTheDocument()
  })
})
