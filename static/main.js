// 🌌 Canvas Setup
const canvas = document.getElementById("world");
let ctx = null;

if (canvas) {
  ctx = canvas.getContext("2d");
}

function drawScene() {
  if (!ctx || !canvas) return;

  ctx.fillStyle = "#243447";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#89c9b8";
  ctx.font = "24px serif";
  ctx.fillText("You arrive in the forest clearing.", 40, 60);
  ctx.fillText("There is a gentle hum in the air...", 40, 100);
}

// 🕊 Whispersong Arrival Glade Transition
window.onload = () => {
  const arrivalSection = document.getElementById("ws-arrival-glade");
  const enterButton = document.getElementById("ws-enter-button");
  const gameContainer = document.getElementById("game-container");

  // Show the arrival screen after short delay
  setTimeout(() => {
    if (arrivalSection) {
      arrivalSection.classList.remove("ws-hidden");
      arrivalSection.classList.add("ws-visible");
    }
  }, 1000);

  // Handle entry into Whispersong
  if (enterButton) {
    enterButton.addEventListener("click", () => {
      if (arrivalSection) {
        arrivalSection.classList.remove("ws-visible");
        arrivalSection.classList.add("ws-hidden");
      }

      drawScene();
      if (gameContainer) gameContainer.style.display = "flex";

      // 🎶 Start ambient music
      const audio = document.getElementById("ws-audio");
      if (audio) {
        audio.volume = 0;
        audio.play();
        let vol = 0;
        const fade = setInterval(() => {
          if (vol < 0.6) {
            vol += 0.02;
            audio.volume = vol;
          } else {
            clearInterval(fade);
          }
        }, 200);
      }

      // 🗣 Nova speaks
      if (typeof initNovaIntro === "function") {
        initNovaIntro();
      }
    });
  }
};
