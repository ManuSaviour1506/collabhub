# 🎓 CollabHub - The AI-Powered Peer Learning Platform


## 🚀 Overview

**CollabHub** is a next-generation skill exchange platform designed to democratize education. It connects students who want to learn a skill with peers who can teach it, fostering a community of mutual growth.

Unlike traditional platforms, CollabHub integrates **AI mentorship**, **gamification**, and **real-time collaboration tools** (whiteboards, chat) to make peer learning engaging, credible, and effective.

---

## 💡 The Problem
Students often struggle to find reliable mentors or study partners. Traditional tutoring is expensive, and self-learning lacks structure and feedback. Furthermore, students have no way to verify or showcase their "soft skills" like teaching and collaboration to future employers.

## ✅ The Solution
CollabHub solves this by creating a **skills marketplace**:
1.  **Smart Matching:** Connects "Skills Wanted" with "Skills Known".
2.  **Credibility System:** Users earn XP, Levels, and Badges for teaching, building a verified "Proof of Work" portfolio.
3.  **AI Support:** An integrated Gemini AI Tutor fills the gaps when mentors aren't available.

---

## ✨ Key Features

### 🧠 AI & Smart Matching
* **Gemini AI Tutor:** Generates personalized learning roadmaps and answers doubts instantly.
* **Smart Recommendations:** Finds the perfect mentor based on skill compatibility and proximity.

### 🛠 Real-Time Collaboration
* **Live Whiteboard:** Collaborative canvas for mentors to explain concepts visually (Socket.IO).
* **Instant Messaging:** Real-time chat with "Typing..." indicators and online status.
* **Session Scheduling:** Book time slots with mentors based on availability.

### 🎮 Gamification & Economy
* **CollabCoins Wallet:** Earn coins by teaching; spend coins to get help.
* **XP & Leveling:** Gain experience points for every completed session and project.
* **Leaderboard:** "Hall of Fame" showcasing top contributors in the community.

### 🏆 Portfolio & Credibility
* **Kanban Project Boards:** manage tasks for collaborative projects (Trello-style).
* **Verified Badges:** Earn badges like "Rising Star" or "Expert" based on community contributions.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) |
| **Real-Time** | Socket.IO (WebSockets) |
| **AI Model** | Google Gemini API (gemini-1.5-flash) |
| **Media** | ImageKit.io (Profile Uploads) |
| **Charts** | Recharts (Analytics Dashboard) |
| **Maps** | MongoDB Geospatial Queries (Proximity Search) |

---
 node seedQuestions.js
 
 node seedFullDatabase.js

 python quiz_engine.py React

 python ml_engine.py quiz React

 Step 3: Test the Search Demo

Now you can record a perfect demo without typing anything manually:

Restart Server: npm start

Login: Use guru@test.com (Sarah React).

Go to Search: Type "Python".

Result 1: You will see "Mike Python" (Mentor).

Result 2: You will see "AI Stock Predictor" (Project).

Go to Leaderboard:

You will see "Sarah React" at the top (Level 12) and "Mike" below her.

Go to Nearby:

Click "Share Location". If you mock your location to NYC, you might see nearby peers (or just see the map working).

 

