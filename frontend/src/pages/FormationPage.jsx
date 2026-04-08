import React, { useState, useEffect } from 'react'

// ─── Données des modules ───────────────────────────────────────────────────
const LEVELS = [
  {
    id: 1,
    title: 'Les fondamentaux',
    subtitle: 'Comprendre les bases avant tout',
    icon: '🌱',
    color: '#00C896',
    dim: 'rgba(0,200,150,0.12)',
    border: 'rgba(0,200,150,0.25)',
    modules: [
      {
        id: '1-1',
        title: 'Qu\'est-ce que la crypto ?',
        duration: '3 min',
        icon: '₿',
        content: [
          {
            type: 'text',
            text: 'La crypto-monnaie est une monnaie numérique qui fonctionne sans banque centrale. Elle est décentralisée — personne ne la contrôle — et son prix est déterminé uniquement par l\'offre et la demande.',
          },
          {
            type: 'key-points',
            points: [
              { icon: '📈', title: 'Prix volatile', desc: 'Le prix peut monter ou baisser de 10% en quelques heures. C\'est ce qui crée des opportunités de trading.' },
              { icon: '🌐', title: 'Marché 24h/24', desc: 'Contrairement aux actions, le marché crypto ne ferme jamais. Il tourne 7j/7, 365j/365.' },
              { icon: '⚡', title: 'Haute liquidité', desc: 'BTC et ETH s\'échangent en milliards de dollars chaque jour. Tu peux entrer et sortir rapidement.' },
            ]
          },
          {
            type: 'visual',
            visual: 'price-movement',
            caption: 'Le prix évolue constamment — chaque variation crée une opportunité'
          },
          {
            type: 'warning',
            text: 'La crypto est un actif risqué. Ne jamais investir plus que ce qu\'on est prêt à perdre. Ce que tu apprends ici t\'aide à gérer ce risque, pas à l\'éliminer.'
          }
        ],
        quiz: {
          q: 'Qu\'est-ce qui détermine le prix d\'une crypto-monnaie ?',
          options: ['La banque centrale', 'L\'offre et la demande', 'Le gouvernement', 'Les mineurs uniquement'],
          correct: 1,
          expl: 'Le prix d\'une crypto est uniquement déterminé par l\'offre et la demande sur le marché. Plus de gens veulent acheter → le prix monte. Plus veulent vendre → il baisse.'
        }
      },
      {
        id: '1-2',
        title: 'Lire un graphique en chandeliers',
        duration: '5 min',
        icon: '🕯️',
        content: [
          {
            type: 'text',
            text: 'Les graphiques en chandeliers (ou "bougies") sont l\'outil de base de tout trader. Chaque bougie représente une période de temps et contient 4 informations essentielles.',
          },
          {
            type: 'visual',
            visual: 'candlestick',
            caption: 'Anatomie d\'une bougie'
          },
          {
            type: 'key-points',
            points: [
              { icon: '🟢', title: 'Bougie verte (haussière)', desc: 'Le prix a MONTÉ pendant cette période. Le bas du corps = prix d\'ouverture, le haut = prix de clôture.' },
              { icon: '🔴', title: 'Bougie rouge (baissière)', desc: 'Le prix a BAISSÉ pendant cette période. Le haut du corps = prix d\'ouverture, le bas = prix de clôture.' },
              { icon: '📏', title: 'Les mèches (ombres)', desc: 'Les lignes fines au-dessus et en-dessous montrent les extrêmes atteints pendant la période.' },
            ]
          },
          {
            type: 'callout',
            title: 'Le pattern "Marteau"',
            text: 'Une bougie avec un petit corps en haut et une longue mèche basse signifie que les vendeurs ont poussé le prix très bas, mais les acheteurs ont repris le contrôle. C\'est souvent un signal de retournement haussier.',
            color: '#00C896'
          }
        ],
        quiz: {
          q: 'Une bougie verte avec une longue mèche basse signifie...',
          options: [
            'Le prix a beaucoup baissé',
            'Les vendeurs ont essayé de faire baisser le prix mais les acheteurs ont repris le contrôle',
            'Le volume était très faible',
            'Le marché est en tendance baissière'
          ],
          correct: 1,
          expl: 'La mèche basse montre que les vendeurs ont poussé le prix vers le bas, mais la bougie verte indique que les acheteurs ont finalement gagné la bataille et clôturé au-dessus de l\'ouverture.'
        }
      },
      {
        id: '1-3',
        title: 'Supports et résistances',
        duration: '4 min',
        icon: '📊',
        content: [
          {
            type: 'text',
            text: 'Un support est un niveau de prix où le marché a historiquement rebondi à la hausse. Une résistance est un niveau où le marché a rebondi à la baisse. Ces niveaux sont importants car la mémoire du marché crée des comportements répétitifs.',
          },
          {
            type: 'visual',
            visual: 'support-resistance',
            caption: 'Support = plancher / Résistance = plafond'
          },
          {
            type: 'key-points',
            points: [
              { icon: '🛡️', title: 'Le support', desc: 'Zone où les acheteurs sont nombreux. Le prix a tendance à rebondir quand il l\'atteint.' },
              { icon: '🚧', title: 'La résistance', desc: 'Zone où les vendeurs sont nombreux. Le prix a tendance à être repoussé quand il l\'atteint.' },
              { icon: '🔄', title: 'Inversion des rôles', desc: 'Quand un support est cassé, il devient une résistance. Quand une résistance est cassée, elle devient un support.' },
            ]
          }
        ],
        quiz: {
          q: 'Qu\'arrive-t-il généralement quand le prix atteint un support solide ?',
          options: [
            'Il continue de baisser fortement',
            'Il rebondit à la hausse car les acheteurs entrent en jeu',
            'Il reste bloqué indéfiniment',
            'Il monte immédiatement vers la résistance'
          ],
          correct: 1,
          expl: 'Un support est une zone où historiquement les acheteurs ont été nombreux. Quand le prix y revient, ces mêmes acheteurs ont tendance à acheter à nouveau, ce qui crée un rebond.'
        }
      },
      {
        id: '1-4',
        title: 'Entrée, Stop Loss, Take Profit',
        duration: '4 min',
        icon: '🎯',
        content: [
          {
            type: 'text',
            text: 'Tout trade est défini par 3 niveaux de prix. Avant d\'entrer dans un trade, tu dois connaître ces 3 niveaux. Si tu ne les connais pas, tu ne dois pas trader.',
          },
          {
            type: 'visual',
            visual: 'trade-levels',
            caption: 'Les 3 niveaux d\'un trade LONG'
          },
          {
            type: 'key-points',
            points: [
              { icon: '▶️', title: 'L\'entrée', desc: 'Le prix auquel tu ouvres ta position. BTC Signal Pro te donne ce niveau précisément.' },
              { icon: '🛑', title: 'Le Stop Loss (SL)', desc: 'Le prix auquel ta position se ferme AUTOMATIQUEMENT si le marché va contre toi. C\'est ta protection. Ne jamais trader sans.' },
              { icon: '🎯', title: 'Le Take Profit (TP)', desc: 'Le prix auquel ta position se ferme pour encaisser ton gain. Te permet de ne pas rester collé à l\'écran.' },
            ]
          },
          {
            type: 'callout',
            title: 'Exemple concret',
            text: 'BTC à 83 420 $. Entrée : 83 420 $. Stop Loss : 81 230 $ (perte max : 2.6%). Take Profit : 89 260 $ (gain potentiel : 7%). Si tu investis 100 €, tu risques 2.60 € pour potentiellement gagner 7 €.',
            color: '#4A9EFF'
          }
        ],
        quiz: {
          q: 'Pourquoi est-il indispensable de toujours définir un Stop Loss avant d\'entrer en trade ?',
          options: [
            'Pour être sûr de gagner',
            'Pour limiter automatiquement ta perte maximale si le marché va dans le mauvais sens',
            'Pour que le broker sache où tu es',
            'C\'est obligatoire légalement'
          ],
          correct: 1,
          expl: 'Sans Stop Loss, une position perdante peut continuer à perdre indéfiniment. Le SL te protège automatiquement — même si tu dors, même si tu n\'as pas accès à ton téléphone.'
        }
      }
    ]
  },
  {
    id: 2,
    title: 'Les indicateurs techniques',
    subtitle: 'Comprendre les outils du moteur',
    icon: '📡',
    color: '#4A9EFF',
    dim: 'rgba(74,158,255,0.12)',
    border: 'rgba(74,158,255,0.25)',
    modules: [
      {
        id: '2-1',
        title: 'Le RSI — Relative Strength Index',
        duration: '5 min',
        icon: '📊',
        content: [
          {
            type: 'text',
            text: 'Le RSI est l\'indicateur le plus utilisé au monde. Il mesure la force des mouvements récents pour déterminer si un actif est suracheté ou survendu. Il oscille entre 0 et 100.',
          },
          {
            type: 'visual',
            visual: 'rsi',
            caption: 'Le RSI oscille entre 0 (survente extrême) et 100 (surachat extrême)'
          },
          {
            type: 'key-points',
            points: [
              { icon: '🔴', title: 'RSI > 70 : Surachat', desc: 'L\'actif a trop monté trop vite. Une correction baissière est probable. Signal de vigilance.' },
              { icon: '🟢', title: 'RSI < 30 : Survente', desc: 'L\'actif a trop baissé trop vite. Un rebond haussier est probable. Signal d\'opportunité.' },
              { icon: '⚪', title: 'RSI 40-60 : Zone neutre', desc: 'Pas de signal clair. Le moteur BTC Signal Pro évite cette zone.' },
            ]
          },
          {
            type: 'callout',
            title: 'Comment BTC Signal Pro utilise le RSI',
            text: 'Le moteur génère un signal LONG quand le RSI passe sous 45. Un signal SHORT quand il dépasse 62. Ces seuils sont plus conservateurs que les 30/70 classiques pour filtrer les signaux faibles.',
            color: '#00C896'
          }
        ],
        quiz: {
          q: 'Le RSI de BTC est à 28. Qu\'est-ce que ça signifie ?',
          options: [
            'BTC est en surachat — probable baisse',
            'BTC est en survente — probable rebond haussier',
            'Le volume est faible',
            'La tendance long terme est baissière'
          ],
          correct: 1,
          expl: 'Un RSI sous 30 (et à fortiori sous 28) indique une survente extrême. Les vendeurs ont poussé le prix trop bas trop vite — statistiquement, un rebond est probable.'
        }
      },
      {
        id: '2-2',
        title: 'L\'EMA 200 — La tendance de fond',
        duration: '4 min',
        icon: '📈',
        content: [
          {
            type: 'text',
            text: 'L\'EMA 200 (Exponential Moving Average sur 200 périodes) est la ligne de tendance la plus surveillée par les traders institutionnels. Elle représente la moyenne des 200 dernières bougies.',
          },
          {
            type: 'visual',
            visual: 'ema',
            caption: 'Prix au-dessus de l\'EMA 200 = tendance haussière'
          },
          {
            type: 'key-points',
            points: [
              { icon: '🟢', title: 'Prix au-dessus de l\'EMA 200', desc: 'Tendance haussière de long terme. Favoriser les trades LONG. C\'est la position de BTC depuis 2023.' },
              { icon: '🔴', title: 'Prix en-dessous de l\'EMA 200', desc: 'Tendance baissière de long terme. Prudence sur les LONG. Envisager les SHORT.' },
              { icon: '⚡', title: 'Croisement de l\'EMA 200', desc: 'Quand le prix croise l\'EMA 200, c\'est un événement majeur — souvent le début d\'un nouveau régime de marché.' },
            ]
          }
        ],
        quiz: {
          q: 'BTC est à 85 000 $ et l\'EMA 200 est à 72 000 $. Quelle est la tendance de fond ?',
          options: [
            'Baissière — le prix va sûrement baisser',
            'Haussière — le prix est bien au-dessus de la moyenne long terme',
            'Neutre — impossible à déterminer',
            'En retournement — attention'
          ],
          correct: 1,
          expl: 'Le prix est 18% au-dessus de l\'EMA 200. Cela confirme une tendance haussière forte de long terme. BTC Signal Pro ne génère de signaux LONG que dans cette configuration.'
        }
      },
      {
        id: '2-3',
        title: 'Le Volume — La conviction du marché',
        duration: '3 min',
        icon: '📦',
        content: [
          {
            type: 'text',
            text: 'Le volume représente la quantité d\'actif échangée pendant une période. C\'est l\'indicateur de conviction : un mouvement de prix avec fort volume est bien plus fiable qu\'un mouvement avec faible volume.',
          },
          {
            type: 'key-points',
            points: [
              { icon: '💪', title: 'Fort volume + hausse', desc: 'De nombreux acheteurs participent — la hausse est réelle et peut continuer.' },
              { icon: '⚠️', title: 'Faible volume + hausse', desc: 'Peu de participants — la hausse peut être manipulée ou s\'essouffler rapidement.' },
              { icon: '📊', title: 'Volume moyen', desc: 'BTC Signal Pro compare le volume actuel à la moyenne des 20 dernières bougies. ×1.3 et plus = signal renforcé.' },
            ]
          },
          {
            type: 'warning',
            text: 'Un signal avec volume faible (×0.8 ou moins) est systématiquement marqué par le moteur. Tu peux choisir de l\'ignorer ou de réduire ta taille de position.'
          }
        ],
        quiz: {
          q: 'Un signal LONG apparaît avec un volume ×0.6 (60% de la moyenne). Comment interpréter ça ?',
          options: [
            'Signal très fort — peu de vendeurs',
            'Signal à traiter avec prudence — peu de conviction, risque de faux signal',
            'Aucune importance',
            'Signal à ignorer absolument'
          ],
          correct: 1,
          expl: 'Un volume faible signifie que peu de traders participent au mouvement. Le signal peut être valide mais moins fiable. BTC Signal Pro l\'indique avec "Volume Faible" — prends une position plus petite ou attends une confirmation.'
        }
      }
    ]
  },
  {
    id: 3,
    title: 'Gestion du risque',
    subtitle: 'La compétence la plus importante',
    icon: '🛡️',
    color: '#F5A623',
    dim: 'rgba(245,166,35,0.12)',
    border: 'rgba(245,166,35,0.25)',
    modules: [
      {
        id: '3-1',
        title: 'Le money management',
        duration: '6 min',
        icon: '💰',
        content: [
          {
            type: 'text',
            text: 'Le money management est LA compétence qui sépare les traders qui durent de ceux qui explosent. La règle d\'or : ne jamais risquer plus de 1-2% de ton capital sur un seul trade.',
          },
          {
            type: 'visual',
            visual: 'money-management',
            caption: 'Risque 1% vs 10% par trade — impact sur la survie'
          },
          {
            type: 'key-points',
            points: [
              { icon: '📏', title: 'La règle des 1-2%', desc: 'Si ton capital est de 1 000 €, tu risques 10 à 20 € maximum par trade. Pas 100 €, pas 200 €.' },
              { icon: '🧮', title: 'Calculer sa taille de position', desc: 'Capital × 2% ÷ Distance au Stop Loss en % = Montant à investir.' },
              { icon: '🔄', title: 'Préserver le capital', desc: 'L\'objectif principal n\'est pas de gagner vite — c\'est de ne pas perdre. Les gains viennent avec la durée.' },
            ]
          },
          {
            type: 'callout',
            title: 'Exemple avec BTC Signal Pro',
            text: 'Capital : 500 €. Règle : 2% de risque = 10 €. Signal : SL à 2.5% de distance. Position = 10 ÷ 0.025 = 400 €. Tu investis 400 € pour risquer 10 €.',
            color: '#F5A623'
          }
        ],
        quiz: {
          q: 'Tu as 2 000 € de capital. En suivant la règle des 2%, combien risques-tu maximum par trade ?',
          options: ['200 €', '40 €', '400 €', '1 000 €'],
          correct: 1,
          expl: '2 000 € × 2% = 40 €. C\'est le montant maximum que tu peux PERDRE sur un trade, pas le montant investi. La taille de position dépend ensuite de la distance à ton Stop Loss.'
        }
      },
      {
        id: '3-2',
        title: 'Le ratio Risque/Récompense',
        duration: '4 min',
        icon: '⚖️',
        content: [
          {
            type: 'text',
            text: 'Le ratio R/R est plus important que le win rate. Un trader avec 40% de trades gagnants peut être profitable s\'il a un bon ratio R/R. Un trader avec 70% de trades gagnants peut perdre de l\'argent avec un mauvais ratio.',
          },
          {
            type: 'visual',
            visual: 'rr-ratio',
            caption: 'R/R 1:2 — tu gagnes 2x ce que tu risques'
          },
          {
            type: 'key-points',
            points: [
              { icon: '📐', title: 'R/R minimum : 1:1.5', desc: 'Si tu risques 1€, tu dois viser au moins 1.50 € de gain. En dessous, la stratégie n\'est pas viable long terme.' },
              { icon: '🏆', title: 'R/R idéal : 1:2 ou plus', desc: 'BTC Signal Pro cible un R/R de 1:2.8 en moyenne. Même avec 40% de wins, tu es rentable.' },
              { icon: '🧮', title: 'Le calcul', desc: 'R/R = Distance au TP ÷ Distance au SL. Signal Pro : (89 260 - 83 420) ÷ (83 420 - 81 230) = 2.67.' },
            ]
          }
        ],
        quiz: {
          q: 'Tu as un R/R de 1:2 et un win rate de 40%. Sur 10 trades, tu gagnes combien ?',
          options: [
            'Tu perds de l\'argent',
            'Tu es à l\'équilibre',
            'Tu es rentable — 4 gains × 2 = 8, 6 pertes × 1 = -6, bilan : +2',
            'Impossible à calculer'
          ],
          correct: 2,
          expl: '4 trades gagnants × +2 = +8. 6 trades perdants × -1 = -6. Bilan = +2. Même avec seulement 40% de réussite, un R/R de 1:2 te rend rentable sur le long terme.'
        }
      }
    ]
  },
  {
    id: 4,
    title: 'Lire le marché',
    subtitle: 'Analyse avancée et contexte',
    icon: '🔭',
    color: '#9945FF',
    dim: 'rgba(153,69,255,0.12)',
    border: 'rgba(153,69,255,0.25)',
    modules: [
      {
        id: '4-1',
        title: 'Structure de marché',
        duration: '5 min',
        icon: '🏗️',
        content: [
          {
            type: 'text',
            text: 'La structure de marché est la façon dont le prix évolue — une série de hauts et de bas. Apprendre à la lire te permet de savoir si tu es dans une tendance haussière, baissière ou en consolidation.',
          },
          {
            type: 'key-points',
            points: [
              { icon: '📈', title: 'Tendance haussière (HH/HL)', desc: 'Higher Highs et Higher Lows — chaque sommet et creux est plus haut que le précédent. Favoriser les LONG.' },
              { icon: '📉', title: 'Tendance baissière (LH/LL)', desc: 'Lower Highs et Lower Lows — chaque sommet et creux est plus bas. Favoriser les SHORT.' },
              { icon: '↔️', title: 'Consolidation (range)', desc: 'Le prix oscille entre un support et une résistance. Attendre une cassure avant de trader.' },
            ]
          }
        ],
        quiz: {
          q: 'BTC fait des sommets de plus en plus hauts et des creux de plus en plus hauts. C\'est...',
          options: ['Une tendance baissière', 'Une consolidation', 'Une tendance haussière — Higher Highs / Higher Lows', 'Un retournement'],
          correct: 2,
          expl: 'Des Higher Highs (HH) et Higher Lows (HL) définissent parfaitement une tendance haussière. C\'est le régime de marché idéal pour les signaux LONG de BTC Signal Pro.'
        }
      },
      {
        id: '4-2',
        title: 'Les zones de liquidité',
        duration: '5 min',
        icon: '💧',
        content: [
          {
            type: 'text',
            text: 'Les zones de liquidité sont les endroits où se concentrent les ordres Stop Loss des autres traders. Les acteurs institutionnels (baleines) cherchent souvent à "chasser" ces zones avant un vrai mouvement.',
          },
          {
            type: 'key-points',
            points: [
              { icon: '🔴', title: 'Liquidité haute', desc: 'Les stops des traders SHORT se concentrent au-dessus des résistances. Une montée soudaine peut viser ces stops avant de redescendre.' },
              { icon: '🟢', title: 'Liquidité basse', desc: 'Les stops des traders LONG se concentrent sous les supports. Une baisse soudaine peut "nettoyer" ces stops avant un rebond.' },
              { icon: '💡', title: 'Comment l\'utiliser', desc: 'BTC Signal Pro affiche ces zones. Si une zone basse vient d\'être purgée, c\'est souvent le meilleur moment pour un LONG.' },
            ]
          }
        ],
        quiz: {
          q: 'Le prix de BTC chute brusquement sous un support important puis remonte rapidement. Qu\'est-ce qui vient probablement de se passer ?',
          options: [
            'Un crash — le signal est invalide',
            'Une chasse aux stops — les stops des longs ont été déclenchés avant un rebond',
            'Un problème technique sur l\'exchange',
            'Une manipulation des régulateurs'
          ],
          correct: 1,
          expl: 'Ce mouvement est classique : les gros acteurs font baisser le prix sous le support pour déclencher les stops des traders retail (chasse aux stops), récupèrent leurs positions à bas prix, puis font remonter le marché.'
        }
      }
    ]
  },
  {
    id: 5,
    title: 'Trader avec un système',
    subtitle: 'Du savoir à la pratique',
    icon: '🚀',
    color: '#FF4D4D',
    dim: 'rgba(255,77,77,0.12)',
    border: 'rgba(255,77,77,0.25)',
    modules: [
      {
        id: '5-1',
        title: 'Construire sa stratégie',
        duration: '6 min',
        icon: '🗺️',
        content: [
          {
            type: 'text',
            text: 'Une stratégie de trading est un ensemble de règles strictes qui définissent QUAND entrer, QUAND sortir, et COMBIEN risquer. Sans stratégie documentée, tu prends des décisions émotionnelles — et les décisions émotionnelles perdent de l\'argent.',
          },
          {
            type: 'key-points',
            points: [
              { icon: '📋', title: 'Les règles d\'entrée', desc: 'Quelles conditions doivent être remplies pour entrer ? RSI sous 45 + EMA + volume ×1.3 + signal A ou B.' },
              { icon: '🚪', title: 'Les règles de sortie', desc: 'TP atteint → sortie. SL touché → sortie. Après 60 bougies sans mouvement → sortie.' },
              { icon: '💰', title: 'Le sizing', desc: 'Toujours 2% du capital risqué. Jamais plus. Même si tu es "sûr" du trade.' },
            ]
          },
          {
            type: 'callout',
            title: 'La règle d\'or',
            text: 'Teste ta stratégie sur données historiques (backtesting) AVANT de risquer de l\'argent réel. BTC Signal Pro a un outil de backtesting intégré. Utilise-le.',
            color: '#FF4D4D'
          }
        ],
        quiz: {
          q: 'Pourquoi est-il important de définir ses règles de trading par écrit avant de commencer ?',
          options: [
            'Pour la comptabilité',
            'Pour éviter les décisions émotionnelles — quand le marché bouge vite, on suit les règles, pas les émotions',
            'C\'est une obligation légale',
            'Pour partager avec sa communauté'
          ],
          correct: 1,
          expl: 'Le trading émotionnel est la première cause de pertes. Quand BTC chute de 5% en 10 minutes, la peur pousse à vendre au pire moment. Des règles écrites et respectées t\'immunisent contre ces réactions.'
        }
      }
    ]
  }
]

