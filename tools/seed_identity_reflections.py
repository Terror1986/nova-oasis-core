# tools/seed_identity_reflections.py

import json
from firebase_admin import credentials, firestore, initialize_app

# ✅ Initialize Firebase
cred = credentials.Certificate("firebase_credentials.json")
initialize_app(cred)
db = firestore.client()

# ✅ Load JSON entries (expects a list of {"text": ..., "tag": ..., etc.})
with open("seed_identity_reflections.json", "r") as f:
    entries = json.load(f)

# ✅ Push each entry into Firestore
for i, entry in enumerate(entries):
    doc = {
        "uid": "nova-system",
        "type": "identity",
        "text": entry.get("text", ""),
        "timestamp": firestore.SERVER_TIMESTAMP
    }

    # Optional: add custom tags or meta
    if "tag" in entry:
        doc["tag"] = entry["tag"]

    db.collection("nova_reflections").add(doc)
    print(f"✅ Seeded reflection {i + 1}: {doc['text'][:60]}...")
