from flask import Flask, request, jsonify
import joblib
import pdfplumber
import os
import tempfile

# Import project guides
from templates.project_guides import PROJECT_GUIDES


app = Flask(__name__)

# -------------------------------
# Load ML Models (ONCE at startup)
# -------------------------------

# AI Planner model
planner_model = joblib.load("models/ai_planner_model.pkl")

# Resume Parser model
from engines.resume_engine import parse_resume


# =====================================================
# 1️⃣ AI PROJECT PLANNER API
# =====================================================
@app.route("/ai-plan", methods=["POST"])
def ai_plan():
    data = request.json

    if not data or "task" not in data:
        return jsonify({"error": "Task description is required"}), 400

    user_task = data["task"]

    # ML prediction
    category = planner_model.predict([user_task])[0]

    guide = PROJECT_GUIDES.get(category)

    if not guide:
        return jsonify({"error": "No guide available for this task"}), 404

    return jsonify({
        "detectedCategory": category,
        "projectTitle": guide["title"],
        "overview": guide["overview"],
        "stepByStepGuide": guide["steps"],
        "skillsRequired": guide["skills"],
        "toolsRequired": guide["tools"]
    })


# =====================================================
# 2️⃣ RESUME PDF PARSER API
# =====================================================
@app.route("/parse-resume", methods=["POST"])
def parse_resume_api():
    if "resume" not in request.files:
        return jsonify({"error": "No resume uploaded"}), 400

    file = request.files["resume"]

    if not file.filename.endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        file.save(tmp.name)
        pdf_path = tmp.name

    # Extract text from PDF
    extracted_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
    finally:
        os.remove(pdf_path)

    if not extracted_text.strip():
        return jsonify({"error": "Unable to extract text from PDF"}), 400

    # Parse resume using ML/NLP model
    parsed_data = parse_resume(extracted_text)

    return jsonify(parsed_data)


# =====================================================
# MAIN
# =====================================================
if __name__ == "__main__":
    app.run(port=5008, debug=True)
