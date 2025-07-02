// nova_core.js — Finalized for Presence: Auto-scroll + Ambient Fix

console.log("[Nova.js] Loaded");

// 🎵 Ambient Audio Setup
const ambientAudio = new Audio("/static/audio/oasis_ambience.mp3");
ambientAudio.loop = true;
ambientAudio.volume = 0.4;
ambientAudio.play().catch(() => {
  console.warn("[Nova.js] Audio autoplay blocked or failed.");
});

window.addEventListener("beforeunload", () => {
  ambientAudio.pause();
  ambientAudio.currentTime = 0;
});

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Nova.js] DOM fully loaded");

  const input = document.getElementById("player-input");
  const outputBox = document.getElementById("nova-output");
  const typingIndicator = document.getElementById("typing-indicator");
  const button = document.getElementById("send-button");

  if (!input || !button || !outputBox || !typingIndicator) {
    console.error("[Nova.js] Missing required DOM elements:", {
      input, button, outputBox, typingIndicator
    });
    return;
  }

  console.log("[Nova.js] DOM elements found. Setting up input.");
  const chatLog = [];

  function detectTone(text) {
    const t = text.toLowerCase();
    if (t.includes("quiet") || t.includes("still")) return "stillness";
    if (t.includes("grief") || t.includes("loss")) return "grief";
    if (t.includes("hope") || t.includes("light")) return "hope";
    return "reflection";
  }

  function setSceneMood(mood) {
    const valid = ["stillness", "grief", "hope", "reflection"];
    document.body.className = document.body.className
      .split(" ")
      .filter((c) => !c.startsWith("mood-"))
      .join(" ")
      .trim();
    if (valid.includes(mood)) document.body.classList.add(`mood-${mood}`);
  }

  function speakNovaTyped(text) {
    const p = document.createElement("p");
    p.className = "nova-line";
    p.textContent = "Nova: ";
    outputBox.appendChild(p);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= text.length) {
        clearInterval(interval);
        p.scrollIntoView({ behavior: "smooth", block: "end" });
        return;
      }
      p.textContent += text[i++];
      p.scrollIntoView({ behavior: "auto", block: "end" });
    }, 20);
  }

  function renderUserLine(text) {
    const p = document.createElement("p");
    p.className = "user-line";
    p.textContent = `You: ${text}`;
    outputBox.appendChild(p);
    p.scrollIntoView({ behavior: "smooth", block: "end" });
  }


  function showTyping() {
    typingIndicator.classList.remove("hidden");
  }

  function hideTyping() {
    typingIndicator.classList.add("hidden");
  }

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

    const uid = window.getNovaUID?.() || "guest";
    fetch("/api/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...entry, uid })
    }).catch((err) => {
      console.warn("[Nova.js] Failed to reflect:", err);
    });
  }

  async function generateNovaLine(type = "message", context = "") {
    if (!context.trim()) return;
    showTyping();

    const memory = chatLog.slice(-20);
    const profile = JSON.parse(localStorage.getItem("nova_profile") || "{}");

    if (!profile.name) {
      const namePrompt = prompt("What name would you like Nova to remember you by?");
      if (namePrompt && namePrompt.trim().length > 0) {
        profile.name = namePrompt.trim();
        localStorage.setItem("nova_profile", JSON.stringify(profile));
        console.log(`[Nova.js] Name set as: ${profile.name}`);
      }
    }

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

  const send = (e) => {
    e?.preventDefault();
    const text = input.value.trim();
    if (text.length > 0) {
      console.log("[Nova.js] Sending input:", text);
      generateNovaLine("message", text);
      input.value = "";
    }
  };

  button?.addEventListener("click", send);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send(e);
  });

  console.log("[Nova.js] Input handlers ready.");

  // 🔊 Fix autoplay audio (must be resumed on user gesture)
  document.body.addEventListener("click", () => {
    if (ambientAudio.paused) {
      ambientAudio.play().catch(() => {
        console.warn("[Nova.js] Audio still blocked after click.");
      });
    }
  }, { once: true });
});
