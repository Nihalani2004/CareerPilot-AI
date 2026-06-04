import React, { useState, useRef } from "react";
import '../style/home.scss';
import { useInterview } from "../hooks/useInterview.js";
import { useNavigate } from "react-router";
const Home = () => {

    const { loading, generateReport, reports, deleteReport } = useInterview()
    const [jobDescription, setJobDescription] = useState("")
    const [selfDescription, setSelfDescription] = useState("")
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    const handleGenerateReport = async () => {
        const resumeFile = resumeInputRef.current.files[0]
        const data = await generateReport({ jobDescription, selfDescription, resumeFile })
        if (data && data._id) {
            navigate(`/interview/${data._id}`)
        }
    }


    if (loading) {
        return (
            <main className="loading-screen">
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }


    return (
        <main className="home">
            {/* ── Hero Section ── */}
            <section className="home__hero">
                <h1 className="home__title">
                    Create Your Custom <span className="home__title--accent">Interview Plan</span>
                </h1>
                <p className="home__subtitle">
                    Let our AI analyze the job requirements and your unique profile to build a winning strategy.
                </p>
            </section>

            {/* ── Main Content Card ── */}
            <section className="home__card">
                <div className="home__card-inner">
                    {/* ── Left Column: Job Description ── */}
                    <div className="home__col home__col--left">
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
                    </div>

                    {/* ── Right Column: Your Profile ── */}
                    <div className="home__col home__col--right">
                        <div className="home__col-title">
                            <span className="home__icon home__icon--profile">👤</span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className="home__upload-section">
                            <p className="home__label">
                                Upload Resume <span className="home__label--best">(Best Results)</span>
                            </p>
                            <label className="home__dropzone" htmlFor="resume">
                                <span className="home__dropzone-icon">☁️</span>
                                <span className="home__dropzone-text">Click to upload or drag &amp; drop</span>
                                <span className="home__dropzone-hint">PDF or DOCX (Max 5MB)</span>
                            </label>
                            <input ref={resumeInputRef}
                                hidden
                                type="file"
                                name="resume"
                                id="resume"
                                accept=".pdf,.docx"
                            />
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
                    </div>
                </div>
            </section>

            {/* ── Bottom Action Bar ── */}
            <section className="home__action-bar">
                <span className="home__ai-note">AI-Powered Strategy Generation • Approx 30s</span>
                <button
                    onClick={handleGenerateReport}
                    className="button primary-button home__generate-btn">
                    <span className="home__generate-icon">✨</span>
                    Generate My Interview Strategy
                </button>
            </section>

            {/* Recent Reports List */}
            {reports.length > 0 && (
                <section className='recent-reports'>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {reports.map(report => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <button 
                                    className="report-delete-btn" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Are you sure you want to delete this interview plan?")) {
                                            deleteReport(report._id);
                                        }
                                    }}
                                    title="Delete plan"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        <line x1="10" y1="11" x2="10" y2="17" />
                                        <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                </button>
                                <h3>{report.title || 'Untitled Position'}</h3>
                                <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                            </li>
                        ))}
                    </ul>
                </section>
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