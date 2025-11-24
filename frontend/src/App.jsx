import { useState, useEffect } from 'react'
import './App.css'

// Change this to your Pi's IP address
const API_URL = 'http://192.168.50.116:5000'

function App() {
  const [status, setStatus] = useState(null)
  const [detections, setDetections] = useState([])
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

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
          setDetections(data.reverse()) // Most recent first
        }
      } catch (err) {
        console.error('Failed to fetch detections:', err)
      }
    }

    fetchStatus()
    fetchDetections()

    const statusInterval = setInterval(fetchStatus, 1000)
    const detectionsInterval = setInterval(fetchDetections, 5000)

    return () => {
      clearInterval(statusInterval)
      clearInterval(detectionsInterval)
    }
  }, [])

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
      </header>

      {error && (
        <div className="error-banner">
          ⚠️ {error} — Is the detector running on the Pi?
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