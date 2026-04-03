# BTC Signal Pro — Stack complète

## Architecture

```
btc-signal-pro/
├── frontend/     → React + Vite (Vercel)
├── backend/      → Node.js Express (Railway)
└── README.md
```

## Stack technique
- **Frontend** : React 18, Vite, TailwindCSS, Chart.js, Firebase Auth
- **Backend** : Node.js, Express, node-cron, Firebase Admin SDK
- **Base de données** : Firebase Firestore
- **Notifications push** : Firebase Cloud Messaging
- **Prix temps réel** : Binance WebSocket
- **Déploiement** : Vercel (frontend) + Railway (backend)

## Démarrage rapide

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Remplir les variables dans .env
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Remplir les variables dans .env
npm run dev
```

## Variables d'environnement

### Backend (.env)
```
FIREBASE_PROJECT_ID=btc-signal-pro
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHANNEL_ID=...
PORT=3001
```

### Frontend (.env)
```
VITE_FIREBASE_API_KEY=AIzaSyBRv7OlRGIDsFmQPpusSX7k12q9iegu70A
VITE_FIREBASE_AUTH_DOMAIN=btc-signal-pro.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=btc-signal-pro
VITE_FIREBASE_STORAGE_BUCKET=btc-signal-pro.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=744822221505
VITE_FIREBASE_APP_ID=1:744822221505:web:03e9dc6e636a1140b6c240
VITE_BACKEND_URL=http://localhost:3001
```

## Déploiement

### Railway (backend)
1. Crée un projet sur railway.app
2. Connecte ton repo GitHub
3. Ajoute les variables d'environnement
4. Railway déploie automatiquement

### Vercel (frontend)
1. `cd frontend && npm run build`
2. Installe Vercel CLI : `npm i -g vercel`
3. `vercel --prod`
