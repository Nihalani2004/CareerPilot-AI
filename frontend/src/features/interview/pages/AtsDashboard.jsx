import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import "../style/AtsDashboard.scss";
import {
    createAtsAnalysis,
    getAtsAnalysis,
    updateAtsSuggestion,
} from "../services/ats-analysis.api";

const SCORE_COPY = (score) => {
    if (score >= 80) return "Strong alignment for this role";
    if (score >= 60) return "Promising alignment with focused gaps";
    return "Important alignment gaps to address";
};

const IMPORTANCE_ORDER = { high: 0, medium: 1, low: 2 };

function ScoreRing({ score }) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const progress = circumference - ((score || 0) / 100) * circumference;

    return (
        <div className="ats-score-ring" aria-label={`ATS compatibility score ${score} out of 100`}>
            <svg viewBox="0 0 110 110" role="img">
                <circle className="ats-score-ring__track" cx="55" cy="55" r={radius} />
                <circle
                    className="ats-score-ring__progress"
                    cx="55"
                    cy="55"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={progress}
                />
            </svg>
            <div className="ats-score-ring__content">
                <strong>{score}</strong><span>/100</span>
            </div>
        </div>
    );
}

function MetricCard({ label, value, caption }) {
    return (
        <article className="ats-metric-card">
            <span>{label}</span>
            <strong>{value}<small>/100</small></strong>
            <div className="ats-meter" aria-hidden="true"><i style={{ width: `${value}%` }} /></div>
            <p>{caption}</p>
        </article>
    );
}

function Badge({ value, type = "status" }) {
    return <span className={`ats-badge ats-badge--${type}-${value}`}>{value.replace(/_/g, " ")}</span>;
}

function Icon({ name }) {
    const paths = {
        back: <path d="M19 12H5m6 6-6-6 6-6" />,
        refresh: <><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" /></>,
        check: <path d="m5 12 4 4L19 6" />,
        bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
        spark: <><path d="m12 3-1.5 5.5L5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z" /><path d="m19 16-.6 2.4L16 19l2.4.6L19 22l.6-2.4L22 19l-2.4-.6L19 16Z" /></>,
    };
    return <svg className="ats-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function EmptyState({ error, onRetry }) {
    return (
        <main className="ats-page ats-page--state">
            <section className="ats-state-card">
                <div className="ats-state-card__icon"><Icon name="spark" /></div>
                <h1>{error ? "ATS analysis is unavailable" : "Preparing ATS intelligence"}</h1>
                <p>{error || "Building transparent, role-specific insights from your saved interview report."}</p>
                {error && <button className="ats-button ats-button--primary" onClick={onRetry}>Try again</button>}
            </section>
        </main>
    );
}

