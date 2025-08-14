import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default function AuthPanel() {
  const auth = getAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setErr(e.message || 'Auth error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {mode === 'signup' ? 'Create account' : 'Sign in'}
        </h1>
        <form onSubmit={handle} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:text-white"
          />
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:text-white"
          />
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button type="submit" className="w-full p-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
            {mode === 'signup' ? 'Sign up' : 'Sign in'}
          </button>
        </form>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          {mode === 'signup' ? (
            <>Already have an account? <button className="text-indigo-600" onClick={() => setMode('signin')}>Sign in</button></>
          ) : (
            <>New here? <button className="text-indigo-600" onClick={() => setMode('signup')}>Create an account</button></>
          )}
        </div>

        <button
          onClick={() => signOut(getAuth())}
          className="mt-6 w-full p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
