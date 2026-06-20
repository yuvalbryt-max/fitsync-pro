import { formatKcal } from '@/lib/utils'
import type { DailySummary } from '@/lib/types'
interface Props { summary: DailySummary | null }
export default function CalorieBalanceCard({ summary }: Props) {
  if (!summary) return (
    <div className="bg-[#0f1520] border border-[#1c2535] rounded-2xl p-3.5 col-span-2 animate-pulse">
      <div className="h-3 w-24 bg-[#1c2535] rounded mb-3" />
      <div className="h-8 w-32 bg-[#1c2535] rounded mb-3" />
      <div className="h-2 bg-[#1c2535] rounded mb-2" />
      <div className="h-2 bg-[#1c2535] rounded" />
    </div>
  )
  const { consumed_kcal, bmr_kcal, active_kcal, steps_kcal, net_balance, protein_g, carbs_g, fat_g } = summary
  const burn = bmr_kcal + active_kcal + steps_kcal
  const deficit = net_balance <= 0
  return (
    <div className={`bg-[#0f1520] border border-[#1c2535] border-t-2 rounded-2xl p-3.5 col-span-2 ${deficit ? 'border-t-[#10b981]' : 'border-t-[#f43f5e]'}`}>
      <p className="text-[10px] text-[#8896aa] font-semibold uppercase tracking-wide mb-2">מאזן קלורי יומי</p>
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-[28px] font-extrabold tabular ${deficit ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>{deficit ? '' : '+'}{formatKcal(net_balance)}</span>
        <span className="text-xs text-[#8896aa]">קל׳ {deficit ? 'גרעון' : 'עודף'}</span>
        <span className={`mr-auto text-[10px] font-semibold ${deficit ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>{deficit ? '✓ בכיוון' : '⚠ עודף'}</span>
      </div>
      {[
        { label: 'נאכל', value: consumed_kcal, pct: (consumed_kcal / burn) * 100, color: 'bg-[#10b981]' },
        { label: `שרפה (${formatKcal(burn)})`, value: burn, pct: 100, color: 'bg-[#3b82f6]' },
      ].map(({ label, value, pct, color }) => (
        <div key={label} className="mb-2">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-[#8896aa]">{label}</span>
            <span className="font-semibold tabular">{formatKcal(value)}</span>
          </div>
          <div className="h-[5px] bg-[#1c2535] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      ))}
      <div className="flex gap-2 mt-3 pt-3 border-t border-[#1c2535]">
        {[
          { l: 'חלבון', v: protein_g, c: 'text-[#3b82f6]' },
          { l: 'פחמימות', v: carbs_g, c: 'text-[#f59e0b]' },
          { l: 'שומן', v: fat_g, c: 'text-[#8b5cf6]' },
        ].map(({ l, v, c }) => (
          <div key={l} className="flex-1 text-center">
            <p className={`text-sm font-bold tabular ${c}`}>{v}g</p>
            <p className="text-[9px] text-[#8896aa] mt-0.5">{l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
