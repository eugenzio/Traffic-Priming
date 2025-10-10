import mongoose, { Schema, Document } from 'mongoose'

export interface ILog extends Document {
  participant_id: string
  age: number
  gender: string
  drivers_license: boolean
  learners_permit: boolean
  region_ga: string
  county_ga: string
  block_idx: number
  prime_type: string
  trial_idx: number
  scene_id: string
  signal: string
  oncoming_car_ttc: number
  pedestrian: string
  choice: string
  correct: number
  rt_ms: number
  displayed_at_ms: number
  responded_at_ms: number
  focus_lost: number
  seed: number
  created_at: Date
}

const LogSchema = new Schema<ILog>({
  participant_id: { type: String, required: true, index: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  drivers_license: { type: Boolean, required: true },
  learners_permit: { type: Boolean, required: true },
  region_ga: { type: String, required: true },
  county_ga: { type: String, required: true },
  block_idx: { type: Number, required: true },
  prime_type: { type: String, required: true },
  trial_idx: { type: Number, required: true },
  scene_id: { type: String, required: true },
  signal: { type: String, required: true },
  oncoming_car_ttc: { type: Number, required: true },
  pedestrian: { type: String, required: true },
  choice: { type: String, required: true },
  correct: { type: Number, required: true },
  rt_ms: { type: Number, required: true },
  displayed_at_ms: { type: Number, required: true },
  responded_at_ms: { type: Number, required: true },
  focus_lost: { type: Number, required: true },
  seed: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
}, { 
  versionKey: false,
  timestamps: false
})

// Create indexes for better query performance
LogSchema.index({ participant_id: 1, created_at: -1 })
LogSchema.index({ prime_type: 1 })
LogSchema.index({ created_at: -1 })

export const LogModel = mongoose.model<ILog>('logs', LogSchema)
