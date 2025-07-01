# utils/log_to_render_chat.py

import os
import json
from datetime import datetime

CHAT_LOG_PATH = "memory/chat_log_render.jsonl"
os.makedirs("memory", exist_ok=True)

def log_to_render_chat(text, speaker="unknown", scene="unspecified"):
    entry = {
        "timestamp": datetime.now().isoformat(),
        "speaker": speaker,
        "scene": scene,
        "text": text.strip()
    }
    with open(CHAT_LOG_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")
    return entry  # Optional, in case you want to echo it
