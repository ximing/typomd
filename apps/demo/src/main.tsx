// src/main.tsx
import { createRoot } from 'react-dom/client'
import '@typomd/theme/default.css'
import '@typomd/react/styles.css'
import './app.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(<App />)
