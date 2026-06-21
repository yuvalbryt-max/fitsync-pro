'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = {
  id: number
  role: 'user' | 'ai'
  text: string
}

const INITIAL: Message[] = [
  {
    id: 1,
    role: 'ai',
    text: 'שלום! אני המאמן האישי החכם שלך. אני כאן כדי לעזור לך עם תזונה, אימונים ויעדי כושר. איך אפשר לעזור היום?',
  },
  {
    id: 2,
    role: 'user',
    text: 'כמה חלבון כדאי לי לאכול ביום כדי לבנות שריר?',
  },
  {
    id: 3,
    role: 'ai',
    text: 'שאלה מצוינת! לבניית שריר מומלץ לצרוך כ-1.6 עד 2.2 גרם חלבון לכל ק״ג משקל גוף. לפי הנתונים שלך, היעד היומי הוא כ-140 גרם. כדאי לפזר את הצריכה על פני 4-5 ארוחות.',
  },
]

const QUICK_PROMPTS = [
  'בנה לי תוכנית אימון',
  'מתכון ארוחת ערב בריאה',
  'איך לשפר את השינה?',
  'ניתוח ההתקדמות שלי',
]

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>(INITIAL)
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', text: trimmed },
      {
        id: Date.now() + 1,
        role: 'ai',
        text: 'תודה על השאלה! אני מנתח את הנתונים שלך ואחזור אליך עם המלצה מותאמת אישית בעוד רגע.',
      },
    ])
    setInput('')
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm font-medium leading-relaxed text-primary-foreground shadow-sm">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-gradient-to-br from-primary to-teal p-[1.5px] shadow-sm">
                <div className="flex flex-col gap-1.5 rounded-2xl rounded-tl-md bg-card px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                    <Sparkles className="h-3 w-3" />
                    AI Coach
                  </span>
                  <p className="text-sm font-medium leading-relaxed text-foreground">{m.text}</p>
                </div>
              </div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 border-t border-border bg-card/95 px-4 pb-3 pt-3 backdrop-blur-md">
        <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => send(p)}
              className="shrink-0 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {p}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex items-center gap-2"
        >
          <input
            dir="rtl"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="כתוב הודעה למאמן..."
            className="h-11 flex-1 rounded-2xl bg-secondary px-4 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
          />
          <button
            type="submit"
            aria-label="שלח"
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-95',
            )}
          >
            <Send className="h-5 w-5 -scale-x-100" />
          </button>
        </form>
      </div>
    </div>
  )
}
