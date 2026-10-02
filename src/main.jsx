import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Register PWA Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('PWA: Versi baru aplikasi telah tersedia.')
  },
  onOfflineReady() {
    console.log('PWA: Aplikasi siap dijalankan secara offline.')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
