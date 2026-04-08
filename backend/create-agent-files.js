const fs = require('fs');
const path = require('path');

// Créer le dossier agent
const agentDir = path.join(__dirname, 'agent');
if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir);

// ── agent.js ──────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(agentDir, 'agent.js'), `
const { getDB } = require('../engine/firebase');
const { getPrice, getKlines } = require('../engine/binance');
const { signalRegistry } = require('../engine/signals');

const agentMemory = {};

async function getUserProfile(userId) {
  try { const db = getDB(); const snap = await db.collection('users').doc(userId).get(); if (snap.exists) return snap.data(); } catch(e) {}
  return null;
}

async function loadAgentMemory(userId) {
  try { const db = getDB(); const snap = await db.collection('agent_memory').doc(userId).get(); if (snap.exists) return snap.data(); } catch(e) {}
  return { history: [], observations: [] };
}

async function saveAgentMemory(userId, memory) {
  try { const db = getDB(); await db.collection('agent_memory').doc(userId).set({ ...memory, updatedAt: Date.now() }, { merge: true }); } catch(e) {}
}

async function buildMarketContext() {
  const assets = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  const ctx = [];
  for (const sym of assets) {
    const p = getPrice(sym);
    if (!p) continue;
    ctx.push(sym.replace('USDT','') + ': ' + Math.round(p.price).toLocaleString('fr-FR') + '$ (' + (p.change24h >= 0 ? '+' : '') + p.change24h?.toFixed(2) + '% 24h)');
  }
  const active = Object.values(signalRegistry).filter(s => !s.dismissed && s.status !== 'expired');
  return {
    prices: ctx.join(' | '),
    signals: active.length > 0 ? active.map(s => 'Signal ' + s.type + ' ' + s.assetShort + ' entree ' + s.entry + '$ note ' + (s.grade?.grade || '-')).join(' | ') : 'Aucun signal actif',
    timestamp: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
  };
}

function buildSystemPrompt(profile, marketCtx) {
  return 'Tu es l agent IA de BTC Signal Pro, mentor de trading crypto personnel. ' +
    'Reponds toujours en francais, sois concis (max 250 mots sur Telegram), pedagogique et bienveillant. ' +
    'Ne donne jamais de conseils financiers directs. Guide, explique, pose des questions. ' +
    'Profil: ' + (profile?.displayName || 'trader') + '. ' +
    'Marche (' + marketCtx.timestamp + '): ' + marketCtx.prices + '. ' +
    'Signaux actifs: ' + marketCtx.signals;
}

async function respondToUser(userId, userMessage) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return 'L agent IA n est pas configure (clé ANTHROPIC_API_KEY manquante). Mais je surveille le marche pour toi !';
    }
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const [profile, memory, marketCtx] = await Promise.all([getUserProfile(userId), loadAgentMemory(userId), buildMarketContext()]);
    if (!agentMemory[userId]) agentMemory[userId] = memory;
    const history = (agentMemory[userId].history || []).slice(-16);
    history.push({ role: 'user', content: userMessage });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: buildSystemPrompt(profile, marketCtx),
      messages: history
    });
    const reply = response.content[0]?.text || 'Je n ai pas pu repondre.';
    history.push({ role: 'assistant', content: reply });
    agentMemory[userId] = { ...agentMemory[userId], history: history.slice(-16), lastContact: Date.now() };
    await saveAgentMemory(userId, agentMemory[userId]);
    return reply;
  } catch(e) {
    console.error('Agent error:', e.message);
    return 'Erreur agent: ' + e.message;
  }
}

