import { useState, useEffect, useCallback, useRef } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export function useSignals() {
  const [signals, setSignals]   = useState([])
  const [prices, setPrices]     = useState({})
  const [lastScan, setLastScan] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const intervalRef = useRef(null)

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/api/signals`, { signal: AbortSignal.timeout(8000) })
      const data = await res.json()
      if (data.success) {
        setSignals(data.signals || [])
        setPrices(data.prices || {})
        setLastScan(data.lastScan)
        setError(null)
      }
    } catch(e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/api/signals/prices`, { signal: AbortSignal.timeout(5000) })
      const data = await res.json()
      if (data.success) setPrices(data.prices)
    } catch(e) {}
  }, [])

  const dismissSignal = useCallback(async (id) => {
    try {
      await fetch(`${BACKEND}/api/signals/${id}/dismiss`, { method: 'POST' })
      setSignals(prev => prev.filter(s => s.id !== id))
    } catch(e) { console.warn('dismiss error:', e) }
  }, [])

  useEffect(() => {
    fetchSignals()
    // Signaux toutes les 30s, prix toutes les 10s
    intervalRef.current = setInterval(fetchSignals, 30000)
    const priceInterval = setInterval(fetchPrices, 10000)
    return () => {
      clearInterval(intervalRef.current)
      clearInterval(priceInterval)
    }
  }, [fetchSignals, fetchPrices])

  return { signals, prices, lastScan, loading, error, dismissSignal, refetch: fetchSignals }
}
