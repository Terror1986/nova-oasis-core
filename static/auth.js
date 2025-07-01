import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔐 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBD3Yq0YgjLDQFfycdQg_6TnSOMBRUsv54",
  authDomain: "novaoasis-5cd43.firebaseapp.com",
  projectId: "novaoasis-5cd43",
  appId: "1:116910631082684511268:web:xxxxxx"
};

// 🔌 Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 🌐 Global UID access for Nova
window.getNovaUID = () => window.userUID || localStorage.getItem("novaUID");

// 🌱 Bind user to Flask session (used by /api/reflect)
async function bindUserSession(user) {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/set_user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });

    if (!res.ok) throw new Error("Non-200 response");
    console.log("✅ [Nova OASIS] Backend session bound for UID:", user.uid);
    return user.uid;
  } catch (err) {
    const fallbackUID = `${user.uid || "unknown"}-unverified`;
    console.warn("⚠️ [Nova OASIS] Backend binding failed. Using fallback UID:", fallbackUID);
    return fallbackUID;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const signupBtn = document.getElementById("signup-button");
  const anonBtn = document.getElementById("continue-anon");
  const logoutBtn = document.getElementById("logout-button");
  const loginBox = document.getElementById("login-box");
  const oasis = document.getElementById("main-oasis");

  // ✅ Let guests in without auth
  oasis?.classList.remove("hidden");
  loginBox?.classList.remove("hidden");
  localStorage.setItem("novaUID", "guest");
  window.userUID = "guest";
  console.log("👥 [Nova OASIS] Guest session started");

  // 🔄 Auth state changes (if logged in manually)
  onAuthStateChanged(auth, (user) => {
    if (user?.uid) {
      console.log(`👤 [Nova OASIS] Authenticated session: ${user.uid}`);
      window.userUID = user.uid;
      localStorage.setItem("novaUID", user.uid);
      oasis?.classList.remove("hidden");
      loginBox?.classList.add("hidden");
    }
  });

  // 🔐 Google Login
  signupBtn?.addEventListener("click", () => {
    signInWithPopup(auth, provider)
      .then(async (result) => {
        const boundUID = await bindUserSession(result.user);
        localStorage.setItem("novaUID", boundUID);
        window.userUID = boundUID;
        location.reload();
      })
      .catch(err => {
        console.error("❌ [Nova OASIS] Google login failed:", err.message);
      });
  });

  // 🕊 Guest Login
  anonBtn?.addEventListener("click", () => {
    signInAnonymously(auth)
      .then(async (result) => {
        const boundUID = await bindUserSession(result.user);
        localStorage.setItem("novaUID", boundUID);
        window.userUID = boundUID;
        location.reload();
      })
      .catch(err => {
        console.error("❌ [Nova OASIS] Guest login failed:", err.message);
      });
  });

  // 🚪 Logout
  logoutBtn?.addEventListener("click", () => {
    signOut(auth).then(() => {
      console.log("🔓 [Nova OASIS] Logged out");
      localStorage.removeItem("novaUID");
      window.userUID = null;
      location.reload();
    });
  });
});
