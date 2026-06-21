'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BottomNav } from '@/components/v0-ui/bottom-nav'
import { Send, Bot, User, Loader2, RefreshCw } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

const QUICK_PROMPTS = [
  '׳›׳׳” ׳§׳׳•׳¨׳™׳•׳× ׳׳›׳׳×׳™ ׳”׳™׳•׳?',
  '׳׳” ׳”׳׳׳–׳ ׳”׳§׳׳•׳¨׳™ ׳©׳׳™?',
  '׳›׳׳” ׳—׳׳‘׳•׳ ׳׳ ׳™ ׳¦׳¨׳™׳?',
  '׳×׳ ׳׳™ ׳˜׳™׳₪ ׳׳×׳–׳•׳ ׳”',
  '׳׳” ׳׳׳›׳•׳ ׳׳—׳¨׳™ ׳׳™׳׳•׳?',
]

function renderMarkdown(text: string) {
  // Simple bold rendering: **text** ג†’ <strong>
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      setHistoryLoading(true)
      try {
        const res = await fetch('/api/ai/chat')
        if (!res.ok) throw new Error('Failed to load history')
        const data: Message[] = await res.json()
        if (data.length > 0) {
          setMessages(data)
        } else {
          // Welcome message
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: '׳©׳׳•׳! ׳׳ ׳™ ׳”׳׳׳׳ ׳”׳׳™׳©׳™ ׳©׳׳ נ’×\n׳׳ ׳™ ׳™׳›׳•׳ ׳׳¢׳ ׳•׳× ׳¢׳ ׳©׳׳׳•׳× ׳׳’׳‘׳™ ׳”׳×׳–׳•׳ ׳”, ׳”׳›׳•׳©׳¨ ׳•׳”׳ ׳×׳•׳ ׳™׳ ׳©׳׳.\n׳‘׳׳” ׳׳•׳›׳ ׳׳¢׳–׳•׳¨ ׳”׳™׳•׳?',
          }])
        }
      } catch {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: '׳©׳׳•׳! ׳׳ ׳™ ׳”׳׳׳׳ ׳”׳׳™׳©׳™ ׳©׳׳ נ’×\n׳©׳׳ ׳׳•׳×׳™ ׳›׳ ׳©׳׳׳” ׳¢׳ ׳×׳–׳•׳ ׳” ׳•׳›׳•׳©׳¨.',
        }])
      } finally {
        setHistoryLoading(false)
      }
    }
    loadHistory()
  }, [])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError(null)

    // Typing indicator message
    const typingId = 'typing-' + Date.now()
    setMessages(prev => [...prev, { id: typingId, role: 'assistant', content: '...' }])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), session_id: sessionId }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to send message')
      }
      const data = await res.json()
      if (data.session_id) setSessionId(data.session_id)

      // Replace typing indicator with real reply
      setMessages(prev => prev
        .filter(m => m.id !== typingId)
        .concat({ id: Date.now().toString(), role: 'assistant', content: data.reply })
      )
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      setError(String(err))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function clearChat() {
    setSessionId(null)
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: '׳©׳™׳—׳” ׳—׳“׳©׳” ׳”׳×׳—׳™׳׳”! ׳‘׳׳” ׳׳•׳›׳ ׳׳¢׳–׳•׳¨?',
    }])
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#080c14] text-white" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#080c14]/95 border-b border-white/5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#3b82f6]/20 flex items-center justify-center">
            <Bot size={20} className="text-[#3b82f6]" />
          </div>
          <div>
            <h1 className="font-semibold text-sm">AI Coach</h1>
            <p className="text-[10px] text-[#3d4f65]">Claude Sonnet ֲ· ׳׳׳׳ ׳׳™׳©׳™</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 rounded-lg text-[#3d4f65] hover:text-white hover:bg-white/5 transition-colors"
          title="׳©׳™׳—׳” ׳—׳“׳©׳”"
        >
          <RefreshCw size={16} />
        </button>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-2">
        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[#3d4f65]" />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mb-0.5 ${
                  msg.role === 'assistant'
                    ? 'bg-[#3b82f6]/20'
                    : 'bg-[#10b981]/20'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot size={14} className="text-[#3b82f6]" />
                    : <User size={14} className="text-[#10b981]" />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#3b82f6] text-white rounded-tr-sm'
                    : 'bg-[#111827] text-[#e2e8f0] rounded-tl-sm border border-white/5'
                }`}>
                  {msg.content === '...' ? (
                    <div className="flex items-center gap-1 py-1">
                      <span className="w-1.5 h-1.5 bg-[#3d4f65] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#3d4f65] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#3d4f65] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <div
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="text-center">
                <p className="text-xs text-red-400 bg-red-900/20 rounded-lg px-3 py-2 inline-block">
                  {error}
                </p>
              </div>
            )}

            <div ref={bottomRef} />
          </>
        )}
      </main>

      {/* Quick prompts */}
      <div className="px-4 pb-2 overflow-x-auto flex gap-2 scrollbar-hide">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            disabled={loading}
            className="shrink-0 text-xs bg-[#111827] border border-white/10 rounded-full px-3 py-1.5 text-[#94a3b8] hover:text-white hover:border-[#3b82f6]/50 transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="px-4 pb-2 pt-1">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="׳©׳׳ ׳׳× ׳”׳׳׳׳ ׳©׳׳..."
            rows={1}
            disabled={loading || historyLoading}
            className="flex-1 bg-[#111827] border border-white/10 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#3b82f6]/50 placeholder:text-[#3d4f65] leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: '44px' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || historyLoading}
            className="shrink-0 w-11 h-11 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center transition-colors"
          >
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={16} className="rotate-180" />
            }
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}

