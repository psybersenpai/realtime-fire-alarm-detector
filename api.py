from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
import requests
import threading
import time

app = Flask(__name__)
CORS(app)

BASE_DIR = "/home/pizero/Projects/RTFireAlarmDetectionSystem"
STATUS_FILE = os.path.join(BASE_DIR, "status.json")
LOG_FILE = os.path.join(BASE_DIR, "detections.jsonl")
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {"topic": "", "enabled": False}

def save_config(config):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)

def send_notification(message):
    config = load_config()
    if not config.get("enabled") or not config.get("topic"):
        return False
    
    try:
        response = requests.post(
            f"https://ntfy.sh/{config['topic']}",
            data=message.encode('utf-8'),
            headers={
                "Title": "Fire Alarm Alert",
                "Priority": "urgent",
                "Tags": "fire,warning"
            }
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Notification failed: {e}")
        return False

# Background thread to watch for new detections
last_detection_count = 0

def detection_watcher():
    global last_detection_count
    while True:
        try:
            if os.path.exists(LOG_FILE):
                with open(LOG_FILE, "r") as f:
                    lines = [l.strip() for l in f if l.strip()]
                    current_count = len(lines)
                    
                    if current_count > last_detection_count:
                        latest = json.loads(lines[-1])
                        send_notification(f"🔥 FIRE ALARM DETECTED at {latest['timestamp']}")
                        last_detection_count = current_count
        except Exception as e:
            print(f"Watcher error: {e}")
        
        time.sleep(2)

@app.route("/api/status")
def get_status():
    try:
        with open(STATUS_FILE, "r") as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify({"error": "Detector not running"}), 503
    except json.JSONDecodeError:
        return jsonify({"error": "Status file corrupted"}), 500

@app.route("/api/detections")
def get_detections():
    try:
        detections = []
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, "r") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        detections.append(json.loads(line))
        return jsonify(detections)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/health")
def health():
    detector_running = os.path.exists(STATUS_FILE)
    return jsonify({
        "api": "ok",
        "detector": "running" if detector_running else "stopped"
    })

@app.route("/api/settings", methods=["GET"])
def get_settings():
    config = load_config()
    return jsonify({
        "topic": config.get("topic", ""),
        "enabled": config.get("enabled", False)
    })

@app.route("/api/settings", methods=["POST"])
def save_settings():
    data = request.get_json()
    config = {
        "topic": data.get("topic", "").strip(),
        "enabled": data.get("enabled", False)
    }
    save_config(config)
    return jsonify({"success": True})

@app.route("/api/test-notification", methods=["POST"])
def test_notification():
    success = send_notification("🧪 Test alert from Fire Alarm Detection System")
    return jsonify({"success": success})

if __name__ == "__main__":
    watcher_thread = threading.Thread(target=detection_watcher, daemon=True)
    watcher_thread.start()
    
    print(f"Status file: {STATUS_FILE}")
    print(f"Log file: {LOG_FILE}")
    print(f"Config file: {CONFIG_FILE}")
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)