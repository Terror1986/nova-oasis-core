import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

cred = credentials.Certificate("firebase_key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

doc_ref = db.collection("reflections").add({
    "speaker": "nova",
    "text": "Testing from Replit!",
    "timestamp": datetime.utcnow().isoformat()
})

print("✅ Firestore write succeeded.")
