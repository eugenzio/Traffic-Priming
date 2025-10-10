import { CONFIG } from '../config'
import type { Participant, LogRow } from '../types'

const API_BASE = CONFIG.API_BASE

export const api = {
  async postParticipant(p: Participant) {
    const response = await fetch(`${API_BASE}/api/participants`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(p)
    })
    if (!response.ok) {
      throw new Error(`Failed to save participant: ${response.statusText}`)
    }
    return response.json()
  },
  
  async postLog(row: Omit<LogRow, 'created_at'>) {
    const response = await fetch(`${API_BASE}/api/logs`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(row)
    })
    if (!response.ok) {
      throw new Error(`Failed to save log: ${response.statusText}`)
    }
    return response.json()
  },

  async getLogs(participantId?: string) {
    const url = participantId 
      ? `${API_BASE}/api/logs?participant_id=${participantId}`
      : `${API_BASE}/api/logs`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`)
    }
    return response.json()
  },

  async exportCSV(participantId?: string) {
    const url = participantId 
      ? `${API_BASE}/api/export?participant_id=${participantId}`
      : `${API_BASE}/api/export`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to export CSV: ${response.statusText}`)
    }
    return response.blob()
  }
}
