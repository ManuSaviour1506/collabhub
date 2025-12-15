import random
import joblib

difficulty_model = joblib.load("models/quiz_difficulty_model.pkl")

def generate_ml_quiz(questions):
    """
    questions → list of MCQs from MongoDB (same skill)
    """

    # STEP 1: ML predicts difficulty
    for q in questions:
        q["difficulty"] = difficulty_model.predict([q["question"]])[0]

    # STEP 2: Group by difficulty
    basic = [q for q in questions if q["difficulty"] == "basic"]
    intermediate = [q for q in questions if q["difficulty"] == "intermediate"]
    advanced = [q for q in questions if q["difficulty"] == "advanced"]

    # STEP 3: Random selection (ML-guided)
    quiz = []
    quiz += random.sample(basic, min(1, len(basic)))
    quiz += random.sample(intermediate, min(2, len(intermediate)))
    quiz += random.sample(advanced, min(2, len(advanced)))

    # STEP 4: Shuffle final quiz
    random.shuffle(quiz)

    # STEP 5: Remove correct answers before sending
    for q in quiz:
        q.pop("correctAnswer", None)

    return quiz
