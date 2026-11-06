import { tr } from '../i18n'
import type { AttrKey, Attributes } from '../engine/types'
import { ATTR_LABELS } from '../engine/player'

// 픽셀 레이더: 바탕 다각형 + 눈금 3겹, base(점선) 위에 vals(채움). 꼭짓점 밖에 라벨과 값
// 라벨이 좌우로 길게 나가도 잘리지 않게 viewBox 가로를 넉넉히 잡고, 넘치면 보이게 둔다
const VW = 400
const VH = 300
const R = 96

export function Radar({
  keys,
  vals,
  base,
  lo,
  hi,
  hover,
  fmt = (v) => String(Math.round(v)),
  rings,
  label,
}: {
  keys: AttrKey[]
  vals: Attributes
  base?: Attributes
  lo: number
  hi: number
  hover?: AttrKey | null
  fmt?: (v: number) => string
  // 눈금 값 표시 (절반·바깥)
  rings?: boolean
  label: string
}) {
  const n = keys.length
  const cx = VW / 2
  const cy = VH / 2
  const ang = (i: number) => ((-90 + (i * 360) / n) * Math.PI) / 180
  const at = (i: number, f: number): [number, number] => [
    cx + R * f * Math.cos(ang(i)),
    cy + R * f * Math.sin(ang(i)),
  ]
  const pt = (i: number, v: number) =>
    at(i, Math.max(0.03, Math.min(1.1, (v - lo) / (hi - lo))))
  const pts = (a: [number, number][]) =>
    a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const mid = ((-90 + 180 / n) * Math.PI) / 180

  return (
    <svg
      className="radar"
      viewBox={`0 0 ${VW} ${VH}`}
      role="img"
      aria-label={label}
    >
      <polygon
        className="radar-bg"
        points={pts(keys.map((_, i) => at(i, 1)))}
      />
      {[0.25, 0.5, 0.75].map((f) => (
        <polygon
          key={f}
          className="radar-ring"
          points={pts(keys.map((_, i) => at(i, f)))}
        />
      ))}
      {keys.map((k, i) => {
        const [x, y] = at(i, 1)
        return (
          <line
            key={k}
            className={k === hover ? 'radar-spoke on' : 'radar-spoke'}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
          />
        )
      })}
      {base && (
        <polygon
          className="radar-base"
          points={pts(keys.map((k, i) => pt(i, base[k])))}
        />
      )}
      <polygon
        className="radar-cur"
        points={pts(keys.map((k, i) => pt(i, vals[k])))}
      />
      {keys.map((k, i) => {
        const [x, y] = pt(i, vals[k])
        const s = k === hover ? 11 : 7
        return (
          <rect
            key={k}
            className={k === hover ? 'radar-dot on' : 'radar-dot'}
            x={x - s / 2}
            y={y - s / 2}
            width={s}
            height={s}
          />
        )
      })}
      {rings &&
        [0.5, 1].map((f) => (
          <text
            key={f}
            className="radar-tick"
            x={cx + R * f * Math.cos(mid) * 0.87 + 4}
            y={cy + R * f * Math.sin(mid) * 0.87 + 4}
          >
            {Math.round(lo + (hi - lo) * f)}
          </text>
        ))}
      {keys.map((k, i) => {
        const c = Math.cos(ang(i))
        const x = cx + (R + 20) * c
        const y = cy + (R + 22) * Math.sin(ang(i))
        const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end'
        return (
          <g key={k} textAnchor={anchor}>
            <text
              className={k === hover ? 'radar-label on' : 'radar-label'}
              x={x}
              y={y - 6}
            >
              {tr(ATTR_LABELS[k])}
            </text>
            <text className="radar-value" x={x} y={y + 12}>
              {fmt(vals[k])}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
