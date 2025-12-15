import sys
import json
import random
import re
import spacy
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# --- 1. SETUP MODELS ---
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    model = None

try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    nlp = None

# --- 2. DATA CONSTANTS ---

QUESTION_BANK = {
    "React": [
        {"q": "What is a Component?", "o": ["Function/Class returning UI", "Database", "Server", "API"], "a": 0, "d": "basic"},
        {"q": "Which hook manages state?", "o": ["useEffect", "useState", "useContext", "useReducer"], "a": 1, "d": "basic"},
        {"q": "What is the Virtual DOM?", "o": ["Virus", "Heavy DOM", "Lightweight copy", "Browser API"], "a": 2, "d": "intermediate"},
        {"q": "Context API avoids?", "o": ["State", "Prop Drilling", "API calls", "Rendering"], "a": 1, "d": "advanced"}
    ],
    "Python": [
        {"q": "Output text to console?", "o": ["echo", "print()", "log", "write"], "a": 1, "d": "basic"},
        {"q": "Immutable data type?", "o": ["List", "Set", "Dictionary", "Tuple"], "a": 3, "d": "intermediate"}
    ]
}

TECH_SKILLS = {
    "python", "javascript", "react", "node.js", "java", "c++", "c#", "html", "css",
    "sql", "mongodb", "aws", "docker", "machine learning", "flutter", "figma"
}

# --- NEW: PROJECT TEMPLATES ---
PROJECT_TEMPLATES = {
    "react": ["Initialize Project (Vite/CRA)", "Setup React Router", "Design Component Structure", "Implement Global State (Redux/Context)", "Connect to API", "Responsive Styling"],
    "node": ["Setup Express Server", "Configure MongoDB Connection", "Design API Routes", "Implement Auth Middleware", "Create Controllers"],
    "python": ["Setup Virtual Env", "Install Dependencies", "Write Core Logic", "Unit Testing", "Optimize Performance"],
    "machine learning": ["Data Collection", "Data Cleaning (EDA)", "Feature Engineering", "Train Model", "Evaluate Metrics", "Deployment"],
    "mobile": ["Setup Environment (Expo/Flutter)", "Design Screens", "Implement Navigation", "API Integration", "Test on Device"],
    "general": ["Define Scope & MVP", "Initialize Git Repo", "Create Wireframes", "Develop Core Features", "Testing & Bug Fixes"]
}

# --- 3. FUNCTIONS ---

def generate_quiz(topic):
    questions = QUESTION_BANK.get(topic, QUESTION_BANK['React'])
    selected = random.sample(questions, min(5, len(questions)))
    return selected

def match_mentors(query, candidates):
    if not model: return []
    candidate_texts = [f"{c['fullName']} {c.get('bio', '')} {' '.join(c.get('skillsKnown', []))}" for c in candidates]
    query_vec = model.encode([query])
    cand_vecs = model.encode(candidate_texts)
    scores = cosine_similarity(query_vec, cand_vecs)[0]
    
    results = []
    for idx, score in enumerate(scores):
        if score > 0.15:
            cand = candidates[idx]
            cand['matchScore'] = round(float(score) * 100, 1)
            results.append(cand)
    results.sort(key=lambda x: x['matchScore'], reverse=True)
    return results[:10]

def parse_resume_text(text):
    if not nlp: return {"error": "SpaCy model not loaded"}
    doc = nlp(text)
    full_name = "Unknown User"
    for ent in doc.ents:
        if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
            full_name = ent.text
            break
            
    found_skills = set()
    clean_text = re.sub(r'[^\w\s]', '', text.lower())
    for token in clean_text.split():
        if token in TECH_SKILLS: found_skills.add(token.capitalize())
    if "node.js" in text.lower(): found_skills.add("Node.js")
    if "machine learning" in text.lower(): found_skills.add("Machine Learning")

    sentences = list(doc.sents)
    bio = " ".join([str(s) for s in sentences[:2]]).replace("\n", " ").strip()
    return {"fullName": full_name, "skillsKnown": list(found_skills), "bio": bio[:150] + "..." if len(bio) > 150 else bio}

# --- NEW: AI PLANNER LOGIC ---
def plan_project(description):
    desc_lower = description.lower()
    tasks = []
    
    # Keyword Matching for Templates
    if "react" in desc_lower or "frontend" in desc_lower:
        tasks.extend(PROJECT_TEMPLATES["react"])
    if "node" in desc_lower or "backend" in desc_lower or "express" in desc_lower:
        tasks.extend(PROJECT_TEMPLATES["node"])
    if "python" in desc_lower or "django" in desc_lower:
        tasks.extend(PROJECT_TEMPLATES["python"])
    if "ml" in desc_lower or "ai" in desc_lower or "data" in desc_lower:
        tasks.extend(PROJECT_TEMPLATES["machine learning"])
    if "app" in desc_lower or "mobile" in desc_lower:
        tasks.extend(PROJECT_TEMPLATES["mobile"])
        
    # Default fallback
    if not tasks:
        tasks.extend(PROJECT_TEMPLATES["general"])
    else:
        tasks.append("Final Review & Deployment")

    return list(set(tasks)) # Unique tasks

# --- 4. MAIN EXECUTION ---
if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No command provided"}))
            sys.exit(1)

        mode = sys.argv[1]

        if mode == 'quiz':
            print(json.dumps(generate_quiz(sys.argv[2])))
        elif mode == 'match':
            print(json.dumps(match_mentors(sys.argv[2], json.loads(sys.argv[3]))))
        elif mode == 'parse_resume':
            print(json.dumps(parse_resume_text(" ".join(sys.argv[2:]))))
        elif mode == 'plan_project':
            print(json.dumps(plan_project(" ".join(sys.argv[2:]))))

    except Exception as e:
        print(json.dumps({"error": str(e)}))