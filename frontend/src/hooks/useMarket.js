import { useState, useEffect } from 'react'

export function useMarket(prices, currentAsset = 'BTCUSDT') {
  const [fearGreed, setFearGreed] = useState(null)
  const [sentiment, setSentiment] = useState({ score: 74, label: 'HAUSSIER', cls: 'bull' })

  // Fear & Greed Index
  useEffect(() => {
    async function fetchFG() {
      try {
        const c = new AbortController()
        setTimeout(() => c.abort(), 5000)
        const r = await fetch('https://api.alternative.me/fng/?limit=1', { signal: c.signal })
        const d = await r.json()
        const val = parseInt(d.data[0].value)
        const label = d.data[0].value_classification
        setFearGreed({ val, label })
      } catch(e) {
        // Fallback
        const p = prices[currentAsset]
        if (p) {
          const val = Math.min(100, Math.max(0, Math.round(50 + p.change24h * 3)))
          setFearGreed({ val, label: val > 60 ? 'Greed' : val < 40 ? 'Fear' : 'Neutral' })
        }
      }
    }
    fetchFG()
    const id = setInterval(fetchFG, 3600000)
    return () => clearInterval(id)
  }, [])

  // Calcul sentiment
  useEffect(() => {
    const p = prices[currentAsset]
    if (!p) return
    const chg = p.change24h || 0
    const score = Math.min(100, Math.max(0, Math.round(50 + chg * 5)))
    const label = score >= 62 ? 'HAUSSIER' : score <= 40 ? 'BAISSIER' : 'NEUTRE'
    const cls   = score >= 62 ? 'bull' : score <= 40 ? 'bear' : 'neutral'
    setSentiment({ score, label, cls, chg })
  }, [prices, currentAsset])

  return { fearGreed, sentiment }
}
