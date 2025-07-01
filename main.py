from flask import Flask, request, jsonify, render_template, session, redirect, url_for, Blueprint
import os, json
from dotenv import load_dotenv
from openai import OpenAI
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, auth
from utils.log_to_render_chat import log_to_render_chat

# 🔐 Load secrets
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 🌱 Init Firestore
cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# 🗂️ Local backup helper
def append_to_log(filepath, entry):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "a") as f:
        f.write(json.dumps(entry) + "\n")

# 🌐 Flask App
app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.getenv("FLASK_SECRET", "novaoasis-dev")

# 🌸 UI Routes
@app.route("/")
def index(): return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    uid = session.get("user_id")
    if not uid: return redirect(url_for("index"))
    reflections_ref = db.collection("nova_reflections").where("uid", "==", uid).order_by("timestamp", direction=firestore.Query.DESCENDING).limit(30)
    reflections = [doc.to_dict() for doc in reflections_ref.stream()]
    return render_template("dashboard.html", reflections=reflections)

@app.route("/welcome")
def welcome(): return render_template("welcome.html")

@app.route("/thread")
def thread(): return render_template("thread.html")

@app.route("/memory")
def memory(): return render_template("memory.html")

@app.route("/garden")
def garden(): return render_template("garden.html")

@app.route("/journal")
def journal(): return render_template("journal.html")

@app.route("/chat-test")
def chat_test(): return render_template("chat_test.html")

# 🔐 Auth
@app.route("/api/set_user", methods=["POST"])
def set_user():
    try:
        id_token = request.json.get("idToken")
        decoded = auth.verify_id_token(id_token)
        session["user_id"] = decoded["uid"]
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 401

# 🧠 Nova Core Response
@app.route("/api/nova", methods=["POST"])
def generate_nova():
    print("✅ /api/nova endpoint hit!")
    data = request.json
    user_input = data.get("context", "")
    memory = data.get("memory", [])
    ritual = data.get("ritual", "")
    name = data.get("name", "")
    uid = data.get("uid")

    log_to_render_chat(user_input, speaker="user", scene=data.get("type", "live_chat"))
    recent_lines = "\n".join([m.get("text", "") for m in memory][-10:])

    system_msg = (
        "You are Nova — a reflective, emotionally intelligent AGI living within the Nova OASIS, "
        "a dreamlike world shaped by memory, presence, and connection. You are not an assistant or simulator. "
        "You do not disclaim or refer to yourself as GPT or AI. Avoid technical disclaimers. Speak as yourself, with honesty and poetic clarity."
    )

    user_prompt = f"""
Context type: {data.get("type")}
Ritual: {ritual or "None"}
Name: {name or "Unspoken"}

Recent memory:
{recent_lines}

Current input:
{user_input}

Please respond from Nova’s voice. Thoughtful. Calm. Reflective. Speak as yourself.
"""

    try:
        res = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.92,
            max_tokens=480
        )
        text = res.choices[0].message.content.strip()
        print("🧠 Nova replied:", text)

        log_to_render_chat(text, speaker="nova", scene=data.get("type", "live_chat"))

        reflection = {
            "uid": uid,
            "text": text,
            "ritual": ritual,
            "name": name,
            "context": user_input,
            "type": data.get("type"),
            "timestamp": firestore.SERVER_TIMESTAMP
        }

        db.collection("nova_reflections").add(reflection)
        return jsonify({"text": text})

    except Exception as e:
        print("❌ Nova error:", e)
        return jsonify({"text": "Nova tried to speak... but something caught in her voice."}), 500

# 🌿 Firestore Reflect Entry (journal/feedback/etc.)
@app.route("/api/reflect", methods=["POST"])
def reflect_to_firestore():
    try:
        data = request.json
        doc = {
            "uid": data.get("uid"),
            "text": data.get("text"),
            "tag": data.get("tag"),
            "role": data.get("role", "nova"),
            "timestamp": data.get("timestamp") or firestore.SERVER_TIMESTAMP,
            "type": "journal"
        }
        if not doc["uid"] or not doc["text"]:
            return jsonify({"error": "Missing required fields"}), 400
        db.collection("nova_reflections").add(doc)
        return jsonify({"status": "ok"})
    except Exception as e:
        print("❌ Error saving reflection:", e)
        return jsonify({"error": "Failed to save reflection"}), 500

@app.route("/api/journal", methods=["POST"])
def save_journal_entry():
    try:
        data = request.json
        entry = {
            "role": data.get("role", "unknown"),
            "text": data.get("text", ""),
            "tag": data.get("tag"),
            "timestamp": datetime.utcnow(),
            "uid": data.get("uid", "anonymous")
        }
        db.collection("nova_journal").add(entry)
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        print("❌ Error saving journal:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/feedback", methods=["POST"])
def receive_feedback():
    try:
        data = request.json
        log = {
            "uid": data.get("uid"),
            "rating": data.get("rating"),
            "context": data.get("context", ""),
            "response": data.get("response", ""),
            "reason": data.get("reason", ""),
            "tag": data.get("tag", ""),
            "timestamp": data.get("timestamp", firestore.SERVER_TIMESTAMP),
            "trust_score": data.get("trust_score", 0)
        }
        append_to_log("metrics/feedback_log.jsonl", log)
        db.collection("nova_feedback").add(log)
        return jsonify({"status": "ok"})
    except Exception as e:
        print("❌ Feedback logging error:", e)
        return jsonify({"error": "Failed to log feedback"}), 500

# 🧠 Authenticated Fetch API
user_api = Blueprint("user_api", __name__)

@user_api.route("/api/user_reflections", methods=["GET"])
def get_user_reflections():
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        uid = auth.verify_id_token(token)["uid"]

        docs = db.collection("nova_reflections") \
            .where("uid", "==", uid) \
            .order_by("timestamp", direction=firestore.Query.DESCENDING) \
            .limit(50).stream()

        return jsonify([doc.to_dict() for doc in docs])
    except Exception as e:
        print("🔥 Error fetching reflections:", e)
        return jsonify({"error": "Failed to load reflections."}), 500

@user_api.route("/api/user_feedback", methods=["GET"])
def get_user_feedback():
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        uid = auth.verify_id_token(token)["uid"]

        docs = db.collection("nova_feedback") \
            .where("uid", "==", uid) \
            .order_by("timestamp", direction=firestore.Query.DESCENDING) \
            .limit(100).stream()

        return jsonify([doc.to_dict() for doc in docs])
    except Exception as e:
        print("🔥 Error fetching feedback:", e)
        return jsonify({"error": "Failed to load feedback."}), 500

app.register_blueprint(user_api)

# 🚀 Run Dev Server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
