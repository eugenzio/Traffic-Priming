import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'
import { ExperimentProvider } from './context/ExperimentProvider'
import trialTape from './data/trial_tape.sample.json'

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <ExperimentProvider blocks={trialTape.blocks}>
      <App />
    </ExperimentProvider>
  </React.StrictMode>
)
