
const TelegramBot = require('node-telegram-bot-api');
const { respondToUser, generateProactiveMessage } = require('./agent');
const { getDB } = require('../engine/firebase');

let bot = null;

function initTelegramAgent() {
  if (!process.env.TELEGRAM_BOT_TOKEN) { console.warn('Telegram agent non configure'); return; }
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  console.log('Agent Telegram demarre - en ecoute');

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId,
      'Bonjour ' + (msg.from.first_name || 'trader') + ' !\n\nJe suis ton agent IA BTC Signal Pro. Je surveille le marche 24h/24.\n\nTu peux me poser des questions directement ici :\n- Analyse de BTC en ce moment ?\n- Explique-moi le RSI\n- Dois-je prendre le signal actuel ?\n\nCommandes : /marche /signaux /briefing');
  });

  bot.onText(/\/marche|\/market/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendChatAction(chatId, 'typing');
    const reply = await respondToUser('tg_' + chatId, 'Donne-moi une analyse du marche crypto maintenant. Quels actifs surveilles-tu ?');
    await sendMsg(chatId, reply);
  });

  bot.onText(/\/signaux|\/signals/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendChatAction(chatId, 'typing');
    const reply = await respondToUser('tg_' + chatId, 'Quels sont les signaux actifs ? Lesquels meritent attention ?');
    await sendMsg(chatId, reply);
  });

  bot.onText(/\/briefing/, async (msg) => {
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
  let msg = (signal.type === 'LONG' ? 'SIGNAL LONG' : 'SIGNAL SHORT') + ' - ' + (signal.assetShort||'BTC') + '/USDT\n';
  msg += 'Entree : ' + signal.entry?.toLocaleString('fr-FR') + ' $\n';
  msg += 'Stop Loss : ' + signal.sl?.toLocaleString('fr-FR') + ' $ (-' + slPct + '%)\n';
  msg += 'Take Profit : ' + signal.tp?.toLocaleString('fr-FR') + ' $ (+' + tpPct + '%)\n';
  msg += 'R/R 1:' + signal.rr + ' | Note ' + (signal.grade?.grade||'-') + ' | Conf ' + (signal.conf?.score||0) + '/6\n';
  if (agentComment) msg += '\n' + agentComment;
  msg += '\n\nBTC Signal Pro';
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
