import React from 'react'

const NAV_ITEMS = [
  { id: 'market',   label: 'Marché',    icon: MarketIcon    },
  { id: 'signals',  label: 'Signaux',   icon: SignalsIcon   },
  { id: 'history',  label: 'Historique',icon: HistoryIcon   },
  { id: 'alerts',   label: 'Alertes',   icon: AlertsIcon    },
]

export default function BottomNav({ active, onNavigate, sigCount = 0 }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[rgba(8,8,8,0.97)] border-t border-white/[0.07] backdrop-blur-xl pt-2 pb-[22px] flex z-[200]">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onNavigate(id)}
          className={`flex-1 flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer py-1 relative font-sans ${active === id ? 'text-[#00C896]' : 'text-[#666]'}`}>
          <div className="w-6 h-6 flex items-center justify-center relative">
            <Icon />
            {id === 'signals' && sigCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF4D4D] text-white text-[9px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-1 border-2 border-[#080808]">
                {sigCount > 9 ? '9+' : sigCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">{label}</span>
        </button>
      ))}
    </nav>
  )
}

function MarketIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5"/></svg>
}
function SignalsIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
}
function HistoryIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4"/><polyline points="3 21 3 15 9 15"/></svg>
}
function AlertsIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
}
