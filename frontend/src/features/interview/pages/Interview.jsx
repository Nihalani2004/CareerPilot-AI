import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../style/Interview.scss";
import { useInterview } from "../hooks/useInterview.js";
import { useNavigate, useParams } from "react-router";

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

/* ── Animation Variants ── */
const cardVariants = {
    initial: { opacity: 0, y: 15 },
    animate: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const bodyVariants = {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: 'easeInOut' } },
};

const contentFade = {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, x: -10, transition: { duration: 0.2 } },
};

/* ═══════════════════════════════════════════
   Accordion Card — Questions
   ═══════════════════════════════════════════ */
const QuestionCard = ({ idx, question, intention, answer, open, toggle }) => (
    <motion.div
        className={`iv-card ${open ? "iv-card--open" : ""}`}
        custom={idx}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        layout
    >
        <button className="iv-card__head" onClick={toggle}>
            <span className="iv-card__badge">Q{idx + 1}</span>
            <span className="iv-card__q">{question}</span>
            <Chevron open={open} />
        </button>
        <AnimatePresence>
            {open && (
                <motion.div
                    className="iv-card__body"
                    variants={bodyVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ overflow: 'hidden' }}
                >
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
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

/* ═══════════════════════════════════════════
   Accordion Card — Road Map Day
   ═══════════════════════════════════════════ */
const DayCard = ({ day, focus, tasks, open, toggle, idx }) => (
    <motion.div
        className={`iv-card ${open ? "iv-card--open" : ""}`}
        custom={idx}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        layout
    >
        <button className="iv-card__head" onClick={toggle}>
            <span className="iv-card__badge iv-card__badge--day">Day {day}</span>
            <span className="iv-card__q">{focus}</span>
            <Chevron open={open} />
        </button>
        <AnimatePresence>
            {open && (
                <motion.div
                    className="iv-card__body"
                    variants={bodyVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ overflow: 'hidden' }}
                >
                    <ul className="iv-card__tasks">
                        {tasks.map((t, i) => (
                            <motion.li
                                key={i}
                                className="iv-card__task"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.3 }}
                            >
                                {t}
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

/* ═══════════════════════════════════════════
   Animated Score Ring
   ═══════════════════════════════════════════ */
const AnimatedScoreRing = ({ score }) => {
    const circumference = 2 * Math.PI * 48; // r=48
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="iv-score__ring">
            <svg viewBox="0 0 120 120">
                <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="48" className="iv-score__track" />
                <motion.circle
                    cx="60" cy="60" r="48"
                    className="iv-score__fill"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
            </svg>
            <div className="iv-score__value">
                <motion.span
                    className="iv-score__num"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    {score}
                </motion.span>
                <motion.span
                    className="iv-score__pct"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                >
                    %
                </motion.span>
            </div>
        </div>
    );
};

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
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
                >
                    <div className="auth-spinner" />
                    <h1>Loading your interview plan...</h1>
                </motion.div>
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
        <motion.div
            className="iv-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <div className="iv-layout">
                {/* ── Sidebar ── */}
                <aside className="iv-sidebar">
                    <span className="iv-label">SECTIONS</span>
                    <nav className="iv-nav">
                        {NAV_ITEMS.map((item) => (
                            <motion.button
                                key={item.id}
                                className={`iv-nav__item ${activeTab === item.id ? "iv-nav__item--active" : ""}`}
                                onClick={() => handleTab(item.id)}
                                whileHover={{ x: 3 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <span className="iv-nav__icon">{item.icon}</span>
                                <span className="iv-nav__label">{item.label}</span>
                            </motion.button>
                        ))}
                    </nav>
                    <motion.button
                        onClick={handleDownloadResume}
                        disabled={downloading}
                        className={`button primary-button iv-sidebar__download ${downloadSuccess ? 'success-button' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {downloading ? (
                            <>
                                <svg className="spinner-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
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
                    </motion.button>
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
                                ? `${data.preparationPlan.length} days`
                                : `${questions.length} questions`}
                        </span>
                    </div>

                    {/* Question / Roadmap Cards with AnimatePresence for tab transitions */}
                    <AnimatePresence mode="wait">
                        {(activeTab === "technical" || activeTab === "behavioral") && (
                            <motion.div
                                key={activeTab}
                                className="iv-cards"
                                variants={contentFade}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                {questions.map((q, i) => (
                                    <QuestionCard
                                        key={`${activeTab}-${i}`}
                                        idx={i}
                                        open={i === expanded}
                                        toggle={() => toggle(i)}
                                        {...q}
                                    />
                                ))}
                            </motion.div>
                        )}

                        {activeTab === "roadmap" && (
                            <motion.div
                                key="roadmap"
                                className="iv-cards"
                                variants={contentFade}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                {data.preparationPlan.map((d, i) => (
                                    <DayCard
                                        key={i}
                                        idx={i}
                                        open={i === expanded}
                                        toggle={() => toggle(i)}
                                        {...d}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                {/* ── Right Panel ── */}
                <aside className="iv-panel">
                    {/* Match Score */}
                    <motion.div
                        className="iv-score"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        <span className="iv-label">MATCH SCORE</span>
                        <AnimatedScoreRing score={data.matchScore} />
                        <span className="iv-score__desc">
                            {data.matchScore >= 80 ? 'Strong match for this role' :
                             data.matchScore >= 60 ? 'Good match — some gaps to address' :
                             'Notable gaps — focused prep needed'}
                        </span>
                    </motion.div>

                    {/* Skill Gaps */}
                    <div className="iv-gaps">
                        <span className="iv-label">SKILL GAPS</span>
                        <div className="iv-gaps__list">
                            {data.skillGaps.map((gap, i) => {
                                const s = SEVERITY[gap.severity] || SEVERITY.medium;
                                return (
                                    <motion.div
                                        key={i}
                                        className="iv-gaps__item"
                                        style={{ borderLeftColor: s.color }}
                                        initial={{ opacity: 0, x: 15 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                                        whileHover={{ x: 4 }}
                                    >
                                        <span className="iv-gaps__name">{gap.skill}</span>
                                        <span className="iv-gaps__sev" style={{ background: `${s.color}12`, color: s.color, border: `1px solid ${s.color}25` }}>
                                            {s.label}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>
        </motion.div>
    );
};

export default Interview;
