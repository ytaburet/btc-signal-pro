import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { auth, googleProvider, db, registerFCMToken } from '../firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        await loadUserData(u.uid)
        await registerFCMToken(u.uid)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function loadUserData(uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) setUserData(snap.data())
    } catch(e) {
      console.warn('loadUserData:', e.message)
    }
  }

  async function saveUserData(data) {
    if (!user) return
    try {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true })
      setUserData(prev => ({ ...prev, ...data }))
    } catch(e) {
      console.warn('saveUserData:', e.message)
    }
  }

  async function loginEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function registerEmail(name, email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    return cred
  }

  async function loginGoogle() {
    return signInWithPopup(auth, googleProvider)
  }

  async function logout() {
    await signOut(auth)
    setUserData(null)
  }

  const value = { user, userData, loading, loginEmail, registerEmail, loginGoogle, logout, saveUserData, loadUserData }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
