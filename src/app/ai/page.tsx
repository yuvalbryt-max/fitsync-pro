'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BottomNav } from '@/components/v0-ui/bottom-nav'
import { AppHeader } from '@/components/v0-ui/app-header'
import { Send, Loader2, RefreshCw } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

const QUICK_PROMPTS = [
  'כמה קלוריות אכלתי היום?',
  'מה המאזן הקלורי שלי?',
  'כמה חלבון אני צריך?',
  'תן לי טיפ לתזונה',
  'מה לאכול אחרי אימון?',
]

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;').replace(/'/g,'&#x27;')
}
function renderMarkdown(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

export default function AiChatPage() {
  const [messages, setMessages]             = useState<Message[]>([])
  const [input, setInput]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [sessionId, setSessionId]           = useState<string | null>(null)
  const [error, setError]                   = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  useEffect(() => {
    async function loadHistory() {
      setHistoryLoading(true)
      try {
        const res = await fetch('/api/ai/chat')
        if (!res.ok) throw new Error('Failed')
        const data: Message[] = await res.json()
        setMessages(data.length > 0 ? data : [{
          id: 'welcome', role: 'assistant',
          content: 'שלום! אני המאמן האישי שלך 💪\nאני יכול לענות על שאלות לגבי התזונה, הכושר והנתונים שלך.\nבמה אוכל לעזור היום?',
        }])
      } catch {
        setMessages([{ id: 'welcome', role: 'assistant', content: 'שלום! אני המאמן האישי שלך 💪\nשאל אותי כל שאלה על תזונה וכושר.' }])
      } finally {
        setHistoryLoading(false)
      }
    }
    loadHistory()
  }, [])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: text.trim() }])
    setInput(''); setLoading(true); setError(null)
    const typingId = 'typing-' + crypto.randomUUID()
    setMessages(prev => [...prev, { id: typingId, role: 'assistant', content: '...' }])
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), session_id: sessionId }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'שגיאה') }
      const data = await res.json()
      if (data.session_id) setSessionId(data.session_id)
      setMessages(prev => prev.filter(m => m.id !== typingId)
        .concat({ id: crypto.randomUUID(), role: 'assistant', content: data.reply }))
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      setError(String(err).replace('Error: ', ''))
    } finally {
      setLoading(false); inputRef.current?.focus()
    }
  }

  function clearChat() {
    setSessionId(null); setError(null)
    setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: 'שיחה חדשה התחילה! במה אוכל לעזור?' }])
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        title="AI Coach"
        subtitle="Claude Sonnet · מאמן אישי"
        badge={
          <button onClick={clearChat} aria-label="שיחה חדשה"
            className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={11} /> חדש
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mb-0.5 text-[10px] font-bold ${
                  msg.role === 'assistant' ? 'bg-brand-soft text-primary' : 'bg-primary text-primary-foreground'
                }`}>
                  {msg.role === 'assistant' ? 'AI' : 'א'}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-card text-foreground rounded-tl-sm border border-border'
                }`}>
                  {msg.content === '...' ? (
                    <div className="flex items-center gap-1 py-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  )}
                </div>
              </div>
            ))}
            {error && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-red bg-red-soft border border-red rounded-xl px-4 py-2 text-center">{error}</p>
                <button
                  onClick={() => { setError(null); inputRef.current?.focus() }}
                  className="text-xs text-primary underline font-semibold"
                >
                  נסה שוב
                </button>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </main>

      <div className="px-4 pb-2 overflow-x-auto flex gap-2 no-scrollbar">
        {QUICK_PROMPTS.map(prompt => (
          <button key={prompt} onClick={() => sendMessage(prompt)} disabled={loading}
            className="shrink-0 text-xs bg-card border border-border rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50 shadow-sm">
            {prompt}
          </button>
        ))}
      </div>

      <div className="px-4 pb-3 pt-2 border-t border-border bg-card/80 backdrop-blur">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input) }} className="flex items-end gap-2">
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="שאל את המאמן שלך..." rows={1} disabled={loading || historyLoading}
            className="flex-1 bg-muted border border-input rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/50 leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: '44px' }}
          />
          <button type="submit" disabled={loading || !input.trim() || historyLoading}
            className="shrink-0 w-11 h-11 bg-primary hover:bg-primary/90 disabled:opacity-40 rounded-2xl flex items-center justify-center transition-colors">
            {loading
              ? <Loader2 size={16} className="animate-spin text-primary-foreground" />
              : <Send size={16} className="text-primary-foreground rotate-180" />}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}