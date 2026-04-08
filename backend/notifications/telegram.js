const { sendToChannel } = require('../agent/telegram-agent');

// Anti-spam — un seul signal toutes les 4h max
let lastSentAt = 0;
const COOLDOWN = 4 * 60 * 60 * 1000; // 4 heures

async function sendTelegramSignal(signal) {
  // BTC uniquement
  if (signal.asset !== 'BTCUSDT') return;

  // Score minimum 5/6
  if (!signal.conf || signal.conf.score < 5) return;

  // Anti-spam — pas deux signaux en moins de 4h
  const now = Date.now();
  if (now - lastSentAt < COOLDOWN) {
    console.log(`Signal ignoré (cooldown actif — prochain dans ${Math.round((COOLDOWN - (now - lastSentAt)) / 60000)} min)`);
    return;
  }

  const isLong = signal.type === 'LONG';
  const slPct  = ((Math.abs(signal.entry - signal.sl) / signal.entry) * 100).toFixed(1);
  const tpPct  = ((Math.abs(signal.tp - signal.entry) / signal.entry) * 100).toFixed(1);

  const msg =
    '─────────────────────\n' +
    (isLong ? '🟢 BUY' : '🔴 SELL') + '  BTC  ' + signal.entry?.toLocaleString('fr-FR') + ' $\n' +
    '─────────────────────\n' +
    '\n' +
    '🛑 SL : ' + signal.sl?.toLocaleString('fr-FR') + ' $  (-' + slPct + '%)\n' +
    '🎯 TP : ' + signal.tp?.toLocaleString('fr-FR') + ' $  (+' + tpPct + '%)\n' +
    '\n' +
    '📊 R/R 1:' + signal.rr + '   |   Note ' + (signal.grade?.grade || '-') + '   |   Conf ' + signal.conf.score + '/6\n' +
    '\n' +
    '─────────────────────\n' +
    '⚠️ Ceci n\'est pas un conseil financier.\n' +
    'Il s\'agit d\'une prise de position personnelle.\n' +
    'Ne tradez qu\'avec ce que vous pouvez vous\n' +
    'permettre de perdre.\n' +
    '─────────────────────';

  await sendToChannel(msg);
  lastSentAt = now;
  console.log(`📤 Signal BTC envoyé sur le channel — Note ${signal.grade?.grade} Conf ${signal.conf.score}/6`);
}

module.exports = { sendTelegramSignal };