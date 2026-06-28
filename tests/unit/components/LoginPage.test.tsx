import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
const mockSignInWithOtp = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithOtp: mockSignInWithOtp },
  }),
}))

import LoginPage from '@/app/auth/login/page'

describe('LoginPage', () => {
  beforeEach(() => { mockSignInWithOtp.mockReset() })

  it('renders FitSync Pro branding', () => {
    render(<LoginPage />)
    expect(screen.getByText('FitSync Pro')).toBeInTheDocument()
    expect(screen.getByText('פלטפורמת הכושר האישית שלך')).toBeInTheDocument()
  })

  it('has accessible main landmark', () => {
    render(<LoginPage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders email label and input', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('כתובת אימייל')).toBeInTheDocument()
  })

  it('submit button disabled when email is empty', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: 'שלח קישור כניסה' })).toBeDisabled()
  })

  it('submit button enabled after typing email', () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test@example.com' } })
    expect(screen.getByRole('button', { name: 'שלח קישור כניסה' })).toBeEnabled()
  })

  it('shows success state after OTP sent', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null })
    render(<LoginPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'שלח קישור כניסה' }))
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(screen.getByText('בדוק את המייל שלך')).toBeInTheDocument()
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument()
  })

  it('shows error message on auth failure', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: { message: 'Invalid email' } })
    render(<LoginPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'bad@test.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'שלח קישור כניסה' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
  })
})
