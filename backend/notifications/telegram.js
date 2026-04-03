const TelegramBot = require('node-telegram-bot-api');

let bot = null;

function initTelegram() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️  Telegram non configuré (TELEGRAM_BOT_TOKEN manquant)');
    return;
  }
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  console.log('✅ Telegram Bot initialisé');
}

async function sendTelegramSignal(signal) {
  if (!bot || !process.env.TELEGRAM_CHANNEL_ID) return;

  const emoji = signal.type === 'LONG' ? '🟢' : '🔴';
  const grade = signal.grade?.grade || '—';
  const conf  = signal.conf ? `${signal.conf.score}/${signal.conf.max}` : '—';
  const slPct = ((Math.abs(signal.entry - signal.sl) / signal.entry) * 100).toFixed(1);
  const tpPct = ((Math.abs(signal.tp - signal.entry) / signal.entry) * 100).toFixed(1);

  const msg = `${emoji} <b>Signal ${signal.type} — ${signal.assetShort}/USDT</b>
━━━━━━━━━━━━━━━━━━━
💰 Entrée   : <code>${signal.entry.toLocaleString('fr-FR')} $</code>
🛑 Stop Loss: <code>${signal.sl.toLocaleString('fr-FR')} $</code> <i>(-${slPct}%)</i>
🎯 Take Profit: <code>${signal.tp.toLocaleString('fr-FR')} $</code> <i>(+${tpPct}%)</i>
━━━━━━━━━━━━━━━━━━━
📊 R/R         : 1:${signal.rr}
🏅 Note        : <b>${grade}</b> — ${signal.grade?.label || ''}
🔗 Confluence  : ${conf} indicateurs
📈 Daily       : ${signal.dailyTrend === 'bull' ? '↑ Haussier' : '↓ Baissier'}
📦 Volume      : ${signal.vol?.label || '—'} ×${signal.vol?.ratio || '—'}
━━━━━━━━━━━━━━━━━━━
⏰ ${new Date().toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
<i>BTC Signal Pro · Niveaux figés à la détection</i>`;

  try {
    await bot.sendMessage(process.env.TELEGRAM_CHANNEL_ID, msg, {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
    console.log(`📱 Telegram envoyé: ${signal.type} ${signal.assetShort}`);
  } catch(e) {
    console.error('Telegram send error:', e.message);
  }
}

async function sendTelegramAlert(title, body) {
  if (!bot || !process.env.TELEGRAM_CHANNEL_ID) return;
  try {
    await bot.sendMessage(process.env.TELEGRAM_CHANNEL_ID, `⚠️ <b>${title}</b>\n${body}`, {
      parse_mode: 'HTML'
    });
  } catch(e) {
    console.error('Telegram alert error:', e.message);
  }
}

// Initialiser au démarrage
initTelegram();

module.exports = { sendTelegramSignal, sendTelegramAlert };
