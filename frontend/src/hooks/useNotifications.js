import { useState, useCallback } from 'react'

export function useNotifications() {
  const [notifs, setNotifs]         = useState([])
  const [unreadCount, setUnread]    = useState(0)
  const [priceAlerts, setPriceAlerts] = useState([])

  const addNotif = useCallback((type, title, text) => {
    const notif = {
      id: Date.now() + Math.random(),
      type,   // 'signal' | 'price' | 'alert' | 'liq' | 'info'
      title,
      text,
      time: new Date(),
      read: false
    }
    setNotifs(prev => [notif, ...prev].slice(0, 50))
    setUnread(prev => prev + 1)

    // Notification push système
    if (Notification.permission === 'granted') {
      new Notification(title, { body: text })
    }

    return notif
  }, [])

  const markAllRead = useCallback(() => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }, [])

  const clearAll = useCallback(() => {
    setNotifs([])
    setUnread(0)
  }, [])

  const addPriceAlert = useCallback((price, type, asset) => {
    setPriceAlerts(prev => [...prev, {
      id: Date.now(),
      price: parseFloat(price),
      type,   // 'above' | 'below'
      asset,
      triggered: false
    }])
  }, [])

  const deletePriceAlert = useCallback((id) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  // Vérifier les alertes prix
  const checkPriceAlerts = useCallback((currentPrice, symbol) => {
    setPriceAlerts(prev => prev.map(a => {
      if (a.asset !== symbol || a.triggered) return a
      const triggered = a.type === 'above'
        ? currentPrice >= a.price
        : currentPrice <= a.price
      if (triggered) {
        addNotif('price',
          `Alerte prix ${symbol.replace('USDT','')} !`,
          `${a.type === 'above' ? 'Au-dessus' : 'En-dessous'} de ${a.price.toLocaleString('fr-FR')} $ — Actuel : ${Math.round(currentPrice).toLocaleString('fr-FR')} $`
        )
        return { ...a, triggered: true }
      }
      return a
    }))
  }, [addNotif])

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false
    const p = await Notification.requestPermission()
    return p === 'granted'
  }, [])

  return {
    notifs, unreadCount, priceAlerts,
    addNotif, markAllRead, clearAll,
    addPriceAlert, deletePriceAlert, checkPriceAlerts,
    requestPermission
  }
}
