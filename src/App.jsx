import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { readEnv } from './envGuard.js';
import AuthPanel from './AuthPanel.jsx';

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

// ===== Context =====
const AppContext = createContext();
const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setIsAuthReady(true); });
    return () => unsub();
  }, []);

  return <AppContext.Provider value={{ user, isAuthReady }}>{children}</AppContext.Provider>;
};
const useAuth = () => useContext(AppContext);

// ===== UI Pieces =====
function Sidebar({ active, setActive, user }) {
  const Item = ({ id, label }) => (
    <button
      onClick={() => setActive(id)}
      style={{
        width: '100%', textAlign: 'left', padding: '10px 12px',
        borderRadius: 8, marginBottom: 6,
        background: active === id ? '#6366f1' : '#f3f4f6',
        color: active === id ? 'white' : '#111827', border: 'none', cursor: 'pointer'
      }}
    >{label}</button>
  );
  return (
    <div style={{width:260, padding:16, borderRight:'1px solid #e5e7eb'}}>
      <h2 style={{margin:'0 0 16px', fontWeight:800}}>TickBox</h2>
      <Item id="home" label="Home" />
      <Item id="tasks" label="Tasks" />
      <Item id="categories" label="Categories" />
      <Item id="settings" label="Settings" />
      <div style={{marginTop:24, fontSize:12, color:'#6b7280'}}>
        <div>User:</div>
        <div style={{wordBreak:'break-all'}}>{user?.email || user?.uid || 'Not signed in'}</div>
      </div>
    </div>
  );
}

function TasksView({ user, categories }) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!user) return;
    const col = collection(db, `artifacts/${appId}/users/${user.uid}/tasks`);
    return onSnapshot(col, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const colRef = collection(db, `artifacts/${appId}/users/${user.uid}/tasks`);
    await addDoc(colRef, { title, completed:false, categoryId: categoryId || '' , createdAt: new Date().toISOString() });
    setTitle(''); setCategoryId('');
  };

  const toggle = async (t) => {
    const ref = doc(db, `artifacts/${appId}/users/${user.uid}/tasks`, t.id);
    await updateDoc(ref, { completed: !t.completed });
  };

  const remove = async (id) => {
    const ref = doc(db, `artifacts/${appId}/users/${user.uid}/tasks`, id);
    await deleteDoc(ref);
  };

  return (
    <div style={{padding:24}}>
      <h1>Tasks</h1>
      <form onSubmit={addTask} style={{display:'flex', gap:8, margin:'12px 0'}}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="New task" style={{flex:1, padding:10, border:'1px solid #e5e7eb', borderRadius:8}} />
        <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} style={{padding:10, border:'1px solid #e5e7eb', borderRadius:8}}>
          <option value="">No category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" style={{padding:'10px 14px', borderRadius:8, background:'#6366f1', color:'#fff', border:'none'}}>Add</button>
      </form>

      <div style={{display:'grid', gap:8}}>
        {tasks.map(t => (
          <div key={t.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, border:'1px solid #e5e7eb', borderRadius:8}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <input type="checkbox" checked={t.completed} onChange={()=>toggle(t)} />
              <span style={{textDecoration: t.completed ? 'line-through' : 'none'}}>{t.title}</span>
              {t.categoryId && <span style={{fontSize:12, color:'#6b7280'}}>• {(categories.find(c=>c.id===t.categoryId)?.name) || 'Unknown'}</span>}
            </div>
            <button onClick={()=>remove(t.id)} style={{border:'none', background:'transparent', color:'#ef4444', cursor:'pointer'}}>Delete</button>
          </div>
        ))}
        {tasks.length === 0 && <div style={{color:'#6b7280'}}>No tasks yet.</div>}
      </div>
    </div>
  );
}

function CategoriesView({ user }) {
  const [name, setName] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user) return;
    const col = collection(db, `artifacts/${appId}/users/${user.uid}/categories`);
    return onSnapshot(col, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const addCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const colRef = collection(db, `artifacts/${appId}/users/${user.uid}/categories`);
    await addDoc(colRef, { name });
    setName('');
  };

  const remove = async (id) => {
    const ref = doc(db, `artifacts/${appId}/users/${user.uid}/categories`, id);
    await deleteDoc(ref);
  };

  return (
    <div style={{padding:24}}>
      <h1>Categories</h1>
      <form onSubmit={addCategory} style={{display:'flex', gap:8, margin:'12px 0'}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="New category" style={{flex:1, padding:10, border:'1px solid #e5e7eb', borderRadius:8}} />
        <button type="submit" style={{padding:'10px 14px', borderRadius:8, background:'#6366f1', color:'#fff', border:'none'}}>Add</button>
      </form>

      <div style={{display:'grid', gap:8}}>
        {categories.map(c => (
          <div key={c.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, border:'1px solid #e5e7eb', borderRadius:8}}>
            <span>{c.name}</span>
            <button onClick={()=>remove(c.id)} style={{border:'none', background:'transparent', color:'#ef4444', cursor:'pointer'}}>Delete</button>
          </div>
        ))}
        {categories.length === 0 && <div style={{color:'#6b7280'}}>No categories yet.</div>}
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div style={{padding:24}}>
      <h1>Settings</h1>
      <button onClick={()=>signOut(auth)} style={{marginTop:12, padding:'10px 14px', borderRadius:8, background:'#ef4444', color:'#fff', border:'none'}}>Sign out</button>
    </div>
  );
}

// ===== App Shell =====
function Shell() {
  const { user, isAuthReady } = useAuth();
  const [active, setActive] = useState('tasks');
  const [categories, setCategories] = useState([]);
  const unsubRef = useRef(null);

  if (envError) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Configuration error</h1>
        <pre style={{ whiteSpace: 'pre-wrap', color: 'crimson' }}>{envError.message}</pre>
      </div>
    );
  }
  if (!isAuthReady) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!user) return <AuthPanel />;

  // keep categories in shell so TasksView can show names
  useEffect(() => {
    const col = collection(db, `artifacts/${appId}/users/${user.uid}/categories`);
    unsubRef.current = onSnapshot(col, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubRef.current && unsubRef.current();
  }, [user]);

  return (
    <div style={{display:'flex', minHeight:'100vh'}}>
      <Sidebar active={active} setActive={setActive} user={user} />
      <div style={{flex:1}}>
        {active === 'home' && <div style={{padding:24}}><h1>Home</h1><p>Welcome! Use the sidebar to manage tasks and categories.</p></div>}
        {active === 'tasks' && <TasksView user={user} categories={categories} />}
        {active === 'categories' && <CategoriesView user={user} />}
        {active === 'settings' && <SettingsView />}
      </div>
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
