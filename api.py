from flask import Flask, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # Allows React dashboard to connect from browser

BASE_DIR = "/home/pizero/Projects/RTFireAlarmDetectionSystem"
STATUS_FILE = os.path.join(BASE_DIR, "status.json")
LOG_FILE = os.path.join(BASE_DIR, "detections.jsonl")

@app.route("/api/status")
def get_status():
    """Live status from C++ detector"""
    try:
        with open(STATUS_FILE, "r") as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify({"error": "Detector not running"}), 503
    except json.JSONDecodeError:
        return jsonify({"error": "Status file corrupted"}), 500

@app.route("/api/detections")
def get_detections():
    """History of fire alarm events"""
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
    """Health check"""
    detector_running = os.path.exists(STATUS_FILE)
    return jsonify({
        "api": "ok",
        "detector": "running" if detector_running else "stopped"
    })

if __name__ == "__main__":
    print(f"Status file: {STATUS_FILE}")
    print(f"Log file: {LOG_FILE}")
    app.run(host="0.0.0.0", port=5000, debug=True)
