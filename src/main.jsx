import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {ThemeProvider}from '@/components/layout/theme-provider'
import { DarkMode } from './components/layout/darkMode'

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="fixed top-0 right-0 p-4"><DarkMode/></div>
        <App />
     </ThemeProvider>
  </StrictMode>,
)
