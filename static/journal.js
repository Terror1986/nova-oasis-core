// static/journal.js

// 📓 Nova's Journal Archive — Immersive Scene

// 🌫️ Stop main ambient if still playing
if (window.stopNovaAmbient) stopNovaAmbient();

// 🎧 Presence-based ambient music
const audio = new Audio("/static/audio/mood_presence.mp3");
audio.loop = true;
audio.volume = 0.35;
audio.play().catch(() => {});

// 🧾 Render journal entries
const log = JSON.parse(localStorage.getItem("nova_journal") || "[]");
const journal = document.querySelector(".journal-entries");

log.forEach(entry => {
  const div = document.createElement("div");
  div.className = `journal-entry ${entry.tag || ""}`;

  const timestamp = new Date(entry.timestamp).toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  div.innerHTML = `
    <strong>${entry.role}</strong>
    <em>${timestamp}</em><br>
    ${entry.text}
    ${entry.tag ? `<span class="tag">${entry.tag}</span>` : ""}
  `;

  journal.appendChild(div);
});

// 📤 Export journal to file
function exportJournalAsFile() {
  const data = localStorage.getItem("nova_journal");
  if (!data) return alert("No journal entries to export.");
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nova_journal.json";
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("export-journal")?.addEventListener("click", exportJournalAsFile);

// 🧹 Clean up ambient audio
window.onbeforeunload = () => {
  audio.pause();
  audio.currentTime = 0;
};
