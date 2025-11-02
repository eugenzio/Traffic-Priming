import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './styles/theme.css'
import App from './App'
import { ExperimentProvider } from './context/ExperimentProvider'
import { ThemeProvider } from './context/ThemeProvider'
import trialTape from './data/trial_tape.sample.json'

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ExperimentProvider blocks={trialTape.blocks}>
        <App />
      </ExperimentProvider>
    </ThemeProvider>
  </React.StrictMode>
)