async function generateProactiveMessage(userId, trigger) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const [profile, marketCtx] = await Promise.all([getUserProfile(userId), buildMarketContext()]);
    let prompt = '';
    if (trigger.type === 'new_signal') {
      const s = trigger.signal;
      prompt = 'Nouveau signal detecte: ' + s.type + ' ' + (s.assetShort||'BTC') + ' entree ' + s.entry + '$ SL ' + s.sl + '$ TP ' + s.tp + '$ note ' + (s.grade?.grade||'-') + '. Genere un message Telegram engageant qui explique pourquoi ce signal existe en 2-3 phrases simples et pose une question a l utilisateur. Max 200 mots.';
    } else if (trigger.type === 'morning_briefing') {
      prompt = 'Genere un briefing matinal du marche crypto. Resume la situation, les niveaux cles a surveiller, et donne un focus pedagogique du jour. Commence par Bonjour ' + (profile?.displayName || 'trader') + '. Max 250 mots.';
    } else if (trigger.type === 'market_observation') {
      prompt = trigger.observation + '. Genere un message pedagogique sur cette observation. Max 200 mots.';
    } else return null;
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: buildSystemPrompt(profile, marketCtx),
      messages: [{ role: 'user', content: prompt }]
    });
    return response.content[0]?.text || null;
  } catch(e) { console.error('Proactive msg error:', e.message); return null; }
}

async function runMarketAnalysis() {
  const observations = [];
  for (const sym of ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']) {
    try {
      const p = getPrice(sym);
      if (!p) continue;
      const klines = await getKlines(sym, '4h', 50);
      if (klines.length < 15) continue;
      const closes = klines.map(k => k.close);
      const rsi = calcRSI(closes, 14);
      const asset = sym.replace('USDT','');
      if (rsi < 28) observations.push({ asset, type: 'rsi_low', severity: 'high', observation: asset + ' RSI a ' + rsi.toFixed(0) + ' - survente extreme, rebond probable.' });
      else if (rsi > 78) observations.push({ asset, type: 'rsi_high', severity: 'high', observation: asset + ' RSI a ' + rsi.toFixed(0) + ' - surachat extreme, correction probable.' });
    } catch(e) {}
  }
  return observations;
}

function calcRSI(closes, period) {
  if (closes.length < period + 1) return 50;
  let g = 0, l = 0;
  for (let i = 1; i <= period; i++) { const d = closes[i]-closes[i-1]; d>0?g+=d:l+=Math.abs(d); }
  let ag = g/period, al = l/period;
  for (let i = period+1; i < closes.length; i++) { const d = closes[i]-closes[i-1]; ag=(ag*(period-1)+(d>0?d:0))/period; al=(al*(period-1)+(d<0?Math.abs(d):0))/period; }
  return al === 0 ? 100 : 100-(100/(1+ag/al));
}

module.exports = { respondToUser, generateProactiveMessage, runMarketAnalysis, buildMarketContext };
`);

// ── telegram-agent.js ─────────────────────────────────────────────────────
fs.writeFileSync(path.join(agentDir, 'telegram-agent.js'), `
const TelegramBot = require('node-telegram-bot-api');
const { respondToUser, generateProactiveMessage } = require('./agent');
const { getDB } = require('../engine/firebase');

let bot = null;

function initTelegramAgent() {
  if (!process.env.TELEGRAM_BOT_TOKEN) { console.warn('Telegram agent non configure'); return; }
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  console.log('Agent Telegram demarre - en ecoute');

  bot.onText(/\\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId,
      'Bonjour ' + (msg.from.first_name || 'trader') + ' !\\n\\nJe suis ton agent IA BTC Signal Pro. Je surveille le marche 24h/24.\\n\\nTu peux me poser des questions directement ici :\\n- Analyse de BTC en ce moment ?\\n- Explique-moi le RSI\\n- Dois-je prendre le signal actuel ?\\n\\nCommandes : /marche /signaux /briefing');
  });

  bot.onText(/\\/marche|\\/market/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendChatAction(chatId, 'typing');
    const reply = await respondToUser('tg_' + chatId, 'Donne-moi une analyse du marche crypto maintenant. Quels actifs surveilles-tu ?');
    await sendMsg(chatId, reply);
  });

  bot.onText(/\\/signaux|\\/signals/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendChatAction(chatId, 'typing');
    const reply = await respondToUser('tg_' + chatId, 'Quels sont les signaux actifs ? Lesquels meritent attention ?');
    await sendMsg(chatId, reply);
  });

  bot.onText(/\\/briefing/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendChatAction(chatId, 'typing');
    const reply = await generateProactiveMessage('tg_' + chatId, { type: 'morning_briefing' });
    if (reply) await sendMsg(chatId, reply);
  });

  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const chatId = msg.chat.id;
    await bot.sendChatAction(chatId, 'typing');
    try {
      const userId = await getTgUserId(chatId);
      const reply = await respondToUser(userId || 'tg_' + chatId, msg.text);
      await sendMsg(chatId, reply);
    } catch(e) {
      await bot.sendMessage(chatId, 'Erreur. Reessaie dans quelques instants.');
    }
  });

  bot.on('polling_error', (e) => console.error('Telegram polling error:', e.message));
  return bot;
}

