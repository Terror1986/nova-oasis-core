// static/garden.js

// 🌿 Nova's Memory Garden — Immersive Scene

// 🌫️ Fade out main ambient from index.html
if (window.stopNovaAmbient) stopNovaAmbient();

// 🎧 Ambient: Calm growth
const audio = new Audio("/static/audio/mood_calm.mp3");
audio.loop = true;
audio.volume = 0.4;
audio.play().catch(() => {});

// 🌿 Load memory journal
const log = JSON.parse(localStorage.getItem("nova_journal") || "[]");
const garden = document.querySelector(".garden-blooms");
garden.innerHTML = "";

// 💠 Render last 100 memory blooms
log.slice(-100).forEach(entry => {
  const bloom = document.createElement("div");
  bloom.className = `garden-bloom ${entry.tag || 'untagged'}`;
  bloom.title = `${entry.tag || 'untagged'}\n${entry.text}`;
  garden.appendChild(bloom);
});

// 🧹 Clean ambient on exit
window.onbeforeunload = () => {
  audio.pause();
  audio.currentTime = 0;
};
