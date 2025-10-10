import { Router, Request, Response } from 'express'
import { LogModel } from './models'

const router = Router()

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Save participant data (optional - mainly for logging)
router.post('/participants', async (req: Request, res: Response) => {
  try {
    const participantData = req.body
    console.log('Participant data received:', participantData)
    
    // For now, we just log the participant data
    // In a full implementation, you might want to save this to a separate collection
    res.json({ ok: true, message: 'Participant data received' })
  } catch (error) {
    console.error('Error saving participant:', error)
    res.status(500).json({ error: 'Failed to save participant data' })
  }
})

// Save trial log
router.post('/logs', async (req: Request, res: Response) => {
  try {
    const logData = req.body
    
    // Validate required fields
    const requiredFields = [
      'participant_id', 'block_idx', 'prime_type', 'trial_idx', 
      'scene_id', 'signal', 'oncoming_car_ttc', 'pedestrian', 
      'choice', 'correct', 'rt_ms', 'displayed_at_ms', 
      'responded_at_ms', 'focus_lost', 'seed'
    ]
    
    for (const field of requiredFields) {
      if (logData[field] === undefined || logData[field] === null) {
        return res.status(400).json({ 
          error: `Missing required field: ${field}` 
        })
      }
    }

    const log = new LogModel(logData)
    await log.save()
    
    console.log(`Log saved for participant ${logData.participant_id}, trial ${logData.trial_idx}`)
    res.json({ ok: true, id: log._id })
  } catch (error) {
    console.error('Error saving log:', error)
    res.status(500).json({ error: 'Failed to save log data' })
  }
})

// Get logs for a specific participant
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { participant_id, from, to } = req.query
    
    let query: any = {}
    
    if (participant_id) {
      query.participant_id = participant_id
    }
    
    if (from || to) {
      query.created_at = {}
      if (from) query.created_at.$gte = new Date(from as string)
      if (to) query.created_at.$lte = new Date(to as string)
    }
    
    const logs = await LogModel.find(query).sort({ created_at: -1 })
    res.json({ logs, count: logs.length })
  } catch (error) {
    console.error('Error fetching logs:', error)
    res.status(500).json({ error: 'Failed to fetch logs' })
  }
})

// Export logs as CSV
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { participant_id, from, to } = req.query
    
    let query: any = {}
    
    if (participant_id) {
      query.participant_id = participant_id
    }
    
    if (from || to) {
      query.created_at = {}
      if (from) query.created_at.$gte = new Date(from as string)
      if (to) query.created_at.$lte = new Date(to as string)
    }
    
    const logs = await LogModel.find(query).sort({ created_at: 1 })
    
    // CSV headers
    const headers = [
      'participant_id', 'age', 'gender', 'drivers_license', 'learners_permit', 'region_ga', 'county_ga',
      'block_idx', 'prime_type', 'trial_idx', 'scene_id', 'signal', 
      'oncoming_car_ttc', 'pedestrian', 'choice', 'correct', 'rt_ms',
      'displayed_at_ms', 'responded_at_ms', 'focus_lost', 'seed', 'created_at'
    ]
    
    // Convert to CSV
    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.participant_id,
        log.age,
        log.gender,
        log.drivers_license ? 1 : 0,
        log.learners_permit ? 1 : 0,
        log.region_ga,
        log.county_ga,
        log.block_idx,
        log.prime_type,
        log.trial_idx,
        log.scene_id,
        log.signal,
        log.oncoming_car_ttc,
        log.pedestrian,
        log.choice,
        log.correct,
        log.rt_ms,
        log.displayed_at_ms,
        log.responded_at_ms,
        log.focus_lost,
        log.seed,
        log.created_at.toISOString()
      ].join(','))
    ]
    
    const csvContent = csvRows.join('\n')
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="priming-experiment-${new Date().toISOString().split('T')[0]}.csv"`)
    res.send(csvContent)
  } catch (error) {
    console.error('Error exporting CSV:', error)
    res.status(500).json({ error: 'Failed to export CSV' })
  }
})

// Admin endpoint to get experiment statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalLogs = await LogModel.countDocuments()
    const uniqueParticipants = await LogModel.distinct('participant_id')
    
    const primeTypeStats = await LogModel.aggregate([
      {
        $group: {
          _id: '$prime_type',
          count: { $sum: 1 },
          avgAccuracy: { $avg: '$correct' },
          avgRT: { $avg: '$rt_ms' }
        }
      }
    ])
    
    res.json({
      totalLogs,
      uniqueParticipants: uniqueParticipants.length,
      primeTypeStats
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

export default router
