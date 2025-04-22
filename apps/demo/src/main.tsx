// src/main.tsx
import { createRoot } from 'react-dom/client'
import '@mdeditor/theme/default.css'
import '@mdeditor/react/styles.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(<App />)
