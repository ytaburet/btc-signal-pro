const { getPrice, getKlines } = require('./binance');
const { saveSignal, sendPushToAll } = require('./firebase');
const { sendTelegramSignal } = require('../notifications/telegram');

const signalRegistry = {};
let lastScanTime = null;
let totalScans = 0;

const ASSETS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin',  short: 'BTC' },
  { symbol: 'ETHUSDT', name: 'Ethereum', short: 'ETH' },
  { symbol: 'SOLUSDT', name: 'Solana',   short: 'SOL' },
  { symbol: 'BNBUSDT', name: 'BNB',      short: 'BNB' },
  { symbol: 'XRPUSDT', name: 'XRP',      short: 'XRP' },
];

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let g = 0, l = 0;
  for (let i = 1; i <= period; i++) { const d = closes[i]-closes[i-1]; d>0?g+=d:l+=Math.abs(d); }
  let ag = g/period, al = l/period;
  for (let i = period+1; i < closes.length; i++) { const d = closes[i]-closes[i-1]; ag=(ag*(period-1)+(d>0?d:0))/period; al=(al*(period-1)+(d<0?Math.abs(d):0))/period; }
  return al===0?100:100-(100/(1+ag/al));
}

function calcEMA(closes, period) {
  if (closes.length < period) return closes[closes.length-1];
  const k = 2/(period+1);
  let ema = closes.slice(0,period).reduce((a,b)=>a+b,0)/period;
  for (let i = period; i < closes.length; i++) ema = closes[i]*k+ema*(1-k);
  return ema;
}

function isHammer(k) {
  const body=Math.abs(k.close-k.open), range=k.high-k.low;
  return range>0 && (Math.min(k.open,k.close)-k.low)>=body*1.5 && body/range<0.45;
}

function isEngulfing(k1, k2) {
  return k1.close<k1.open && k2.close>k2.open && k2.open<k1.close && k2.close>k1.open;
}

function calcVolStrength(klines) {
  if (klines.length<20) return {ratio:1,strong:false,label:'Inconnu'};
  const vols=klines.map(k=>k.volume);
  const avg=vols.slice(-20,-1).reduce((a,b)=>a+b,0)/19;
  const last=vols[vols.length-1];
  const ratio=avg>0?parseFloat((last/avg).toFixed(2)):1;
  return {ratio,strong:ratio>=1.1,label:ratio>=1.8?'Très fort':ratio>=1.3?'Fort':ratio>=1.0?'Normal':'Faible'};
}

function hasHigherLow(klines) {
  if (klines.length<20) return false;
  const lows=klines.slice(-20).map(k=>k.low);
  const mid=Math.floor(lows.length/2);
  return Math.min(...lows.slice(mid)) > Math.min(...lows.slice(0,mid));
}

function buildConf(ind) {
  const items = [
    {name:'EMA 200',        ok: ind.bull},
    {name:'RSI favorable',  ok: ind.rsi<52||ind.rsi>58},
    {name:'Pattern bougie', ok: ind.hammer||ind.engulfing},
    {name:'MACD',           ok: ind.macdOk},
    {name:'Niveau clé',     ok: ind.nearLevel},
    {name:'Tendance Daily', ok: ind.dailyOk},
  ];
  return {items, score:items.filter(i=>i.ok).length, max:6};
}

function calcGrade(conf) {
  const s=conf.score;
  const grade=s>=5?'A':s>=4?'B':s>=3?'C':'D';
  return {grade, label:grade==='A'?'Setup solide':grade==='B'?'Setup correct':grade==='C'?'Setup faible':'Setup très faible', total:s*16, factors:[]};
}

