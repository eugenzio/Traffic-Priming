import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/research-theme.css'
import './styles.css'
import './styles/theme.css'
import './styles/tour-theme.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { ExperimentProvider } from './context/ExperimentProvider'
import { ThemeProvider } from './context/ThemeProvider'
import trialTape from './data/trial_tape.sample.json'

// Theme bootstrap: set initial theme before React renders to prevent flash
const stored = localStorage.getItem('theme');
const initial = stored === 'dark' ? 'dark' : 'light';
document.documentElement.setAttribute('data-theme', initial);

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ExperimentProvider blocks={trialTape.blocks}>
          <App />
        </ExperimentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
