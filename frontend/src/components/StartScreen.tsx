import React, { useState } from 'react'
import { useExperiment } from '../context/ExperimentProvider'
import type { Participant, CountyGA } from '../types'
import { unlockAudio } from '../utils/audio'

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

  return (
    <div className="card">
      <h1>Left-Turn Decision Study</h1>
      
      <div className="consent-text">
        <h3>Study Overview</h3>
        <p>
          You will participate in a study about driving decisions. You will see various traffic scenarios 
          and be asked whether a left turn is allowed. The study includes different types of visual and 
          audio cues (primes) that may influence your decisions.
        </p>
        <p>
          <strong>Instructions:</strong> You will see traffic scenes and decide if a left turn is allowed. 
          Use the <span className="kbd">←</span> arrow key to indicate "Turn Left" and 
          the <span className="kbd">Space</span> bar to indicate "Do Not Turn".
        </p>
        <p>
          The study takes approximately 3-5 minutes to complete. Your responses are anonymous and will 
          be used for research purposes only.
        </p>
      </div>

      <div className="grid">
        <div>
          <label htmlFor="participant-id">Participant ID (required):</label>
          <div className="row">
            <input
              id="participant-id"
              style={{ flex: 1 }}
              type="text"
              placeholder="Participant ID (required)"
              value={participantData.participant_id}
              onChange={e => setParticipantData({ ...participantData, participant_id: e.target.value })}
            />
            <button type="button" className="btn" onClick={genId}>Generate ID</button>
          </div>
        </div>

        <div className="row">
          <div style={{ flex: 1 }}>
            <label htmlFor="age">Age (required):</label>
            <input
              id="age"
              type="number"
              min="10"
              max="100"
              required
              placeholder="Age (required)"
              value={participantData.age}
              onChange={e => setParticipantData({ ...participantData, age: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="gender">Gender (required):</label>
            <select
              id="gender"
              required
              value={participantData.gender}
              onChange={e => setParticipantData({ ...participantData, gender: e.target.value })}
            >
              <option value="">Select gender (required)</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={participantData.drivers_license}
              onChange={e => setParticipantData({ ...participantData, drivers_license: e.target.checked })}
            />
            I have a valid driver's license
          </label>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={participantData.learners_permit}
              onChange={e => setParticipantData({ ...participantData, learners_permit: e.target.checked })}
            />
            I have a learner's permit
          </label>
        </div>

        <div>
          <label htmlFor="region">Region (required):</label>
          <select
            id="region"
            required
            value={participantData.region_ga}
            onChange={e => setParticipantData({ ...participantData, region_ga: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="">Select region (required)</option>
            <option value="Metro Atlanta">Metro Atlanta</option>
            <option value="North Georgia">North Georgia</option>
            <option value="Middle Georgia">Middle Georgia</option>
            <option value="South Georgia">South Georgia</option>
            <option value="Coastal Georgia">Coastal Georgia</option>
            <option value="Outside of Georgia">Outside of Georgia</option>
          </select>
        </div>

        <div>
          <label htmlFor="county">County (required):</label>
          <select
            id="county"
            required
            value={participantData.county_ga}
            onChange={e => setParticipantData({ ...participantData, county_ga: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="">County (required)</option>
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
        </div>

        <div className="audio-test">
          <button className="btn" onClick={testAudio}>
            {audioTested ? '✓ Audio Test Complete' : 'Test Audio'}
          </button>
          <small>Click to test your audio system</small>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
            />
            I have read the instructions and consent to participate in this study
          </label>
        </div>

        <button 
          className="btn primary" 
          disabled={!canStart} 
          onClick={handleStart}
        >
          Begin Experiment
        </button>
      </div>
    </div>
  )
}