export default function AtsDashboard() {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [importanceFilter, setImportanceFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const loadAnalysis = async ({ regenerate = false } = {}) => {
        setError("");
        setIsRefreshing(true);
        try {
            if (!regenerate) {
                try {
                    const result = await getAtsAnalysis(interviewId);
                    setAnalysis(result.analysis);
                    return;
                } catch (requestError) {
                    if (requestError.response?.status !== 404) throw requestError;
                }
            }

            const result = await createAtsAnalysis(interviewId);
            setAnalysis(result.analysis);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "We could not create your ATS analysis. Please try again.");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadAnalysis();
    }, [interviewId]);

    const requirements = useMemo(() => (analysis?.requirements || [])
        .filter((item) => importanceFilter === "all" || item.importance === importanceFilter)
        .filter((item) => statusFilter === "all" || item.status === statusFilter)
        .sort((left, right) => IMPORTANCE_ORDER[left.importance] - IMPORTANCE_ORDER[right.importance]), [analysis, importanceFilter, statusFilter]);

    const matchedCount = analysis?.requirements?.filter((item) => item.status === "matched").length || 0;
    const missingCount = analysis?.requirements?.filter((item) => item.status === "missing").length || 0;

    const updateSuggestionStatus = async (suggestionId, status) => {
        const previousAnalysis = analysis;
        setAnalysis((current) => ({
            ...current,
            suggestions: current.suggestions.map((suggestion) => suggestion.id === suggestionId ? { ...suggestion, status } : suggestion),
        }));

        try {
            await updateAtsSuggestion(analysis._id, suggestionId, status);
        } catch (requestError) {
            setAnalysis(previousAnalysis);
            setError(requestError.response?.data?.message || "Suggestion status could not be saved.");
        }
    };

    if (!analysis) return <EmptyState error={error} onRetry={() => loadAnalysis({ regenerate: true })} />;

    const { metrics } = analysis;
    return (
        <main className="ats-page">
            <div className="ats-shell">
                <header className="ats-header">
                    <button className="ats-back" onClick={() => navigate(`/interview/${interviewId}`)} aria-label="Return to interview report">
                        <Icon name="back" /> Back to report
                    </button>
                    <div className="ats-header__actions">
                        <span className="ats-method-note">Evidence-based estimate</span>
                        <button className="ats-button ats-button--secondary" onClick={() => loadAnalysis({ regenerate: true })} disabled={isRefreshing}>
                            <Icon name="refresh" /> {isRefreshing ? "Refreshing" : "Refresh analysis"}
                        </button>
                    </div>
                </header>

                <section className="ats-hero">
                    <div>
                        <span className="ats-eyebrow"><Icon name="spark" /> ATS Intelligence</span>
                        <h1>Make every application more explainable.</h1>
                        <p>Transparent alignment insights for <strong>{analysis.targetRole}</strong>, based only on evidence in your saved profile and target job description.</p>
                    </div>
                    <div className="ats-hero__score">
                        <ScoreRing score={metrics.overallScore} />
                        <div><span>ATS compatibility</span><strong>{SCORE_COPY(metrics.overallScore)}</strong></div>
                    </div>
                </section>

                <p className="ats-disclaimer">This is an AI-assisted compatibility estimate, not a prediction of a company’s hiring decision. Add skills only when you have genuine evidence.</p>

                <section className="ats-metrics-grid" aria-label="ATS scoring breakdown">
                    <MetricCard label="Keyword alignment" value={metrics.keywordAlignment} caption="Weighted coverage of role requirements" />
                    <MetricCard label="Skill evidence" value={metrics.skillAlignment} caption="Requirements found in your profile" />
                    <MetricCard label="Evidence quality" value={metrics.evidenceQuality} caption="Matched requirements with context" />
                    <MetricCard label="Resume completeness" value={metrics.completeness} caption="Detected standard resume sections" />
                </section>

                <section className="ats-card ats-card--requirements">
                    <div className="ats-section-heading">
                        <div>
                            <span className="ats-eyebrow">Requirement coverage</span>
                            <h2>What the role asks for</h2>
                            <p><strong>{matchedCount}</strong> matched and <strong>{missingCount}</strong> not yet evidenced.</p>
                        </div>
                        <div className="ats-filters">
                            <label>Priority<select value={importanceFilter} onChange={(event) => setImportanceFilter(event.target.value)}><option value="all">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select></label>
                            <label>Coverage<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All coverage</option><option value="matched">Matched</option><option value="missing">Missing</option></select></label>
                        </div>
                    </div>
                    <div className="ats-requirement-list">
                        {requirements.length ? requirements.map((requirement) => (
                            <article className="ats-requirement" key={requirement.key}>
                                <div className={`ats-requirement__indicator ats-requirement__indicator--${requirement.status}`}><Icon name={requirement.status === "matched" ? "check" : "spark"} /></div>
                                <div className="ats-requirement__body">
                                    <div><h3>{requirement.label}</h3><span>{requirement.category}</span></div>
                                    {requirement.evidence ? <p><b>Evidence:</b> {requirement.evidence}</p> : <p>Not evidenced in the submitted candidate content.</p>}
                                </div>
                                <div className="ats-requirement__badges"><Badge value={requirement.importance} type="priority" /><Badge value={requirement.status} /></div>
                            </article>
                        )) : <p className="ats-empty-inline">No requirements match the selected filters.</p>}
                    </div>
                </section>

                <div className="ats-two-column">
                    <section className="ats-card">
                        <div className="ats-section-heading"><div><span className="ats-eyebrow">Resume health</span><h2>Section analysis</h2></div></div>
                        <div className="ats-section-list">
                            {analysis.sections.map((section) => (
                                <article className="ats-section-row" key={section.key}>
                                    <div className="ats-section-row__top"><div><h3>{section.label}</h3><p>{section.insight}</p></div><Badge value={section.status} /></div>
                                    <div className="ats-progress"><i style={{ width: `${section.score}%` }} /></div>
                                    <strong>{section.score}/100</strong>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="ats-card">
                        <div className="ats-section-heading"><div><span className="ats-eyebrow">Parsing checklist</span><h2>ATS readability signals</h2></div></div>
                        <div className="ats-audit-list">
                            {analysis.auditChecklist.map((item) => (
                                <article className="ats-audit" key={item.key}>
                                    <div className={`ats-audit__icon ats-audit__icon--${item.status}`}><Icon name={item.status === "pass" ? "check" : "spark"} /></div>
                                    <div><h3>{item.label}</h3><p>{item.detail}</p></div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="ats-card ats-card--suggestions">
                    <div className="ats-section-heading"><div><span className="ats-eyebrow">Action plan</span><h2>Safe, role-specific improvements</h2><p>Suggestions never change your report or resume automatically.</p></div></div>
                    <div className="ats-suggestion-list">
                        {analysis.suggestions.map((suggestion) => (
                            <article className={`ats-suggestion ats-suggestion--${suggestion.status}`} key={suggestion.id}>
                                <div className="ats-suggestion__top"><div><Badge value={suggestion.priority} type="priority" /><span>{suggestion.section}</span></div><Badge value={suggestion.status} type="suggestion" /></div>
                                <h3>{suggestion.title}</h3>
                                <p>{suggestion.detail}</p>
                                {suggestion.relatedKeywords.length > 0 && <div className="ats-keyword-chips">{suggestion.relatedKeywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>}
                                <div className="ats-suggestion__actions">
                                    <button onClick={() => updateSuggestionStatus(suggestion.id, suggestion.status === "saved" ? "open" : "saved")}><Icon name="bookmark" /> {suggestion.status === "saved" ? "Saved" : "Save"}</button>
                                    <button onClick={() => updateSuggestionStatus(suggestion.id, suggestion.status === "applied" ? "open" : "applied")}><Icon name="check" /> {suggestion.status === "applied" ? "Applied" : "Mark applied"}</button>
                                    {suggestion.status !== "dismissed" && <button className="ats-text-button" onClick={() => updateSuggestionStatus(suggestion.id, "dismissed")}>Dismiss</button>}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {analysis.keywordCoverage.length > 0 && <section className="ats-keywords"><span className="ats-eyebrow">Job-description signals</span><div>{analysis.keywordCoverage.map((keyword) => <span key={keyword.word}>{keyword.word}<b>{keyword.count}</b></span>)}</div></section>}
            </div>
        </main>
    );
}
