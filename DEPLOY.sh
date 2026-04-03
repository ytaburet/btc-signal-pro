#!/bin/bash
# ============================================
# BTC Signal Pro — Guide de déploiement complet
# ============================================

echo "
╔══════════════════════════════════════════╗
║     BTC Signal Pro — Stack v2.0          ║
║     Frontend React + Backend Node.js     ║
╚══════════════════════════════════════════╝
"

# ── ÉTAPE 1 : Firebase Admin SDK ──────────────────────────────
echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉTAPE 1 — Clé Firebase Admin SDK (backend)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Va sur console.firebase.google.com
2. Projet btc-signal-pro → Paramètres (engrenage) → Comptes de service
3. Clique 'Générer une nouvelle clé privée'
4. Télécharge le fichier JSON
5. Copie ces valeurs dans backend/.env :
   - project_id       → FIREBASE_PROJECT_ID
   - private_key      → FIREBASE_PRIVATE_KEY (garde les \\n)
   - client_email     → FIREBASE_CLIENT_EMAIL
"

# ── ÉTAPE 2 : Bot Telegram ────────────────────────────────────
echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉTAPE 2 — Créer le Bot Telegram
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Ouvre Telegram → cherche @BotFather
2. Tape /newbot → suis les instructions
3. Copie le token → TELEGRAM_BOT_TOKEN dans .env

4. Crée un channel Telegram privé (ou groupe)
5. Ajoute ton bot comme administrateur
6. Envoie un message dans le channel
7. Va sur : https://api.telegram.org/bot<TON_TOKEN>/getUpdates
8. Trouve l'id du chat (commence par -100) → TELEGRAM_CHANNEL_ID
"

# ── ÉTAPE 3 : Test local ─────────────────────────────────────
echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉTAPE 3 — Test en local
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Terminal 1 — Backend
cd backend
cp .env.example .env
# Remplis les valeurs dans .env
npm install
npm run dev
# → http://localhost:3001/health

# Terminal 2 — Frontend
cd frontend
cp .env.example .env
npm install
npm run dev
# → http://localhost:5173
"

# ── ÉTAPE 4 : Déploiement Railway (backend) ───────────────────
echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉTAPE 4 — Déployer le backend sur Railway
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Va sur railway.app → New Project
2. Deploy from GitHub repo (connecte ton repo)
   OU : Railway CLI
   
   npm install -g @railway/cli
   cd backend
   railway login
   railway init
   railway up

3. Dans Railway Dashboard → Variables :
   Ajoute toutes les variables de .env

4. Récupère l'URL publique Railway (ex: https://xxx.railway.app)
5. Mets à jour VITE_BACKEND_URL dans frontend/.env avec cette URL
"

# ── ÉTAPE 5 : Déploiement Vercel (frontend) ───────────────────
echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉTAPE 5 — Déployer le frontend sur Vercel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

npm install -g vercel

cd frontend
npm run build  # vérifier qu'il n'y a pas d'erreurs

vercel         # première fois : suit les instructions
# OU pour déployer en production :
vercel --prod

# Récupère ton URL Vercel (ex: https://btc-signal-pro.vercel.app)
"

# ── ÉTAPE 6 : Firebase — ajouter le domaine Vercel ───────────
echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉTAPE 6 — Autoriser le domaine dans Firebase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Firebase Console → Authentication → Settings → Domaines autorisés
→ Ajoute : ton-app.vercel.app

Règles Firestore (Firebase Console → Firestore → Règles) :
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /signals/{signalId} {
      allow read: if request.auth != null;
      allow write: if false; // Écriture uniquement depuis le backend
    }
  }
}
"

echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Architecture complète déployée !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend  : https://btc-signal-pro.vercel.app
Backend   : https://xxx.railway.app
Firebase  : btc-signal-pro (existant)
Telegram  : @ton_channel

Le moteur tourne désormais 24h/24 sur Railway.
Les signaux sont envoyés sur Telegram et en push Firebase.
"
