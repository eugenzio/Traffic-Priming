# Priming Experiment (MVP)

A web-based behavioral experiment that tests how different priming effects influence drivers' left-turn decisions. The experiment measures accuracy and reaction time under seven priming conditions and records all participant data for analysis.

## 🎯 Objective

Test how different types of priming (visual, auditory, social) influence left-turn driving decisions by measuring:
- Response accuracy
- Reaction time
- Decision patterns under different priming conditions

## ⚙️ Features

### Core Functionality
- **Participant Input**: ID, demographics, driving experience
- **7 Priming Conditions**: Visual Safety, Visual Risk, Auditory Safety, Auditory Risk, Social Norm, Positive Frame, Neutral
- **Traffic Scenarios**: 21 trials (7 blocks × 3 trials each) with varying conditions
- **Real-time Logging**: Millisecond-precision reaction time measurement
- **Data Export**: CSV download with complete experiment data

### Technical Features
- HTML5 Canvas rendering for traffic scenes
- Web Audio API for auditory primes
- MongoDB data storage
- Real-time feedback and progress tracking
- Responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (for trial logging)
- npm or yarn

### Installation

1. **Clone and install dependencies**
```bash
git clone <your-repo-url>
cd "Traffic Experiment"
npm install                    # Root workspace
npm --prefix frontend install  # Frontend deps (includes @supabase/supabase-js)
npm --prefix backend install   # Backend deps (optional - legacy)
```

2. **Configure environment variables**

**Frontend (required):**
```bash
cd frontend
cp .env.example .env
# Edit frontend/.env with your Supabase credentials:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Backend (optional - legacy MongoDB):**
```bash
cd backend
cp .env.example .env
# Edit backend/.env if using legacy backend
```

3. **Run development servers**
```bash
# From root directory:
npm run dev
```

This starts:
- **Frontend:** http://localhost:5173 (Vite dev server)
- **Backend:** http://localhost:5174 (optional - ts-node-dev)

### Environment Variables

**Frontend (`frontend/.env`):**
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGci...` |
| `VITE_USE_DB` | Enable database logging | `true` |

**Backend (`backend/.env`):** (Legacy - optional)
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/priming` |
| `PORT` | Backend server port | `5174` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |

### Production Build
```bash
# Frontend only (SPA)
cd frontend
npm run build  # → dist/

# Backend (if needed)
cd backend
npm run build  # → dist/
```

## 📊 Experiment Structure

### Priming Conditions
1. **Visual Safety**: "Check traffic and signals"
2. **Visual Risk**: "Accidents happen when you rush"  
3. **Auditory Safety**: Voice + tone: "Wait until it's safe to turn"
4. **Auditory Risk**: Beep + voice: "Turning now can cause an accident"
5. **Social Norm**: "Most drivers wait for pedestrians"
6. **Positive Frame**: "Waiting helps everyone arrive safely"
7. **Neutral**: Fixation cross (baseline)

### Trial Logic
Each trial presents a traffic scenario with:
- **Traffic Signal**: Green Arrow, Red, No Left Turn, Yellow Flashing
- **Oncoming Car**: Time-to-Collision (TTC) ranging 0.6-4.0 seconds
- **Pedestrian**: Present or absent

**Decision Rules:**
- ❌ **Not Allowed**: Red/No Left Turn signal, TTC < 1.5s, or pedestrian crossing
- ✅ **Allowed**: Green arrow with TTC ≥ 1.5s and no pedestrian

### Controls
- `←` Arrow Key: Turn Left
- `Space` Bar: Do Not Turn

## 📁 Repository Structure

```
Traffic Experiment/
├── README.md
├── package.json           # Root workspace scripts
├── .gitignore            # Monorepo-wide ignores
│
├── frontend/             # React + Vite SPA
│   ├── .env.example      # Template for VITE_* variables
│   ├── .env              # Local dev (gitignored)
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── components/   # React components
│       │   ├── StartScreen.tsx
│       │   ├── PrimeScreen.tsx
│       │   ├── TrialScreen.tsx
│       │   ├── CanvasRenderer.tsx
│       │   └── ResultScreen.tsx
│       ├── context/      # State management
│       │   └── ExperimentProvider.tsx
│       ├── lib/          # Supabase client & telemetry
│       │   ├── supabase.ts
│       │   └── telemetry.ts
│       ├── utils/        # Audio, judgment, timing
│       ├── data/         # Trial tape configuration
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API client
│   │   ├── types.ts       # TypeScript definitions
│   │   ├── utils/         # Helper functions
│   │   └── styles.css     # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── backend/
    ├── src/
    │   ├── models.ts      # MongoDB schemas
    │   ├── routes.ts      # API endpoints
    │   ├── server.ts      # Express server
    │   └── db.ts          # Database connection
    ├── package.json
    └── tsconfig.json
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
MONGODB_URI=mongodb://localhost:27017/priming
PORT=5174
CORS_ORIGIN=http://localhost:5173
```

### Experiment Parameters (frontend/src/config.ts)
```typescript
export const CONFIG = {
  PRIME_DURATION_SEC: 12,    // Prime display duration
  TTC_THRESHOLD_SEC: 1.5,    // Time-to-collision threshold
  CANVAS_WIDTH: 800,         // Scene canvas width
  CANVAS_HEIGHT: 450,        // Scene canvas height
  TOTAL_TRIALS: 21,          // 7 blocks × 3 trials
  EXPERIMENT_DURATION_MIN: 3.5
}
```

## 📈 Data Schema

Each trial logs:
```typescript
{
  participant_id: string
  age?: number
  gender?: string
  drivers_license: boolean
  learners_permit: boolean
  block_idx: number
  prime_type: string
  trial_idx: number
  scene_id: string
  signal: string
  oncoming_car_ttc: number
  pedestrian: string
  choice: 'turn_left' | 'wait'
  correct: 0 | 1
  rt_ms: number
  displayed_at_ms: number
  responded_at_ms: number
  focus_lost: 0 | 1
  seed: number
  created_at: string
}
```

## 🚀 Deployment

### Frontend (Vercel - Recommended)

**Quick Deploy:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from root
cd "Traffic Experiment"
vercel --prod
```

