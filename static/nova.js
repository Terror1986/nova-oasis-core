// nova_core.js — Focused Demo Build for Nova OASIS Core

// 🎵 Ambient Audio Setup
const ambientAudio = new Audio("/static/audio/oasis_ambience.mp3");
ambientAudio.loop = true;
ambientAudio.volume = 0.4;
ambientAudio.play().catch(() => {});

window.addEventListener("beforeunload", () => {
  ambientAudio.pause();
  ambientAudio.currentTime = 0;
});

// 🧠 DOM References
const input = document.getElementById("player-input");
const outputBox = document.getElementById("nova-output");
const typingIndicator = document.getElementById("typing-indicator");
const chatLog = [];

// 🎭 Tone Detection
function detectTone(text) {
  const t = text.toLowerCase();
  if (t.includes("quiet") || t.includes("still")) return "stillness";
  if (t.includes("grief") || t.includes("loss")) return "grief";
  if (t.includes("hope") || t.includes("light")) return "hope";
  return "reflection";
}

// 🌌 Mood Class Setter
function setSceneMood(mood) {
  const valid = ["stillness", "grief", "hope", "reflection"];
  document.body.className = document.body.className
    .split(" ")
    .filter((c) => !c.startsWith("mood-"))
    .join(" ")
    .trim();
  if (valid.includes(mood)) document.body.classList.add(`mood-${mood}`);
}

// 🗣️ Nova Typing Animation
function speakNovaTyped(text) {
  const p = document.createElement("p");
  p.className = "nova-line";
  p.textContent = "Nova: ";
  outputBox.appendChild(p);
  outputBox.scrollTop = outputBox.scrollHeight;

  let i = 0;
  const interval = setInterval(() => {
    if (i >= text.length) return clearInterval(interval);
    p.textContent += text[i++];
    outputBox.scrollTop = outputBox.scrollHeight;
  }, 20);
}

// 🙋‍♂️ User Message Renderer
function renderUserLine(text) {
  const p = document.createElement("p");
  p.className = "user-line";
  p.textContent = `You: ${text}`;
  outputBox.appendChild(p);
  outputBox.scrollTop = outputBox.scrollHeight;
}

// ⌛ Typing Indicator Controls
function showTyping() {
  typingIndicator.classList.remove("hidden");
}
function hideTyping() {
  typingIndicator.classList.add("hidden");
}

// 📓 Local Journal + Trust System
function saveJournalEntry(entry) {
  const log = JSON.parse(localStorage.getItem("nova_journal") || "[]");
  log.push(entry);
  localStorage.setItem("nova_journal", JSON.stringify(log));

  const profile = JSON.parse(localStorage.getItem("nova_profile") || "{}");
  if (!profile.trust_score) profile.trust_score = 0;
  if (!profile.trust_score_session) profile.trust_score_session = 0;

  if (entry.role === "nova" && entry.tag && profile.trust_score_session < 2) {
    profile.trust_score += 1;
    profile.trust_score_session += 1;
  }
  localStorage.setItem("nova_profile", JSON.stringify(profile));

  const uid = window.getNovaUID?.();
  if (uid) {
    fetch("/api/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...entry, uid })
    }).catch(() => {});
  }
}

// 💬 Main Nova Response Loop
async function generateNovaLine(type = "message", context = "") {
  if (!context.trim()) return;
  showTyping();

  const memory = chatLog.slice(-20);
  const profile = JSON.parse(localStorage.getItem("nova_profile") || "{}");
  const ritual = profile.ritual || "";
  const name = profile.name || "";
  const uid = window.getNovaUID?.() || null;
  const payload = { type, context, memory, ritual, name, uid };

  try {
    const res = await fetch("/api/nova", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    const line = data.text?.trim() || "(Nova said nothing...)";

    const now = new Date().toISOString();
    const tone = detectTone(line);

    chatLog.push({ role: "user", text: context });
    chatLog.push({ role: "nova", text: line });
    if (chatLog.length > 40) chatLog.splice(0, chatLog.length - 40);

    saveJournalEntry({ role: "user", text: context, timestamp: now });
    saveJournalEntry({ role: "nova", text: line, timestamp: now, tag: tone });

    renderUserLine(context);
    hideTyping();
    speakNovaTyped(line);
    setSceneMood(tone);
  } catch (err) {
    hideTyping();
    speakNovaTyped("Nova tried to speak… but something broke inside.");
  }
}

// 🎯 Setup Input Handler
function setupNovaInput() {
  const button = document.getElementById("send-button");

  const send = (e) => {
    e?.preventDefault();
    const text = input.value.trim();
    if (text.length > 0) {
      generateNovaLine("message", text);
      input.value = "";
    }
  };

  button?.addEventListener("click", send);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send(e);
  });
}

document.addEventListener("DOMContentLoaded", setupNovaInput);
