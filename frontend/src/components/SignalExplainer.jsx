import React, { useState } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

// Génère l'explication via Claude API (si clé dispo) ou en local
async function generateExplanation(signal, apiKey) {
  const isLong = signal.type === 'LONG'
  const rsi    = signal.note?.match(/RSI (\d+)/)?.[1] || '—'
  const conf   = signal.conf ? `${signal.conf.score}/${signal.conf.max}` : '—'
  const grade  = signal.grade?.grade || '—'
  const asset  = signal.assetShort || 'BTC'
  const slPct  = signal.entry && signal.sl ? ((Math.abs(signal.entry - signal.sl) / signal.entry) * 100).toFixed(1) : '—'
  const tpPct  = signal.entry && signal.tp ? ((Math.abs(signal.tp - signal.entry) / signal.entry) * 100).toFixed(1) : '—'

  if (apiKey) {
    const prompt = `Tu es un formateur en trading crypto qui explique les signaux à des débutants absolus.

Signal détecté : ${signal.type} sur ${asset}/USDT
Entrée : ${signal.entry} $ | Stop Loss : ${signal.sl} $ (-${slPct}%) | Take Profit : ${signal.tp} $ (+${tpPct}%)
RSI 4H : ${rsi} | EMA 200 : ${isLong ? 'prix au-dessus' : 'prix en-dessous'} | Confluence : ${conf} | Note : ${grade}
Volume : ${signal.vol?.label || '—'} ×${signal.vol?.ratio || '—'} | Tendance Daily : ${signal.dailyTrend === 'bull' ? 'haussière' : 'baissière'}

Explique ce signal en 4 parties courtes, en langage très simple pour un débutant :
1. **Pourquoi ce signal existe** (1-2 phrases)
2. **Ce que disent les indicateurs** (RSI, EMA, volume — 1 phrase chacun)
3. **Le risque concret** (si je mets 100€, je peux perdre X€ ou gagner Y€)
4. **Ce qu'il faut surveiller** (1-2 points clés)

Sois direct, concret, sans jargon inutile. Pas d'intro ni de conclusion.`

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const d = await r.json()
      if (d.content?.[0]?.text) return { type: 'ai', text: d.content[0].text }
    } catch(e) {}
  }

  // Fallback local — explication générée sans API
  return { type: 'local', text: generateLocalExplanation(signal, rsi, slPct, tpPct) }
}

