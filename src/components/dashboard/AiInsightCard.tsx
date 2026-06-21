import type { AiInsight } from '@/lib/types'

interface AiInsightCardProps {
  insight: AiInsight | null
}

export default function AiInsightCard({ insight }: AiInsightCardProps) {
  if (!insight) return null

  return (
    <div className="bg-gradient-to-br from-[#120d1e] to-[#0f1a2e] border border-[#2d1a52] border-t-2 border-t-[#ec4899] rounded-2xl p-3.5 col-span-2">
      <div className="inline-flex items-center gap-1.5 bg-[#3d0e29] border border-[#7a1040] text-[#ec4899] text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide mb-2">
        ג¦ AI ׳×׳•׳‘׳ ׳” ׳™׳•׳׳™׳×
      </div>
      <p
        className="text-[12px] text-[#c8d4e4] leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: insight.content
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#e8edf5]">$1</strong>'),
        }}
      />
    </div>
  )
}

