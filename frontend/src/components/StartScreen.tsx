import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useExperiment } from '../context/ExperimentProvider'
import type { Participant, CountyGA } from '../types'
import { unlockAudio } from '../utils/audio'
import { SectionHeader, FieldGroup, Kbd, Notice } from './ResearchUI'
import { pageVariants, pageVariantsReduced, fadeUpVariants, fadeUpVariantsReduced, staggerContainer } from '../motion/tokens'

// county groups + Outside of GA
const COUNTY_GROUPS = {
  top5: ['Fulton County','Gwinnett County','Cobb County','DeKalb County','Chatham County'],
  metroCore: ['Fulton County','Gwinnett County','Cobb County','DeKalb County','Clayton County'],
  metroSuburbs: ['Cherokee County','Forsyth County','Henry County','Fayette County'],
  northGA: ['Hall County'],
  coastal: ['Chatham County'],
} as const;

export default function StartScreen({ onBegin }: { onBegin: () => void }) {
  const { setParticipant } = useExperiment()
  const prefersReducedMotion = useReducedMotion()
  const [consent, setConsent] = useState(false)
  const [audioTested, setAudioTested] = useState(false)
  const [participantData, setParticipantData] = useState({
    participant_id: '',
    age: '',
    gender: '',
    drivers_license: false,
    learners_permit: false,
    region_ga: '',
    county_ga: ''
  })

  const canStart = 
    consent && 
    audioTested && 
    participantData.participant_id.trim().length > 0 &&
    String(participantData.age).trim().length > 0 &&
    !!participantData.gender &&
    !!participantData.region_ga &&
    !!participantData.county_ga

  const genId = () => {
    const id = 'P' + Math.random().toString(36).slice(2, 10).toUpperCase();
    setParticipantData(prev => ({ ...prev, participant_id: id }));
  };

  const handleStart = async () => {
    console.log('[START] Begin clicked - unlocking audio before experiment');
    
    // Ensure audio is unlocked before starting experiment
    try {
      await unlockAudio();
    } catch (e) {
      console.error('[START] Audio unlock failed:', e);
    }
    
    const participant: Participant = {
      participant_id: participantData.participant_id.trim(),
      age: Number(participantData.age),
      gender: participantData.gender as any,
      drivers_license: participantData.drivers_license,
      learners_permit: participantData.learners_permit,
      region_ga: participantData.region_ga as any,
      county_ga: participantData.county_ga as any
    }
    
    setParticipant(participant)
    console.log('[START] Starting experiment...');
    onBegin()
  }

  const testAudio = async () => {
    // Unlock audio and test with beep + speech
    try {
      console.log('[START] Test Audio clicked - unlocking...');
      
      // Unlock audio gate (critical for TTS on all primes)
      await unlockAudio();
      
      // Play test beep
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // A4 note
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.5)
      
      // Test TTS
      setTimeout(async () => {
        try {
          const testUtterance = new SpeechSynthesisUtterance('Audio test');
          testUtterance.lang = 'en-US';
          testUtterance.rate = 1.0;
          testUtterance.volume = 0.5;
          speechSynthesis.speak(testUtterance);
          console.log('[START] Test speech triggered');
        } catch (e) {
          console.error('[START] Test speech failed:', e);
        }
      }, 600);
      
      setAudioTested(true)
      console.log('[START] ✅ Audio test complete');
    } catch (error) {
      console.error('[START] ❌ Audio test failed:', error)
      alert('Audio test failed. Please check your audio settings.')
    }
  }

  const containerVariants = prefersReducedMotion ? {} : staggerContainer;
  const itemVariants = prefersReducedMotion ? fadeUpVariantsReduced : fadeUpVariants;

  return (
    <motion.main
      className="page"
      variants={prefersReducedMotion ? pageVariantsReduced : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        style={{ marginBottom: 'var(--space-6)' }}
        variants={itemVariants}
        initial="initial"
        animate="animate"
      >
        <h1 style={{ margin: 0 }}>Left-Turn Decision Study</h1>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div className="section" variants={itemVariants}>
        <SectionHeader index={1} title="Study Overview" />
        <p>
          This study examines left-turn decisions under controlled traffic scenes. Each trial presents
          a single intersection with a specified signal state, an oncoming vehicle with a labeled
          time-to-collision (TTC), and, in some trials, a pedestrian crossing.
        </p>
      </motion.div>

      <motion.div className="section" variants={itemVariants}>
        <SectionHeader index={2} title="Instructions" />
        <p>
          Indicate "Turn Left" with the <Kbd>←</Kbd> key and "Do Not Turn" with the <Kbd>Space</Kbd> bar.
          Please respond as you would when driving, prioritizing safety.
        </p>
        <Notice title="Duration">
          <p>The study takes approximately 3–5 minutes to complete.</p>
        </Notice>
      </motion.div>

      <motion.div className="section" variants={itemVariants}>
        <SectionHeader index={3} title="Privacy" />
        <p>
          Responses are anonymous and stored without direct identifiers. Aggregate results may be
          reported in academic venues.
        </p>
      </motion.div>

      <motion.div className="section" variants={itemVariants}>
        <SectionHeader index={4} title="Participant Information" />
        <div className="card">
          <div className="card-body">
            <div className="form-grid">
              <FieldGroup label="Participant ID" htmlFor="participant-id" required>
                <div className="form-row">
                  <input
                    id="participant-id"
                    className="input"
                    style={{ flex: 1 }}
                    type="text"
                    placeholder="Enter or generate ID"
                    value={participantData.participant_id}
                    onChange={e => setParticipantData({ ...participantData, participant_id: e.target.value })}
                  />
                  <button type="button" className="btn" onClick={genId}>
                    Generate ID
                  </button>
                </div>
              </FieldGroup>

              <div className="form-row">
                <FieldGroup label="Age" htmlFor="age" required>
                  <input
                    id="age"
                    className="input"
                    type="number"
                    min="10"
                    max="100"
                    placeholder="Age"
                    value={participantData.age}
                    onChange={e => setParticipantData({ ...participantData, age: e.target.value })}
                  />
                </FieldGroup>

                <FieldGroup label="Gender" htmlFor="gender" required>
                  <select
                    id="gender"
                    className="select"
                    value={participantData.gender}
                    onChange={e => setParticipantData({ ...participantData, gender: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </FieldGroup>
              </div>

              <div className="form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={participantData.drivers_license}
                    onChange={e => setParticipantData({ ...participantData, drivers_license: e.target.checked })}
                  />
                  Valid driver's license
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={participantData.learners_permit}
                    onChange={e => setParticipantData({ ...participantData, learners_permit: e.target.checked })}
                  />
                  Learner's permit
                </label>
              </div>

              <FieldGroup label="Region" htmlFor="region" required>
                <select
                  id="region"
                  className="select"
                  value={participantData.region_ga}
                  onChange={e => setParticipantData({ ...participantData, region_ga: e.target.value })}
                >
                  <option value="">Select region</option>
                  <option value="Metro Atlanta">Metro Atlanta</option>
                  <option value="North Georgia">North Georgia</option>
                  <option value="Middle Georgia">Middle Georgia</option>
                  <option value="South Georgia">South Georgia</option>
                  <option value="Coastal Georgia">Coastal Georgia</option>
                  <option value="Outside of Georgia">Outside of Georgia</option>
                </select>
              </FieldGroup>

              <FieldGroup label="County" htmlFor="county" required>
                <select
                  id="county"
                  className="select"
                  value={participantData.county_ga}
                  onChange={e => setParticipantData({ ...participantData, county_ga: e.target.value })}
                >
                  <option value="">Select county</option>
                  <optgroup label="Top 5 by population">
                    {COUNTY_GROUPS.top5.map(c => <option key={`t5-${c}`} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="Metro Atlanta — Core">
                    {COUNTY_GROUPS.metroCore.map(c => <option key={`mc-${c}`} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="Metro Atlanta — Suburbs">
                    {COUNTY_GROUPS.metroSuburbs.map(c => <option key={`ms-${c}`} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="North Georgia">
                    {COUNTY_GROUPS.northGA.map(c => <option key={`ng-${c}`} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="Coastal Georgia">
                    {COUNTY_GROUPS.coastal.map(c => <option key={`cg-${c}`} value={c}>{c}</option>)}
                  </optgroup>
                  <option value="Outside of Georgia">Outside of Georgia</option>
                </select>
              </FieldGroup>

              <div>
                <button className="btn" onClick={testAudio}>
                  {audioTested ? '✓ Audio test complete' : 'Test audio'}
                </button>
                <div className="help" style={{ marginTop: 'var(--space-2)' }}>
                  Click to verify your audio system is working
                </div>
              </div>

              <Notice>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                  />
                  I have read the instructions and consent to participate in this study
                </label>
              </Notice>

              <button
                className="btn btn-primary"
                disabled={!canStart}
                onClick={handleStart}
                style={{ width: '100%' }}
              >
                Begin experiment
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      </motion.div>
    </motion.main>
  )
}
