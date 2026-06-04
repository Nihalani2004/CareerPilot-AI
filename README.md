# CareerPilot AI ✈️💼

CareerPilot AI is an advanced, AI-powered interview preparation agent and ATS-optimized resume tailor. By analyzing a target job description alongside a candidate's resume or self-description, it generates a comprehensive preparation report and a customized resume.

## 🌟 Key Features

* **ATS Resume Tailoring & PDF Export:** Rewrites and aligns candidate resume points to emphasize relevant skills and action verbs matching the target job description. The tailored resume is rendered into a clean, print-ready, ATS-compliant PDF via a headless browser (`puppeteer`) and cached for fast download.
* **Intelligent Profile Alignment:** Analyzes resume content and job descriptions using Gemini 2.5 Flash to compute an accurate **Match Score** and identify critical **Skill Gaps** categorized by severity.
* **Custom Interview Question Generation:** Produces custom technical and behavioral interview questions tailored to the candidate's gaps and target role. Each question includes:
  * **Interviewer Intention:** The rationale behind asking the question.
  * **Suggested Model Answer:** A step-by-step approach to answer effectively.
* **Step-by-Step Preparation Roadmap:** Provides a personalized, day-by-day study and action plan to guide the candidate's preparation leading up to their interview.
* **Secure Authentication:** Features full signup/login workflows using JWT cookies and bcrypt password encryption, with server-side token blacklisting for secure logouts.

---

## 🛠️ Technology Stack

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (using Mongoose ODM)
* **AI Integration:** Google GenAI SDK (`@google/genai`)
* **PDF Rendering:** Puppeteer (headless Chrome)
* **Parser:** PDF-Parse (for processing uploaded resumes)
* **Validation:** Zod (for structured JSON schemas)
* **Auth:** JSON Web Tokens (JWT), Cookies, and Bcryptjs

### Frontend
* **Core:** React (Vite setup)
* **Styling:** Custom SCSS
* **Routing:** React Router DOM
* **State Management:** React Context API

---

## 🚀 Getting Started

Follow these steps to run the application locally on your machine.

### Prerequisites
* [Node.js](https://nodejs.org/) installed (v18+ recommended)
* A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or a local MongoDB database instance
* A [Google Gemini API Key](https://ai.google.dev/)

### Setup Instructions

#### 1. Clone the Repository
```bash
git clone https://github.com/Nihalani2004/CareerPilot-AI.git
cd CareerPilot-AI
```

#### 2. Configure Backend `.env`
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_GENAI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

#### 3. Install Dependencies & Run

**Start the Backend Server:**
```bash
cd backend
npm install
npm run dev
```

**Start the Frontend App:**
Open a new terminal session, then:
```bash
cd frontend
npm install
npm run dev
```

The frontend application should now be running at `http://localhost:5173`.
