const fs = require('fs');
const path = require('path');

// Réécrire server.js
fs.writeFileSync('server.js', `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { initFirebase } = require('./engine/firebase');
const { runSignalEngine } = require('./engine/signals');
const { initBinanceWS } = require('./engine/binance');
const signalsRouter = require('./routes/signals');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

initFirebase();

app.use('/api/signals', signalsRouter);
app.use('/api/users', usersRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/api/status', (req, res) => {
  const { getEngineStatus } = require('./engine/signals');
  res.json(getEngineStatus());
});

app.listen(PORT, () => {
  console.log('BTC Signal Pro Backend — Port ' + PORT);
  initBinanceWS(['btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'xrpusdt']);
  cron.schedule('*/30 * * * * *', async () => {
    try { await runSignalEngine(); } catch(e) { console.error('Engine error:', e.message); }
  });
  setTimeout(() => runSignalEngine(), 3000);
});
`);
console.log('server.js OK');

// Réécrire engine/firebase.js
fs.writeFileSync('engine/firebase.js', `const admin = require('firebase-admin');
const serviceAccount = require('../btc-signal-pro-firebase-adminsdk-fbsvc-a30d04391e.json');
let db = null, messaging = null;

function initFirebase() {
  if (admin.apps.length) return;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://btc-signal-pro.firebaseio.com'
  });
  db = admin.firestore();
  messaging = admin.messaging();
  console.log('Firebase Admin OK');
}

function getDB() { if (!db) throw new Error('Firebase non init'); return db; }
function getMessaging() { return messaging; }

async function saveSignal(s) {
  await getDB().collection('signals').doc(s.id).set(
    { ...s, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
}

async function getActiveSignals() {
  const snap = await getDB().collection('signals')
    .where('status', 'in', ['new', 'confirmed'])
    .where('dismissed', '==', false)
    .orderBy('createdAt', 'desc').limit(20).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getAllFCMTokens() {
  const snap = await getDB().collection('users').get();
  const t = [];
  snap.docs.forEach(d => { if (d.data().fcmToken) t.push(d.data().fcmToken); });
  return t;
}

async function sendPushToAll(title, body, data) {
  data = data || {};
  const t = await getAllFCMTokens();
  if (!t.length) return;
  try {
    const r = await messaging.sendEachForMulticast({ notification: { title, body }, data, tokens: t });
    console.log('Push: ' + r.successCount + '/' + t.length);
  } catch(e) { console.error('Push error:', e.message); }
}

module.exports = { initFirebase, getDB, getMessaging, saveSignal, getActiveSignals, getAllFCMTokens, sendPushToAll };
`);
console.log('engine/firebase.js OK');

console.log('');
console.log('Tous les fichiers sont repares. Lance maintenant : npm run dev');