function generateLocalExplanation(signal, rsi, slPct, tpPct) {
  const isLong = signal.type === 'LONG'
  const asset  = signal.assetShort || 'BTC'
  const grade  = signal.grade?.grade || '—'
  const conf   = signal.conf ? signal.conf.score : 0
  const vol    = signal.vol

  const rsiExpl = isLong
    ? `Le RSI à ${rsi} indique que ${asset} est en zone de survente — les vendeurs ont poussé le prix trop bas, une correction à la hausse est probable.`
    : `Le RSI à ${rsi} indique que ${asset} est en zone de surachat — les acheteurs ont poussé le prix trop haut, une correction à la baisse est probable.`

  const emaExpl = isLong
    ? `Le prix est au-dessus de l'EMA 200, la moyenne mobile de long terme. Cela confirme que la tendance de fond est haussière.`
    : `Le prix est en-dessous de l'EMA 200. La tendance de fond est baissière, ce qui renforce la probabilité d'une poursuite à la baisse.`

  const volExpl = vol?.strong
    ? `Le volume est ${vol.label.toLowerCase()} (×${vol.ratio} la moyenne). Un volume élevé confirme que les traders institutionnels participent au mouvement — c'est un bon signe.`
    : `Le volume est dans la moyenne. Le signal est valide mais une augmentation du volume renforcerait la conviction.`

  const risk100 = slPct !== '—'
    ? `Si tu investis 100 €, tu peux perdre au maximum ${(100 * parseFloat(slPct) / 100).toFixed(0)} € (si le Stop Loss est touché) ou gagner ${(100 * parseFloat(tpPct) / 100).toFixed(0)} € (si le Take Profit est atteint).`
    : ''

  const gradeExpl = grade === 'A'
    ? `La note A indique que ${conf} indicateurs sur 6 sont alignés — c'est un des meilleurs setups possibles.`
    : grade === 'B'
    ? `La note B indique un bon setup avec ${conf} indicateurs alignés. La plupart des conditions sont réunies.`
    : `La note ${grade} indique un setup acceptable mais avec quelques réserves. La prudence s'impose.`

  return `**Pourquoi ce signal existe**
${isLong ? `Le moteur a détecté une opportunité d'achat sur ${asset}` : `Le moteur a détecté une opportunité de vente sur ${asset}`}. ${gradeExpl}

**Ce que disent les indicateurs**
• ${rsiExpl}
• ${emaExpl}
• ${volExpl}

**Le risque concret**
${risk100}
Le ratio Risque/Récompense est de 1:${signal.rr} — pour 1 € risqué, tu peux en gagner ${signal.rr}.

**Ce qu'il faut surveiller**
• ${isLong ? 'Si le prix casse sous le support, le signal est invalidé — respecte ton stop loss.' : 'Si le prix casse au-dessus de la résistance, le signal est invalidé.'}
• Évite de prendre ce trade juste avant un événement macro important (FOMC, CPI).`
}

// ── Composant principal ──
export default function SignalExplainer({ signal, apiKey }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [quiz, setQuiz]       = useState(null)
  const [quizAnswer, setAnswer] = useState(null)

  async function handleOpen() {
    setOpen(true)
    if (result) return
    setLoading(true)
    const r = await generateExplanation(signal, apiKey)
    setResult(r)
    setLoading(false)
    // Générer un quiz basé sur le signal
    setQuiz(generateQuiz(signal))
  }

  function generateQuiz(s) {
    const isLong = s.type === 'LONG'
    const rsi = s.note?.match(/RSI (\d+)/)?.[1] || '42'
    const quizzes = [
      {
        q: `Dans ce signal ${s.type}, le RSI à ${rsi} signifie que ${s.assetShort || 'BTC'} est en zone de...`,
        options: [
          isLong ? 'Survente — les vendeurs ont trop poussé' : 'Surachat — les acheteurs ont trop poussé',
          isLong ? 'Surachat — les acheteurs dominent' : 'Survente — les vendeurs dominent',
          'Volume anormalement élevé',
          'Tendance haussière confirmée'
        ],
        correct: 0,
        expl: isLong
          ? `Un RSI sous 45 indique que le prix a été vendu excessivement — c'est une zone où un rebond est statistiquement plus probable.`
          : `Un RSI au-dessus de 62 indique que le prix a été acheté excessivement — c'est une zone où une correction est statistiquement plus probable.`
      },
      {
        q: `Ce signal est de type ${s.type}. Cela signifie que tu dois...`,
        options: [
          isLong ? 'Acheter — tu paries sur une hausse du prix' : 'Vendre — tu paries sur une baisse du prix',
          isLong ? 'Vendre — tu paries sur une baisse du prix' : 'Acheter — tu paries sur une hausse du prix',
          'Attendre que le prix atteigne le Take Profit',
          'Annuler tes positions existantes'
        ],
        correct: 0,
        expl: isLong
          ? `Un trade LONG signifie que tu achètes en espérant que le prix monte jusqu'au Take Profit avant de toucher le Stop Loss.`
          : `Un trade SHORT signifie que tu vends en espérant que le prix baisse jusqu'au Take Profit avant de toucher le Stop Loss.`
      },
      {
        q: `Le Stop Loss est à ${s.sl?.toLocaleString('fr-FR')} $. Son rôle est de...`,
        options: [
          'Limiter ta perte maximale si le marché va contre toi',
          'Déclencher automatiquement un profit',
          'Signaler un nouveau signal d\'achat',
          'Protéger ton Take Profit'
        ],
        correct: 0,
        expl: `Le Stop Loss est ton filet de sécurité. Si le prix atteint ce niveau, ta position se ferme automatiquement et tu limites ta perte. Ne jamais trader sans Stop Loss.`
      }
    ]
    return quizzes[Math.floor(Math.random() * quizzes.length)]
  }

  function formatText(text) {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <div key={i} className="text-xs font-bold text-white uppercase tracking-wider mt-4 mb-2 first:mt-0">{line.replace(/\*\*/g, '')}</div>
        }
        if (line.startsWith('• ')) {
          return <div key={i} className="flex gap-2 text-xs text-[#999] leading-relaxed mb-1"><span className="text-[#00C896] flex-shrink-0">•</span><span>{line.slice(2)}</span></div>
        }
        if (line.trim()) {
          return <div key={i} className="text-xs text-[#999] leading-relaxed mb-2">{line}</div>
        }
        return null
      })
  }

  if (!open) {
    return (
      <button onClick={handleOpen}
        className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#4A9EFF]/12 text-[#4A9EFF] border-none cursor-pointer font-sans w-full justify-center mt-2 hover:bg-[#4A9EFF]/20 transition-colors">
        <span>🎓</span>
        Comprendre ce signal
      </button>
    )
  }

  return (
    <div className="mt-3 bg-[#0d1117] border border-[#4A9EFF]/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎓</span>
          <span className="text-xs font-bold text-[#4A9EFF] uppercase tracking-wider">Comprendre ce signal</span>
          {result?.type === 'ai' && <span className="text-[10px] bg-[#4A9EFF]/12 text-[#4A9EFF] px-2 py-0.5 rounded-full font-semibold">Claude IA</span>}
        </div>
        <button onClick={() => setOpen(false)} className="text-[#666] text-lg bg-none border-none cursor-pointer leading-none">×</button>
      </div>

      <div className="px-4 py-4">
        {/* Explication */}
        {loading ? (
          <div className="flex items-center gap-3 py-4">
            <div className="flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#4A9EFF]" style={{animation:`bounce 0.7s ${i*0.15}s infinite`}}/>)}
            </div>
            <span className="text-xs text-[#666]">Analyse du signal en cours...</span>
          </div>
        ) : result ? (
          <div className="mb-4">{formatText(result.text)}</div>
        ) : null}

        {/* Glossaire rapide */}
        {result && (
          <div className="bg-[#111] rounded-xl p-3 mb-4">
            <div className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-3">Glossaire rapide</div>
            <div className="flex flex-col gap-2">
              {[
                { term: 'RSI', def: 'Indicateur de force relative — mesure si un actif est suracheté ou survendu (0-100)' },
                { term: 'EMA 200', def: 'Moyenne mobile sur 200 périodes — indique la tendance de long terme' },
                { term: 'Stop Loss', def: 'Niveau de prix où ta position se ferme automatiquement pour limiter la perte' },
                { term: 'Take Profit', def: 'Niveau de prix où ta position se ferme automatiquement pour encaisser le gain' },
                { term: 'R/R ' + signal.rr, def: `Pour 1€ risqué tu peux en gagner ${signal.rr} — ratio Risque/Récompense` },
              ].map((g, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-[10px] font-bold text-[#4A9EFF] min-w-[60px] flex-shrink-0">{g.term}</span>
                  <span className="text-[10px] text-[#666] leading-relaxed">{g.def}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz */}
        {quiz && result && (
          <div className="bg-[#111] rounded-xl p-3">
            <div className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-3">
              🧠 Quiz — Teste ta compréhension
            </div>
            <div className="text-xs font-semibold text-white mb-3 leading-relaxed">{quiz.q}</div>
            <div className="flex flex-col gap-2">
              {quiz.options.map((opt, i) => (
                <button key={i} onClick={() => setAnswer(i)}
                  className={`text-left text-xs px-3 py-2.5 rounded-xl border cursor-pointer font-sans transition-all ${
                    quizAnswer === null
                      ? 'bg-[#1a1a1a] border-white/[0.07] text-[#999] hover:border-[#4A9EFF]/30'
                      : i === quiz.correct
                      ? 'bg-[#00C896]/12 border-[#00C896] text-[#00C896]'
                      : quizAnswer === i
                      ? 'bg-[#FF4D4D]/12 border-[#FF4D4D] text-[#FF4D4D]'
                      : 'bg-[#1a1a1a] border-white/[0.07] text-[#444]'
                  }`}>
                  <span className="font-bold mr-2" style={{
                    color: quizAnswer !== null ? (i === quiz.correct ? '#00C896' : quizAnswer === i ? '#FF4D4D' : '#333') : '#666'
                  }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                </button>
              ))}
            </div>
            {quizAnswer !== null && (
              <div className={`mt-3 px-3 py-2.5 rounded-xl text-xs leading-relaxed ${
                quizAnswer === quiz.correct
                  ? 'bg-[#00C896]/10 text-[#00C896] border border-[#00C896]/20'
                  : 'bg-[#FF4D4D]/10 text-[#FF4D4D] border border-[#FF4D4D]/20'
              }`}>
                {quizAnswer === quiz.correct ? '✓ Bonne réponse ! ' : '✗ Pas tout à fait. '}
                {quiz.expl}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
