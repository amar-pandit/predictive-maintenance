/* ================== BACKEND API ================== */
const API_URL = "https://predictive-maintenance-api-v2.onrender.com";

/* ================== FIREBASE SAFE INIT ================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

let firebaseConfig, appId;
try {
    firebaseConfig = typeof __firebase_config !== "undefined"
        ? JSON.parse(__firebase_config)
        : { apiKey: "local" };
    appId = typeof __app_id !== "undefined" ? __app_id : "maintenance-x";
} catch {
    firebaseConfig = { apiKey: "local" };
    appId = "local";
}

const app = initializeApp(firebaseConfig);
const db = firebaseConfig.apiKey !== "local" ? getFirestore(app) : null;
const auth = firebaseConfig.apiKey !== "local" ? getAuth(app) : null;

/* ================== GLOBALS ================== */
let charts = {};
let threeCore = { scene: null, camera: null, renderer: null, blades: null };

/* ================== ML METRICS ================== */
async function getHealthMetrics() {
    // ✅ SAFE number conversion (422 FIX)
    const temp = Number(document.getElementById("temp")?.value || 0);
    const vib  = Number(document.getElementById("vib")?.value || 0);
    const pres = Number(document.getElementById("pres")?.value || 0);
    const rpm  = Number(document.getElementById("rpm")?.value || 0);

    console.log("Sending to backend:", temp, vib, pres, rpm);

    const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            temperature: temp,
            vibration: vib,
            pressure: pres,
            rpm: rpm
        })
    });

    if (!res.ok) {
        const err = await res.text();
        console.error("Backend error:", err);
        throw new Error("Backend not responding");
    }

    const data = await res.json();
    console.log("Backend response:", data);

    return {
        temp,
        vib,
        pres,
        rpm,
        failureRisk: data.risk_percentage,
        health: Math.max(0, 100 - data.risk_percentage),
        status: data.status
    };
}

/* ================== UI SYNC ================== */
async function syncUI() {
    try {
        const m = await getHealthMetrics();

        document.getElementById("v-temp").innerText = m.temp;
        document.getElementById("v-vib").innerText = m.vib;
        document.getElementById("v-pres").innerText = m.pres;
        document.getElementById("v-rpm").innerText = m.rpm;
        document.getElementById("hud-rpm").innerText = m.rpm.toFixed(0);

        const healthEl = document.getElementById("health-val");
        const modeEl = document.getElementById("hud-mode");

        healthEl.innerText = `${m.health}%`;
        modeEl.innerText = m.status;

        const color =
            m.status === "CRITICAL" ? "var(--danger)" :
            m.status === "WARNING"  ? "var(--warning)" :
                                     "var(--primary)";

        healthEl.style.color = color;
        modeEl.style.color = color;

        if (threeCore.blades) {
            const c =
                m.status === "CRITICAL" ? 0xef4444 :
                m.status === "WARNING"  ? 0xfbbf24 :
                                          0x00f2ff;
            threeCore.blades.material.color.setHex(c);
        }

        if (charts.prob) {
            charts.prob.data.datasets[0].data = [
                100 - m.failureRisk,
                m.failureRisk
            ];
            charts.prob.update();
        }

        if (charts.radar) {
            charts.radar.data.datasets[0].data = [
                (m.temp / 100) * 100,
                (m.vib / 0.25) * 100,
                (m.pres / 50) * 100,
                (m.rpm / 2200) * 100
            ];
            charts.radar.update();
        }

    } catch (err) {
        console.error(err);
        document.getElementById("hud-mode").innerText = "BACKEND OFFLINE";
    }
}

/* ================== EVENTS ================== */
["temp", "vib", "pres", "rpm"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", syncUI);
});

/* ================== DUMMY FUNCTIONS (HTML FIX) ================== */
window.syncToArchive = function () {
    console.log("Archive feature placeholder");
};

window.executeNeuralAnalysis = function () {
    console.log("Diagnostics placeholder");
};

/* ================== INIT ================== */
window.addEventListener("load", () => {
    syncUI();
    if (auth) signInAnonymously(auth);
});
