from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import joblib
import os
import pandas as pd

app = FastAPI(title="Predictive Maintenance Backend")

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= PATHS =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "..", "model", "failure_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "..", "model", "scaler.pkl")
CSV_PATH = os.path.join(BASE_DIR, "..", "data", "sensor_data.csv")

# ================= LOAD MODEL =================
try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
except Exception as e:
    raise RuntimeError(f"❌ Model loading failed: {e}")

# ================= SCHEMA =================
class SensorData(BaseModel):
    temperature: float
    vibration: float
    pressure: float
    rpm: float

# ================= HEALTH =================
@app.get("/")
def health():
    return {"status": "backend running successfully"}

# ================= READ LATEST CSV =================
@app.get("/latest")
def latest_from_csv():
    if not os.path.exists(CSV_PATH):
        raise HTTPException(status_code=404, detail="CSV file not found")

    df = pd.read_csv(CSV_PATH)

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    last = df.iloc[-1]

    return {
        "temperature": float(last["temperature"]),
        "vibration": float(last["vibration"]),
        "pressure": float(last["pressure"]),
        "rpm": float(last["rpm"]),
    }

# ================= PREDICTION =================
@app.post("/predict")
def predict(data: SensorData):
    try:
        X = np.array([[ 
            data.temperature,
            data.vibration,
            data.pressure,
            data.rpm
        ]])

        X_scaled = scaler.transform(X)
        failure_prob = model.predict_proba(X_scaled)[0][1]

        if failure_prob >= 0.7:
            status = "CRITICAL"
        elif failure_prob >= 0.4:
            status = "WARNING"
        else:
            status = "OPTIMAL"

        return {
            "failure_probability": round(float(failure_prob), 3),
            "risk_percentage": round(float(failure_prob * 100), 1),
            "status": status
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