async function sendMsg(chatId, text) {
  if (!bot) return;
  const MAX = 4000;
  const parts = [];
  let r = text;
  while (r.length > 0) { parts.push(r.slice(0, MAX)); r = r.slice(MAX); }
  for (const p of parts) {
    try { await bot.sendMessage(chatId, p); } catch(e) {}
    if (parts.length > 1) await new Promise(res => setTimeout(res, 300));
  }
}

async function sendSignalMessage(chatId, signal, agentComment) {
  if (!bot) return;
  const slPct = ((Math.abs(signal.entry - signal.sl) / signal.entry) * 100).toFixed(1);
  const tpPct = ((Math.abs(signal.tp - signal.entry) / signal.entry) * 100).toFixed(1);
  const emoji = signal.type === 'LONG' ? 'BUY' : 'SELL';
  let msg = (signal.type === 'LONG' ? 'SIGNAL LONG' : 'SIGNAL SHORT') + ' - ' + (signal.assetShort||'BTC') + '/USDT\\n';
  msg += 'Entree : ' + signal.entry?.toLocaleString('fr-FR') + ' $\\n';
  msg += 'Stop Loss : ' + signal.sl?.toLocaleString('fr-FR') + ' $ (-' + slPct + '%)\\n';
  msg += 'Take Profit : ' + signal.tp?.toLocaleString('fr-FR') + ' $ (+' + tpPct + '%)\\n';
  msg += 'R/R 1:' + signal.rr + ' | Note ' + (signal.grade?.grade||'-') + ' | Conf ' + (signal.conf?.score||0) + '/6\\n';
  if (agentComment) msg += '\\n' + agentComment;
  msg += '\\n\\nBTC Signal Pro';
  try { await bot.sendMessage(chatId, msg); } catch(e) { console.error('sendSignalMessage error:', e.message); }
}

async function sendProactiveMessage(userId, message) {
  if (!bot || !message) return;
  try {
    const db = getDB();
    const snap = await db.collection('users').doc(userId).get();
    if (!snap.exists) return;
    const data = snap.data();
    if (data.telegramChatId) await sendMsg(data.telegramChatId, message);
  } catch(e) {}
}

async function sendToChannel(message) {
  if (!bot || !process.env.TELEGRAM_CHANNEL_ID) return;
  try { await bot.sendMessage(process.env.TELEGRAM_CHANNEL_ID, message); } catch(e) {}
}

async function getTgUserId(chatId) {
  try {
    const db = getDB();
    const snap = await db.collection('users').where('telegramChatId', '==', String(chatId)).limit(1).get();
    if (!snap.empty) return snap.docs[0].id;
  } catch(e) {}
  return null;
}

function getBot() { return bot; }

module.exports = { initTelegramAgent, sendSignalMessage, sendProactiveMessage, sendToChannel, getBot };
`);

// ── orchestrator.js ───────────────────────────────────────────────────────
fs.writeFileSync(path.join(agentDir, 'orchestrator.js'), `
const cron = require('node-cron');
const { generateProactiveMessage, runMarketAnalysis } = require('./agent');
const { sendProactiveMessage, sendToChannel } = require('./telegram-agent');
const { getDB } = require('../engine/firebase');
const { signalRegistry } = require('../engine/signals');

