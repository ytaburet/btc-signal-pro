const express = require('express');
const router = express.Router();
const { getDB } = require('../engine/firebase');

// POST /api/users/fcm-token — Enregistrer le token FCM pour les push
router.post('/fcm-token', async (req, res) => {
  const { userId, token } = req.body;
  if (!userId || !token) {
    return res.status(400).json({ success: false, error: 'userId et token requis' });
  }
  try {
    const db = getDB();
    await db.collection('users').doc(userId).set({ fcmToken: token }, { merge: true });
    res.json({ success: true, message: 'Token FCM enregistré' });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/users/:userId/settings — Récupérer les réglages
router.get('/:userId/settings', async (req, res) => {
  try {
    const db = getDB();
    const doc = await db.collection('users').doc(req.params.userId).get();
    if (!doc.exists) return res.json({ success: true, settings: {} });
    res.json({ success: true, settings: doc.data() });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// PUT /api/users/:userId/settings — Sauvegarder les réglages
router.put('/:userId/settings', async (req, res) => {
  try {
    const db = getDB();
    await db.collection('users').doc(req.params.userId).set(req.body, { merge: true });
    res.json({ success: true, message: 'Réglages sauvegardés' });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