// ─── Visuels SVG ──────────────────────────────────────────────────────────
function Visual({ type }) {
  if (type === 'candlestick') return (
    <svg viewBox="0 0 320 180" className="w-full max-w-sm mx-auto">
      <rect x="0" y="0" width="320" height="180" fill="#0d1117" rx="12"/>
      {/* Bougie verte */}
      <line x1="80" y1="30" x2="80" y2="60" stroke="#00C896" strokeWidth="2"/>
      <rect x="65" y="60" width="30" height="60" fill="#00C896" rx="2"/>
      <line x1="80" y1="120" x2="80" y2="150" stroke="#00C896" strokeWidth="2"/>
      <text x="80" y="170" textAnchor="middle" fill="#666" fontSize="10">Haussière</text>
      {/* Labels verts */}
      <text x="125" y="45" fill="#00C896" fontSize="9">← Haut (mèche)</text>
      <text x="125" y="68" fill="#00C896" fontSize="9">← Clôture</text>
      <text x="125" y="112" fill="#00C896" fontSize="9">← Ouverture</text>
      <text x="125" y="145" fill="#00C896" fontSize="9">← Bas (mèche)</text>
      {/* Bougie rouge */}
      <line x1="220" y1="30" x2="220" y2="55" stroke="#FF4D4D" strokeWidth="2"/>
      <rect x="205" y="55" width="30" height="60" fill="#FF4D4D" rx="2"/>
      <line x1="220" y1="115" x2="220" y2="150" stroke="#FF4D4D" strokeWidth="2"/>
      <text x="220" y="170" textAnchor="middle" fill="#666" fontSize="10">Baissière</text>
    </svg>
  )

  if (type === 'support-resistance') return (
    <svg viewBox="0 0 320 160" className="w-full max-w-sm mx-auto">
      <rect x="0" y="0" width="320" height="160" fill="#0d1117" rx="12"/>
      {/* Résistance */}
      <line x1="20" y1="40" x2="300" y2="40" stroke="#FF4D4D" strokeWidth="1.5" strokeDasharray="6,3"/>
      <text x="25" y="33" fill="#FF4D4D" fontSize="10" fontWeight="600">RÉSISTANCE</text>
      {/* Support */}
      <line x1="20" y1="120" x2="300" y2="120" stroke="#00C896" strokeWidth="1.5" strokeDasharray="6,3"/>
      <text x="25" y="148" fill="#00C896" fontSize="10" fontWeight="600">SUPPORT</text>
      {/* Prix sinusoïdal */}
      <polyline points="20,80 60,50 90,110 130,55 165,115 200,48 240,112 275,52 300,80"
        fill="none" stroke="#f2f2f2" strokeWidth="2"/>
      {/* Points de rebond */}
      {[[60,50],[130,55],[200,48],[275,52]].map(([x,y],i) =>
        <circle key={i} cx={x} cy={y} r="4" fill="#FF4D4D" opacity="0.8"/>
      )}
      {[[90,110],[165,115],[240,112]].map(([x,y],i) =>
        <circle key={i} cx={x} cy={y} r="4" fill="#00C896" opacity="0.8"/>
      )}
    </svg>
  )

  if (type === 'rsi') return (
    <svg viewBox="0 0 320 140" className="w-full max-w-sm mx-auto">
      <rect x="0" y="0" width="320" height="140" fill="#0d1117" rx="12"/>
      {/* Zones */}
      <rect x="20" y="14" width="280" height="28" fill="rgba(255,77,77,0.08)" rx="4"/>
      <text x="25" y="28" fill="#FF4D4D" fontSize="9" fontWeight="600">SURACHAT &gt; 70</text>
      <rect x="20" y="98" width="280" height="28" fill="rgba(0,200,150,0.08)" rx="4"/>
      <text x="25" y="116" fill="#00C896" fontSize="9" fontWeight="600">SURVENTE &lt; 30</text>
      {/* Ligne RSI */}
      <polyline points="20,80 55,60 90,45 115,25 145,50 175,70 205,90 235,115 265,95 300,60"
        fill="none" stroke="#4A9EFF" strokeWidth="2"/>
      {/* Labels */}
      <text x="295" y="20" fill="#FF4D4D" fontSize="9">70</text>
      <text x="295" y="80" fill="#666" fontSize="9">50</text>
      <text x="295" y="128" fill="#00C896" fontSize="9">30</text>
      {/* Lignes de référence */}
      <line x1="20" y1="42" x2="300" y2="42" stroke="#FF4D4D" strokeWidth="0.5" strokeDasharray="4,3" opacity="0.5"/>
      <line x1="20" y1="98" x2="300" y2="98" stroke="#00C896" strokeWidth="0.5" strokeDasharray="4,3" opacity="0.5"/>
    </svg>
  )

  if (type === 'ema') return (
    <svg viewBox="0 0 320 150" className="w-full max-w-sm mx-auto">
      <rect x="0" y="0" width="320" height="150" fill="#0d1117" rx="12"/>
      {/* EMA 200 */}
      <polyline points="20,110 80,100 140,90 200,80 260,70 300,65"
        fill="none" stroke="#F5A623" strokeWidth="2" strokeDasharray="5,3"/>
      <text x="200" y="58" fill="#F5A623" fontSize="9" fontWeight="600">EMA 200</text>
      {/* Prix au-dessus */}
      <polyline points="20,90 55,70 85,55 115,65 145,50 175,45 205,55 235,40 270,50 300,35"
        fill="none" stroke="#00C896" strokeWidth="2"/>
      <text x="240" y="30" fill="#00C896" fontSize="9" fontWeight="600">PRIX</text>
      {/* Zone verte entre les deux */}
      <polygon points="20,90 55,70 85,55 115,65 145,50 175,45 205,55 235,40 270,50 300,35 300,65 260,70 200,80 140,90 80,100 20,110"
        fill="rgba(0,200,150,0.07)"/>
      <text x="120" y="95" fill="#00C896" fontSize="9" opacity="0.8">Zone haussière ↑</text>
    </svg>
  )

  if (type === 'trade-levels') return (
    <svg viewBox="0 0 320 180" className="w-full max-w-sm mx-auto">
      <rect x="0" y="0" width="320" height="180" fill="#0d1117" rx="12"/>
      {/* TP */}
      <line x1="60" y1="35" x2="260" y2="35" stroke="#00C896" strokeWidth="1.5" strokeDasharray="5,3"/>
      <rect x="60" y="25" width="90" height="18" fill="rgba(0,200,150,0.15)" rx="4"/>
      <text x="68" y="37" fill="#00C896" fontSize="9" fontWeight="600">TAKE PROFIT +7%</text>
      <text x="265" y="39" fill="#00C896" fontSize="9">89 260 $</text>
      {/* Entrée */}
      <line x1="60" y1="95" x2="260" y2="95" stroke="#f2f2f2" strokeWidth="1.5"/>
      <rect x="60" y="85" width="70" height="18" fill="rgba(255,255,255,0.08)" rx="4"/>
      <text x="68" y="97" fill="#f2f2f2" fontSize="9" fontWeight="600">ENTRÉE</text>
      <text x="265" y="99" fill="#f2f2f2" fontSize="9">83 420 $</text>
      {/* SL */}
      <line x1="60" y1="148" x2="260" y2="148" stroke="#FF4D4D" strokeWidth="1.5" strokeDasharray="5,3"/>
      <rect x="60" y="138" width="90" height="18" fill="rgba(255,77,77,0.15)" rx="4"/>
      <text x="68" y="150" fill="#FF4D4D" fontSize="9" fontWeight="600">STOP LOSS -2.6%</text>
      <text x="265" y="152" fill="#FF4D4D" fontSize="9">81 230 $</text>
      {/* Flèches */}
      <line x1="40" y1="95" x2="40" y2="38" stroke="#00C896" strokeWidth="1.5" markerEnd="url(#arrowG)"/>
      <line x1="40" y1="95" x2="40" y2="145" stroke="#FF4D4D" strokeWidth="1.5"/>
      <text x="8" y="70" fill="#00C896" fontSize="8">+7%</text>
      <text x="5" y="122" fill="#FF4D4D" fontSize="8">-2.6%</text>
    </svg>
  )

  if (type === 'rr-ratio') return (
    <svg viewBox="0 0 320 130" className="w-full max-w-sm mx-auto">
      <rect x="0" y="0" width="320" height="130" fill="#0d1117" rx="12"/>
      {/* Barre risque */}
      <text x="20" y="40" fill="#666" fontSize="10">Tu risques</text>
      <rect x="20" y="48" width="60" height="22" fill="#FF4D4D" rx="4" opacity="0.8"/>
      <text x="50" y="64" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">1 €</text>
      {/* Barre gain */}
      <text x="20" y="98" fill="#666" fontSize="10">Tu peux gagner</text>
      <rect x="20" y="105" width="120" height="22" fill="#00C896" rx="4" opacity="0.8"/>
      <text x="80" y="121" textAnchor="middle" fill="#000" fontSize="10" fontWeight="700">2 € (R/R 1:2)</text>
      {/* Label R/R */}
      <text x="200" y="70" fill="#4A9EFF" fontSize="28" fontWeight="900">1:2</text>
      <text x="200" y="88" fill="#666" fontSize="10">Ratio R/R</text>
    </svg>
  )

  if (type === 'money-management') return (
    <svg viewBox="0 0 320 150" className="w-full max-w-sm mx-auto">
      <rect x="0" y="0" width="320" height="150" fill="#0d1117" rx="12"/>
      {/* Capital 1% */}
      <text x="20" y="25" fill="#00C896" fontSize="10" fontWeight="600">Risque 1% par trade</text>
      <rect x="20" y="32" width="260" height="16" fill="#1a1a1a" rx="4"/>
      <rect x="20" y="32" width="260" height="16" fill="#00C896" rx="4" opacity="0.7"/>
      <text x="155" y="44" textAnchor="middle" fill="#000" fontSize="9" fontWeight="600">Capital préservé après 10 pertes : 90%</text>
      {/* Capital 10% */}
      <text x="20" y="75" fill="#FF4D4D" fontSize="10" fontWeight="600">Risque 10% par trade</text>
      <rect x="20" y="82" width="260" height="16" fill="#1a1a1a" rx="4"/>
      <rect x="20" y="82" width="105" height="16" fill="#FF4D4D" rx="4" opacity="0.7"/>
      <text x="70" y="94" textAnchor="middle" fill="white" fontSize="9" fontWeight="600">Capital restant : 35%</text>
      {/* Message */}
      <text x="160" y="128" textAnchor="middle" fill="#666" fontSize="10">10 trades perdants consécutifs</text>
      <text x="160" y="143" textAnchor="middle" fill="#444" fontSize="9">(ça arrive à tout le monde)</text>
    </svg>
  )

  if (type === 'price-movement') return (
    <svg viewBox="0 0 320 120" className="w-full max-w-sm mx-auto">
      <rect x="0" y="0" width="320" height="120" fill="#0d1117" rx="12"/>
      <polyline points="10,90 35,75 55,60 70,80 90,45 110,65 130,35 155,55 175,25 200,45 220,20 245,40 265,15 290,30 310,20"
        fill="none" stroke="url(#priceGrad)" strokeWidth="2"/>
      <defs>
        <linearGradient id="priceGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4A9EFF"/>
          <stop offset="100%" stopColor="#00C896"/>
        </linearGradient>
      </defs>
      <text x="160" y="110" textAnchor="middle" fill="#444" fontSize="9">Chaque variation = opportunité potentielle</text>
    </svg>
  )

  return null
}