**Configuration:**
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

**Environment Variables (Vercel Dashboard):**
```
VITE_SUPABASE_URL=https://deqpvcawzlytufumwkhf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... (your real key)
VITE_USE_DB=true
```

**Alternative Platforms:**
- **Netlify:** Same settings, use Netlify CLI or drag-and-drop `frontend/dist/`
- **Cloudflare Pages:** Connect repo, set root to `frontend`

### Backend (Optional - Legacy)

**Render / Railway:**
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `node dist/server.js`

**Environment Variables:**
```
MONGODB_URI=mongodb+srv://...
PORT=5174
CORS_ORIGIN=https://your-frontend.vercel.app
```

**Note:** Backend is optional - trial logging now goes directly to Supabase from the frontend with offline queue support.

### Supabase Setup

1. **Create project** at https://supabase.com
2. **Run SQL migrations** (see Database Optimization section below)
3. **Copy credentials** to frontend/.env
4. **Enable RLS** (Row Level Security):
   ```sql
   -- Allow anonymous inserts only
   CREATE POLICY "Allow anonymous inserts" ON public.trial_logs
   FOR INSERT TO anon WITH CHECK (true);
   ```

### Database Optimization (Run in Supabase SQL Editor)

```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trial_logs_created_at 
ON public.trial_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trial_logs_participant_id 
ON public.trial_logs (participant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_logs_unique_trial 
ON public.trial_logs (participant_id, block_idx, trial_idx);

CREATE INDEX IF NOT EXISTS idx_trial_logs_prime_type 
ON public.trial_logs (prime_type);

-- Add CHECK constraints for data integrity
ALTER TABLE public.trial_logs 
ADD CONSTRAINT IF NOT EXISTS trial_logs_choice_check 
CHECK (choice IN ('turn_left', 'wait'));

ALTER TABLE public.trial_logs 
ADD CONSTRAINT IF NOT EXISTS trial_logs_correct_check 
CHECK (correct IN (0, 1));

ALTER TABLE public.trial_logs 
ADD CONSTRAINT IF NOT EXISTS trial_logs_focus_lost_check 
CHECK (focus_lost IN (0, 1));
```

## 🔌 API Endpoints (Legacy Backend - Optional)

- `GET /api/health` - Server health check
- `POST /api/participants` - Save participant data
- `POST /api/logs` - Save trial response
- `GET /api/logs` - Retrieve logs (with optional filters)
- `GET /api/export` - Download CSV export
- `GET /api/stats` - Experiment statistics

## 🧪 Customization

### Adding New Priming Conditions
1. Update `PrimeType` in `types.ts`
2. Add content in `PrimeScreen.tsx`
3. Extend trial tape in `trial_tape.sample.json`

### Modifying Trial Logic
Edit judgment rules in `frontend/src/utils/judgment.ts`

### Changing Visual Scenes
Modify canvas rendering in `frontend/src/components/CanvasRenderer.tsx`

## 📊 Analysis

The experiment generates data suitable for:
- ANOVA analysis of priming effects
- Reaction time analysis
- Accuracy comparisons across conditions
- Individual difference analysis

## 🛠️ Development

### Adding Features
1. Frontend changes: Edit React components in `frontend/src/`
2. Backend changes: Modify Express routes in `backend/src/`
3. Database changes: Update Mongoose schemas in `backend/src/models.ts`

### Testing
```bash
# Test frontend
npm --prefix frontend run dev

# Test backend
npm --prefix backend run dev

# Test API endpoints
curl http://localhost:5174/api/health
```

## 📝 Notes

- **Timing**: Uses `performance.now()` for millisecond precision
- **Audio**: Requires user interaction to enable Web Audio API
- **Data**: All responses logged locally and to database
- **Export**: CSV download available on completion
- **Duration**: ~3-5 minutes per participant

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for research purposes. Please ensure compliance with your institution's research ethics guidelines.

---

**Built with**: React, TypeScript, Express, MongoDB, HTML5 Canvas, Web Audio API
