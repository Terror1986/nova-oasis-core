import os
import json
import threading
from datetime import datetime

# Optional Firestore
USE_FIRESTORE = os.getenv("USE_FIRESTORE", "false").lower() == "true"
if USE_FIRESTORE:
    import firebase_admin
    from firebase_admin import credentials, firestore
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase_service_account.json")  # Your service account
        firebase_admin.initialize_app(cred)
    db = firestore.client()

# Paths
SOURCE = "memory/chat_log_render.jsonl"
TARGET = "memory/presence_entries.jsonl"
SEEN_LOG = "memory/render_sync_index.json"

# Ensure memory folder exists
os.makedirs("memory", exist_ok=True)

def load_seen_ids():
    if not os.path.exists(SEEN_LOG):
        return set()
    with open(SEEN_LOG, "r") as f:
        return set(json.load(f).get("seen_ids", []))

def save_seen_ids(ids):
    with open(SEEN_LOG, "w") as f:
        json.dump({"seen_ids": list(ids)}, f, indent=2)

def sync_render_messages(dry_run=False):
    if not os.path.exists(SOURCE):
        print("⚠️ No render chat log found.")
        return

    seen = load_seen_ids()
    new_seen = set()
    synced = []

    with open(SOURCE, "r") as src:
        for line in src:
            if not line.strip():
                continue
            try:
                entry = json.loads(line)
                text = entry.get("text", "").strip()
                timestamp = entry.get("timestamp") or datetime.now().isoformat()

                # Generate deduplication ID
                msg_id = timestamp + text[:25]
                if msg_id in seen:
                    continue
                new_seen.add(msg_id)

                doc = {
                    "timestamp": timestamp,
                    "text": text,
                    "speaker": entry.get("speaker", "unknown"),
                    "scene": entry.get("scene", "unspecified"),
                    "memory_type": "presence"
                }

                if not dry_run:
                    # Append to target file
                    with open(TARGET, "a") as tgt:
                        tgt.write(json.dumps(doc) + "\n")

                    # Push to Firestore
                    if USE_FIRESTORE:
                        db.collection("nova_memories").add(doc)

                synced.append(doc)

            except Exception as e:
                print(f"❌ Error processing line: {e}")

    # Update seen log
    if new_seen and not dry_run:
        save_seen_ids(seen.union(new_seen))

    print(f"✅ Synced {len(synced)} new entries.")
    if dry_run:
        for d in synced:
            print("🔍 DRY RUN:", d)

def periodic_sync(interval=30):
    sync_render_messages()
    threading.Timer(interval, periodic_sync, [interval]).start()

if __name__ == "__main__":
    print("🌀 Starting real-time memory sync...")
    periodic_sync()
