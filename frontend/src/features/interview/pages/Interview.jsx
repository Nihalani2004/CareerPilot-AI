import React, { useState, useEffect } from "react";
import "../style/Interview.scss";
import { useInterview } from "../hooks/useInterview.js";
import { useNavigate, useParams } from "react-router";

/* ── Mock data (will be replaced by hook/state/API layers) ── */
// const mockData = {
//     matchScore: 95,
//     technicalQuestions: [
//         {
//             question: "Explain the difference between Virtual DOM and Real DOM in React.js, and why it's beneficial.",
//             intention: "To assess the candidate's understanding of React internals and performance optimization techniques.",
//             answer: "Explain that the Virtual DOM is a lightweight copy of the Real DOM. When state changes, React updates the Virtual DOM first, performs 'diffing' to identify changes, and then updates only the necessary parts of the Real DOM (reconciliation). This minimizes expensive DOM operations.",
//         },
//         {
//             question: "How do you handle authentication and authorization in your MERN stack applications? Mention JWT specifically.",
//             intention: "To evaluate security knowledge and practical experience with REST API protection as mentioned in the AI Resume Builder project.",
//             answer: "Describe the flow: User logs in, server validates credentials and issues a JSON Web Token (JWT). The token is stored on the client side (Local Storage or Cookies) and sent in the 'Authorization' header for subsequent requests. On the server, middleware verifies the token before granting access to protected routes.",
//         },
//         {
//             question: "Can you explain the Middleware pattern in Express.js and how you used it in your projects?",
//             intention: "To check backend architectural knowledge and understanding of request-response cycles.",
//             answer: "Define middleware as functions that have access to the request object, response object, and the next middleware function. Mention use cases like logging (Morgan), body parsing (express.json), authentication checks, and error handling.",
//         },
//         {
//             question: "Describe the implementation of the Razorpay integration in your ImagiFy project. How do you ensure the payment is verified securely?",
//             intention: "To understand the candidate's ability to integrate third-party services and handle critical transactions.",
//             answer: "Explain the frontend-backend-provider flow: Create an order on the backend, trigger the payment UI on the frontend, and most importantly, use a Webhook or secret-key signature verification on the backend after payment to prevent fraud.",
//         },
//         {
//             question: "Given an array of strings, how would you group anagrams together? What is the time complexity of your approach?",
//             intention: "To test Data Structures and Algorithms proficiency, specifically hash maps and string manipulation.",
//             answer: "Use a Hash Map where the key is the sorted version of the string and the value is a list of original strings. Iterate through the array once. Time complexity: O(N * K log K) where N is the number of strings and K is the max length of a string.",
//         },
//     ],
//     behavioralQuestions: [
//         {
//             question: "Tell me about a challenging technical hurdle you faced during a hackathon and how you overcame it.",
//             intention: "To assess problem-solving skills, pressure management, and persistence.",
//             answer: "Use the STAR method (Situation, Task, Action, Result). Focus on a specific bug or integration issue, the steps taken to debug it (reading documentation, using Postman), and the successful outcome.",
//         },
//         {
//             question: "How do you prioritize tasks when working on multiple features for a project like the AI Resume Builder?",
//             intention: "To evaluate time management and understanding of core vs. peripheral features.",
//             answer: "Discuss identifying the 'Minimum Viable Product' (MVP) features first. Explain using tools like Trello or Git issues to track progress and focusing on high-impact tasks (like core API logic) before UI polish.",
//         },
//     ],
//     skillGaps: [
//         { skill: "Unit and Integration Testing (e.g., Jest, Mocha)", severity: "medium" },
//         { skill: "Cloud Deployment & DevOps (e.g., AWS, Docker, CI/CD)", severity: "low" },
//         { skill: "State Management Libraries (e.g., Redux/Zustand)", severity: "medium" },
//     ],
//     preparationPlan: [
//         {
//             day: 1,
//             focus: "Advanced JavaScript & React Fundamentals",
//             tasks: [
//                 "Review ES6+ features: Closures, Hoisting, Promises, and Async/Await",
//                 "Deep dive into React Hooks (useState, useEffect, useMemo, useCallback)",
//                 "Practice building a small component using Context API",
//             ],
//         },
//         {
//             day: 2,
//             focus: "Node.js, Express, and Database Schema Design",
//             tasks: [
//                 "Review Express middleware and error handling",
//                 "Practice MongoDB aggregation pipelines and Mongoose schema validation",
//                 "Explain the difference between SQL (MySQL) and NoSQL (MongoDB) use cases",
//             ],
//         },
//         {
//             day: 3,
//             focus: "REST API Security and Third-party Integrations",
//             tasks: [
//                 "Implement a sample JWT authentication flow",
//                 "Review Razorpay documentation and webhook verification logic",
//                 "Study HTTP status codes and REST best practices",
//             ],
//         },
//         {
//             day: 4,
//             focus: "Data Structures, Algorithms & Logic",
//             tasks: [
//                 "Solve Medium-level LeetCode problems on Arrays, Strings, and Hash Maps",
//                 "Review Linked Lists and Tree traversal basics",
//                 "Practice Big O analysis for all solutions",
//             ],
//         },
//         {
//             day: 5,
//             focus: "Project Deep-Dive and Behavioral Mock",
//             tasks: [
//                 "Walk through AI Resume Builder code; be ready to explain every line",
//                 "Prepare STAR-format answers for hackathon and internship experiences",
//                 "Do a mock interview focusing on 'Why this company' and 'Technical strengths'",
//             ],
//         },
//     ],
// };

