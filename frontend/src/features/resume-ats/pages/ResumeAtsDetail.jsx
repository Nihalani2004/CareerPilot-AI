import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import ParticleField from "../../../components/ParticleField";
import AnimatedConfirmButton from "../../../components/AnimatedConfirmButton";
import { compareResumeAtsScans, deleteResumeAtsScan, getResumeAtsScan, getResumeAtsScans } from "../services/resume-ats.api";
import "../style/resumeAts.scss";

const priorityCopy = { critical: "Critical", high: "High impact", medium: "Improve", low: "Polish" };

function ScoreRing({ score }) {
    const radius = 43, circumference = 2 * Math.PI * radius;
    return <div className="resume-ats-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r={radius} /><circle className="resume-ats-ring__value" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference - (score / 100) * circumference} /></svg><div><strong>{score}</strong><span>/100</span></div></div>;
}

export default function ResumeAtsDetail() {
    const { scanId } = useParams();
    const navigate = useNavigate();
    const [scan, setScan] = useState(null);
    const [scans, setScans] = useState([]);
    const [comparisonId, setComparisonId] = useState("");
    const [comparison, setComparison] = useState(null);
    const [isComparing, setIsComparing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => { let active = true; Promise.all([getResumeAtsScan(scanId), getResumeAtsScans()]).then(([scanResult, listResult]) => { if (!active) return; setScan(scanResult.scan); setScans(listResult.scans.filter((item) => item._id !== scanId)); }).catch((requestError) => active && setError(requestError.response?.data?.message || "We could not load this ATS scan.")); return () => { active = false; }; }, [scanId]);
    const missingSections = useMemo(() => scan?.result.sections.filter((section) => !section.present) || [], [scan]);
    const compare = async () => { if (!comparisonId) return; setIsComparing(true); try { const result = await compareResumeAtsScans(comparisonId, scanId); setComparison(result.comparison); } catch (requestError) { setError(requestError.response?.data?.message || "Resume versions could not be compared."); } finally { setIsComparing(false); } };
    const remove = async () => { try { await deleteResumeAtsScan(scanId); navigate("/resume-ats", { replace: true }); } catch (requestError) { setError(requestError.response?.data?.message || "Scan could not be deleted."); } };

    if (!scan && !error) return <main className="resume-ats-page resume-ats-state-page">Loading your ATS scan...</main>;
    if (!scan) return <main className="resume-ats-page resume-ats-state-page"><section className="resume-ats-empty"><h1>ATS scan unavailable</h1><p>{error}</p><button className="button primary-button" onClick={() => navigate("/resume-ats")}>Return to ATS checker</button></section></main>;
    const { result } = scan;
    const recommendations = result.recommendations?.length ? result.recommendations : result.findings.slice(0, 3).map((finding) => ({ focus: finding.title, priority: finding.priority, why: finding.evidence || finding.category, action: finding.detail }));

    return <main className="resume-ats-page"><ParticleField className="resume-ats-page__particles" /><section className="resume-ats-detail">
        <header className="resume-ats-detail__header"><div><button className="resume-ats-back" type="button" onClick={() => navigate("/resume-ats")}>← Resume ATS Checker</button><span className="resume-ats-eyebrow">SAVED RESUME AUDIT</span><h1>{scan.displayName}</h1><p>{scan.originalFileName} · {new Date(scan.createdAt).toLocaleDateString()}</p></div><div className="resume-ats-detail__actions"><button type="button" onClick={() => navigate("/resume-ats")}>Upload revision</button><AnimatedConfirmButton triggerLabel="Delete scan" triggerClassName="resume-ats-delete" title="Delete this ATS scan?" description={`Delete \"${scan.displayName}\" from your saved resume history. This cannot be undone.`} confirmLabel="Delete scan" onConfirm={remove} /></div></header>
        {error && <p className="resume-ats-error" role="alert">{error}</p>}
        <motion.section className="resume-ats-hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><ScoreRing score={result.overallScore} /><div><span className="resume-ats-eyebrow">ATS-READINESS ESTIMATE</span><h2>{result.label}</h2><p>{result.disclaimer}</p></div><div className="resume-ats-parser-status"><b>{result.parserHealth.textExtracted ? "Text extracted" : "Text not extracted"}</b><span>{result.parserHealth.wordCount} words · {result.parserHealth.characterCount} characters</span></div></motion.section>
        <section className="resume-ats-score-grid">{result.scores.map((item) => <article key={item.key}><span>{item.label}</span><strong>{item.score}<small>/100</small></strong><i><b style={{ width: `${item.score}%` }} /></i><p>{item.summary}</p></article>)}</section>
        <section className="resume-ats-recommendations"><header><div><span className="resume-ats-eyebrow">RECOMMENDED FOCUS</span><h2>Make these improvements first</h2><p>These actions are prioritized from the resume text that was actually extracted.</p></div></header><div>{recommendations.map((recommendation, index) => <article key={`${recommendation.focus}-${index}`}><span className={`resume-ats-priority resume-ats-priority--${recommendation.priority}`}>{priorityCopy[recommendation.priority] || "Focus"}</span><div><small>Focus {index + 1}</small><h3>{recommendation.focus}</h3><p>{recommendation.action}</p></div><em>{recommendation.why}</em></article>)}</div></section>
        <section className="resume-ats-columns"><section className="resume-ats-panel"><span className="resume-ats-eyebrow">PRIORITIZED FIXES</span><h2>Improve what scanners notice first</h2><div className="resume-ats-findings">{result.findings.length ? result.findings.map((finding) => <article key={finding.id}><span className={`resume-ats-priority resume-ats-priority--${finding.priority}`}>{priorityCopy[finding.priority]}</span><div><h3>{finding.title}</h3><p>{finding.detail}</p>{finding.evidence && <small>{finding.evidence}</small>}</div><b>+{finding.scoreImpact}</b></article>) : <p className="resume-ats-state">No priority issues were detected by these checks.</p>}</div></section><section className="resume-ats-panel"><span className="resume-ats-eyebrow">RESUME COMPLETENESS</span><h2>What the parser detected</h2><div className="resume-ats-check-list">{result.sections.map((section) => <div key={section.key}><i className={section.present ? "resume-ats-check-list__pass" : "resume-ats-check-list__missing"}>{section.present ? "✓" : "!"}</i><span>{section.label}</span><b>{section.present ? "Detected" : "Missing"}</b></div>)}</div><div className="resume-ats-contact-grid">{Object.entries(result.contacts).map(([key, present]) => <span key={key} className={present ? "is-present" : "is-missing"}>{present ? "✓" : "!"} {key === "githubOrPortfolio" ? "GitHub / portfolio" : key}</span>)}</div></section></section>
        <section className="resume-ats-panel"><span className="resume-ats-eyebrow">SKILLS PARSER</span><h2>Recognized skills</h2><div className="resume-ats-skills">{result.skills.length ? result.skills.map((skill) => <span key={skill}>{skill}</span>) : <p className="resume-ats-state">No recognized skills found. Add a clearly labelled Technical Skills section.</p>}</div></section>
        <section className="resume-ats-panel"><span className="resume-ats-eyebrow">WHAT THE PARSER SAW</span><h2>Extracted text preview</h2><p className="resume-ats-panel__hint">This preview is limited and helps you identify PDF extraction issues. It is not a visual-layout inspection.</p><pre className="resume-ats-preview">{result.parserHealth.preview}</pre></section>
        <section className="resume-ats-panel resume-ats-version"><span className="resume-ats-eyebrow">VERSION COMPARISON</span><h2>Compare an earlier scan</h2><p>Upload a revision, then compare the score breakdown and resolved findings.</p><div><select value={comparisonId} onChange={(event) => setComparisonId(event.target.value)}><option value="">Choose an earlier scan</option>{scans.map((item) => <option key={item._id} value={item._id}>{item.displayName} — {item.result.overallScore}/100</option>)}</select><button type="button" onClick={compare} disabled={!comparisonId || isComparing}>{isComparing ? "Comparing..." : "Compare scans"}</button></div>{comparison && <section className="resume-ats-version__result"><strong>{comparison.before.score}/100 → {comparison.after.score}/100</strong><span className={comparison.overallChange >= 0 ? "is-positive" : "is-negative"}>{comparison.overallChange >= 0 ? "+" : ""}{comparison.overallChange} overall</span><div>{comparison.scoreChanges.map((item) => <p key={item.key}>{item.label}<b className={item.change >= 0 ? "is-positive" : "is-negative"}>{item.change >= 0 ? "+" : ""}{item.change}</b></p>)}</div><small>{comparison.resolvedFindingIds.length} issues resolved · {comparison.newFindingIds.length} new issues detected</small></section>}</section>
    </section></main>;
}
