// Ce fichier est conservé pour compatibilité
// Le bot Telegram est maintenant géré par agent/telegram-agent.js
const { sendToChannel, getBot } = require('../agent/telegram-agent');

async function sendTelegramSignal(signal) {
  const isLong = signal.type === 'LONG';
  const slPct = ((Math.abs(signal.entry - signal.sl) / signal.entry) * 100).toFixed(1);
  const tpPct = ((Math.abs(signal.tp - signal.entry) / signal.entry) * 100).toFixed(1);
  const msg =
    (isLong ? '🟢 SIGNAL LONG' : '🔴 SIGNAL SHORT') + ' — ' + (signal.assetShort||'BTC') + '/USDT\n' +
    'Entrée : ' + signal.entry?.toLocaleString('fr-FR') + ' $\n' +
    'Stop Loss : ' + signal.sl?.toLocaleString('fr-FR') + ' $ (-' + slPct + '%)\n' +
    'Take Profit : ' + signal.tp?.toLocaleString('fr-FR') + ' $ (+' + tpPct + '%)\n' +
    'R/R 1:' + signal.rr + ' | Note ' + (signal.grade?.grade||'-') + ' | Conf ' + (signal.conf?.score||0) + '/6\n\n' +
    'BTC Signal Pro';
  await sendToChannel(msg);
}

module.exports = { sendTelegramSignal };