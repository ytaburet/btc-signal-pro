const admin = require('firebase-admin');
let db = null, messaging = null;

function initFirebase() {
  if (admin.apps.length) return;

  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '')
    .replace(/\\n/g, '\n')
    .replace(/^"|"$/g, '');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      privateKey:  privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
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