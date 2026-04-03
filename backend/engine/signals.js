const { getPrice, getKlines } = require('./binance');
const { saveSignal, getActiveSignals, sendPushToAll } = require('./firebase');
const { sendTelegramSignal } = require('../notifications/telegram');

// ── Registre des signaux en mémoire ──
const signalRegistry = {};
let lastScanTime = null;
let totalScans = 0;

const ASSETS = [
  { symbol: 'BTCUSDT',  name: 'Bitcoin',  short: 'BTC'  },
  { symbol: 'ETHUSDT',  name: 'Ethereum', short: 'ETH'  },
  { symbol: 'SOLUSDT',  name: 'Solana',   short: 'SOL'  },
  { symbol: 'BNBUSDT',  name: 'BNB',      short: 'BNB'  },
  { symbol: 'XRPUSDT',  name: 'XRP',      short: 'XRP'  },
];

// ── Indicateurs techniques ──
function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let g = 0, l = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i-1];
    d > 0 ? g += d : l += Math.abs(d);
  }
  let ag = g/period, al = l/period;
  for (let i = period+1; i < closes.length; i++) {
    const d = closes[i] - closes[i-1];
    ag = (ag*(period-1) + (d > 0 ? d : 0)) / period;
    al = (al*(period-1) + (d < 0 ? Math.abs(d) : 0)) / period;
  }
  return al === 0 ? 100 : 100 - (100 / (1 + ag/al));
}

function calcEMA(closes, period) {
  if (closes.length < period) return closes[closes.length-1];
  const k = 2/(period+1);
  let ema = closes.slice(0, period).reduce((a,b) => a+b, 0) / period;
  for (let i = period; i < closes.length; i++) ema = closes[i]*k + ema*(1-k);
  return ema;
}

function isHammer(kline) {
  const { open: o, high: h, low: l, close: c } = kline;
  const body = Math.abs(c-o), range = h-l;
  return range > 0 && (Math.min(o,c)-l) >= body*2 && body/range < 0.4;
}

function calcVolStrength(klines) {
  if (klines.length < 20) return { ratio: 1, strong: false, label: 'Inconnu' };
  const vols = klines.map(k => k.volume);
  const avg = vols.slice(-20,-1).reduce((a,b) => a+b, 0) / 19;
  const last = vols[vols.length-1];
  const ratio = avg > 0 ? parseFloat((last/avg).toFixed(2)) : 1;
  return {
    ratio,
    strong: ratio >= 1.3,
    label: ratio >= 1.8 ? 'Très fort' : ratio >= 1.3 ? 'Fort' : ratio >= 0.8 ? 'Normal' : 'Faible'
  };
}

function buildConf(rsi, bull, hammer, macdBull, nearLevel, dailyBull) {
  const items = [
    { name: 'EMA 200',          ok: bull      },
    { name: 'RSI',              ok: rsi < 45 || rsi > 62 },
    { name: 'Pattern bougie',   ok: hammer    },
    { name: 'MACD',             ok: macdBull  },
    { name: 'Niveau clé',       ok: nearLevel },
    { name: 'Tendance Daily',   ok: dailyBull },
  ];
  return { items, score: items.filter(i => i.ok).length, max: 6 };
}

function calcGrade(conf, vol, rsi, dailyOk, hammer) {
  const factors = [
    { name: 'Confluence',   score: conf.score/conf.max >= 0.83 ? 25 : conf.score/conf.max >= 0.66 ? 20 : conf.score/conf.max >= 0.5 ? 13 : 5 },
    { name: 'Volume',       score: vol.ratio >= 1.8 ? 25 : vol.ratio >= 1.3 ? 20 : vol.ratio >= 0.8 ? 10 : 0 },
    { name: 'RSI',          score: rsi < 30 || rsi > 75 ? 25 : rsi < 38 || rsi > 68 ? 18 : rsi < 45 || rsi > 62 ? 10 : 3 },
    { name: 'Timeframes',   score: dailyOk ? 15 : 0 },
    { name: 'Pattern',      score: hammer ? 10 : 0 },
  ];
  const total = factors.reduce((a,f) => a + f.score, 0);
  const grade = total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : 'D';
  return {
    grade,
    label: grade === 'A' ? 'Setup solide' : grade === 'B' ? 'Setup correct' : grade === 'C' ? 'Setup faible' : 'Setup très faible',
    total,
    factors
  };
}

