import React, { useState, useEffect } from 'react'

function getEvents() {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth(), d = now.getDate()
  return [
    { date: new Date(y,m,d+2,20,0),  name: 'FOMC — Décision taux FED',      detail: 'Impact direct sur BTC si surprise. Éviter positions ouvertes avant annonce.', impact: 'high', btcImpact: 'Très volatil',      col: '#FF4D4D' },
    { date: new Date(y,m,d+5,14,30), name: 'CPI US — Inflation mensuelle',   detail: 'Inflation haute = taux haut = baissier actifs risqués.',                       impact: 'high', btcImpact: 'Selon résultat',    col: '#FF4D4D' },
    { date: new Date(y,m,d+8,14,30), name: 'NFP — Emploi non-agricole',      detail: 'Indicateur économique clé US. Corrélé aux actifs risqués.',                    impact: 'med',  btcImpact: 'Volatilité',        col: '#F5A623' },
    { date: new Date(y,m,d+11,0,0),  name: 'Expiration options BTC — Deribit',detail: 'Mouvements fréquents avant et après les grandes expirations.',                 impact: 'med',  btcImpact: 'Volatilité',        col: '#00C896' },
    { date: new Date(y,m,d+18,14,30),name: 'PPI US — Prix producteurs',      detail: 'Indicateur avancé de l\'inflation. Corrélé au CPI.',                          impact: 'low',  btcImpact: 'Impact limité',     col: '#F5A623' },
  ].filter(e => e.date > now).sort((a, b) => a.date - b.date).slice(0, 5)
}

function countdown(date) {
  const diff = date - Date.now()
  const days = Math.floor(diff / 86400000)
  const h    = Math.floor((diff % 86400000) / 3600000)
  const min  = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `Dans ${days}j ${h}h`
  if (h > 0)    return `Dans ${h}h ${min}min`
  return `Dans ${min} min`
}

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function MacroCalendar() {
  const [events, setEvents] = useState(getEvents)
  const [, tick] = useState(0)

  // Refresh countdown chaque minute
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mx-4 mb-4 bg-[#111] border border-white/[0.07] rounded-2xl p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#666] mb-3">
        Calendrier macro — Impact crypto
      </div>

      {events.length === 0 && (
        <div className="text-xs text-[#666] text-center py-4">Aucun événement imminent</div>
      )}

      {events.map((e, i) => {
        const day  = e.date.getDate().toString().padStart(2, '0')
        const mo   = MONTHS[e.date.getMonth()]
        const time = e.date.getHours() > 0
          ? e.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : 'Toute la journée'
        const impactCls = e.impact === 'high'
          ? 'bg-[#FF4D4D]/15 text-[#FF4D4D]'
          : e.impact === 'med'
          ? 'bg-[#F5A623]/12 text-[#F5A623]'
          : 'bg-[#1a1a1a] text-[#666]'
        const impactLbl = e.impact === 'high' ? 'Fort' : e.impact === 'med' ? 'Moyen' : 'Faible'

        return (
          <div key={i} className={`flex gap-3 py-3 ${i < events.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
            {/* Date */}
            <div className="min-w-[40px] text-center flex-shrink-0" style={{ color: e.col }}>
              <div className="text-lg font-extrabold leading-none">{day}</div>
              <div className="text-[10px] uppercase">{mo}</div>
              <div className="text-[9px] text-[#666] mt-0.5">{time}</div>
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold mb-1 leading-tight">{e.name}</div>
              <div className="text-xs text-[#666] leading-relaxed mb-2">{e.detail}</div>
              <div className="flex gap-2 flex-wrap items-center">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${impactCls}`}>{impactLbl}</span>
                <span className="text-[10px]" style={{ color: e.btcImpact.includes('volatil') ? '#F5A623' : e.col }}>
                  BTC : {e.btcImpact}
                </span>
                <span className="text-[10px] text-[#444] ml-auto">{countdown(e.date)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
