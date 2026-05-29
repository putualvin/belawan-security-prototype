import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { useStore } from './store/useStore'

// Dev-only: expose the store for prototype verification in the browser console.
if (import.meta.env.DEV) {
  ;(window as unknown as { __store: typeof useStore }).__store = useStore
}

// Honour Vite's base path (e.g. "/repo/" on GitHub Pages) for client routing.
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
