const WebSocket = require('ws');
const axios = require('axios');

// Prix en mémoire — partagé avec le moteur de signaux
const prices = {};
const klineCache = {}; // cache des chandeliers

let wsConnections = [];

function initBinanceWS(symbols) {
  symbols.forEach(symbol => {
    connectSymbol(symbol);
  });
  console.log(`📡 WebSocket Binance démarré pour: ${symbols.join(', ')}`);
}

function connectSymbol(symbol) {
  const url = `wss://stream.binance.com:9443/ws/${symbol}@ticker`;
  const ws = new WebSocket(url);

  ws.on('open', () => {
    console.log(`✅ WS connecté: ${symbol.toUpperCase()}`);
  });

  ws.on('message', (data) => {
    try {
      const tick = JSON.parse(data.toString());
      const sym = tick.s; // ex: BTCUSDT
      prices[sym] = {
        price: parseFloat(tick.c),
        change24h: parseFloat(tick.P),
        high24h: parseFloat(tick.h),
        low24h: parseFloat(tick.l),
        volume24h: parseFloat(tick.v),
        updatedAt: Date.now()
      };
    } catch(e) {}
  });

  ws.on('close', () => {
    console.log(`🔌 WS déconnecté: ${symbol}, reconnexion dans 5s...`);
    setTimeout(() => connectSymbol(symbol), 5000);
  });

  ws.on('error', (e) => {
    console.error(`WS error ${symbol}:`, e.message);
  });

  wsConnections.push(ws);
}

function getPrice(symbol) {
  return prices[symbol] || null;
}

function getAllPrices() {
  return prices;
}

// Récupérer les klines avec cache (5min)
async function getKlines(symbol, interval, limit = 100) {
  const key = `${symbol}_${interval}_${limit}`;
  const cached = klineCache[key];

  // Cache valide 5 minutes
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
    return cached.data;
  }

  try {
    const res = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol, interval, limit },
      timeout: 8000
    });

    const klines = res.data.map(k => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    }));

    klineCache[key] = { data: klines, ts: Date.now() };
    return klines;
  } catch(e) {
    console.error(`Klines error ${symbol}:`, e.message);
    return cached?.data || [];
  }
}

module.exports = { initBinanceWS, getPrice, getAllPrices, getKlines };
