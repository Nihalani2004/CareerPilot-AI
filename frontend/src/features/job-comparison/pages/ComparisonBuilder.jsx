import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router";
import ParticleField from "../../../components/ParticleField";
import { createJobComparison } from "../services/job-comparison.api";
import "../style/jobComparison.scss";

const blankDescription = (number) => ({ companyName: "", roleTitle: `Role ${number}`, sourceUrl: "", content: "" });

export default function ComparisonBuilder() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const sourceInterviewReport = params.get("source") || "";
    const [name, setName] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [location, setLocation] = useState("");
    const [descriptions, setDescriptions] = useState([blankDescription(1), blankDescription(2)]);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateDescription = (index, field, value) => setDescriptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
    const removeDescription = (index) => setDescriptions((current) => current.length > 2 ? current.filter((_, itemIndex) => itemIndex !== index) : current);

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            const result = await createJobComparison({ name, targetRole, experienceLevel, location, sourceInterviewReport: sourceInterviewReport || undefined, jobDescriptions: descriptions });
            navigate(`/job-comparisons/${result.comparison._id}`, { replace: true });
        } catch (requestError) {
            setError(requestError.response?.data?.message || "We could not create this job market comparison.");
        } finally { setIsSubmitting(false); }
    };

    return <main className="comparison-page comparison-page--builder">
        <ParticleField className="comparison-page__particles" />
        <motion.section className="comparison-builder" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .32 }}>
            <button className="comparison-back" type="button" onClick={() => navigate("/job-comparisons")}>← Job market comparisons</button>
            <span className="comparison-eyebrow">MARKET INTELLIGENCE</span>
            <h1>Compare the roles you are targeting.</h1>
            <p>Add 2–10 similar job descriptions. CareerPilot identifies recurring expectations and compares them with evidence from your saved interview report when one is linked.</p>
            <form className="comparison-builder__form" onSubmit={submit}>
                <div className="comparison-field-grid">
                    <label>Comparison name<input required maxLength="100" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full Stack Developer market" /></label>
                    <label>Target role<input required maxLength="160" value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Full Stack Developer" /></label>
                    <label>Experience level<input maxLength="80" value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)} placeholder="Entry level / 0–2 years" /></label>
                    <label>Location (optional)<input maxLength="120" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="India / Remote" /></label>
                </div>
                <div className="comparison-source-note">{sourceInterviewReport ? "Your current interview report will be used as profile evidence." : "You can still compare market demand. Start from an interview report later for an evidence-based readiness score."}</div>
                <div className="comparison-descriptions">{descriptions.map((description, index) => <article className="comparison-description-form" key={index}>
                    <header><span>JOB DESCRIPTION {index + 1}</span>{descriptions.length > 2 && <button type="button" onClick={() => removeDescription(index)}>Remove</button>}</header>
                    <div className="comparison-field-grid comparison-field-grid--description">
                        <label>Company<input maxLength="120" value={description.companyName} onChange={(event) => updateDescription(index, "companyName", event.target.value)} placeholder="Company name" /></label>
                        <label>Role title<input required maxLength="160" value={description.roleTitle} onChange={(event) => updateDescription(index, "roleTitle", event.target.value)} placeholder="Role title" /></label>
                    </div>
                    <label>Source URL (optional)<input type="url" maxLength="500" value={description.sourceUrl} onChange={(event) => updateDescription(index, "sourceUrl", event.target.value)} placeholder="https://company.com/jobs/..." /></label>
                    <label>Job description<textarea required maxLength="8000" value={description.content} onChange={(event) => updateDescription(index, "content", event.target.value)} placeholder="Paste the complete job description here…" /></label>
                </article>)}</div>
                {descriptions.length < 10 && <button type="button" className="comparison-add" onClick={() => setDescriptions((current) => [...current, blankDescription(current.length + 1)])}>+ Add another job description</button>}
                {error && <p className="comparison-error" role="alert">{error}</p>}
                <button type="submit" className="button primary-button comparison-submit" disabled={isSubmitting}>{isSubmitting ? "Comparing roles..." : "Analyze job market demand"}</button>
            </form>
        </motion.section>
    </main>;
}
