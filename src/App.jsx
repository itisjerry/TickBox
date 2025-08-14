import { readEnv } from './envGuard.js';

let app, auth, db, appId;
let envError = null;

try {
  const { appId: _appId, firebaseConfig } = readEnv();
  appId = _appId;
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  envError = e;
}
import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AuthPanel from './AuthPanel.jsx';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const AppContext = createContext();
const AppProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setIsAuthReady(true); });
    return () => unsub();
  }, []);
  return <AppContext.Provider value={{user,isAuthReady}}>{children}</AppContext.Provider>;
};
const useAuth = () => useContext(AppContext);

function Shell() {
  const {user, isAuthReady} = useAuth();
  if (!isAuthReady) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!user) return <AuthPanel />;
  return <div className="min-h-screen p-10">Signed in as <code>{user.email || user.uid}</code>. (Your full app UI renders here.)</div>;
}

export default function App(){ return <AppProvider><Shell/></AppProvider>; }
