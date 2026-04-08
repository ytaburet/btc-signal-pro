require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { initFirebase } = require('./engine/firebase');
const { runSignalEngine } = require('./engine/signals');
const { initBinanceWS } = require('./engine/binance');
const { initTelegramAgent } = require('./agent/telegram-agent');
const { startAgentOrchestrator } = require('./agent/orchestrator');
const signalsRouter = require('./routes/signals');
const usersRouter = require('./routes/users');
const agentRouter = require('./routes/agent');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

initFirebase();

app.use('/api/signals', signalsRouter);
app.use('/api/users', usersRouter);
app.use('/api/agent', agentRouter);

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
  initTelegramAgent();
  startAgentOrchestrator();
  cron.schedule('*/30 * * * * *', async () => {
    try { await runSignalEngine(); } catch(e) { console.error('Engine error:', e.message); }
  });
  cron.schedule('*/5 * * * *', async () => {
    try { await runSignalEngine({ deep: true }); } catch(e) {}
  });
  setTimeout(() => runSignalEngine(), 3000);
});