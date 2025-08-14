Drop-in auth patch

How to apply:
1) Close your dev server (Ctrl+C).
2) Extract this archive to your project root so the files land at:
   - src/AuthPanel.jsx
   - src/App.jsx  (it will replace your current one)
3) Run:
   npm install
   npm run dev

Make sure you have enabled Email/Password in Firebase Authentication
and that your .env has the VITE_FIREBASE_* values set.
