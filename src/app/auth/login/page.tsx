'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (authError) setError(authError.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6">
      <main className="w-full max-w-sm" aria-label="כניסה לחשבון">

        {/* לוגו */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-4">
            <Activity className="h-8 w-8 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">FitSync Pro</h1>
          <p className="text-muted-foreground text-sm mt-1">פלטפורמת הכושר האישית שלך</p>
        </div>

        {sent ? (
          <div
            role="status"
            aria-live="polite"
            className="bg-green-soft border border-green rounded-2xl p-6 text-center shadow-sm"
          >
            <div className="text-3xl mb-3" aria-hidden="true">📧</div>
            <p className="text-green font-semibold">בדוק את המייל שלך</p>
            <p className="text-muted-foreground text-sm mt-2">
              שלחנו קישור כניסה ל-<strong className="text-foreground">{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                    כתובת אימייל
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? 'login-error' : undefined}
                    className="w-full bg-muted border border-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary text-base transition-colors"
                  />
                </div>

                {error && (
                  <p
                    id="login-error"
                    role="alert"
                    className="text-sm text-red bg-red-soft border border-red rounded-xl px-4 py-3"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-xl transition-colors"
                >
                  {loading ? 'שולח...' : 'שלח קישור כניסה'}
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              נשלח אליך קישור magic link — ללא סיסמה
            </p>
          </form>
        )}
      </main>
    </div>
  )
}