const notifiedSignals = new Set();
const notifiedObs = new Set();

async function getTelegramUsers() {
  try {
    const db = getDB();
    const snap = await db.collection('users').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.telegramChatId);
  } catch(e) { return []; }
}

async function notifyNewSignal(signal) {
  if (notifiedSignals.has(signal.id)) return;
  notifiedSignals.add(signal.id);
  console.log('Agent: nouveau signal ' + signal.type + ' ' + signal.assetShort);

  // Message channel simple
  const slPct = ((Math.abs(signal.entry - signal.sl) / signal.entry) * 100).toFixed(1);
  const tpPct = ((Math.abs(signal.tp - signal.entry) / signal.entry) * 100).toFixed(1);
  const msg = (signal.type === 'LONG' ? 'SIGNAL LONG' : 'SIGNAL SHORT') + ' - ' + (signal.assetShort||'BTC') + '/USDT\\n' +
    'Entree: ' + signal.entry?.toLocaleString('fr-FR') + '$ | SL: ' + signal.sl?.toLocaleString('fr-FR') + '$ (-' + slPct + '%) | TP: ' + signal.tp?.toLocaleString('fr-FR') + '$ (+' + tpPct + '%)\\n' +
    'Note: ' + (signal.grade?.grade||'-') + ' | R/R 1:' + signal.rr + ' | BTC Signal Pro';
  await sendToChannel(msg);

  // Message personnalise aux utilisateurs (si clé Anthropic dispo)
  if (process.env.ANTHROPIC_API_KEY) {
    const users = await getTelegramUsers();
    for (const user of users) {
      try {
        const agentMsg = await generateProactiveMessage(user.id, { type: 'new_signal', signal });
        if (agentMsg) await sendProactiveMessage(user.id, agentMsg);
        await new Promise(r => setTimeout(r, 200));
      } catch(e) {}
    }
  }
}

function startAgentOrchestrator() {
  // Briefing matinal 8h
  cron.schedule('0 8 * * *', async () => {
    if (!process.env.ANTHROPIC_API_KEY) return;
    const users = await getTelegramUsers();
    for (const user of users) {
      try {
        const msg = await generateProactiveMessage(user.id, { type: 'morning_briefing' });
        if (msg) await sendProactiveMessage(user.id, msg);
        await new Promise(r => setTimeout(r, 300));
      } catch(e) {}
    }
  }, { timezone: 'Europe/Paris' });

  // Analyse marche toutes les heures
  cron.schedule('0 * * * *', async () => {
    if (!process.env.ANTHROPIC_API_KEY) return;
    try {
      const observations = await runMarketAnalysis();
      const high = observations.filter(o => o.severity === 'high' && !notifiedObs.has(o.asset + '_' + o.type));
      if (!high.length) return;
      const users = await getTelegramUsers();
      for (const obs of high) {
        notifiedObs.add(obs.asset + '_' + obs.type);
        setTimeout(() => notifiedObs.delete(obs.asset + '_' + obs.type), 4*3600000);
        for (const user of users) {
          try {
            const msg = await generateProactiveMessage(user.id, { type: 'market_observation', observation: obs.observation });
            if (msg) await sendProactiveMessage(user.id, msg);
            await new Promise(r => setTimeout(r, 300));
          } catch(e) {}
        }
      }
    } catch(e) {}
  });

  console.log('Agent orchestrateur demarre');
}

module.exports = { startAgentOrchestrator, notifyNewSignal };
`);

// ── routes/agent.js ───────────────────────────────────────────────────────
const routesDir = path.join(__dirname, 'routes');
fs.writeFileSync(path.join(routesDir, 'agent.js'), `
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
`);

console.log('');
console.log('Fichiers crees avec succes :');
console.log('  backend/agent/agent.js');
console.log('  backend/agent/telegram-agent.js');
console.log('  backend/agent/orchestrator.js');
console.log('  backend/routes/agent.js');
console.log('');
console.log('Lance maintenant :');
console.log('  git add .');
console.log('  git commit -m "Add agent files"');
console.log('  git push');
