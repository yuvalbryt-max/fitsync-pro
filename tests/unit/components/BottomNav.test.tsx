import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BottomNav from '@/components/layout/BottomNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('BottomNav', () => {
  it('renders all 5 nav items', () => {
    render(<BottomNav />)
    expect(screen.getByText('בית')).toBeInTheDocument()
    expect(screen.getByText('אימון')).toBeInTheDocument()
    expect(screen.getByText('תזונה')).toBeInTheDocument()
    expect(screen.getByText('ניתוח')).toBeInTheDocument()
    expect(screen.getByText('AI Chat')).toBeInTheDocument()
  })

  it('marks the home route as active', () => {
    render(<BottomNav />)
    const homeLink = screen.getByText('בית').closest('a')
    expect(homeLink).toHaveClass('text-[#3b82f6]')
  })
})
