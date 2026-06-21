import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, session_id } = await request.json()
  if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)

  // Fetch context in parallel
  const [summaryRes, insightRes, recentMsgsRes] = await Promise.all([
    supabase.from('daily_summary').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('ai_insights').select('content,insight_date').eq('user_id', user.id)
      .order('insight_date', { ascending: false }).limit(3),
    supabase.from('chat_messages').select('role,content').eq('user_id', user.id)
      .eq('session_id', session_id || '').order('created_at', { ascending: false }).limit(10),
  ])

  const summary      = summaryRes.data
  const insights     = insightRes.data || []
  const recentMsgs   = (recentMsgsRes.data || []).reverse()

  // Build system prompt with user context
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

  // Build messages array
  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...recentMsgs.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]

  try {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 500,
      system:     systemPrompt,
      messages,
    })

    const assistantContent = response.content[0].type === 'text' ? response.content[0].text : ''
    const sid = session_id || crypto.randomUUID()

    // Save both messages
    await supabase.from('chat_messages').insert([
      { user_id: user.id, session_id: sid, role: 'user',      content: message,          model_used: null },
      { user_id: user.id, session_id: sid, role: 'assistant', content: assistantContent, model_used: 'claude-sonnet-4-6' },
    ])

    return NextResponse.json({ reply: assistantContent, session_id: sid })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
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
