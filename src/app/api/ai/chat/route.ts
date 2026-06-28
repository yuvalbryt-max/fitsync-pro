import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

function getAnthropic() { return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) }

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { message?: unknown; session_id?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { message, session_id } = body
  if (!message || typeof message !== 'string' || !message.trim())
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  if (message.length > 2000)
    return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 })
  const sessionIdStr = typeof session_id === 'string' ? session_id : null

  const today = new Date().toISOString().slice(0, 10)

  const [summaryRes, insightRes, recentMsgsRes] = await Promise.all([
    supabase.from('daily_summary').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('ai_insights').select('content,insight_date').eq('user_id', user.id)
      .order('insight_date', { ascending: false }).limit(3),
    sessionIdStr
      ? supabase.from('chat_messages').select('role,content').eq('user_id', user.id)
          .eq('session_id', sessionIdStr).order('created_at', { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
  ])

  const summary    = summaryRes.data
  const insights   = insightRes.data || []
  const recentMsgs = (recentMsgsRes.data || []).reverse()

  const systemPrompt = `אתה מאמן כושר ותזונה אישי חכם. אתה מדבר בעברית.
אתה מכיר את הנתונים של המשתמש ומשתמש בהם בתשובות שלך.

${summary ? `נתוני היום (${today}):
- BMR: ${summary.bmr_kcal} קל׳
- פעילות: ${summary.active_kcal} קל׳
- נאכל: ${summary.consumed_kcal} קל׳
- מאזן: ${summary.net_balance > 0 ? '+' : ''}${summary.net_balance} קל׳ (${summary.net_balance <= 0 ? 'גרעון' : 'עודף'})
- חלבון: ${summary.protein_g}g | פחמימות: ${summary.carbs_g}g | שומן: ${summary.fat_g}g` : 'אין נתוני תזונה להיום עדיין.'}

${insights.length ? `תובנות אחרונות:\n${insights.map(i => `• ${i.insight_date}: ${i.content.slice(0, 100)}...`).join('\n')}` : ''}

ענה בתמציתיות. השתמש ב-**bold** לנתונים חשובים. אם שואלים על קלוריות, תן מספרים מדויקים.`

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...recentMsgs.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]

  try {
    const response = await getAnthropic().messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 500,
      system:     systemPrompt,
      messages,
    })

    const firstBlock = response.content?.[0]
    const assistantContent = firstBlock?.type === 'text' ? firstBlock.text : ''
    if (!assistantContent) throw new Error('Empty response from AI')
    const sid = sessionIdStr || crypto.randomUUID()

    await supabase.from('chat_messages').insert([
      { user_id: user.id, session_id: sid, role: 'user',      content: message.trim(),   model_used: null },
      { user_id: user.id, session_id: sid, role: 'assistant', content: assistantContent, model_used: 'claude-sonnet-4-6' },
    ])

    return NextResponse.json({ reply: assistantContent, session_id: sid })
  } catch (err) {
    console.error('[ai/chat POST]', err)
    const isQuota = String(err).includes('429') || String(err).toLowerCase().includes('quota')
    return NextResponse.json({
      error: isQuota ? 'שירות ה-AI עמוס כרגע. נסה שוב בעוד דקה.' : 'שגיאה בתקשורת עם ה-AI. נסה שוב.',
    }, { status: isQuota ? 503 : 500 })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json((data || []).reverse())
}
