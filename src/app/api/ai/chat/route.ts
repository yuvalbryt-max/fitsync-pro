import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { message?: unknown; session_id?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { message, session_id } = body
  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 })
  }
  const sessionIdStr = typeof session_id === 'string' ? session_id : null

  const today = new Date().toISOString().slice(0, 10)

  // Fetch context — only load chat history if session_id is provided (null → new session, no history)
  const [summaryRes, insightRes, recentMsgsRes] = await Promise.all([
    supabase.from('daily_summary').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('ai_insights').select('content,insight_date').eq('user_id', user.id)
      .order('insight_date', { ascending: false }).limit(3),
    sessionIdStr
      ? supabase.from('chat_messages').select('role,content').eq('user_id', user.id)
          .eq('session_id', sessionIdStr).order('created_at', { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
  ])

  const summary      = summaryRes.data
  const insights     = insightRes.data || []
  const recentMsgs   = (recentMsgsRes.data || []).reverse()

  // Build system prompt with user context
  const systemPrompt = `׳׳×׳” ׳׳׳׳ ׳›׳•׳©׳¨ ׳•׳×׳–׳•׳ ׳” ׳׳™׳©׳™ ׳—׳›׳. ׳׳×׳” ׳׳“׳‘׳¨ ׳‘׳¢׳‘׳¨׳™׳×.
׳׳×׳” ׳׳›׳™׳¨ ׳׳× ׳”׳ ׳×׳•׳ ׳™׳ ׳©׳ ׳”׳׳©׳×׳׳© ׳•׳׳©׳×׳׳© ׳‘׳”׳ ׳‘׳×׳©׳•׳‘׳•׳× ׳©׳׳.

${summary ? `׳ ׳×׳•׳ ׳™ ׳”׳™׳•׳ (${today}):
- BMR: ${summary.bmr_kcal} ׳§׳׳³
- ׳₪׳¢׳™׳׳•׳×: ${summary.active_kcal} ׳§׳׳³
- ׳ ׳׳›׳: ${summary.consumed_kcal} ׳§׳׳³
- ׳׳׳–׳: ${summary.net_balance > 0 ? '+' : ''}${summary.net_balance} ׳§׳׳³ (${summary.net_balance <= 0 ? '׳’׳¨׳¢׳•׳' : '׳¢׳•׳“׳£'})
- ׳—׳׳‘׳•׳: ${summary.protein_g}g | ׳₪׳—׳׳™׳׳•׳×: ${summary.carbs_g}g | ׳©׳•׳׳: ${summary.fat_g}g` : '׳׳™׳ ׳ ׳×׳•׳ ׳™ ׳×׳–׳•׳ ׳” ׳׳”׳™׳•׳ ׳¢׳“׳™׳™׳.'}

${insights.length ? `׳×׳•׳‘׳ ׳•׳× ׳׳—׳¨׳•׳ ׳•׳×:\n${insights.map(i => `ג€¢ ${i.insight_date}: ${i.content.slice(0, 100)}...`).join('\n')}` : ''}

׳¢׳ ׳” ׳‘׳×׳׳¦׳™׳×׳™׳•׳×. ׳”׳©׳×׳׳© ׳‘-**bold** ׳׳ ׳×׳•׳ ׳™׳ ׳—׳©׳•׳‘׳™׳. ׳׳ ׳©׳•׳׳׳™׳ ׳¢׳ ׳§׳׳•׳¨׳™׳•׳×, ׳×׳ ׳׳¡׳₪׳¨׳™׳ ׳׳“׳•׳™׳§׳™׳.`

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

    const firstBlock = response.content?.[0]
    const assistantContent = firstBlock?.type === 'text' ? firstBlock.text : ''
    if (!assistantContent) throw new Error('Empty response from AI')
    const sid = sessionIdStr || crypto.randomUUID()

    // Save both messages
    await supabase.from('chat_messages').insert([
      { user_id: user.id, session_id: sid, role: 'user',      content: message,          model_used: null },
      { user_id: user.id, session_id: sid, role: 'assistant', content: assistantContent, model_used: 'claude-sonnet-4-6' },
    ])

    return NextResponse.json({ reply: assistantContent, session_id: sid })
  } catch (err) {
    console.error('[ai/chat POST]', err)
    return NextResponse.json({ error: 'שגיאה בתקשורת עם ה-AI. נסה שוב.' }, { status: 500 })
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