function noTradeCheck(rsi4h, rsi1h, bull, vol) {
  const conds = [
    { label: 'RSI 4H en zone neutre',   triggered: rsi4h >= 44 && rsi4h <= 56 },
    { label: 'Volume insuffisant',      triggered: vol.ratio < 0.8 },
    { label: 'Contradiction 1H / 4H',  triggered: (bull && rsi1h > 65) || (!bull && rsi1h < 35) },
  ];
  return { conds, isNoTrade: conds.filter(c => c.triggered).length >= 2 };
}

// ── Scan d'un actif ──
async function scanAsset(asset, options = {}) {
  const price = getPrice(asset.symbol);
  if (!price || Date.now() - price.updatedAt > 30000) return; // données trop vieilles

  const [kl4, kl1, kl1d] = await Promise.all([
    getKlines(asset.symbol, '4h', 100),
    getKlines(asset.symbol, '1h', 60),
    getKlines(asset.symbol, '1d', 50)
  ]);

  if (kl4.length < 30) return;

  const closes4  = kl4.map(k => k.close);
  const closes1  = kl1.map(k => k.close);
  const closes1d = kl1d.map(k => k.close);

  const rsi4  = calcRSI(closes4);
  const rsi1  = calcRSI(closes1);
  const ema200 = calcEMA(closes4, Math.min(200, closes4.length));
  const ema50d = calcEMA(closes1d, Math.min(50, closes1d.length));

  const p     = price.price;
  const bull  = p > ema200;
  const dailyTrend = closes1d[closes1d.length-1] > ema50d ? 'bull' : 'bear';
  const dailyBull  = dailyTrend === 'bull';

  const vol    = calcVolStrength(kl4);
  const hammer = isHammer(kl4[kl4.length-1]);
  const macdBull = bull && rsi4 < 55;

  const support    = p * 0.968;
  const resistance = p * 1.025;
  const nearSup    = Math.abs(p - support) / support < 0.025;
  const nearRes    = Math.abs(p - resistance) / resistance < 0.02;

  const noTrade = noTradeCheck(rsi4, rsi1, bull, vol);
  if (noTrade.isNoTrade) return;

  const nowTs = Date.now();
  const RSI_LONG  = 45;
  const RSI_SHORT = 62;
  const MIN_CONF  = 3;

  // ── Signal LONG ──
  if (rsi4 < RSI_LONG && (nearSup || bull) && dailyBull && vol.ratio >= 0.8) {
    const conf = buildConf(rsi4, bull, hammer, macdBull, nearSup, dailyBull);
    if (conf.score >= MIN_CONF) {
      const id = `LONG-4H-${asset.symbol}`;
      const grade = calcGrade(conf, vol, rsi4, true, hammer);
      const tp = Math.round(p * 1.07);
      const sl = Math.round(p * 0.975);
      const rr = ((tp-p)/(p-sl)).toFixed(1);

      if (!signalRegistry[id] || signalRegistry[id].dismissed) {
        const signal = {
          id, type: 'LONG', name: `Swing 4H — ${asset.short}`,
          asset: asset.symbol, assetName: asset.name, assetShort: asset.short,
          tf: '4H', entry: Math.round(p), sl, tp, rr,
          conf, grade, vol, dailyTrend,
          note: `RSI ${rsi4.toFixed(0)} zone favorable. Volume ${vol.label} ×${vol.ratio}. EMA 200 confirmée.`,
          createdAt: nowTs, lastSeen: nowTs, status: 'new', dismissed: false
        };
        signalRegistry[id] = signal;
        await saveSignal(signal);
        await notifyNewSignal(signal);
        console.log(`🟢 Signal LONG ${asset.short} — Note ${grade.grade} — Conf ${conf.score}/6`);
      } else {
        signalRegistry[id].lastSeen = nowTs;
        signalRegistry[id].status = 'confirmed';
        await saveSignal(signalRegistry[id]);
      }
    }
  }

  // ── Signal SHORT ──
  if (rsi1 > RSI_SHORT && nearRes && !dailyBull && vol.ratio >= 0.8) {
    const conf = buildConf(rsi1, !bull, false, !macdBull, nearRes, !dailyBull);
    if (conf.score >= MIN_CONF - 1) {
      const id = `SHORT-1H-${asset.symbol}`;
      const grade = calcGrade(conf, vol, rsi1, true, false);
      const tp = Math.round(p * 0.972);
      const sl = Math.round(p * 1.025);
      const rr = ((p-tp)/(sl-p)).toFixed(1);

      if (!signalRegistry[id] || signalRegistry[id].dismissed) {
        const signal = {
          id, type: 'SHORT', name: `Rejet résistance — ${asset.short}`,
          asset: asset.symbol, assetName: asset.name, assetShort: asset.short,
          tf: '1H', entry: Math.round(p), sl, tp, rr,
          conf, grade, vol, dailyTrend,
          note: `RSI ${rsi1.toFixed(0)} surachat. Volume ${vol.label}. Daily baissier.`,
          createdAt: nowTs, lastSeen: nowTs, status: 'new', dismissed: false
        };
        signalRegistry[id] = signal;
        await saveSignal(signal);
        await notifyNewSignal(signal);
        console.log(`🔴 Signal SHORT ${asset.short} — Note ${grade.grade} — Conf ${conf.score}/6`);
      } else {
        signalRegistry[id].lastSeen = nowTs;
        signalRegistry[id].status = 'confirmed';
        await saveSignal(signalRegistry[id]);
      }
    }
  }

  // Expirer les vieux signaux
  Object.values(signalRegistry).forEach(s => {
    if (s.asset === asset.symbol && !s.dismissed && (nowTs - s.lastSeen) > 120000) {
      s.status = 'expired';
      saveSignal(s);
    }
  });
}

