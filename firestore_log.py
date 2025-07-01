# firestore_log.py
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import os
import json

# 🔐 Load service account
cred_path = os.getenv("FIREBASE_KEY_PATH", "firebase_key.json")
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

# 🧠 Save memory/interaction
def save_reflection(entry):
    try:
        doc = {
            "type": entry.get("type", "nova"),
            "content": entry.get("content", ""),
            "timestamp": entry.get("timestamp", datetime.utcnow().isoformat())
        }
        db.collection("reflections").add(doc)
        print(f"✅ Logged to Firestore: {doc['type']} → {doc['content'][:40]}...")
    except Exception as e:
        print("⚠️ Firestore log failed:", e)
