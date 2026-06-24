import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
// Test the v0-ui BottomNav — the one actually used in production
import { BottomNav } from '@/components/v0-ui/bottom-nav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('BottomNav (v0-ui)', () => {
  it('renders all 6 nav items', () => {
    render(<BottomNav />)
    expect(screen.getByText('בית')).toBeInTheDocument()
    expect(screen.getByText('אימון')).toBeInTheDocument()
    expect(screen.getByText('תזונה')).toBeInTheDocument()
    expect(screen.getByText('משקל')).toBeInTheDocument()
    expect(screen.getByText('ניתוח')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('marks the home route as active with text-primary class', () => {
    render(<BottomNav />)
    expect(screen.getByText('בית')).toHaveClass('text-primary')
  })

  it('non-active items use text-muted-foreground', () => {
    render(<BottomNav />)
    expect(screen.getByText('AI')).toHaveClass('text-muted-foreground')
  })

  it('home link has correct href', () => {
    render(<BottomNav />)
    expect(screen.getByText('בית').closest('a')).toHaveAttribute('href', '/')
  })

  it('training link has correct href', () => {
    render(<BottomNav />)
    expect(screen.getByText('אימון').closest('a')).toHaveAttribute('href', '/training')
  })

  it('weight link has correct href /body/weight', () => {
    render(<BottomNav />)
    expect(screen.getByText('משקל').closest('a')).toHaveAttribute('href', '/body/weight')
  })

  it('analytics link has correct href', () => {
    render(<BottomNav />)
    expect(screen.getByText('ניתוח').closest('a')).toHaveAttribute('href', '/analytics')
  })
})
