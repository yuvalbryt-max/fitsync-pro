'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (!error) setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080c14] px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">💪</div>
          <h1 className="text-2xl font-bold text-[#e8edf5]">FitSync Pro</h1>
          <p className="text-[#8896aa] text-sm mt-1">פלטפורמת הכושר האישית שלך</p>
        </div>

        {sent ? (
          <div className="bg-[#0d3326] border border-[#0a5e40] rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">📧</div>
            <p className="text-[#10b981] font-semibold">בדוק את המייל שלך</p>
            <p className="text-[#8896aa] text-sm mt-2">
              שלחנו קישור כניסה ל-{email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#8896aa] mb-2"
              >
                כתובת אימייל
              </label>
              <input
                id="email"
                type="email"
                placeholder="כתובת אימייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0f1520] border border-[#1c2535] rounded-xl px-4 py-3 text-[#e8edf5] placeholder:text-[#3d4f65] focus:outline-none focus:border-[#3b82f6] text-base"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'שולח...' : 'שלח קישור כניסה'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
