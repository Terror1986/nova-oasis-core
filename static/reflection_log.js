// reflection_log.js

document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("nova-thread-list");
  const filterBar = document.getElementById("filter-bar");
  const raw = localStorage.getItem("reflection_log") || "[]";
  const log = JSON.parse(raw).slice(-50).reverse(); // Show last 50 memories

  const uniqueTypes = [...new Set(log.map(e => e.type))];
  const state = { filter: null };

  // 🎛 Filter Buttons
  uniqueTypes.forEach(type => {
    const btn = document.createElement("button");
    btn.textContent = type;
    btn.className = "filter-btn";
    btn.addEventListener("click", () => {
      state.filter = state.filter === type ? null : type;
      render();
    });
    filterBar.appendChild(btn);
  });

  function render() {
    list.innerHTML = "";
    const entries = state.filter
      ? log.filter(e => e.type === state.filter)
      : log;

    entries.forEach(entry => {
      const li = document.createElement("li");
      li.className = "thread-entry";
      li.dataset.type = entry.type;
      li.dataset.timestamp = entry.timestamp;

      li.innerHTML = `
        <strong>${entry.type === "nova" ? "Nova" : "You"}</strong>: ${entry.content}
        <div class="timestamp">${new Date(entry.timestamp).toLocaleString()}</div>
        <div class="memory-actions">
          <button class="pin-btn">📌</button>
          <button class="recall-btn">🧠 Recall</button>
          <button class="highlight-btn">✨</button>
        </div>
      `;

      li.addEventListener("click", () => {
        const utter = new SpeechSynthesisUtterance(entry.content);
        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
      });

      list.appendChild(li);
    });

    // 🔘 Action Buttons
    document.querySelectorAll(".pin-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const li = e.target.closest(".thread-entry");
        li.style.borderLeft = "4px solid gold";
      });
    });

    document.querySelectorAll(".recall-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const li = e.target.closest(".thread-entry");
        const text = li.textContent.split("🧠")[0].trim();
        localStorage.setItem("novaRecalling", text);
        alert(`✅ Recalled: "${text}" will be included in your next prompt.`);
      });
    });

    document.querySelectorAll(".highlight-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const li = e.target.closest(".thread-entry");
        li.style.background = "rgba(255,255,200,0.08)";
        li.style.boxShadow = "0 0 12px rgba(255,255,180,0.2)";
      });
    });
  }

  render();
});
