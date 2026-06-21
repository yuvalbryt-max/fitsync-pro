type Ring = {
  value: number // 0..100
  color: string
}

type ActivityRingsProps = {
  rings: Ring[]
  size?: number
  centerLabel?: string
  centerSub?: string
}

export function ActivityRings({
  rings,
  size = 132,
  centerLabel,
  centerSub,
}: ActivityRingsProps) {
  const stroke = 9
  const gap = 5
  const center = size / 2

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${center} ${center})`}>
          {rings.map((ring, i) => {
            const r = center - stroke / 2 - i * (stroke + gap)
            const circ = 2 * Math.PI * r
            const dash = (Math.min(Math.max(ring.value, 0), 100) / 100) * circ
            return (
              <g key={i}>
                <circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth={stroke}
                />
                <circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ - dash}`}
                />
              </g>
            )
          })}
        </g>
      </svg>
      {(centerLabel || centerSub) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel && (
            <span className="text-2xl font-extrabold leading-none text-primary-foreground">
              {centerLabel}
            </span>
          )}
          {centerSub && (
            <span className="mt-1 text-[11px] font-medium text-primary-foreground/70">
              {centerSub}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
