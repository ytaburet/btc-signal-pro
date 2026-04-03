const express = require('express');
const router = express.Router();
const { getEngineStatus, signalRegistry } = require('../engine/signals');
const { getActiveSignals, saveSignal } = require('../engine/firebase');
const { getAllPrices } = require('../engine/binance');

// GET /api/signals — Tous les signaux actifs
router.get('/', async (req, res) => {
  try {
    const status = getEngineStatus();
    const prices = getAllPrices();
    res.json({
      success: true,
      signals: status.signals,
      prices,
      lastScan: status.lastScan,
      totalScans: status.totalScans
    });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/signals/prices — Prix de tous les actifs
router.get('/prices', (req, res) => {
  res.json({ success: true, prices: getAllPrices() });
});

// GET /api/signals/status — État du moteur
router.get('/status', (req, res) => {
  res.json({ success: true, ...getEngineStatus() });
});

// POST /api/signals/:id/dismiss — Ignorer un signal
router.post('/:id/dismiss', async (req, res) => {
  const { id } = req.params;
  const signal = signalRegistry[id];
  if (!signal) return res.status(404).json({ success: false, error: 'Signal non trouvé' });

  signal.dismissed = true;
  signal.status = 'expired';
  await saveSignal(signal);

  res.json({ success: true, message: 'Signal ignoré' });
});

// GET /api/signals/history — Historique des signaux
router.get('/history', async (req, res) => {
  try {
    const { getDB } = require('../engine/firebase');
    const db = getDB();
    const snap = await db.collection('signals')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const signals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, signals });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
