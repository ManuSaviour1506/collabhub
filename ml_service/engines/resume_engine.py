import spacy
import re

# Load spaCy once
nlp = spacy.load("en_core_web_sm")

TECH_SKILLS = {
    "python", "java", "javascript", "react", "node", "express",
    "mongodb", "sql", "html", "css", "docker", "aws",
    "machine learning", "deep learning", "data science",
    "flask", "django", "git"
}

def parse_resume(text):
    doc = nlp(text)

    # 1️⃣ Full Name
    full_name = "Unknown"
    for ent in doc.ents:
        if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
            full_name = ent.text
            break

    # 2️⃣ Skills
    clean_text = re.sub(r"[^\w\s]", " ", text.lower())
    found_skills = {skill.title() for skill in TECH_SKILLS if skill in clean_text}

    # 3️⃣ Bio
    sentences = list(doc.sents)
    bio = " ".join([s.text for s in sentences[:2]])

    return {
        "fullName": full_name,
        "skills": list(found_skills),
        "bio": bio[:200]
    }
 