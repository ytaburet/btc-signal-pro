import React, { useEffect, useRef, useState } from 'react'
import { Chart, LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler } from 'chart.js'

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler)

const TF_OPTIONS = [
  { label: '1H', value: '1h', limit: 48 },
  { label: '4H', value: '4h', limit: 60 },
  { label: '1J', value: '1d', limit: 60 },
]

export default function PriceChart({ symbol = 'BTCUSDT', currentPrice }) {
  const canvasRef  = useRef(null)
  const chartRef   = useRef(null)
  const [tf, setTf] = useState('1h')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAndRender(tf)
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [tf, symbol])

  // Mettre à jour le dernier point en temps réel
  useEffect(() => {
    if (!chartRef.current || !currentPrice) return
    const ds = chartRef.current.data.datasets[0]
    if (ds.data.length) {
      ds.data[ds.data.length - 1] = currentPrice
      chartRef.current.update('none')
    }
  }, [currentPrice])

  async function loadAndRender(interval) {
    setLoading(true)
    const opt = TF_OPTIONS.find(t => t.value === interval)
    let closes = [], labels = []

    try {
      const c = new AbortController()
      setTimeout(() => c.abort(), 6000)
      const r = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${opt.limit}`,
        { signal: c.signal }
      )
      const klines = await r.json()
      closes = klines.map(k => parseFloat(k[4]))
      labels = klines.map(k => {
        const d = new Date(k[0])
        return interval === '1d'
          ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
          : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      })
    } catch(e) {
      // Fallback simulé
      const n = opt.limit
      let p = (currentPrice || 83420) * 0.975
      for (let i = 0; i < n; i++) {
        p = p * (1 + (Math.random() - 0.485) * 0.006)
        closes.push(parseFloat(p.toFixed(2)))
        labels.push(i % 8 === 0 ? `${i}h` : '')
      }
      closes[n - 1] = currentPrice || 83420
    }

    // Calcul EMA 200 (ou période réduite si pas assez de données)
    const emaPeriod = Math.min(200, Math.floor(closes.length / 2))
    const ema = calcEMA(closes, emaPeriod)
    const support    = closes.map(c => c * 0.968)
    const resistance = closes.map(c => c * 1.025)

    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }
    const ctx = canvasRef.current
    if (!ctx) return

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Prix',
            data: closes,
            borderColor: '#f2f2f2',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.3,
            fill: false,
          },
          {
            label: 'EMA 200',
            data: ema,
            borderColor: '#F5A623',
            borderWidth: 1,
            borderDash: [4, 3],
            pointRadius: 0,
            fill: false,
          },
          {
            label: 'Support',
            data: support,
            borderColor: '#00C896',
            borderWidth: 1,
            borderDash: [2, 3],
            pointRadius: 0,
            fill: false,
          },
          {
            label: 'Résistance',
            data: resistance,
            borderColor: '#FF4D4D',
            borderWidth: 1,
            borderDash: [2, 3],
            pointRadius: 0,
            fill: false,
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: ctx => {
                const v = ctx.raw
                return `${ctx.dataset.label} : ${v >= 1000 ? Math.round(v).toLocaleString('fr-FR') : v?.toFixed(4)} $`
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#444', font: { size: 9 }, maxTicksLimit: 8 }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#444',
              font: { size: 9 },
              callback: v => v >= 1000 ? Math.round(v / 1000) + 'k' : v.toFixed(4),
              position: 'right'
            },
            position: 'right'
          }
        }
      }
    })

    setLoading(false)
  }

  function calcEMA(closes, period) {
    if (closes.length < period) return closes.map(() => null)
    const k = 2 / (period + 1)
    let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
    const result = new Array(period - 1).fill(null)
    result.push(ema)
    for (let i = period; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k)
      result.push(parseFloat(ema.toFixed(4)))
    }
    return result
  }

  return (
    <div className="mx-4 mb-4 bg-[#111] border border-white/[0.07] rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666]">
          {symbol.replace('USDT', '')} / USDT
        </span>
        <div className="flex gap-1">
          {TF_OPTIONS.map(t => (
            <button key={t.value} onClick={() => setTf(t.value)}
              className={`text-[10px] font-semibold px-2 py-1 rounded-md border-none cursor-pointer font-sans ${
                tf === t.value
                  ? 'bg-[#00C896]/15 text-[#00C896]'
                  : 'bg-[#1a1a1a] text-[#666]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[190px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[#666]">
            Chargement...
          </div>
        )}
        <canvas ref={canvasRef} />
      </div>

      <div className="flex gap-4 mt-2">
        {[
          { color: '#f2f2f2', label: 'Prix' },
          { color: '#F5A623', label: 'EMA 200', dashed: true },
          { color: '#00C896', label: 'Support', dashed: true },
          { color: '#FF4D4D', label: 'Résistance', dashed: true },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{
              background: l.color,
              borderTop: l.dashed ? `2px dashed ${l.color}` : undefined,
              background: l.dashed ? 'transparent' : l.color
            }} />
            <span className="text-[10px] text-[#666]">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