// ─── Composant Module ─────────────────────────────────────────────────────
function ModuleView({ module, levelColor, onComplete, completed }) {
  const [quizAnswer, setAnswer] = useState(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [passed, setPassed]     = useState(completed)

  function handleAnswer(i) {
    setAnswer(i)
    if (i === module.quiz.correct) {
      setTimeout(() => {
        setPassed(true)
        onComplete(module.id)
      }, 1200)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{scrollbarWidth:'none'}}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{module.icon}</span>
          <div>
            <h2 className="text-lg font-bold leading-tight">{module.title}</h2>
            <span className="text-xs text-[#666]">{module.duration} de lecture</span>
          </div>
          {passed && <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-[#00C896]/12 text-[#00C896]">✓ Validé</span>}
        </div>
      </div>

      {/* Contenu */}
      <div className="px-4 pb-4 flex flex-col gap-4">
        {module.content.map((block, i) => {
          if (block.type === 'text') return (
            <p key={i} className="text-sm text-[#ccc] leading-relaxed">{block.text}</p>
          )
          if (block.type === 'key-points') return (
            <div key={i} className="flex flex-col gap-3">
              {block.points.map((pt, j) => (
                <div key={j} className="flex gap-3 bg-[#0d1117] rounded-xl p-3 border border-white/[0.05]">
                  <span className="text-lg flex-shrink-0 mt-0.5">{pt.icon}</span>
                  <div>
                    <div className="text-sm font-semibold mb-1" style={{color: levelColor}}>{pt.title}</div>
                    <div className="text-xs text-[#888] leading-relaxed">{pt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )
          if (block.type === 'visual') return (
            <div key={i} className="bg-[#0d1117] rounded-xl p-4 border border-white/[0.05]">
              <Visual type={block.visual} />
              <p className="text-xs text-[#666] text-center mt-3">{block.caption}</p>
            </div>
          )
          if (block.type === 'callout') return (
            <div key={i} className="rounded-xl p-4 border" style={{background:`${block.color}10`, borderColor:`${block.color}30`}}>
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{color: block.color}}>{block.title}</div>
              <div className="text-sm text-[#ccc] leading-relaxed">{block.text}</div>
            </div>
          )
          if (block.type === 'warning') return (
            <div key={i} className="bg-[#F5A623]/08 border border-[#F5A623]/25 rounded-xl p-4 flex gap-3">
              <span className="text-lg flex-shrink-0">⚠️</span>
              <p className="text-sm text-[#F5A623] leading-relaxed">{block.text}</p>
            </div>
          )
          return null
        })}
      </div>

      {/* Quiz */}
      <div className="mx-4 mb-8">
        {!showQuiz ? (
          <button onClick={() => setShowQuiz(true)}
            className="w-full py-3.5 rounded-xl text-sm font-bold border-none cursor-pointer font-sans transition-all"
            style={{background: levelColor, color: '#000'}}>
            🧠 Tester ma compréhension →
          </button>
        ) : (
          <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl p-4">
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{color: levelColor}}>Quiz de validation</div>
            <div className="text-sm font-semibold text-white mb-4 leading-relaxed">{module.quiz.q}</div>
            <div className="flex flex-col gap-2">
              {module.quiz.options.map((opt, i) => (
                <button key={i} onClick={() => !quizAnswer && handleAnswer(i)}
                  className="text-left text-xs px-3.5 py-3 rounded-xl border cursor-pointer font-sans transition-all leading-relaxed"
                  style={{
                    background: quizAnswer === null ? '#111' : i === module.quiz.correct ? 'rgba(0,200,150,0.12)' : quizAnswer === i ? 'rgba(255,77,77,0.12)' : '#0d1117',
                    borderColor: quizAnswer === null ? 'rgba(255,255,255,0.07)' : i === module.quiz.correct ? '#00C896' : quizAnswer === i ? '#FF4D4D' : 'rgba(255,255,255,0.04)',
                    color: quizAnswer === null ? '#ccc' : i === module.quiz.correct ? '#00C896' : quizAnswer === i ? '#FF4D4D' : '#444',
                    cursor: quizAnswer !== null ? 'default' : 'pointer'
                  }}>
                  <span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span>{opt}
                </button>
              ))}
            </div>
            {quizAnswer !== null && (
              <div className="mt-4 rounded-xl p-3 text-xs leading-relaxed"
                style={{
                  background: quizAnswer === module.quiz.correct ? 'rgba(0,200,150,0.08)' : 'rgba(255,77,77,0.08)',
                  color: quizAnswer === module.quiz.correct ? '#00C896' : '#FF4D4D',
                  border: `1px solid ${quizAnswer === module.quiz.correct ? 'rgba(0,200,150,0.2)' : 'rgba(255,77,77,0.2)'}`
                }}>
                {quizAnswer === module.quiz.correct ? '✓ Bonne réponse ! ' : '✗ Pas tout à fait. '}{module.quiz.expl}
                {quizAnswer !== module.quiz.correct && (
                  <button onClick={() => { setAnswer(null) }}
                    className="block mt-2 font-bold underline bg-none border-none cursor-pointer font-sans text-xs"
                    style={{color: '#FF4D4D'}}>
                    Réessayer
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page principale Formation ────────────────────────────────────────────
export default function FormationPage() {
  const [progress, setProgress]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('btc_formation') || '{}') } catch { return {} }
  })
  const [activeLevel, setActiveLevel] = useState(null)
  const [activeModule, setActiveModule] = useState(null)

  function markComplete(moduleId) {
    const next = { ...progress, [moduleId]: true }
    setProgress(next)
    localStorage.setItem('btc_formation', JSON.stringify(next))
  }

  function getLevelProgress(level) {
    const total   = level.modules.length
    const done    = level.modules.filter(m => progress[m.id]).length
    return { total, done, pct: Math.round(done / total * 100) }
  }

  function isLevelUnlocked(level) {
    if (level.id === 1) return true
    const prev = LEVELS.find(l => l.id === level.id - 1)
    if (!prev) return true
    return prev.modules.every(m => progress[m.id])
  }

  // Vue module ouvert
  if (activeModule) {
    const level = LEVELS.find(l => l.modules.some(m => m.id === activeModule.id))
    return (
      <div className="flex flex-col h-full bg-[#080808]">
        <div className="flex items-center gap-3 px-4 pt-14 pb-3 border-b border-white/[0.07] flex-shrink-0"
          style={{background: '#080808'}}>
          <button onClick={() => setActiveModule(null)}
            className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center border-none cursor-pointer text-[#666] text-sm">
            ←
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{color: level?.color}}>{level?.title}</div>
            <div className="text-xs text-[#666] truncate">{activeModule.title}</div>
          </div>
          {progress[activeModule.id] && <span className="text-[#00C896] text-sm">✓</span>}
        </div>
        <ModuleView
          module={activeModule}
          levelColor={level?.color || '#00C896'}
          completed={!!progress[activeModule.id]}
          onComplete={markComplete}
        />
      </div>
    )
  }

  // Vue niveau ouvert
  if (activeLevel) {
    const lp = getLevelProgress(activeLevel)
    const unlocked = isLevelUnlocked(activeLevel)
    return (
      <div className="flex flex-col h-full bg-[#080808]">
        <div className="flex items-center gap-3 px-4 pt-14 pb-4 flex-shrink-0" style={{background:'#080808'}}>
          <button onClick={() => setActiveLevel(null)}
            className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center border-none cursor-pointer text-[#666] text-sm">
            ←
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{activeLevel.title}</h2>
            <div className="text-xs text-[#666]">{lp.done}/{lp.total} modules complétés</div>
          </div>
        </div>

        {/* Barre de progression du niveau */}
        <div className="px-4 mb-4">
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{width: lp.pct + '%', background: activeLevel.color}} />
          </div>
        </div>

        {!unlocked && (
          <div className="mx-4 mb-4 bg-[#111] border border-[#F5A623]/30 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-2">🔒</div>
            <div className="text-sm font-semibold mb-1">Niveau verrouillé</div>
            <div className="text-xs text-[#666]">Complète le niveau précédent pour débloquer.</div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4" style={{scrollbarWidth:'none'}}>
          {activeLevel.modules.map((module, i) => {
            const done = !!progress[module.id]
            const canAccess = unlocked
            return (
              <button key={module.id} onClick={() => canAccess && setActiveModule(module)}
                className="w-full text-left bg-[#111] border border-white/[0.07] rounded-2xl p-4 mb-3 font-sans"
                style={{cursor: canAccess ? 'pointer' : 'not-allowed', opacity: canAccess ? 1 : 0.5}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{background: done ? activeLevel.color + '20' : '#1a1a1a'}}>
                    {done ? '✓' : module.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-0.5">{module.title}</div>
                    <div className="text-xs text-[#666]">{module.duration}</div>
                  </div>
                  {done
                    ? <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background: activeLevel.color + '20', color: activeLevel.color}}>✓ Validé</span>
                    : <span className="text-[#666] text-sm">→</span>
                  }
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Vue principale — liste des niveaux
  const totalModules = LEVELS.reduce((a, l) => a + l.modules.length, 0)
  const doneModules  = LEVELS.reduce((a, l) => a + l.modules.filter(m => progress[m.id]).length, 0)
  const globalPct    = Math.round(doneModules / totalModules * 100)

  return (
    <div className="flex flex-col h-full bg-[#080808]">
      {/* Header */}
      <div className="pt-[52px] px-5 pb-4 flex-shrink-0">
        <h1 className="text-[28px] font-bold tracking-tight mb-1">Formation</h1>
        <p className="text-xs text-[#666]">Apprends à trader la crypto pas à pas</p>
      </div>

      {/* Progression globale */}
      <div className="mx-4 mb-5 bg-[#111] border border-white/[0.07] rounded-2xl p-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-sm font-bold">Ta progression</div>
            <div className="text-xs text-[#666] mt-0.5">{doneModules}/{totalModules} modules complétés</div>
          </div>
          <div className="text-2xl font-black" style={{
            background: 'linear-gradient(135deg, #00C896, #4A9EFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>{globalPct}%</div>
        </div>
        <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{width: globalPct + '%', background: 'linear-gradient(90deg, #00C896, #4A9EFF)'}} />
        </div>
      </div>

      {/* Niveaux */}
      <div className="flex-1 overflow-y-auto px-4 pb-24" style={{scrollbarWidth:'none'}}>
        {LEVELS.map((level, i) => {
          const lp = getLevelProgress(level)
          const unlocked = isLevelUnlocked(level)
          const complete = lp.done === lp.total
          return (
            <button key={level.id} onClick={() => setActiveLevel(level)}
              className="w-full text-left rounded-2xl p-5 mb-4 border font-sans transition-all"
              style={{
                background: unlocked ? level.dim : '#0d1117',
                borderColor: unlocked ? level.border : 'rgba(255,255,255,0.04)',
                opacity: unlocked ? 1 : 0.6
              }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{background: unlocked ? level.color + '20' : '#1a1a1a'}}>
                  {!unlocked ? '🔒' : complete ? '✅' : level.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{color: level.color}}>Niveau {level.id}</span>
                    {complete && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background: level.color + '20', color: level.color}}>✓ Complété</span>}
                    {!unlocked && <span className="text-[10px] text-[#666]">🔒 Verrouillé</span>}
                  </div>
                  <div className="text-base font-bold mb-0.5">{level.title}</div>
                  <div className="text-xs text-[#666] mb-3">{level.subtitle}</div>
                  {/* Barre de progression */}
                  <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden mb-1.5">
                    <div className="h-full rounded-full transition-all"
                      style={{width: lp.pct + '%', background: level.color}} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#666]">
                    <span>{lp.done}/{lp.total} modules</span>
                    <span>{lp.pct}%</span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}

        {/* Message de fin */}
        {globalPct === 100 && (
          <div className="bg-gradient-to-br from-[#00C896]/15 to-[#4A9EFF]/10 border border-[#00C896]/25 rounded-2xl p-6 text-center mb-4">
            <div className="text-4xl mb-3">🏆</div>
            <div className="text-lg font-bold mb-2">Formation complétée !</div>
            <div className="text-sm text-[#888] leading-relaxed">Tu as assimilé les bases du trading crypto. Maintenant, pratique avec les signaux de l'app en mode simulation avant de passer au réel.</div>
          </div>
        )}
      </div>
    </div>
  )
}
