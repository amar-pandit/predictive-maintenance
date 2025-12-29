import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

/* ================== BACKEND API ================== */
/* 🔴 IMPORTANT: Put your REAL Render backend URL here */
const API_URL = "https://predictive-maintenance-api.onrender.com";

/* ================== FIREBASE SAFE INIT ================== */
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
let threeCore = { scene: null, camera: null, renderer: null, turbine: null, blades: null };

/* ================== ML-POWERED METRICS ================== */
async function getHealthMetrics() {
    const temp = parseFloat(document.getElementById("temp").value);
    const vib  = parseFloat(document.getElementById("vib").value);
    const pres = parseFloat(document.getElementById("pres").value);
    const rpm  = parseFloat(document.getElementById("rpm").value);

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
        throw new Error("Backend not responding");
    }

    const data = await res.json();

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

        healthEl.innerText = m.health + "%";
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
                (m.temp - 50) / 65 * 100,
                (m.vib / 0.25) * 100,
                (m.pres / 50) * 100,
                (m.rpm / 2200) * 100
            ];
            charts.radar.update();
        }

        const term = document.getElementById("term-feed");
        term.innerHTML =
            `> TEMP:${m.temp}  VIB:${m.vib}<br>` +
            `> RPM:${m.rpm}<br>` +
            `> RISK:${m.failureRisk}%<br>` +
            `> STATUS:${m.status}`;

    } catch (err) {
        console.error(err);
        document.getElementById("hud-mode").innerText = "BACKEND OFFLINE";
    }
}

/* ================== THREE.JS ================== */
function initThree() {
    const container = document.getElementById("viewport");
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        45, container.clientWidth / container.clientHeight, 0.1, 1000
    );

    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById("three-canvas"),
        alpha: true,
        antialias: true
    });

    renderer.setSize(container.clientWidth, container.clientHeight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const light = new THREE.PointLight(0x00f2ff, 1.2);
    light.position.set(5, 5, 5);
    scene.add(light);

    const group = new THREE.Group();

    const hub = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.8, 2),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    group.add(hub);
    threeCore.turbine = hub;

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.05, 16, 100),
        new THREE.MeshBasicMaterial({ color: 0x00f2ff })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    threeCore.blades = ring;

    scene.add(group);
    camera.position.z = 8;

    threeCore.scene = scene;
    threeCore.camera = camera;
    threeCore.renderer = renderer;

    const animate = () => {
        requestAnimationFrame(animate);
        const rpm = parseFloat(document.getElementById("rpm").value || 1400);
        group.rotation.y += rpm / 8000;
        renderer.render(scene, camera);
    };
    animate();
}

/* ================== CHARTS ================== */
function initCharts() {
    charts.prob = new Chart(document.getElementById("probChart"), {
        type: "doughnut",
        data: {
            labels: ["Safe", "Risk"],
            datasets: [
                { data: [100, 0], backgroundColor: ["#00f2ff", "#ef4444"] }
            ]
        },
        options: { cutout: "75%", plugins: { legend: { display: false } } }
    });

    charts.radar = new Chart(document.getElementById("radarChart"), {
        type: "radar",
        data: {
            labels: ["Heat", "Vib", "Pressure", "RPM"],
            datasets: [
                { data: [0, 0, 0, 0], borderColor: "#00f2ff" }
            ]
        },
        options: { plugins: { legend: { display: false } } }
    });
}

/* ================== INIT ================== */
window.addEventListener("load", () => {
    initThree();
    initCharts();
    syncUI();

    ["temp", "vib", "pres", "rpm"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", syncUI);
    });

    if (auth) signInAnonymously(auth);
});