async function scanAsset(asset) {
  const price = getPrice(asset.symbol);
  if (!price || Date.now()-price.updatedAt>60000) return;

  const [kl4, kl1, kl1d] = await Promise.all([
    getKlines(asset.symbol,'4h',100),
    getKlines(asset.symbol,'1h',60),
    getKlines(asset.symbol,'1d',50)
  ]);
  if (kl4.length<30) return;

  const closes4=kl4.map(k=>k.close), closes1d=kl1d.map(k=>k.close);
  const rsi4=calcRSI(closes4);
  const ema200=calcEMA(closes4, Math.min(200,Math.floor(closes4.length*0.9)));
  const ema50d=calcEMA(closes1d, Math.min(50,closes1d.length));

  const p=price.price, bull=p>ema200;
  const dailyBull=closes1d[closes1d.length-1]>ema50d;
  const vol=calcVolStrength(kl4);
  const hammer=isHammer(kl4[kl4.length-1]);
  const engulf=kl4.length>=2&&isEngulfing(kl4[kl4.length-2],kl4[kl4.length-1]);
  const higherLow=hasHigherLow(kl4);

  const highs20=kl4.slice(-20).map(k=>k.high), lows20=kl4.slice(-20).map(k=>k.low);
  const structHigh=Math.max(...highs20), structLow=Math.min(...lows20);
  const range=structHigh-structLow||1;
  const nearSup=(p-structLow)/range<0.2;
  const nearRes=(structHigh-p)/range<0.2;

  const nowTs=Date.now();
  const RSI_LONG=52, RSI_SHORT=58, MIN_CONF=2;

  // ── LONG ──
  if (rsi4<RSI_LONG && (bull||nearSup||higherLow)) {
    const conf=buildConf({rsi:rsi4, bull, hammer, engulfing:engulf, macdOk:rsi4<45||bull, nearLevel:nearSup, dailyOk:dailyBull||rsi4<48});
    if (conf.score>=MIN_CONF) {
      const id=`LONG-4H-${asset.symbol}`;
      const ex=signalRegistry[id];
      if (!ex||ex.dismissed||(nowTs-ex.createdAt)>4*3600000) {
        const grade=calcGrade(conf);
        const tp=Math.round(p*(bull?1.07:1.05)), sl=Math.round(p*(bull?0.975:0.962));
        const rr=((tp-p)/(p-sl)).toFixed(1);
        const signal={id,type:'LONG',name:`Swing 4H — ${asset.short}`,asset:asset.symbol,assetName:asset.name,assetShort:asset.short,tf:'4H',entry:Math.round(p),sl,tp,rr,conf,grade,vol,dailyTrend:dailyBull?'bull':'bear',note:`RSI 4H à ${rsi4.toFixed(0)}. ${bull?'Au-dessus EMA 200.':'Zone de support.'} Volume ${vol.label} ×${vol.ratio}.`,createdAt:nowTs,lastSeen:nowTs,status:'new',dismissed:false};
        signalRegistry[id]=signal;
        await saveSignal(signal);
        await notifyNewSignal(signal);
        console.log(`🟢 Signal LONG ${asset.short} — Note ${grade.grade} — RSI ${rsi4.toFixed(0)} — Conf ${conf.score}/6`);
      } else if (ex&&!ex.dismissed) { ex.lastSeen=nowTs; ex.status='confirmed'; await saveSignal(ex); }
    }
  }

  // ── SHORT ──
  if (rsi4>RSI_SHORT && (!bull||nearRes)) {
    const conf=buildConf({rsi:rsi4, bull:!bull, hammer:false, engulfing:false, macdOk:rsi4>65||!bull, nearLevel:nearRes, dailyOk:!dailyBull||rsi4>62});
    if (conf.score>=MIN_CONF) {
      const id=`SHORT-4H-${asset.symbol}`;
      const ex=signalRegistry[id];
      if (!ex||ex.dismissed||(nowTs-ex.createdAt)>4*3600000) {
        const grade=calcGrade(conf);
        const tp=Math.round(p*0.972), sl=Math.round(p*1.025);
        const rr=((p-tp)/(sl-p)).toFixed(1);
        const signal={id,type:'SHORT',name:`Rejet résistance — ${asset.short}`,asset:asset.symbol,assetName:asset.name,assetShort:asset.short,tf:'4H',entry:Math.round(p),sl,tp,rr,conf,grade,vol,dailyTrend:dailyBull?'bull':'bear',note:`RSI 4H à ${rsi4.toFixed(0)} — zone de surachat. Volume ${vol.label}.`,createdAt:nowTs,lastSeen:nowTs,status:'new',dismissed:false};
        signalRegistry[id]=signal;
        await saveSignal(signal);
        await notifyNewSignal(signal);
        console.log(`🔴 Signal SHORT ${asset.short} — Note ${grade.grade} — RSI ${rsi4.toFixed(0)} — Conf ${conf.score}/6`);
      } else if (ex&&!ex.dismissed) { ex.lastSeen=nowTs; ex.status='confirmed'; await saveSignal(ex); }
    }
  }

  if (totalScans%10===0) console.log(`📊 ${asset.short}: prix=${Math.round(p)} RSI=${rsi4.toFixed(0)} EMA200=${Math.round(ema200)} bull=${bull} vol=×${vol.ratio}`);

  Object.values(signalRegistry).forEach(s => {
    if (s.asset===asset.symbol&&!s.dismissed&&(nowTs-s.lastSeen)>8*3600000) { s.status='expired'; saveSignal(s); }
  });
}

async function notifyNewSignal(signal) {
  const title=`Signal ${signal.type} ${signal.assetShort} — Note ${signal.grade.grade}`;
  const body=`Entrée ${signal.entry.toLocaleString()} $ · SL ${signal.sl.toLocaleString()} $ · TP ${signal.tp.toLocaleString()} $`;
  const data={signalId:signal.id,type:signal.type,asset:signal.asset};
  await sendPushToAll(title,body,data).catch(e=>console.warn('Push error:',e.message));
  await sendTelegramSignal(signal).catch(e=>console.warn('Telegram error:',e.message));
  try { const {notifyNewSignal:n}=require('../agent/orchestrator'); n(signal).catch(()=>{}); } catch(e) {}
}

async function runSignalEngine(options={}) {
  totalScans++; lastScanTime=new Date();
  const assets=options.deep?ASSETS:ASSETS.slice(0,3);
  await Promise.all(assets.map(a=>scanAsset(a).catch(e=>console.error(`Scan ${a.short}:`,e.message))));
}

function getEngineStatus() {
  const active=Object.values(signalRegistry).filter(s=>!s.dismissed&&s.status!=='expired');
  return {running:true,lastScan:lastScanTime,totalScans,activeSignals:active.length,signals:active,assetsMonitored:ASSETS.map(a=>a.symbol)};
}

module.exports = { runSignalEngine, getEngineStatus, signalRegistry };
