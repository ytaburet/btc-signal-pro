
const express = require('express');
const router = express.Router();
const { respondToUser } = require('../agent/agent');

router.post('/chat', async (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) return res.status(400).json({ success: false, error: 'userId et message requis' });
  try {
    const reply = await respondToUser(userId, message);
    res.json({ success: true, reply });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/telegram-id', async (req, res) => {
  const { userId, telegramChatId } = req.body;
  if (!userId || !telegramChatId) return res.status(400).json({ success: false, error: 'Manque userId ou telegramChatId' });
  try {
    const { getDB } = require('../engine/firebase');
    await getDB().collection('users').doc(userId).set({ telegramChatId: String(telegramChatId) }, { merge: true });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
