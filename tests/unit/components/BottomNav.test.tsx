import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
// Test the v0-ui BottomNav — the one actually used in production
import { BottomNav } from '@/components/v0-ui/bottom-nav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('BottomNav (v0-ui)', () => {
  it('renders all 5 nav items', () => {
    render(<BottomNav />)
    expect(screen.getByText('בית')).toBeInTheDocument()
    expect(screen.getByText('אימון')).toBeInTheDocument()
    expect(screen.getByText('תזונה')).toBeInTheDocument()
    expect(screen.getByText('ניתוח')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('marks the home route as active with text-primary class', () => {
    render(<BottomNav />)
    const homeLabel = screen.getByText('בית')
    // The active label span has text-primary class
    expect(homeLabel).toHaveClass('text-primary')
  })

  it('non-active items use text-muted-foreground', () => {
    render(<BottomNav />)
    const aiLabel = screen.getByText('AI')
    expect(aiLabel).toHaveClass('text-muted-foreground')
  })

  it('home link has correct href', () => {
    render(<BottomNav />)
    const homeLink = screen.getByText('בית').closest('a')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('training link has correct href', () => {
    render(<BottomNav />)
    const link = screen.getByText('אימון').closest('a')
    expect(link).toHaveAttribute('href', '/training')
  })
})
