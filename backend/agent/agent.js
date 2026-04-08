
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
