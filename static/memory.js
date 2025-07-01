// static/memory.js

// 🧠 Nova's Memory Thread — Immersive Scene

// 🌫️ Fade out main ambient from index
if (window.stopNovaAmbient) stopNovaAmbient();

// 🎧 Load and play memory ambient
const audio = new Audio("/static/audio/mood_clarity.mp3");
audio.loop = true;
audio.volume = 0.4;
audio.play().catch(() => {});

// 🧠 Load journal memory
const log = JSON.parse(localStorage.getItem("nova_journal") || "[]");
const thread = document.querySelector(".memory-log");
thread.innerHTML = "";

// 🪄 Render last 40 entries
log.slice(-40).forEach(entry => {
  const div = document.createElement("div");
  div.className = `memory-entry ${entry.role}`;
  div.innerHTML = `<strong>${entry.role}:</strong> ${entry.text}`;
  thread.appendChild(div);
});

// 🧹 Clean up ambient on leave
window.onbeforeunload = () => {
  audio.pause();
  audio.currentTime = 0;
};