/* ── Navigation Items with inline SVG icons ── */
const NAV_ITEMS = [
    {
        id: "technical",
        label: "Technical Questions",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        )
    },
    {
        id: "behavioral",
        label: "Behavioral Questions",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        )
    },
    {
        id: "roadmap",
        label: "Road Map",
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" y1="3" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
        )
    },
];

/* ── Severity config ── */
const SEVERITY = {
    high: { label: "High", color: "#f43f5e" },
    medium: { label: "Medium", color: "#f59e0b" },
    low: { label: "Low", color: "#10b981" },
};

/* ── Chevron ── */
const Chevron = ({ open }) => (
    <svg className={`iv-chevron ${open ? "iv-chevron--up" : ""}`} width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/* ═══════════════════════════════════════════
   Accordion Card — Questions
   ═══════════════════════════════════════════ */
const QuestionCard = ({ idx, question, intention, answer, open, toggle }) => (
    <div className={`iv-card ${open ? "iv-card--open" : ""}`}>
        <button className="iv-card__head" onClick={toggle}>
            <span className="iv-card__badge">Q{idx + 1}</span>
            <span className="iv-card__q">{question}</span>
            <Chevron open={open} />
        </button>
        {open && (
            <div className="iv-card__body">
                <div className="iv-card__section">
                    <span className="iv-tag iv-tag--intention">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                        </svg>
                        Intention
                    </span>
                    <p className="iv-card__text">{intention}</p>
                </div>
                <div className="iv-card__divider" />
                <div className="iv-card__section">
                    <span className="iv-tag iv-tag--answer">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Model Answer
                    </span>
                    <p className="iv-card__text">{answer}</p>
                </div>
            </div>
        )}
    </div>
);

/* ═══════════════════════════════════════════
   Accordion Card — Road Map Day
   ═══════════════════════════════════════════ */
const DayCard = ({ day, focus, tasks, open, toggle }) => (
    <div className={`iv-card ${open ? "iv-card--open" : ""}`}>
        <button className="iv-card__head" onClick={toggle}>
            <span className="iv-card__badge iv-card__badge--day">Day {day}</span>
            <span className="iv-card__q">{focus}</span>
            <Chevron open={open} />
        </button>
        {open && (
            <div className="iv-card__body">
                <ul className="iv-card__tasks">
                    {tasks.map((t, i) => (
                        <li key={i} className="iv-card__task">{t}</li>
                    ))}
                </ul>
            </div>
        )}
    </div>
);

/* ═══════════════════════════════════════════
   Interview Page Component
   ═══════════════════════════════════════════ */
const Interview = () => {

    const [downloading, setDownloading] = useState(false)
    const [downloadSuccess, setDownloadSuccess] = useState(false)
    const { report, getReportById, loading, getResumePdf } = useInterview()
    const { interviewId } = useParams()
    const [activeTab, setActiveTab] = useState("technical");
    const [expanded, setExpanded] = useState(0);

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [interviewId])

    if (loading || !report) {
        return (
            <main className="loading-screen">
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    const data = report;
    const questions = activeTab === "technical" ? data.technicalQuestions : data.behavioralQuestions;

    const handleTab = (id) => {
        setActiveTab(id);
        setExpanded(0);
    };
    const toggle = (i) => setExpanded(i === expanded ? -1 : i);

    const handleDownloadResume = async () => {
        try {
            setDownloadSuccess(false)
            const result = await getResumePdf(interviewId, setDownloading)
            if (result && result.cancelled) {
                return
            }
            setDownloadSuccess(true)
            setTimeout(() => {
                setDownloadSuccess(false)
            }, 3000)
        } catch (error) {
            alert("Failed to generate and download resume. Please try again.")
        } finally {
            setDownloading(false)
        }
    }


    return (
        <div className="iv-page">
            <div className="iv-layout">
                {/* ── Sidebar ── */}
                <aside className="iv-sidebar">
                    <span className="iv-label">SECTIONS</span>
                    <nav className="iv-nav">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                className={`iv-nav__item ${activeTab === item.id ? "iv-nav__item--active" : ""}`}
                                onClick={() => handleTab(item.id)}
                            >
                                <span className="iv-nav__icon">{item.icon}</span>
                                <span className="iv-nav__label">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <button
                        onClick={handleDownloadResume}
                        disabled={downloading}
                        className={`button primary-button iv-sidebar__download ${downloadSuccess ? 'success-button' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {downloading ? (
                            <>
                                <svg className="spinner-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }}>
                                    <line x1="12" y1="2" x2="12" y2="6"></line>
                                    <line x1="12" y1="18" x2="12" y2="22"></line>
                                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                    <line x1="2" y1="12" x2="6" y2="12"></line>
                                    <line x1="18" y1="12" x2="22" y2="12"></line>
                                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                                </svg>
                                Downloading...
                            </>
                        ) : downloadSuccess ? (
                            <>
                                <svg height="0.8rem" style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Downloaded!
                            </>
                        ) : (
                            <>
                                <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                                Download Resume
                            </>
                        )}
                    </button>
                </aside>

                {/* ── Main Content Column ── */}
                <main className="iv-main">
                    {/* Header */}
                    <div className="iv-main__header">
                        <h1 className="iv-main__title">
                            {activeTab === "technical" && "Technical Questions"}
                            {activeTab === "behavioral" && "Behavioral Questions"}
                            {activeTab === "roadmap" && "Preparation Road Map"}
                        </h1>
                        <span className="iv-pill">
                            {activeTab === "roadmap"
                                ? `${data.preparationPlan.length} questions`
                                : `${questions.length} questions`}
                        </span>
                    </div>

                    {/* Question Cards Stack */}
                    {(activeTab === "technical" || activeTab === "behavioral") && (
                        <div className="iv-cards">
                            {questions.map((q, i) => (
                                <QuestionCard
                                    key={i}
                                    idx={i}
                                    open={i === expanded}
                                    toggle={() => toggle(i)}
                                    {...q}
                                />
                            ))}
                        </div>
                    )}

                    {/* Road Map Cards Stack */}
                    {activeTab === "roadmap" && (
                        <div className="iv-cards">
                            {data.preparationPlan.map((d, i) => (
                                <DayCard
                                    key={i}
                                    open={i === expanded}
                                    toggle={() => toggle(i)}
                                    {...d}
                                />
                            ))}
                        </div>
                    )}
                </main>

                {/* ── Right Panel ── */}
                <aside className="iv-panel">
                    {/* Match Score */}
                    <div className="iv-score">
                        <span className="iv-label">MATCH SCORE</span>
                        <div className="iv-score__ring">
                            <svg viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="48" className="iv-score__track" />
                                <circle
                                    cx="60" cy="60" r="48"
                                    className="iv-score__fill"
                                    strokeDasharray={`${(data.matchScore / 100) * 301.6} 301.6`}
                                />
                            </svg>
                            <div className="iv-score__value">
                                <span className="iv-score__num">{data.matchScore}</span>
                                <span className="iv-score__pct">%</span>
                            </div>
                        </div>
                        <span className="iv-score__desc">Strong match for this role</span>
                    </div>

                    {/* Skill Gaps */}
                    <div className="iv-gaps">
                        <span className="iv-label">SKILL GAPS</span>
                        <div className="iv-gaps__list">
                            {data.skillGaps.map((gap, i) => {
                                const s = SEVERITY[gap.severity] || SEVERITY.medium;
                                return (
                                    <div key={i} className="iv-gaps__item" style={{ borderLeftColor: s.color }}>
                                        <span className="iv-gaps__name">{gap.skill}</span>
                                        <span className="iv-gaps__sev" style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}25` }}>
                                            {s.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Interview;
