import { describe, it, expect } from 'vitest'

// Unit-testable validation logic extracted from ai/chat/route.ts
const MAX_MESSAGE_LENGTH = 2000

function validateMessage(body: unknown): { ok: true; message: string; sessionId: string | null } | { ok: false; error: string; status: number } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid JSON', status: 400 }
  const { message, session_id } = body as Record<string, unknown>
  if (!message || typeof message !== 'string' || !message.trim())
    return { ok: false, error: 'message is required', status: 400 }
  if (message.length > MAX_MESSAGE_LENGTH)
    return { ok: false, error: 'Message too long (max 2000 chars)', status: 400 }
  const sessionId = typeof session_id === 'string' ? session_id : null
  return { ok: true, message: message.trim(), sessionId }
}

describe('chat route — message validation', () => {
  it('accepts a valid message', () => {
    const r = validateMessage({ message: 'כמה קלוריות אכלתי?' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.message).toBe('כמה קלוריות אכלתי?')
  })

  it('trims whitespace from message', () => {
    const r = validateMessage({ message: '  hello  ' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.message).toBe('hello')
  })

  it('rejects empty message', () => {
    const r = validateMessage({ message: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })

  it('rejects whitespace-only message', () => {
    const r = validateMessage({ message: '   ' })
    expect(r.ok).toBe(false)
  })

  it('rejects message over 2000 chars', () => {
    const r = validateMessage({ message: 'a'.repeat(2001) })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('2000')
  })

  it('accepts message at exactly 2000 chars', () => {
    const r = validateMessage({ message: 'a'.repeat(2000) })
    expect(r.ok).toBe(true)
  })

  it('rejects missing message field', () => {
    const r = validateMessage({ session_id: 'abc' })
    expect(r.ok).toBe(false)
  })

  it('extracts string session_id', () => {
    const r = validateMessage({ message: 'hi', session_id: 'abc-123' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.sessionId).toBe('abc-123')
  })

  it('returns null sessionId when session_id is not a string', () => {
    const r = validateMessage({ message: 'hi', session_id: 42 })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.sessionId).toBeNull()
  })

  it('returns null sessionId when session_id is absent', () => {
    const r = validateMessage({ message: 'hi' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.sessionId).toBeNull()
  })
})
