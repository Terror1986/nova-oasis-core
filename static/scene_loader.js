// scene_loader.js — loads and renders ambient scenes

let scenes = [];
let sceneMap = {};
let currentSceneId = null;
let visitedScenes = new Set();
let previousChoices = {};
const SCENE_MEMORY_KEY = "whispersong_progress";

// Load all scenes from JSON
function loadScenesFromJSON() {
  fetch("/static/data/scenes.json")
    .then(res => res.json())
    .then(data => {
      scenes = data;
      sceneMap = Object.fromEntries(data.map(s => [s.id, s]));
      console.log("🌌 Loaded scenes:", scenes.length);
      resumeLastScene();
    });
}

// Show a scene by ID
function showSceneById(sceneId) {
  const scene = sceneMap[sceneId];
  if (!scene) {
    console.warn("⚠️ Scene not found:", sceneId);
    return;
  }

  currentSceneId = sceneId;
  visitedScenes.add(sceneId);
  saveSceneProgress();

  const container = document.getElementById("scene-container") || document.getElementById("nova-output");
  if (!container) return;

  container.innerHTML = `
    <div class="scene-frame fade-in">
      <img src="/static/images/${scene.image}" alt="${scene.title}" class="scene-image" />
      <div class="scene-caption-overlay">
        <h2>${scene.title}</h2>
        <p>${scene.caption}</p>
      </div>
    </div>
  `;

  // Scene-specific animation classes
  if (scene.transition) {
    container.classList.remove("fade-in", "glow", "dim", "spiral", "soft");
    container.classList.add(scene.transition);
  }
}

// Save state
function saveSceneProgress() {
  const state = {
    currentSceneId,
    visitedScenes: Array.from(visitedScenes),
    previousChoices
  };
  localStorage.setItem(SCENE_MEMORY_KEY, JSON.stringify(state));
}

// Resume from localStorage
function resumeLastScene() {
  const raw = localStorage.getItem(SCENE_MEMORY_KEY);
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    currentSceneId = saved.currentSceneId;
    visitedScenes = new Set(saved.visitedScenes || []);
    previousChoices = saved.previousChoices || {};

    if (currentSceneId) {
      showSceneById(currentSceneId);
    }
  } catch (err) {
    console.error("⚠️ Failed to resume progress:", err);
  }
}

function updateChoice(key, value) {
  previousChoices[key] = value;
  saveSceneProgress();
}

function nextScene() {
  const currentIndex = scenes.findIndex(s => s.id === currentSceneId);
  if (currentIndex >= 0 && currentIndex < scenes.length - 1) {
    showSceneById(scenes[currentIndex + 1].id);
  }
}

function resetGameProgress() {
  localStorage.removeItem(SCENE_MEMORY_KEY);
  currentSceneId = null;
  visitedScenes.clear();
  previousChoices = {};
  console.log("🧹 Game progress cleared.");
}

window.loadScenesFromJSON = loadScenesFromJSON;
window.showSceneById = showSceneById;
window.nextScene = nextScene;
window.updateChoice = updateChoice;
window.resetGameProgress = resetGameProgress;
window.resumeLastScene = resumeLastScene;

window.addEventListener("DOMContentLoaded", loadScenesFromJSON);