// ── Notifications ──
async function notifyNewSignal(signal) {
  const title = `Signal ${signal.type} ${signal.assetShort} — Note ${signal.grade.grade}`;
  const body  = `Entrée ${signal.entry.toLocaleString()} $ · SL ${signal.sl.toLocaleString()} $ · TP ${signal.tp.toLocaleString()} $`;
  const data  = { signalId: signal.id, type: signal.type, asset: signal.asset };

  // Push Firebase
  await sendPushToAll(title, body, data).catch(e => console.warn('Push error:', e.message));

  // Telegram
  await sendTelegramSignal(signal).catch(e => console.warn('Telegram error:', e.message));
}

// ── Moteur principal ──
async function runSignalEngine(options = {}) {
  totalScans++;
  lastScanTime = new Date();

  const assetsToScan = options.deep ? ASSETS : ASSETS.slice(0, 3); // BTCUSDT, ETH, SOL en priorité

  await Promise.all(assetsToScan.map(asset => scanAsset(asset, options)));
}

function getEngineStatus() {
  const activeSignals = Object.values(signalRegistry)
    .filter(s => !s.dismissed && s.status !== 'expired');

  return {
    running: true,
    lastScan: lastScanTime,
    totalScans,
    activeSignals: activeSignals.length,
    signals: activeSignals,
    assetsMonitored: ASSETS.map(a => a.symbol)
  };
}

module.exports = { runSignalEngine, getEngineStatus, signalRegistry };
