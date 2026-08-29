import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import ParticleField from "../../../components/ParticleField";
import { addJobDescription, deleteJobDescription, getJobComparison, refreshJobComparison } from "../services/job-comparison.api";
import "../style/jobComparison.scss";

function Ring({ score }) {
    const radius = 42, circumference = 2 * Math.PI * radius;
    return <div className="comparison-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r={radius} /><circle className="comparison-ring__value" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference - (score / 100) * circumference} /></svg><div><strong>{score}</strong><span>/100</span></div></div>;
}

const blankDescription = { companyName: "", roleTitle: "", sourceUrl: "", content: "" };

export default function ComparisonDashboard() {
    const { comparisonId } = useParams();
    const navigate = useNavigate();
    const [comparison, setComparison] = useState(null);
    const [error, setError] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [description, setDescription] = useState(blankDescription);
    const [isSavingDescription, setIsSavingDescription] = useState(false);

    const load = async () => {
        try { const result = await getJobComparison(comparisonId); setComparison(result.comparison); }
        catch (requestError) { setError(requestError.response?.data?.message || "We could not load this comparison."); }
    };
    useEffect(() => { load(); }, [comparisonId]);
    const refresh = async () => { setIsRefreshing(true); setError(""); try { const result = await refreshJobComparison(comparisonId); setComparison(result.comparison); } catch (requestError) { setError(requestError.response?.data?.message || "Analysis could not be refreshed."); } finally { setIsRefreshing(false); } };
    const remove = async (descriptionId) => { if (!window.confirm("Remove this job description from the comparison?")) return; try { const result = await deleteJobDescription(comparisonId, descriptionId); setComparison(result.comparison); } catch (requestError) { setError(requestError.response?.data?.message || "Job description could not be removed."); } };
    const submitDescription = async (event) => { event.preventDefault(); setIsSavingDescription(true); try { const result = await addJobDescription(comparisonId, description); setComparison(result.comparison); setDescription(blankDescription); setShowAdd(false); } catch (requestError) { setError(requestError.response?.data?.message || "Job description could not be added."); } finally { setIsSavingDescription(false); } };
    const matrix = useMemo(() => comparison ? comparison.analysis.requirements.filter((item) => item.frequency >= 2).slice(0, 12) : [], [comparison]);

    if (!comparison && !error) return <main className="comparison-page comparison-state-page">Loading your job market comparison…</main>;
    if (!comparison) return <main className="comparison-page comparison-state-page"><section className="comparison-empty"><h1>Comparison unavailable</h1><p>{error}</p><button className="button primary-button" onClick={() => navigate("/job-comparisons")}>Return to comparisons</button></section></main>;

    const { analysis } = comparison;
    return <main className="comparison-page">
        <ParticleField className="comparison-page__particles" />
        <section className="comparison-dashboard">
            <header className="comparison-dashboard__header"><div><button className="comparison-back" type="button" onClick={() => navigate("/job-comparisons")}>← My comparisons</button><span className="comparison-eyebrow">TARGET ROLE READINESS</span><h1>{comparison.targetRole} market signal</h1><p>{analysis.totalDescriptions} job descriptions{comparison.experienceLevel ? ` · ${comparison.experienceLevel}` : ""}{comparison.location ? ` · ${comparison.location}` : ""}</p></div><div className="comparison-dashboard__actions"><button type="button" onClick={() => setShowAdd((current) => !current)} disabled={comparison.jobDescriptions.length >= 10}>Add job description</button><button type="button" onClick={refresh} disabled={isRefreshing}>{isRefreshing ? "Refreshing…" : "Refresh analysis"}</button></div></header>
            {error && <p className="comparison-error" role="alert">{error}</p>}
            {showAdd && <form className="comparison-inline-form" onSubmit={submitDescription}><div className="comparison-field-grid"><label>Company<input value={description.companyName} onChange={(event) => setDescription((current) => ({ ...current, companyName: event.target.value }))} /></label><label>Role title<input required value={description.roleTitle} onChange={(event) => setDescription((current) => ({ ...current, roleTitle: event.target.value }))} /></label></div><label>Source URL<input type="url" value={description.sourceUrl} onChange={(event) => setDescription((current) => ({ ...current, sourceUrl: event.target.value }))} /></label><label>Job description<textarea required value={description.content} onChange={(event) => setDescription((current) => ({ ...current, content: event.target.value }))} /></label><div><button type="button" onClick={() => setShowAdd(false)}>Cancel</button><button className="button primary-button" disabled={isSavingDescription}>{isSavingDescription ? "Adding…" : "Add and analyze"}</button></div></form>}
            <motion.section className="comparison-hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><div><span className="comparison-eyebrow">EVIDENCE-BASED ESTIMATE</span><h2>Prepare for what the market repeats.</h2><p>{analysis.readiness.hasProfile ? "Your saved report is being checked against the recurring requirements below. A match means the skill is mentioned in your own saved evidence." : "Link an interview report when creating a comparison to calculate readiness against your saved profile."}</p></div><div className="comparison-hero__score"><Ring score={analysis.readiness.score} /><strong>{analysis.readiness.hasProfile ? "Profile-backed readiness" : "Market demand mapped"}</strong></div></motion.section>
            <section className="comparison-metrics">{[["Core skills", analysis.readiness.coreSkillCoverage], ["Tools & platforms", analysis.readiness.toolCoverage], ["Responsibility alignment", analysis.readiness.responsibilityAlignment], ["Evidence quality", analysis.readiness.evidenceQuality]].map(([label, score]) => <article key={label}><span>{label}</span><strong>{score}<small>/100</small></strong><i><b style={{ width: `${score}%` }} /></i></article>)}</section>
            <section className="comparison-section"><header><span className="comparison-eyebrow">REPEATED DEMAND</span><h2>Skills companies ask for most</h2></header><div className="comparison-demand-grid">{analysis.repeatedSkills.length ? analysis.repeatedSkills.map((skill) => <article key={skill.key}><div><h3>{skill.label}</h3><span className={`comparison-demand comparison-demand--${skill.importance}`}>{skill.importance}</span></div><strong>{skill.frequency}<small>/{analysis.totalDescriptions}</small></strong><p>{skill.percentage}% of compared roles</p></article>) : <p>No common skill signals were detected yet. Use complete descriptions for a more useful comparison.</p>}</div></section>
            <section className="comparison-columns"><section className="comparison-section"><header><span className="comparison-eyebrow">HIGH-DEMAND TOOLS</span><h2>Tools to prioritize</h2></header><div className="comparison-chip-list">{analysis.highDemandTools.map((tool) => <span key={tool.key}>{tool.label}<b>{tool.percentage}%</b></span>) || <p>No repeated tools detected.</p>}</div></section><section className="comparison-section"><header><span className="comparison-eyebrow">COMMON RESPONSIBILITIES</span><h2>What this role expects</h2></header><div className="comparison-responsibilities">{analysis.repeatedResponsibilities.map((item) => <div key={item.key}><span>{item.label}</span><b>{item.frequency}/{analysis.totalDescriptions}</b></div>)}</div></section></section>
            <section className="comparison-section"><header><span className="comparison-eyebrow">EVIDENCE GAP MAP</span><h2>What to strengthen next</h2></header><div className="comparison-gaps">{analysis.gaps.filter((gap) => gap.status === "missing").length ? analysis.gaps.filter((gap) => gap.status === "missing").map((gap) => <article key={gap.key}><span className={`comparison-demand comparison-demand--${gap.demandLevel}`}>{gap.demandLevel}</span><h3>{gap.label}</h3><p>Not found in the linked profile evidence.</p></article>) : <p>{analysis.readiness.hasProfile ? "Your saved profile contains evidence for every detected priority requirement." : "Link a saved interview report to identify evidence gaps."}</p>}</div></section>
            <section className="comparison-section comparison-matrix"><header><span className="comparison-eyebrow">COMPANY COMPARISON</span><h2>Requirement coverage by role</h2></header><div className="comparison-table-wrap"><table><thead><tr><th>Requirement</th>{comparison.jobDescriptions.map((description, index) => <th key={description._id}>{description.companyName || description.roleTitle || `Role ${index + 1}`}</th>)}</tr></thead><tbody>{matrix.map((requirement) => <tr key={requirement.key}><td>{requirement.label}</td>{comparison.jobDescriptions.map((description) => <td key={description._id}>{requirement.descriptionIds.includes(description._id) ? "Required" : "—"}</td>)}</tr>)}</tbody></table></div></section>
            <section className="comparison-section"><header><span className="comparison-eyebrow">SAVED JOB DESCRIPTIONS</span><h2>Sources in this analysis</h2></header><div className="comparison-sources">{comparison.jobDescriptions.map((description, index) => <article key={description._id}><div><span>{description.companyName || "Untitled company"}</span><h3>{description.roleTitle}</h3>{description.sourceUrl && <a href={description.sourceUrl} target="_blank" rel="noreferrer">Open source ↗</a>}</div><button type="button" disabled={comparison.jobDescriptions.length <= 2} onClick={() => remove(description._id)}>Remove</button></article>)}</div></section>
        </section>
    </main>;
}
