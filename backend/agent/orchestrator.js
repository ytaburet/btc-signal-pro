
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
  const msg = (signal.type === 'LONG' ? 'SIGNAL LONG' : 'SIGNAL SHORT') + ' - ' + (signal.assetShort||'BTC') + '/USDT\n' +
    'Entree: ' + signal.entry?.toLocaleString('fr-FR') + '$ | SL: ' + signal.sl?.toLocaleString('fr-FR') + '$ (-' + slPct + '%) | TP: ' + signal.tp?.toLocaleString('fr-FR') + '$ (+' + tpPct + '%)\n' +
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
