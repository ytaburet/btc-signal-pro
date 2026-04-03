import React, { useState, useEffect } from 'react'

export default function SignalCard({ signal, currentPrice, onDismiss, onAnalyze, onExport }) {
  const [distSL, setDistSL] = useState(0)
  const [distTP, setDistTP] = useState(0)

  useEffect(() => {
    if (!currentPrice || !signal.sl || !signal.tp) return
    setDistSL(((Math.abs(currentPrice - signal.sl) / signal.sl) * 100).toFixed(2))
    setDistTP(((Math.abs(currentPrice - signal.tp) / signal.tp) * 100).toFixed(2))
  }, [currentPrice, signal])

  const isLong     = signal.type === 'LONG'
  const slClose    = parseFloat(distSL) < 1.5
  const grade      = signal.grade?.grade || '—'
  const gradeColor = grade === 'A' ? '#00C896' : grade === 'B' ? '#5DCAA5' : grade === 'C' ? '#F5A623' : '#FF4D4D'
  const confScore  = signal.conf?.score || 0
  const confMax    = signal.conf?.max || 6
  const vol        = signal.vol

  function getAge(ts) {
    const s = Math.round((Date.now() - ts) / 1000)
    if (s < 60) return 'À l\'instant'
    if (s < 3600) return Math.floor(s/60) + 'min'
    return Math.floor(s/3600) + 'h'
  }

  function pFmt(v) {
    return v >= 1000 ? Math.round(v).toLocaleString('fr-FR') : v?.toFixed(4)
  }

  return (
    <div className={`mx-4 mb-3 rounded-2xl p-4 border fade-in ${
      isLong
        ? 'bg-[#111] border-l-[3px] border-l-[#00C896] border-t-white/[0.07] border-r-white/[0.07] border-b-white/[0.07]'
        : 'bg-[#111] border-l-[3px] border-l-[#FF4D4D] border-t-white/[0.07] border-r-white/[0.07] border-b-white/[0.07]'
    }`}>

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 items-center flex-wrap">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isLong ? 'bg-[#00C896]/12 text-[#00C896]' : 'bg-[#FF4D4D]/12 text-[#FF4D4D]'}`}>
            {signal.type}
          </span>
          <span className="text-sm font-semibold">{signal.name}</span>
          {signal.status === 'new'
            ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#00C896] text-black" style={{animation:'pulse 0.8s infinite alternate'}}>NOUVEAU</span>
            : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#4A9EFF]/15 text-[#4A9EFF]">Confirmé</span>
          }
        </div>
        <span className="text-xs text-[#666] whitespace-nowrap">{getAge(signal.createdAt)}</span>
      </div>

      {/* Status bar */}
      <div className={`flex justify-between items-center px-3 py-1.5 rounded-lg mb-3 text-xs ${
        signal.status === 'warning' ? 'bg-[#F5A623]/12' : 'bg-[#00C896]/12'
      }`}>
        <span className={`font-semibold ${signal.status === 'warning' ? 'text-[#F5A623]' : 'text-[#00C896]'}`}>
          {signal.status === 'new' ? 'Nouveau signal' : signal.status === 'warning' ? 'Signal en attente' : 'Signal confirmé'}
        </span>
        <span className="text-[#666]">{signal.assetShort || 'BTC'} · {signal.tf}</span>
      </div>

      {/* Badges */}
      <div className="flex gap-2 flex-wrap mb-3">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#666]">R/R 1:{signal.rr}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${signal.dailyTrend === 'bull' ? 'bg-[#00C896]/12 text-[#00C896]' : 'bg-[#F5A623]/12 text-[#F5A623]'}`}>
          Daily {signal.dailyTrend === 'bull' ? '↑' : '↓'}
        </span>
        {vol && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${vol.strong ? 'bg-[#00C896]/15 text-[#00C896]' : vol.ratio < 0.8 ? 'bg-[#FF4D4D]/12 text-[#FF4D4D]' : 'bg-[#1a1a1a] text-[#666]'}`}>
            {vol.label} ×{vol.ratio}
          </span>
        )}
      </div>

      {/* Niveaux figés */}
      <div className="text-[10px] text-[#666] uppercase tracking-wider mb-2">Niveaux figés à la détection</div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Entrée', val: pFmt(signal.entry) + ' $', color: 'text-white' },
          { label: 'Stop Loss', val: pFmt(signal.sl) + ' $', color: 'text-[#FF4D4D]', sub: slClose ? '⚠ Proche !' : 'Figé', subColor: slClose ? 'text-[#FF4D4D]' : 'text-[#666]' },
          { label: 'Take Profit', val: pFmt(signal.tp) + ' $', color: 'text-[#00C896]' },
        ].map((l, i) => (
          <div key={i} className="bg-[#1a1a1a] rounded-xl p-3">
            <div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">{l.label}</div>
            <div className={`text-sm font-bold ${l.color}`}>{l.val}</div>
            {l.sub && <div className={`text-[10px] mt-1 ${l.subColor}`}>{l.sub}</div>}
          </div>
        ))}
      </div>

      {/* Prix live */}
      <div className="text-[10px] text-[#666] uppercase tracking-wider mb-2">Prix actuel</div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[#1a1a1a] rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-[#666] mb-1">Prix live</div>
          <div className="text-xs font-bold">{currentPrice ? pFmt(currentPrice) + ' $' : '—'}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-[#666] mb-1">Distance SL</div>
          <div className={`text-xs font-bold ${slClose ? 'text-[#FF4D4D]' : 'text-[#666]'}`}>{distSL}%</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-[#666] mb-1">Distance TP</div>
          <div className="text-xs font-bold text-[#666]">{distTP}%</div>
        </div>
      </div>

      {/* Confluence */}
      <div className="bg-[#1a1a1a] rounded-xl p-3 mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] text-[#666] uppercase tracking-wider">Score de confluence</span>
          <span className="text-sm font-bold" style={{color: confScore/confMax >= 0.75 ? '#00C896' : confScore/confMax >= 0.5 ? '#F5A623' : '#FF4D4D'}}>
            {confScore} / {confMax}
          </span>
        </div>
        {signal.conf?.items && (
          <div className="grid grid-cols-2 gap-1">
            {signal.conf.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.ok ? 'bg-[#00C896]' : 'bg-[#333]'}`} />
                <span className={item.ok ? 'text-white' : 'text-[#666]'}>{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note de confiance */}
      {signal.grade && (
        <div className="bg-[#1a1a1a] rounded-xl p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">Note de confiance</div>
              <div className="text-xs text-[#666]">{signal.grade.label}</div>
            </div>
            <div className="text-2xl font-extrabold" style={{color: gradeColor}}>{grade}</div>
          </div>
          <div className="flex flex-col gap-1">
            {signal.grade.factors?.map((f, i) => (
              <div key={i} className="flex justify-between text-xs text-[#666]">
                <span>{f.name}</span>
                <span className="font-semibold" style={{color: f.score >= 20 ? '#00C896' : f.score >= 10 ? '#F5A623' : '#FF4D4D'}}>{f.score}/25</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="text-xs text-[#666] bg-[#1a1a1a] px-3 py-2.5 rounded-xl mb-3 leading-relaxed">{signal.note}</div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onAnalyze(signal)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#4A9EFF]/15 text-[#4A9EFF] border-none cursor-pointer">
          Analyser ↗
        </button>
        <button onClick={() => onExport(signal)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1a1a1a] text-white border border-white/[0.07] cursor-pointer">
          MT4 · TV · Share
        </button>
        <button onClick={() => onDismiss(signal.id)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1a1a1a] text-[#666] border-none cursor-pointer">
          Ignorer
        </button>
      </div>
    </div>
  )
}
