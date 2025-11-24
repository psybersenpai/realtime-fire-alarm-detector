import { useState, useEffect } from 'react'
import './App.css'

const API_URL = ''

function App() {
  const [status, setStatus] = useState(null)
  const [detections, setDetections] = useState([])
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    topic: '',
    enabled: false
  })
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/status`)
        if (!res.ok) throw new Error('Detector not responding')
        const data = await res.json()
        setStatus(data)
        setLastUpdate(new Date())
        setError(null)
      } catch (err) {
        setError(err.message)
      }
    }

    const fetchDetections = async () => {
      try {
        const res = await fetch(`${API_URL}/api/detections`)
        if (res.ok) {
          const data = await res.json()
          setDetections(data.reverse())
        }
      } catch (err) {
        console.error('Failed to fetch detections:', err)
      }
    }

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings`)
        if (res.ok) {
          const data = await res.json()
          setSettings(data)
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err)
      }
    }

    fetchStatus()
    fetchDetections()
    fetchSettings()

    const statusInterval = setInterval(fetchStatus, 1000)
    const detectionsInterval = setInterval(fetchDetections, 5000)

    return () => {
      clearInterval(statusInterval)
      clearInterval(detectionsInterval)
    }
  }, [])

  const handleSaveSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (res.ok) {
        setSaveMessage('✓ Settings saved')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (err) {
      setSaveMessage('✗ Failed to save')
    }
  }

  const handleTestNotification = async () => {
    setSaveMessage('Sending test...')
    try {
      const res = await fetch(`${API_URL}/api/test-notification`, { method: 'POST' })
      const data = await res.json()
      setSaveMessage(data.success ? '✓ Test sent!' : '✗ Send failed')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      setSaveMessage('✗ Test failed')
    }
  }

  const getStateColor = () => {
    if (!status) return '#666'
    if (status.alarm_active) return '#ff4444'
    if (status.state === 'beep') return '#ffaa00'
    return '#44ff44'
  }

  const getStateText = () => {
    if (!status) return 'Connecting...'
    if (status.alarm_active) return '🔥 FIRE ALARM DETECTED'
    if (status.state === 'beep') return '⚠️ Beep Detected'
    if (status.state === 'gap') return '⏳ Listening...'
    return '✓ Monitoring'
  }

  return (
    <div className="container">
      <header>
        <h1>🔥 Fire Alarm Detection System</h1>
        <p className="subtitle">Real-Time Audio Monitoring Dashboard</p>
        <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
          ⚙️ {showSettings ? 'Hide Settings' : 'Settings'}
        </button>
      </header>

      {error && (
        <div className="error-banner">
          ⚠️ {error} — Is the detector running on the Pi?
        </div>
      )}

      {showSettings && (
        <div className="settings-card">
          <h3>🔔 Push Notifications</h3>
          
          <div className="settings-form">
            <div className="form-group">
              <label>ntfy.sh Topic</label>
              <input
                type="text"
                placeholder="my-fire-alarm-123"
                value={settings.topic}
                onChange={e => setSettings({ ...settings, topic: e.target.value })}
              />
              <small>
                Pick a unique name. Subscribe at{' '}
                <a href={`https://ntfy.sh/${settings.topic || 'your-topic'}`} target="_blank" rel="noreferrer">
                  ntfy.sh/{settings.topic || 'your-topic'}
                </a>
                {' '}or use the <a href="https://ntfy.sh" target="_blank" rel="noreferrer">ntfy app</a>
              </small>
            </div>

            <div className="form-group toggle-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={e => setSettings({ ...settings, enabled: e.target.checked })}
                />
                Enable Push Notifications
              </label>
            </div>

            <div className="form-actions">
              <button onClick={handleSaveSettings}>Save Settings</button>
              <button onClick={handleTestNotification} className="secondary">Send Test</button>
            </div>

            {saveMessage && <p className="save-message">{saveMessage}</p>}
          </div>
        </div>
      )}

      <div className="status-card" style={{ borderColor: getStateColor() }}>
        <div className="status-indicator" style={{ backgroundColor: getStateColor() }} />
        <h2>{getStateText()}</h2>
        
        {status && (
          <div className="metrics">
            <div className="metric">
              <span className="label">Frequency</span>
              <span className="value">{status.frequency} Hz</span>
            </div>
            <div className="metric">
              <span className="label">Magnitude</span>
              <span className="value">{status.magnitude_db?.toFixed(1)} dB</span>
            </div>
            <div className="metric">
              <span className="label">Beep Count</span>
              <span className="value">{status.beep_count} / 3</span>
            </div>
            <div className="metric">
              <span className="label">State</span>
              <span className="value">{status.state}</span>
            </div>
          </div>
        )}
        
        {lastUpdate && (
          <p className="last-update">
            Last update: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="detections-card">
        <h3>📋 Detection History</h3>
        {detections.length === 0 ? (
          <p className="no-detections">No fire alarms detected yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Frequency</th>
                <th>Magnitude</th>
              </tr>
            </thead>
            <tbody>
              {detections.map((d, i) => (
                <tr key={i}>
                  <td>{new Date(d.timestamp).toLocaleString()}</td>
                  <td>{d.frequency} Hz</td>
                  <td>{d.magnitude_db?.toFixed(1)} dB</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer>
        <p>Built with Raspberry Pi • C++ • Flask • React</p>
      </footer>
    </div>
  )
}

export default App
