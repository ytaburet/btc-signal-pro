import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import BottomNav from './components/BottomNav'
import SignalCard from './components/SignalCard'
import PriceChart from './components/PriceChart'
import Heatmap from './components/Heatmap'
import MacroCalendar from './components/MacroCalendar'
import { useSignals } from './hooks/useSignals'
import { useNotifications } from './hooks/useNotifications'
import { useMarket } from './hooks/useMarket'
import { db } from './firebase'
import FormationPage from './pages/FormationPage'
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore'

function AppInner() {
  const { user, logout } = useAuth()
  const [page, setPage]           = useState('market')
  const [currentAsset, setAsset]  = useState('BTCUSDT')
  const [showProfile, setProfile] = useState(false)
  const [showNotifCenter, setNotifCenter] = useState(false)
  const [historyData, setHistoryData] = useState([])

  const { signals, prices, lastScan, loading, dismissSignal } = useSignals()
  const { fearGreed, sentiment } = useMarket(prices, currentAsset)
  const { notifs, unreadCount, priceAlerts, addNotif, markAllRead, clearAll, addPriceAlert, deletePriceAlert, checkPriceAlerts, requestPermission } = useNotifications()

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'signals'), orderBy('createdAt', 'desc'), limit(50))
    const unsub = onSnapshot(q, snap => setHistoryData(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return unsub
  }, [user])

  useEffect(() => {
    const p = prices[currentAsset]
    if (p) checkPriceAlerts(p.price, currentAsset)
  }, [prices, currentAsset])

  if (!user) return <LoginPage />

  const p = prices[currentAsset]
  const currentPrice = p?.price
  const activeSignals = signals.filter(s => !s.asset || s.asset === currentAsset)

  // Récupérer la clé API Claude depuis userData ou localStorage
  const apiKey = (typeof window !== 'undefined' && localStorage.getItem('claude_api_key')) || ''

  const ASSETS = [
    { symbol:'BTCUSDT', short:'BTC', color:'#F7931A', emoji:'₿' },
    { symbol:'ETHUSDT', short:'ETH', color:'#627EEA', emoji:'Ξ' },
    { symbol:'SOLUSDT', short:'SOL', color:'#9945FF', emoji:'◎' },
    { symbol:'BNBUSDT', short:'BNB', color:'#F3BA2F', emoji:'B' },
    { symbol:'XRPUSDT', short:'XRP', color:'#346AA9', emoji:'✕' },
  ]

  const taken = historyData.filter(h => h.decision === 'taken')
  const wins  = taken.filter(h => h.outcome === 'win')
  const wr    = taken.length > 0 ? Math.round(wins.length / taken.length * 100) : null
  const pnl   = taken.filter(h => h.pnlNum != null).reduce((a, h) => a + h.pnlNum, 0)

  async function setDecision(sigId, decision) {
    try { await setDoc(doc(db, 'signals', sigId), { decision }, { merge: true }) } catch(e) {}
  }
  async function saveJournal(sigId, text) {
    try { await setDoc(doc(db, 'signals', sigId), { journalEntry: text }, { merge: true }) } catch(e) {}
  }

  return (
    <div className="flex flex-col h-screen max-w-[430px] mx-auto bg-[#080808]">
      <div className="flex-1 overflow-y-auto pb-[86px]" style={{scrollbarWidth:'none'}}>

        {page === 'market' && (
          <div>
            <Topbar title={ASSETS.find(a=>a.symbol===currentAsset)?.short+' / USDT'} sub={lastScan?`Mis à jour à ${new Date(lastScan).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`:'Connexion...'} unread={unreadCount} user={user} onNotif={()=>{setNotifCenter(true);markAllRead()}} onProfile={()=>setProfile(true)} />

            <div className="flex gap-2 px-4 pb-4 overflow-x-auto" style={{scrollbarWidth:'none'}}>
              {ASSETS.map(a => {
                const ap=prices[a.symbol], up=(ap?.change24h||0)>=0
                return <button key={a.symbol} onClick={()=>setAsset(a.symbol)} className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer border-none font-sans ${currentAsset===a.symbol?'bg-[#00C896]/12 ring-1 ring-[#00C896]':'bg-[#111]'}`}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{background:a.color+'22',color:a.color}}>{a.emoji}</span>
                  <span className={`text-xs font-bold ${currentAsset===a.symbol?'text-[#00C896]':'text-white'}`}>{a.short}</span>
                  {ap&&<span className="text-[10px]" style={{color:up?'#00C896':'#FF4D4D'}}>{up?'+':''}{ap.change24h?.toFixed(1)}%</span>}
                </button>
              })}
            </div>

            <div className={`mx-4 mb-4 rounded-2xl px-5 py-6 relative overflow-hidden ${sentiment.cls==='bull'?'bg-gradient-to-br from-[#00C896]/15 to-transparent border border-[#00C896]/25':sentiment.cls==='bear'?'bg-gradient-to-br from-[#FF4D4D]/15 to-transparent border border-[#FF4D4D]/25':'bg-gradient-to-br from-[#F5A623]/15 to-transparent border border-[#F5A623]/25'}`}>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{color:sentiment.cls==='bull'?'#00C896':sentiment.cls==='bear'?'#FF4D4D':'#F5A623'}}>Tendance globale</div>
              <div className="text-[38px] font-extrabold tracking-tight leading-none mb-2" style={{color:sentiment.cls==='bull'?'#00C896':sentiment.cls==='bear'?'#FF4D4D':'#F5A623'}}>{sentiment.label}</div>
              <div className="text-xs text-[#666]">{sentiment.cls==='bull'?'Structure solide. Favorisez les longs.':sentiment.cls==='bear'?'Pression baissière. Prudence.':'Consolidation. Attente catalyseur.'}</div>
              <div className="absolute top-3 right-4 text-[64px] font-black opacity-[0.07] leading-none select-none">{sentiment.score}</div>
            </div>

            <div className="mx-4 mb-4">
              <div className="flex justify-between text-xs text-[#666] mb-1.5"><span>Indice de sentiment</span><span className="font-semibold" style={{color:sentiment.cls==='bull'?'#00C896':sentiment.cls==='bear'?'#FF4D4D':'#F5A623'}}>{sentiment.score} / 100</span></div>
              <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{width:sentiment.score+'%',background:sentiment.cls==='bull'?'#00C896':sentiment.cls==='bear'?'#FF4D4D':'#F5A623'}}/></div>
              <div className="flex justify-between text-[10px] text-[#333] mt-1"><span>Peur extrême</span><span>Neutre</span><span>Euphorie</span></div>
            </div>

            {fearGreed&&<div className="mx-4 mb-4 bg-[#111] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-4"><FGGauge val={fearGreed.val}/><div><div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">Fear & Greed — Alternative.me</div><div className="text-lg font-bold mb-1" style={{color:fearGreed.val<25?'#FF4D4D':fearGreed.val<45?'#F5A623':fearGreed.val<75?'#00C896':'#00E5B0'}}>{fearGreed.val<25?'Peur extrême':fearGreed.val<45?'Peur':fearGreed.val<55?'Neutre':fearGreed.val<75?'Avidité':'Avidité extrême'}</div><div className="text-xs text-[#666]">Score : {fearGreed.val}/100 · {fearGreed.label}</div></div></div>}

            <div className="grid grid-cols-2 gap-2.5 mx-4 mb-4">
              <div className="bg-[#111] border border-white/[0.07] rounded-xl p-3.5"><div className="text-[10px] text-[#666] uppercase tracking-wider mb-1.5">Prix {ASSETS.find(a=>a.symbol===currentAsset)?.short}</div><div className="text-xl font-bold">{currentPrice?(currentPrice>=1000?Math.round(currentPrice).toLocaleString('fr-FR'):currentPrice.toFixed(4))+' $':'—'}</div><div className="text-xs text-[#666] mt-1">{p&&<span style={{color:p.change24h>=0?'#00C896':'#FF4D4D'}}>{p.change24h>=0?'+':''}{p.change24h?.toFixed(2)}%</span>} aujourd'hui</div></div>
              <div className="bg-[#111] border border-white/[0.07] rounded-xl p-3.5"><div className="text-[10px] text-[#666] uppercase tracking-wider mb-1.5">Signaux actifs</div><div className="text-xl font-bold text-[#00C896]">{activeSignals.length}</div><div className="text-xs text-[#666] mt-1">détectés</div></div>
            </div>

            <PriceChart symbol={currentAsset} currentPrice={currentPrice}/>
            <Heatmap/>
            <MacroCalendar/>
          </div>
        )}

        {page === 'signals' && (
          <div>
            <Topbar title="Signaux" sub="Niveaux figés · Backend 24h/24" unread={unreadCount} user={user} onNotif={()=>{setNotifCenter(true);markAllRead()}} onProfile={()=>setProfile(true)}/>
            <div className="mx-4 mb-3 bg-[#111] border border-white/[0.07] rounded-xl p-3.5 flex justify-between items-center text-xs">
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#00C896]" style={{animation:'blink 2s infinite'}}/>Moteur actif — Railway</span>
              <span className="text-[#666]">{lastScan?new Date(lastScan).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'—'}</span>
            </div>
            {loading?<div className="text-center py-12 text-[#666] text-sm">Connexion au backend...</div>:
             activeSignals.length===0?<div className="text-center py-12"><div className="text-5xl opacity-20 mb-3">◎</div><div className="text-sm font-semibold mb-2">Aucun signal actif</div><div className="text-xs text-[#666]">Le moteur tourne en continu.</div></div>:
             activeSignals.map(s=><SignalCard key={s.id} signal={s} currentPrice={currentPrice} onDismiss={dismissSignal} onAnalyze={sig=>addNotif('info','Analyse',`Signal ${sig.type}`)} onExport={()=>{}} apiKey={apiKey}/>)}
          </div>
        )}

        {page === 'formation' && (
          <FormationPage />
        )}

        {page === 'history' && (
          <div>
            <Topbar title="Historique" sub="Signaux de l'algorithme" unread={unreadCount} user={user} onNotif={()=>{setNotifCenter(true);markAllRead()}} onProfile={()=>setProfile(true)}/>
            <div className="grid grid-cols-4 gap-2 mx-4 mb-4">
              {[{v:historyData.length,l:'Signaux'},{v:taken.length,l:'Pris'},{v:wr!=null?wr+'%':'—',l:'Win rate',c:wr>=60?'#00C896':wr>=40?'#F5A623':'#FF4D4D'},{v:pnl!==0?(pnl>=0?'+':'')+pnl.toFixed(1)+'%':'—',l:'P&L',c:pnl>=0?'#00C896':'#FF4D4D'}].map((s,i)=>(
                <div key={i} className="bg-[#111] border border-white/[0.07] rounded-xl p-3 text-center"><div className="text-lg font-bold mb-0.5" style={s.c?{color:s.c}:{}}>{s.v}</div><div className="text-[10px] text-[#666] uppercase">{s.l}</div></div>
              ))}
            </div>
            <div className="mx-4 mb-4">
              <div className="flex justify-between text-xs text-[#666] mb-1.5"><span>Taux de réussite</span><span>{taken.length>0?`${wins.length} gagné${wins.length>1?'s':''} / ${taken.length-wins.length} perdu${taken.length-wins.length>1?'s':''}`:'Aucun trade pris'}</span></div>
              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden flex"><div className="bg-[#00C896] rounded-full" style={{width:(wr||0)+'%'}}/><div className="bg-[#FF4D4D] flex-1"/></div>
            </div>
            {historyData.length===0?<div className="text-center py-12"><div className="text-5xl opacity-20 mb-3">◎</div><div className="text-sm font-semibold mb-2">Aucun signal archivé</div><div className="text-xs text-[#666]">Les signaux expirés apparaissent ici.</div></div>:
             historyData.map(h=><HistoryCard key={h.id} h={h} onDecision={setDecision} onJournal={saveJournal} currentPrice={currentPrice}/>)}
          </div>
        )}

        {page === 'alerts' && (
          <div>
            <Topbar title="Alertes" sub="Notifications de prix et signaux" unread={unreadCount} user={user} onNotif={()=>{setNotifCenter(true);markAllRead()}} onProfile={()=>setProfile(true)}/>
            {typeof Notification!=='undefined'&&Notification.permission!=='granted'&&<div className="mx-4 mb-4 bg-[#111] border border-[#F5A623]/30 rounded-2xl p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#F5A623]/12 flex items-center justify-center flex-shrink-0 text-xl">🔔</div><div className="flex-1"><div className="text-sm font-semibold mb-1">Activer les notifications push</div><div className="text-xs text-[#666]">Reçois les signaux même app fermée</div></div><button onClick={requestPermission} className="bg-[#F5A623] text-black text-xs font-bold px-4 py-2 rounded-xl border-none cursor-pointer font-sans">Activer</button></div>}
            <div className="mx-4 mb-4"><div className="text-[11px] font-semibold uppercase tracking-wider text-[#666] mb-3">Alertes de prix</div><div className="bg-[#111] border border-white/[0.07] rounded-2xl p-4"><div className="text-xs text-[#666] mb-3">Notifié quand le prix atteint ce niveau</div><PriceAlertForm onAdd={addPriceAlert} asset={currentAsset}/>{priceAlerts.map(a=><div key={a.id} className="flex items-center justify-between mt-3 bg-[#1a1a1a] rounded-xl px-3 py-2.5"><div className="text-sm"><span className="font-semibold" style={{color:a.type==='above'?'#00C896':'#FF4D4D'}}>{a.type==='above'?'↑':'↓'} {a.price.toLocaleString('fr-FR')} $ ({a.asset.replace('USDT','')})</span>{a.triggered&&<span className="text-xs text-[#666] ml-2">✓ Déclenchée</span>}</div><button onClick={()=>deletePriceAlert(a.id)} className="text-[#666] text-lg bg-none border-none cursor-pointer">×</button></div>)}</div></div>
            <div className="mx-4 mb-4"><div className="flex justify-between items-center mb-3"><div className="text-[11px] font-semibold uppercase tracking-wider text-[#666]">Historique récent</div>{notifs.length>0&&<button onClick={clearAll} className="text-xs text-[#666] bg-none border-none cursor-pointer font-sans">Effacer</button>}</div>
            {notifs.length===0?<div className="text-center py-8 text-[#666] text-xs">Aucune notification</div>:notifs.slice(0,15).map(n=><div key={n.id} className="flex items-start gap-3 bg-[#111] border border-white/[0.07] rounded-xl p-3 mb-2"><span className="text-lg flex-shrink-0">{{'signal':'📊','price':'💰','alert':'⚠️','liq':'💧','info':'ℹ️'}[n.type]||'🔔'}</span><div><div className="text-xs font-semibold mb-0.5">{n.title}</div><div className="text-xs text-[#666]">{n.text}</div><div className="text-[10px] text-[#333] mt-1">{formatAgo(n.time)}</div></div></div>)}</div>
          </div>
        )}

      </div>
      <BottomNav active={page} onNavigate={setPage} sigCount={activeSignals.length}/>
      {showProfile&&<ProfileSheet user={user} onClose={()=>setProfile(false)} onLogout={logout} stats={{total:historyData.length,taken:taken.length,wr}}/>}
      {showNotifCenter&&<NotifCenter notifs={notifs} onClose={()=>setNotifCenter(false)} onClear={clearAll}/>}
    </div>
  )
}

function Topbar({title,sub,unread,user,onNotif,onProfile}){return(<div className="pt-[52px] px-5 pb-3.5 flex justify-between items-end"><div><h1 className="text-[28px] font-bold tracking-tight">{title}</h1><p className="text-xs text-[#666] mt-0.5">{sub}</p></div><div className="flex items-center gap-2"><button onClick={onNotif} className="relative w-[34px] h-[34px] bg-[#111] border border-white/[0.07] rounded-full flex items-center justify-center cursor-pointer border-solid"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#666" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>{unread>0&&<span className="absolute -top-1 -right-1 bg-[#FF4D4D] text-white text-[9px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center border-2 border-[#080808] px-1">{unread>9?'9+':unread}</span>}</button><button onClick={onProfile} className="w-[30px] h-[30px] rounded-full bg-[#00C896]/12 flex items-center justify-center text-xs font-bold text-[#00C896] cursor-pointer overflow-hidden border-none">{user?.photoURL?<img src={user.photoURL} className="w-full h-full object-cover" alt=""/>:(user?.displayName||user?.email||'U')[0].toUpperCase()}</button><div className="flex items-center gap-1.5 text-xs bg-[#00C896]/12 text-[#00C896] px-3 py-1.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-[#00C896]" style={{animation:'blink 2s infinite'}}/>Live</div></div></div>)}

function FGGauge({val}){const col=val<25?'#FF4D4D':val<45?'#F5A623':val<55?'#f2f2f2':val<75?'#00C896':'#00E5B0';const x=32+24*Math.cos(Math.PI-val/100*Math.PI);const y=32-24*Math.sin(Math.PI-val/100*Math.PI);return(<div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center"><svg viewBox="0 0 64 64" className="absolute inset-0" width="64" height="64"><path d="M 8 32 A 24 24 0 0 1 56 32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round"/><path d={`M 8 32 A 24 24 0 0 1 ${x} ${y}`} fill="none" stroke={col} strokeWidth="6" strokeLinecap="round"/></svg><span className="text-lg font-extrabold relative z-10" style={{color:col}}>{val}</span></div>)}

function HistoryCard({h,onDecision,onJournal,currentPrice}){const[journal,setJournal]=useState(h.journalEntry||'');const[saved,setSaved]=useState(!!h.journalEntry);const isLong=h.type==='LONG';const conf=h.conf?h.conf.score+'/'+h.conf.max:'—';function handleSave(){onJournal(h.id,journal);setSaved(true);}return(<div className="mx-4 mb-3 bg-[#111] border border-white/[0.07] rounded-2xl p-4"><div className="flex justify-between items-start mb-3"><div className="flex gap-2 items-center flex-wrap"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isLong?'bg-[#00C896]/12 text-[#00C896]':'bg-[#FF4D4D]/12 text-[#FF4D4D]'}`}>{h.type}</span><span className="text-sm font-semibold">{h.name||'Signal'}</span>{h.grade&&<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#666]">{h.grade.grade}</span>}</div><span className="text-xs text-[#666] whitespace-nowrap">{h.date||'—'}</span></div><div className="grid grid-cols-4 gap-1.5 mb-3">{[{l:'Entrée',v:h.entry,c:'text-white'},{l:'Stop',v:h.sl,c:'text-[#FF4D4D]'},{l:'TP',v:h.tp,c:'text-[#00C896]'},{l:'Conf.',v:conf,c:'text-[#666]'}].map((f,i)=><div key={i} className="bg-[#1a1a1a] rounded-lg p-2"><div className="text-[9px] text-[#666] uppercase mb-1">{f.l}</div><div className={`text-xs font-semibold ${f.c}`}>{typeof f.v==='number'?(f.v>=1000?f.v.toLocaleString('fr-FR'):f.v?.toFixed(4))+' $':f.v}</div></div>)}</div><div className="text-xs text-[#666] mb-2">As-tu pris ce trade ?</div><div className="flex gap-2 mb-3"><button onClick={()=>onDecision(h.id,h.decision==='taken'?null:'taken')} className={`text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer border font-sans ${h.decision==='taken'?'bg-[#00C896] text-black border-[#00C896]':'bg-transparent text-[#00C896] border-[#00C896]'}`}>{h.decision==='taken'?'✓ Pris':'Oui, pris'}</button><button onClick={()=>onDecision(h.id,h.decision==='skipped'?null:'skipped')} className={`text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer border font-sans ${h.decision==='skipped'?'bg-[#1a1a1a] text-white border-white/20':'bg-transparent text-[#666] border-white/[0.07]'}`}>{h.decision==='skipped'?'✗ Non pris':'Non pris'}</button></div>{h.decision==='taken'&&<div className={`flex justify-between px-3 py-2 rounded-xl text-xs mb-3 ${h.outcome==='win'?'bg-[#00C896]/12 text-[#00C896]':h.outcome==='loss'?'bg-[#FF4D4D]/12 text-[#FF4D4D]':'bg-[#1a1a1a] text-[#666]'}`}><span>{h.outcome==='win'?'TP atteint ✓':h.outcome==='loss'?'SL touché ✗':'En attente...'}</span>{h.pnlNum!=null&&<span className="font-bold">{h.pnlNum>=0?'+':''}{h.pnlNum.toFixed(1)}%</span>}</div>}<div className="text-xs text-[#666] mb-2">Journal</div>{saved&&h.journalEntry?<div className="bg-[#1a1a1a] border-l-2 border-[#4A9EFF] rounded-r-xl px-3 py-2 text-xs text-[#666] italic mb-2">"{h.journalEntry}"</div>:<><textarea value={journal} onChange={e=>{setJournal(e.target.value);setSaved(false)}} placeholder="Pourquoi ce choix ?" className="w-full bg-[#1a1a1a] border border-white/[0.07] text-white text-xs px-3 py-2 rounded-xl outline-none resize-none font-sans min-h-[52px] mb-2"/><button onClick={handleSave} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#4A9EFF]/15 text-[#4A9EFF] border-none cursor-pointer font-sans">Enregistrer</button></>}</div>)}

function PriceAlertForm({onAdd,asset}){const[price,setPrice]=useState('');const[type,setType]=useState('above');return(<div className="flex gap-2"><input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Ex: 90000" className="flex-1 bg-[#1a1a1a] border border-white/[0.07] text-white text-sm px-3 py-2 rounded-xl outline-none font-sans min-w-0"/><select value={type} onChange={e=>setType(e.target.value)} className="bg-[#1a1a1a] border border-white/[0.07] text-white text-xs px-2 py-2 rounded-xl outline-none font-sans"><option value="above">Au-dessus</option><option value="below">En-dessous</option></select><button onClick={()=>{if(price){onAdd(price,type,asset);setPrice('')}}} className="bg-[#00C896] text-black text-xs font-bold px-3 py-2 rounded-xl border-none cursor-pointer font-sans">+</button></div>)}

function NotifCenter({notifs,onClose,onClear}){const icons={signal:'📊',price:'💰',alert:'⚠️',liq:'💧',info:'ℹ️'};return(<div className="fixed inset-0 z-[600]"><div className="absolute inset-0 bg-black/60" onClick={onClose}/><div className="absolute top-0 right-0 w-full max-w-[380px] h-full bg-[#111] border-l border-white/[0.07] flex flex-col" style={{animation:'slideRight 0.25s ease'}}><div className="pt-14 px-4 pb-4 flex justify-between items-center border-b border-white/[0.07] flex-shrink-0"><h2 className="text-xl font-bold">Notifications</h2><div className="flex gap-2">{notifs.length>0&&<button onClick={onClear} className="text-xs text-[#666] bg-[#1a1a1a] px-3 py-1.5 rounded-full border-none cursor-pointer font-sans">Effacer</button>}<button onClick={onClose} className="text-2xl text-[#666] bg-none border-none cursor-pointer leading-none">×</button></div></div><div className="flex-1 overflow-y-auto">{notifs.length===0?<div className="text-center py-16 text-[#666]"><div className="text-4xl opacity-20 mb-3">🔔</div><div className="text-sm font-semibold mb-2">Aucune notification</div></div>:notifs.map(n=><div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-white/[0.04] ${!n.read?'bg-[#4A9EFF]/04':''}`}><div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${n.type==='signal'?'bg-[#00C896]/12':n.type==='price'?'bg-[#4A9EFF]/12':n.type==='alert'?'bg-[#FF4D4D]/12':'bg-[#1a1a1a]'}`}>{icons[n.type]||'🔔'}</div><div><div className="text-xs font-semibold mb-0.5">{n.title}</div><div className="text-xs text-[#666]">{n.text}</div><div className="text-[10px] text-[#444] mt-1">{formatAgo(n.time)}</div></div></div>)}</div></div></div>)}

function ProfileSheet({user,onClose,onLogout,stats}){return(<div className="fixed inset-0 z-[500]" onClick={onClose}><div className="absolute inset-0 bg-black/75"/><div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#111] rounded-t-2xl p-5 pb-11 border border-white/[0.07]" onClick={e=>e.stopPropagation()}><div className="w-16 h-16 rounded-full bg-[#00C896]/12 flex items-center justify-center text-3xl font-bold text-[#00C896] mx-auto mb-3 overflow-hidden">{user.photoURL?<img src={user.photoURL} className="w-full h-full object-cover rounded-full" alt=""/>:(user.displayName||user.email||'U')[0].toUpperCase()}</div><div className="text-lg font-bold text-center mb-1">{user.displayName||'Utilisateur'}</div><div className="text-xs text-[#666] text-center mb-5">{user.email}</div><div className="grid grid-cols-3 gap-2 mb-4">{[{v:stats.total,l:'Signaux'},{v:stats.taken,l:'Pris'},{v:stats.wr!=null?stats.wr+'%':'—',l:'Win rate'}].map((s,i)=><div key={i} className="bg-[#1a1a1a] rounded-xl p-3 text-center"><div className="text-lg font-bold mb-1">{s.v}</div><div className="text-[10px] text-[#666] uppercase">{s.l}</div></div>)}</div><div className="bg-[#1a1a1a] rounded-xl px-4 py-3 text-xs text-[#666] mb-4 text-center">Synchronisé Firebase · {user.email}</div><button onClick={onLogout} className="w-full bg-[#FF4D4D]/12 text-[#FF4D4D] border border-[#FF4D4D] text-sm font-semibold py-3.5 rounded-xl cursor-pointer font-sans">Se déconnecter</button></div></div>)}

function formatAgo(date){if(!date)return'—';const s=Math.round((Date.now()-new Date(date).getTime())/1000);if(s<60)return"À l'instant";if(s<3600)return Math.floor(s/60)+'min';if(s<86400)return Math.floor(s/3600)+'h';return new Date(date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}

export default function App(){return<AuthProvider><AppInner/></AuthProvider>}
