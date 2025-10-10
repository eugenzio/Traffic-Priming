import React from 'react'
import { useExperiment } from '../context/ExperimentProvider'

export default function ResultScreen() {
  const { participant, logs, exportData } = useExperiment()

  const totalTrials = logs.length
  const correctTrials = logs.filter(log => log.correct === 1).length
  const accuracy = totalTrials > 0 ? (correctTrials / totalTrials * 100).toFixed(1) : '0'
  const avgRT = totalTrials > 0 
    ? (logs.reduce((sum, log) => sum + log.rt_ms, 0) / totalTrials).toFixed(0)
    : '0'

  const handleExport = async () => {
    try {
      await exportData()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  return (
    <div className="card">
      <h1>Experiment Complete!</h1>
      
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <h2>Thank you for participating!</h2>
        <p>
          Your responses have been recorded and will be used for research purposes.
        </p>
      </div>

      {participant && (
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>Participant Summary</h3>
          <p><strong>ID:</strong> {participant.participant_id}</p>
          <p><strong>Age:</strong> {participant.age}</p>
          <p><strong>Gender:</strong> {participant.gender}</p>
          <p><strong>Region:</strong> {participant.region_ga}</p>
          <p><strong>County:</strong> {participant.county_ga}</p>
          <p><strong>Driver's License:</strong> {participant.drivers_license ? 'Yes' : 'No'}</p>
          <p><strong>Learner's Permit:</strong> {participant.learners_permit ? 'Yes' : 'No'}</p>
        </div>
      )}

      <div style={{ 
        backgroundColor: '#f0f9ff', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>Performance Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <p><strong>Total Trials:</strong> {totalTrials}</p>
            <p><strong>Correct Responses:</strong> {correctTrials}</p>
            <p><strong>Accuracy:</strong> {accuracy}%</p>
          </div>
          <div>
            <p><strong>Average Reaction Time:</strong> {avgRT}ms</p>
            <p><strong>Experiment Duration:</strong> ~3-5 minutes</p>
          </div>
        </div>
      </div>

      <div className="export-section">
        <h3>Data Export</h3>
        <p>
          You can download your data as a CSV file for your records.
        </p>
        <button className="btn export-btn" onClick={handleExport}>
          Download CSV Data
        </button>
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        border: '1px solid #f59e0b'
      }}>
        <h4>Research Information</h4>
        <p style={{ fontSize: '14px', margin: 0 }}>
          This study investigates how different types of priming (visual, auditory, social) 
          influence driving decisions. Your responses help researchers understand cognitive 
          processes in traffic situations. All data is anonymized and used for scientific 
          purposes only.
        </p>
      </div>
    </div>
  )
}
