🔧 Predictive Maintenance System (ML + FastAPI)

A full-stack Predictive Maintenance web application that uses Machine Learning to predict equipment failure risk in real time using sensor data.
The system includes a FastAPI backend, a trained ML model, and a modern interactive frontend hosted on GitHub Pages.

🚀 Live Demo

Frontend (GitHub Pages):
https://amar-pandit.github.io/predictive-maintenance/

Backend API (Render):
https://predictive-maintenance-api-v2.onrender.com/docs

🧠 Features

Real-time equipment health prediction

Machine Learning–based failure probability

FastAPI REST API backend

Interactive futuristic dashboard UI

CSV-based sensor data simulation

Fully deployed end-to-end system

🛠 Tech Stack

Backend

Python

FastAPI

Scikit-learn

NumPy, Pandas

Joblib

Frontend

HTML, CSS, JavaScript

Chart.js

Three.js

Deployment

Backend: Render

Frontend: GitHub Pages

📁 Project Structure

predictive-maintenance/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│
├── data/
│   └── sensor_data.csv
│
├── model/
│   ├── failure_model.pkl
│   └── scaler.pkl
│
├── training/
│   └── train_model.ipynb
│
├── index.html
├── script.js
├── style.css
└── README.md

⚙️ How It Works

User adjusts sensor values (temperature, vibration, pressure, RPM)

Frontend sends data to FastAPI /predict endpoint

ML model predicts failure probability

Backend returns risk percentage and system status

UI updates health index and visuals in real time

🔗 API Endpoints

Health Check

GET /


Latest Sensor Data

GET /latest


Predict Failure

POST /predict


Sample Input

{
  "temperature": 85,
  "vibration": 0.1,
  "pressure": 40,
  "rpm": 1640
}

📊 Sample Output
{
  "failure_probability": 0.82,
  "risk_percentage": 82.0,
  "status": "CRITICAL"
}

📌 Status

✅ Backend live on Render
✅ Frontend live on GitHub Pages
✅ ML model integrated
✅ Project fully working

👤 Author

Amar Pandit
Computer Science & Engineering
GitHub: https://github.com/amar-pandit

🏁 Note

This project demonstrates a real-world Predictive Maintenance system using Machine Learning + FastAPI + Modern Frontend, suitable for portfolios, interviews, and final-year projects.