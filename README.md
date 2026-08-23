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
NODE_ENV=development
JWT_EXPIRES_IN=1d
AUTH_COOKIE_MAX_AGE_MS=86400000
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_SECURE=false
MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8
AI_REPORT_RATE_LIMIT_WINDOW_MS=900000
AI_REPORT_RATE_LIMIT_MAX=3
AI_REPORT_IP_RATE_LIMIT_MAX=6
AI_REPORT_DAILY_LIMIT=10
AI_PDF_RATE_LIMIT_WINDOW_MS=900000
AI_PDF_RATE_LIMIT_MAX=5
AI_PDF_IP_RATE_LIMIT_MAX=10
AI_PDF_DAILY_LIMIT=10
AI_MAX_RESUME_CHARACTERS=15000
AI_MAX_JOB_DESCRIPTION_CHARACTERS=8000
AI_MAX_SELF_DESCRIPTION_CHARACTERS=4000
GEMINI_MAX_CONCURRENT=2
GEMINI_MAX_QUEUED=8
PUPPETEER_MAX_CONCURRENT=1
PUPPETEER_MAX_QUEUED=4
PUPPETEER_TIMEOUT_MS=30000
```

For production, serve the frontend and API from the same site where possible, set `NODE_ENV=production`, use HTTPS, and set `AUTH_COOKIE_SECURE=true`. If the frontend must be hosted on a different site, set `AUTH_COOKIE_SAME_SITE=none` together with `AUTH_COOKIE_SECURE=true`. Set `TRUST_PROXY=true` when HTTPS is terminated by a reverse proxy. The frontend can use `VITE_API_BASE_URL` to point at a deployed API; it defaults to `http://localhost:3000` during local development.

AI safeguards are enforced per authenticated user and IP address: report generation defaults to 3 requests per user (6 per IP) every 15 minutes and 10 per day; resume PDF requests default to 5 per user (10 per IP) every 15 minutes and 10 fresh generations per day. Cached PDFs do not consume daily PDF credits. Limits, prompt sizes, queue depth, and Puppeteer timeout can be adjusted through the variables above. For multi-instance production deployments, use a shared rate-limit store (such as Redis) in front of the API so short-window limits are global across instances.

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
