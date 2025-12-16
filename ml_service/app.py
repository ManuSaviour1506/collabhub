from flask import Flask, request, jsonify
import joblib
import pdfplumber
import os
import tempfile
# Used for Flask logging when using run()
import sys 

# Import project guides
from templates.project_guides import PROJECT_GUIDES 

# Import the parse_resume function 
from engines.resume_engine import parse_resume 


app = Flask(__name__)

# -------------------------------
# Load ML Models (ONCE at startup)
# -------------------------------

# AI Planner model
planner_model = joblib.load("models/ai_planner_model.pkl") 


# =====================================================
# 1️⃣ AI PROJECT PLANNER API
# =====================================================
@app.route("/ai-plan", methods=["POST"])
def ai_plan():
    """Predicts a project category and returns a structured guide."""
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
# 2️⃣ RESUME FILE PARSER API (Original Upload - kept for flexibility)
# =====================================================
@app.route("/parse-resume", methods=["POST"])
def parse_resume_api():
    """Handles PDF file upload, extracts text, and returns parsed data."""
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

    # Returns: {"fullName", "skills", "bio"}
    return jsonify(parsed_data)


# =====================================================
# 3️⃣ RESUME TEXT PARSER API (Called by Node.js for Resume)
# =====================================================
@app.route("/parse-resume-text", methods=["POST"])
def parse_resume_text_api():
    """Handles raw text from Node.js after PDF parsing."""
    data = request.json
    if not data or "text" not in data:
        return jsonify({"error": "Text is required for parsing"}), 400

    extracted_text = data["text"]

    if not extracted_text.strip():
        return jsonify({"error": "No text provided for parsing"}), 400

    # Parse resume using ML/NLP model
    parsed_data = parse_resume(extracted_text)

    # Returns: {"fullName", "skills", "bio"}
    return jsonify(parsed_data)


# =====================================================
# 4️⃣ AI RECOMMENDATION MATCHING API (Called by Node.js for Recommendations)
# =====================================================
@app.route("/ai-match", methods=["POST"])
def ai_match():
    """Handles the user's project/skill prompt for matching."""
    data = request.json

    # Node.js sends the query as 'prompt'
    if not data or "prompt" not in data:
        return jsonify({"error": "Search prompt (prompt) is required"}), 400

    user_prompt = data["prompt"]
    
    # NOTE: In a complete application, this would run an ML model to find 
    # the best matches based on the user's prompt (text).

    # Minimal placeholder response required by Node.js to prevent crashing
    # Node.js expects { matchedUserIds: [] }
    return jsonify({
        "matchedUserIds": [],
        "category": "Placeholder Match for: " + user_prompt,
    })


# =====================================================
# MAIN
# =====================================================
if __name__ == "__main__":
    # Ensure logs are visible immediately
    app.run(port=5008, debug=True)