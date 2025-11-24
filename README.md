# 🔥 Real-Time Fire Alarm Detection System

An IoT system that detects fire alarm sounds in real-time using a Raspberry Pi, FFT-based audio analysis, and sends instant push notifications to your phone.

![Dashboard Screenshot](docs/dashboard.png)

## Features

- **Real-time audio monitoring** — Continuously analyzes audio for fire alarm frequencies (3000-3600 Hz)
- **FFT-based detection** — Uses Fast Fourier Transform for accurate frequency analysis
- **Pattern recognition** — Detects the characteristic beep pattern (3+ beeps) to reduce false positives
- **Web dashboard** — Monitor status, view detection history from any device on your network
- **Push notifications** — Instant alerts via ntfy.sh when a fire alarm is detected
- **Sub-500ms latency** — Fast detection through optimized C++ and real-time scheduling

## System Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  I2S MEMS Mic   │────▶│  C++ Detector    │────▶│  JSON Logs      │
│  (SPH0645LM4H)  │     │  (FFT Analysis)  │     │  status.json    │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  ntfy.sh        │◀────│  Flask API       │◀────│  React Dashboard│
│  (Push Alerts)  │     │  (Python)        │     │  (Web UI)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Audio Processing | C++, ALSA, FFTW3 |
| Backend API | Python, Flask |
| Frontend | React, Vite |
| Hardware | Raspberry Pi Zero W, I2S MEMS Microphone |
| Notifications | ntfy.sh |

## Hardware Requirements

- Raspberry Pi (Zero W, 3, or 4)
- I2S MEMS Microphone (Adafruit SPH0645LM4H or similar)
- MicroSD card (8GB+)
- Power supply

### Wiring Diagram

| Microphone Pin | Raspberry Pi GPIO |
|----------------|-------------------|
| VDD | 3.3V |
| GND | GND |
| BCLK | GPIO18 |
| LRCL | GPIO19 |
| DOUT | GPIO21 |

> 📖 **Detailed wiring guide:** [Adafruit I2S MEMS Microphone Breakout - Raspberry Pi Wiring & Test](https://learn.adafruit.com/adafruit-i2s-mems-microphone-breakout/raspberry-pi-wiring-test)

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/psybersenpai/realtime-fire-alarm-detector.git
cd realtime-fire-alarm-detector
```

### 2. Install system dependencies
```bash
sudo apt update
sudo apt install -y libasound2-dev libfftw3-dev python3-pip python3-venv
```

### 3. Compile the C++ detector
```bash
g++ -O2 -o fire_alarm_detector fire_alarm_detector.cpp -lasound -lfftw3 -lm
```

### 4. Set up Python environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install flask flask-cors requests
```

### 5. Run the system

Terminal 1 — Start the detector:
```bash
sudo ./fire_alarm_detector
```

Terminal 2 — Start the API server:
```bash
source venv/bin/activate
python3 api.py
```

### 6. Access the dashboard

Open `http://<pi-ip-address>:5000` in your browser.

## Configuration

### Push Notifications

1. Click **Settings** in the dashboard
2. Enter a unique topic name (e.g., `my-fire-alarm-123`)
3. Enable notifications and save
4. Subscribe to your topic:
   - **Web:** Visit `https://ntfy.sh/your-topic-name`
   - **Mobile:** Install the [ntfy app](https://ntfy.sh) and subscribe to your topic

## How It Works

### Detection Algorithm

1. **Audio Capture** — ALSA captures audio at 48kHz via I2S interface
2. **FFT Analysis** — FFTW3 transforms audio to frequency domain (4096-sample windows)
3. **Frequency Filtering** — Isolates 3000-3600 Hz range (standard fire alarm frequency)
4. **Magnitude Threshold** — Checks if signal strength exceeds -20 dB
5. **Pattern Matching** — Confirms 3+ consecutive beeps within 10 seconds
6. **Alert Dispatch** — Logs detection and triggers push notification

### Why These Technologies?

- **C++ over Python** — Lower latency, deterministic performance for real-time audio
- **FFTW3** — Industry-standard FFT library, highly optimized
- **I2S over USB** — Direct digital audio path, no analog noise
- **Flask** — Lightweight, perfect for resource-constrained Pi
- **React** — Modern UI, easy to extend

## Project Structure
```
realtime-fire-alarm-detector/
├── fire_alarm_detector.cpp   # Core detection engine
├── api.py                    # Flask API server
├── frontend/                 # React dashboard
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── dist/                 # Production build
├── config.json               # User settings (gitignored)
├── status.json               # Live detector status (gitignored)
├── detections.jsonl          # Detection history (gitignored)
└── README.md
```

## Performance

| Metric | Value |
|--------|-------|
| Detection Latency | < 500ms |
| Sample Rate | 48 kHz |
| FFT Window | 4096 samples (~85ms) |
| CPU Usage | ~15% on Pi Zero W |
| Memory | ~8 MB |

## Future Enhancements

- [ ] Machine learning model for improved accuracy
- [ ] Multi-sensor fusion (smoke, CO, temperature)
- [ ] Remote dashboard access via Tailscale
- [ ] Historical analytics and trends
- [ ] Integration with smart home systems (Home Assistant)

## License

MIT License — See [LICENSE](LICENSE) for details.

## Author

**Farhan Tahmid** — [GitHub](https://github.com/psybersenpai)

Built as a portfolio project demonstrating embedded systems, real-time audio processing, and full-stack development.