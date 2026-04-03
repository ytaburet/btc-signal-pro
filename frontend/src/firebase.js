import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app       = initializeApp(firebaseConfig)
const auth      = getAuth(app)
const db        = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

// Messaging (push notifications)
let messaging = null
try {
  messaging = getMessaging(app)
} catch(e) {
  console.warn('FCM non disponible:', e.message)
}

// Obtenir le token FCM et l'enregistrer côté backend
async function registerFCMToken(userId) {
  if (!messaging) return
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    })
    if (token) {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/fcm-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token })
      })
    }
  } catch(e) {
    console.warn('FCM token error:', e.message)
  }
}

export { auth, db, googleProvider, messaging, registerFCMToken }
