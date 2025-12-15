import os
import random
import json
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# 1. Load Environment Variables (to get MONGO_URI)
load_dotenv('./server/.env') 

# 2. Connect to MongoDB
MONGO_URI = os.getenv('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client.get_database() # Connects to the default DB in the URI
questions_collection = db['questions']

def generate_stratified_quiz(skill):
    """
    Generates a 5-question quiz using Stratified Random Sampling:
    - 2 Basic
    - 2 Intermediate
    - 1 Advanced
    """
    
    # Define the Stratification Curve
    strata = [
        {'difficulty': 'basic', 'sample_size': 2},
        {'difficulty': 'intermediate', 'sample_size': 2},
        {'difficulty': 'advanced', 'sample_size': 1}
    ]

    final_quiz = []

    for stratum in strata:
        # MongoDB Aggregation Pipeline for Random Sampling
        pipeline = [
            # Filter by Skill and Difficulty
            {
                '$match': {
                    'skill': {'$regex': f'^{skill}$', '$options': 'i'},
                    'difficulty': stratum['difficulty']
                }
            },
            # Randomly select N documents
            {'$sample': {'size': stratum['sample_size']}},
            # Clean up output (remove _id, make it JSON serializable)
            {
                '$project': {
                    '_id': 0,
                    'question': 1,
                    'options': 1,
                    'correctAnswer': 1,
                    'difficulty': 1
                }
            }
        ]

        # Execute Query
        questions = list(questions_collection.aggregate(pipeline))
        
        # Fallback Logic: If we asked for 2 but DB only had 1, try to fill from other levels
        # (For this simple version, we just append what we found)
        final_quiz.extend(questions)

    # Shuffle the final 5 questions so the difficulty isn't strictly linear visually
    # (Optional: remove this if you want strict Basic -> Adv order)
    # random.shuffle(final_quiz)

    return final_quiz

if __name__ == "__main__":
    # Get the skill from command line arguments
    if len(sys.argv) > 1:
        target_skill = sys.argv[1]
        quiz_data = generate_stratified_quiz(target_skill)
        
        # Check if we successfully generated questions
        if len(quiz_data) > 0:
            print(json.dumps(quiz_data)) # Output JSON to stdout
        else:
            # Output an error JSON if no questions found
            print(json.dumps([{
                "question": f"No questions found for {target_skill}. Please seed the database.",
                "options": ["OK", "Cancel", "Retry", "Exit"],
                "correctAnswer": 0
            }]))
    else:
        print(json.dumps({"error": "No skill provided"}))