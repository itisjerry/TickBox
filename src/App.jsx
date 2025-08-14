import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AuthPanel from './AuthPanel.jsx';
import { readEnv } from './envGuard.js';

// ===== Env Guard + Firebase Init =====
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

// ===== Context Setup =====
const AppContext = createContext();
const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsub();
  }, []);

  return (
    <AppContext.Provider value={{ user, isAuthReady }}>
      {children}
    </AppContext.Provider>
  );
};

const useAuth = () => useContext(AppContext);

// ===== Shell UI =====
function Shell() {
  const { user, isAuthReady } = useAuth();

  // Show env error if config missing
  if (envError) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Configuration error</h1>
        <pre style={{ whiteSpace: 'pre-wrap', color: 'crimson' }}>
          {envError.message}
        </pre>
      </div>
    );
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!user) return <AuthPanel />;

  return (
    <div className="min-h-screen p-10">
      Signed in as <code>{user.email || user.uid}</code>. (Your full app UI
      renders here.)
    </div>
  );
}

// ===== Export =====
export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
