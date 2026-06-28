import type { AiInsight } from '@/lib/types'

interface AiInsightCardProps {
  insight: AiInsight | null
}

export default function AiInsightCard({ insight }: AiInsightCardProps) {
  if (!insight) return null

  const safeHtml = insight.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  return (
    <div className="bg-card border border-border border-t-2 border-t-pink rounded-2xl p-4 shadow-sm">
      <div className="inline-flex items-center gap-1.5 bg-pink-soft text-pink text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide mb-2">
        ✦ AI תובנה יומית
      </div>
      <p
        className="text-[13px] text-foreground/80 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  )
}
