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

// 🌱 Bind user to Flask session with graceful fallback
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

  // 🪪 On auth state change (refresh or restore)
  onAuthStateChanged(auth, (user) => {
    const isAnonymous = user?.isAnonymous || false;
    const uid = user?.uid || null;
    const guestAllowed = localStorage.getItem("novaUID") === "guest";

    if (uid && (!isAnonymous || guestAllowed)) {
      console.log(`👤 [Nova OASIS] Active session ${isAnonymous ? "(guest)" : ""}: ${uid}`);
      window.userUID = uid;
      localStorage.setItem("novaUID", uid);
      oasis?.classList.remove("hidden");
      loginBox?.classList.add("hidden");
    } else {
      if (isAnonymous && !guestAllowed) {
        console.log("⚠️ [Nova OASIS] Disallowed anonymous session — logging out");
        signOut(auth).then(() => {
          localStorage.removeItem("novaUID");
          window.userUID = null;
          oasis?.classList.add("hidden");
          loginBox?.classList.remove("hidden");
        });
      } else {
        console.log("🕓 [Nova OASIS] No session — showing login screen");
        localStorage.removeItem("novaUID");
        window.userUID = null;
        oasis?.classList.add("hidden");
        loginBox?.classList.remove("hidden");
      }
    }
  });

  // 🔐 Google Sign-In
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

  // 🕊 Anonymous Guest Sign-In
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
