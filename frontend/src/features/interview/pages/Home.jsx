import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import '../style/home.scss';
import { useInterview } from "../hooks/useInterview.js";
import { useNavigate } from "react-router";
import ParticleField from "../../../components/ParticleField";
import ProfileMenu from "../../../components/ProfileMenu";
import AnimatedConfirmButton from "../../../components/AnimatedConfirmButton";

/* ── Animation Variants ── */
const fadeUp = {
    initial: { opacity: 0, y: 25 },
    animate: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

const cardStagger = {
    initial: { opacity: 0, y: 20, scale: 0.97 },
    animate: (i) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { delay: 0.3 + i * 0.06, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    const units = ["B", "KB", "MB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const Home = () => {

    const { loading, generateReport, reports, hasMoreReports, loadMoreReports, deleteReport } = useInterview()
    const [jobDescription, setJobDescription] = useState("")
    const [selfDescription, setSelfDescription] = useState("")
    const [resumeFile, setResumeFile] = useState(null)
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    const handleGenerateReport = async () => {
        const data = await generateReport({ jobDescription, selfDescription, resumeFile })
        if (data && data._id) {
            navigate(`/interview/${data._id}`)
        }
    }

    const handleResumeFileChange = (event) => {
        setResumeFile(event.target.files?.[0] || null)
    }

    const removeResumeFile = () => {
        setResumeFile(null)
        if (resumeInputRef.current) {
            resumeInputRef.current.value = ""
        }
    }


    if (loading) {
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


    return (
        <main className="home">
            <ProfileMenu />
            {/* ── 3D Background ── */}
            <div className="home__hero-bg">
                <ParticleField />
            </div>

            {/* ── Hero Section ── */}
            <motion.section className="home__hero" initial="initial" animate="animate">
                <motion.h1 className="home__title" custom={0} variants={fadeUp} initial="initial" animate="animate">
                    Create Your Custom <span className="home__title--accent">Interview Plan</span>
                </motion.h1>
                <motion.p className="home__subtitle" custom={1} variants={fadeUp} initial="initial" animate="animate">
                    Let our AI analyze the job requirements and your unique profile to build a winning strategy.
                </motion.p>
            </motion.section>

            {/* ── Main Content Card ── */}
            <motion.section
                className="home__card"
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <div className="home__card-inner">
                    {/* ── Left Column: Job Description ── */}
                    <motion.div className="home__col home__col--left" custom={2} variants={fadeUp} initial="initial" animate="animate">
                        <div className="home__col-header">
                            <div className="home__col-title">
                                <span className="home__icon home__icon--briefcase">💼</span>
                                <h2>Target Job Description</h2>
                            </div>
                            <span className="home__badge home__badge--required">Required</span>
                        </div>

                        <div className="home__textarea-wrapper">
                            <textarea
                                onChange={(e) => { setJobDescription(e.target.value) }}
                                id="jobDescription"
                                name="jobDescription"
                                className="home__textarea"
                                placeholder={"Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'"}
                                maxLength={5000}
                            />
                            <span className="home__char-count">0 / 5000 chars</span>
                        </div>
                    </motion.div>

                    {/* ── Right Column: Your Profile ── */}
                    <motion.div className="home__col home__col--right" custom={3} variants={fadeUp} initial="initial" animate="animate">
                        <div className="home__col-title">
                            <span className="home__icon home__icon--profile">👤</span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className="home__upload-section">
                            <p className="home__label">
                                Upload Resume <span className="home__label--best">(Best Results)</span>
                            </p>
                            <motion.label
                                className="home__dropzone"
                                htmlFor="resume"
                                whileHover={{ scale: 1.01, borderColor: 'rgba(139, 92, 246, 0.5)' }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <span className="home__dropzone-icon">☁️</span>
                                <span className="home__dropzone-text">Click to upload or drag &amp; drop</span>
                                <span className="home__dropzone-hint">PDF or DOCX (Max 5MB)</span>
                            </motion.label>
                            <input ref={resumeInputRef}
                                hidden
                                type="file"
                                name="resume"
                                id="resume"
                                accept=".pdf,.docx"
                                onChange={handleResumeFileChange}
                            />
                            {resumeFile && (
                                <div className="home__uploaded-file" role="status">
                                    <svg className="home__uploaded-file-icon" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                                        <path d="M14 2v6h6" />
                                        <path d="M8 14h8M8 18h5" />
                                    </svg>
                                    <div className="home__uploaded-file-details">
                                        <span className="home__uploaded-file-name" title={resumeFile.name}>{resumeFile.name}</span>
                                        <span className="home__uploaded-file-size">{formatFileSize(resumeFile.size)}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="home__uploaded-file-remove"
                                        onClick={removeResumeFile}
                                        aria-label={`Remove ${resumeFile.name}`}
                                        title="Remove uploaded resume"
                                    >
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M18 6 6 18M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* OR Divider */}
                        <div className="home__divider">
                            <span className="home__divider-line" />
                            <span className="home__divider-text">OR</span>
                            <span className="home__divider-line" />
                        </div>

                        {/* Quick Self-Description */}
                        <div className="home__self-desc">
                            <p className="home__label">Quick Self-Description</p>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                id="selfDescription"
                                name="selfDescription"
                                className="home__textarea home__textarea--short"
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Banner */}
                        <div className="home__info-banner">
                            <span className="home__info-dot" />
                            <p>
                                Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* ── Bottom Action Bar ── */}
            <motion.section
                className="home__action-bar"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
            >
                <span className="home__ai-note">AI-Powered Strategy Generation • Approx 30s</span>
                <motion.button
                    onClick={handleGenerateReport}
                    className="button primary-button home__generate-btn"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <span className="home__generate-icon">✨</span>
                    Generate My Interview Strategy
                </motion.button>
            </motion.section>

            {/* Recent Reports List */}
            {reports.length > 0 && (
                <motion.section
                    id="recent-reports"
                    className='recent-reports'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {reports.map((report, index) => (
                            <motion.li
                                key={report._id}
                                className='report-item'
                                onClick={() => navigate(`/interview/${report._id}`)}
                                custom={index}
                                variants={cardStagger}
                                initial="initial"
                                animate="animate"
                                whileHover={{ y: -4 }}
                            >
                                <AnimatedConfirmButton
                                    triggerLabel={`Delete ${report.title || "interview plan"}`}
                                    triggerClassName="report-delete-btn"
                                    triggerIcon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>}
                                    title="Delete this interview plan?"
                                    description={`Delete \"${report.title || "Untitled Position"}\" from your interview plans. This cannot be undone.`}
                                    confirmLabel="Delete plan"
                                    onConfirm={() => deleteReport(report._id)}
                                />
                                <h3>{report.title || 'Untitled Position'}</h3>
                                <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                            </motion.li>
                        ))}
                    </ul>
                    {hasMoreReports && (
                        <button
                            type="button"
                            className="button secondary-button reports-load-more"
                            onClick={loadMoreReports}
                        >
                            Load More Plans
                        </button>
                    )}
                </motion.section>
            )}


            {/* ── Footer ── */}
            <footer className="home__footer">
                <a href="#privacy" className="home__footer-link">Privacy Policy</a>
                <a href="#terms" className="home__footer-link">Terms of Service</a>
                <a href="#help" className="home__footer-link">Help Center</a>
            </footer>
        </main>
    );
};

export default Home;
