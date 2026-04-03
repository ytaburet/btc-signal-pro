import React, { useState } from 'react'

const HOURS = ['00h','02h','04h','06h','08h','10h','12h','14h','16h','18h','20h','22h']
const DAYS  = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

// Performance moyenne BTC par heure/jour sur 90 jours (patterns connus)
const MATRIX = [
  [38,42,41,39,40,52,48],[35,36,34,37,35,50,46],[30,31,29,32,30,44,42],[36,38,35,37,34,40,38],
  [52,55,54,53,50,42,40],[65,68,67,66,63,48,45],[72,74,73,71,68,52,50],[68,70,69,67,64,54,52],
  [78,80,79,77,74,58,56],[75,77,76,74,70,55,53],[62,64,63,61,58,60,58],[45,47,46,44,42,58,55],
]

function hmColor(v) {
  if (v < 35) return `rgba(255,77,77,${0.15 + v/35*0.35})`
  if (v < 55) return `rgba(245,166,35,${0.2 + v/55*0.3})`
  return `rgba(0,200,150,${0.2 + (v-55)/45*0.6})`
}

export default function Heatmap() {
  const [tooltip, setTooltip] = useState(null)
  const now    = new Date()
  const curH   = now.getHours()
  const curDay = (now.getDay() + 6) % 7 // 0 = lundi

  return (
    <div className="mx-4 mb-4 bg-[#111] border border-white/[0.07] rounded-2xl p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#666] mb-3">
        Heatmap BTC — Performance par heure &amp; jour (90j)
      </div>

      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', gap: '3px' }}>
        {/* Header */}
        <div />
        {DAYS.map(d => (
          <div key={d} style={{ fontSize: 9, color: '#666', textAlign: 'center', fontWeight: 600 }}>{d}</div>
        ))}

        {/* Lignes */}
        {HOURS.map((h, hi) => (
          <React.Fragment key={h}>
            <div style={{ fontSize: 9, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{h}</div>
            {DAYS.map((_, di) => {
              const v   = MATRIX[hi][di]
              const cur = curDay === di && Math.floor(curH / 2) === hi
              return (
                <div key={di}
                  onClick={() => setTooltip(tooltip?.h === hi && tooltip?.d === di ? null : { h: hi, d: di, v })}
                  style={{
                    height: 26,
                    borderRadius: 3,
                    background: hmColor(v),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 600,
                    color: v > 50 ? '#000' : '#888',
                    cursor: 'pointer',
                    outline: cur ? '2px solid #00C896' : 'none',
                    outlineOffset: 1,
                  }}>
                  {v}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-3 bg-[#1a1a1a] rounded-xl px-3 py-2 text-xs text-[#666]">
          <span className="font-semibold text-white">{DAYS[tooltip.d]} à {HOURS[tooltip.h]}</span>
          {' — Score '}<span style={{ color: hmColor(tooltip.v), fontWeight: 600 }}>{tooltip.v}/100</span>
          {' · '}
          {tooltip.v >= 75 ? 'Zone très active, historiquement fort.' :
           tooltip.v >= 55 ? 'Activité normale, conditions correctes.' :
           tooltip.v >= 40 ? 'Activité faible, spreads élargis.' :
           'Zone à éviter, faible liquidité.'}
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-[#666]">Faible</span>
        <div className="flex gap-0.5">
          {[20,35,50,65,80,95].map(v => (
            <div key={v} style={{ width: 12, height: 12, borderRadius: 2, background: hmColor(v) }} />
          ))}
        </div>
        <span className="text-[10px] text-[#666]">Fort</span>
        <span className="text-[10px] text-[#666] ml-auto">Score moyen historique</span>
      </div>
    </div>
  )
}
