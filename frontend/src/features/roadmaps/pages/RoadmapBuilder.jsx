import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import ParticleField from "../../../components/ParticleField";
import { createLearningRoadmap } from "../services/learning-roadmaps.api";
import "../style/learningRoadmap.scss";

const DEFAULT_FOCUS = ["skill_gaps", "ats_evidence", "technical_interview"];
const focusOptions = [
    ["skill_gaps", "Critical skill gaps"],
    ["ats_evidence", "ATS evidence gaps"],
    ["technical_interview", "Technical interview practice"],
    ["behavioral_interview", "Behavioral interview practice"],
    ["portfolio", "Portfolio proof"],
];

const today = () => new Date().toISOString().slice(0, 10);

export default function RoadmapBuilder() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const reportId = searchParams.get("source") || "";
    const [durationWeeks, setDurationWeeks] = useState(4);
    const [hoursPerWeek, setHoursPerWeek] = useState(6);
    const [intensity, setIntensity] = useState("balanced");
    const [startDate, setStartDate] = useState(today());
    const [focusAreas, setFocusAreas] = useState(DEFAULT_FOCUS);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleFocus = (value) => setFocusAreas((current) => current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]);

    const createRoadmap = async (event) => {
        event.preventDefault();
        if (!reportId) {
            setError("Open an interview report or ATS analysis first, then choose Build Learning Roadmap.");
            return;
        }
        setError("");
        setIsSubmitting(true);
        try {
            const result = await createLearningRoadmap({
                interviewReportId: reportId,
                durationWeeks,
                hoursPerWeek,
                intensity,
                startDate,
                focusAreas,
            });
            navigate(`/roadmaps/${result.roadmap._id}`, { replace: true });
        } catch (requestError) {
            setError(requestError.response?.data?.message || "We could not create your learning roadmap.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="roadmap-page roadmap-page--builder">
            <ParticleField className="roadmap-page__particles" />
            <motion.section className="roadmap-builder" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <button className="roadmap-back" type="button" onClick={() => navigate(reportId ? `/interview/${reportId}` : "/roadmaps")}>← Back</button>
                <span className="roadmap-eyebrow">PERSONALIZED LEARNING ROADMAP</span>
                <h1>Turn your interview gaps into a practical plan.</h1>
                <p>Set a realistic pace. Your tasks will be grounded only in your saved interview report and ATS evidence.</p>

                <form onSubmit={createRoadmap} className="roadmap-builder__form">
                    <div className="roadmap-field-grid">
                        <label>Plan duration<select value={durationWeeks} onChange={(event) => setDurationWeeks(Number(event.target.value))}><option value={1}>1 week</option><option value={2}>2 weeks</option><option value={4}>4 weeks</option><option value={6}>6 weeks</option></select></label>
                        <label>Hours each week<select value={hoursPerWeek} onChange={(event) => setHoursPerWeek(Number(event.target.value))}>{[3, 4, 6, 8, 10, 12, 16].map((hours) => <option key={hours} value={hours}>{hours} hours</option>)}</select></label>
                        <label>Intensity<select value={intensity} onChange={(event) => setIntensity(event.target.value)}><option value="light">Light</option><option value="balanced">Balanced</option><option value="intensive">Intensive</option></select></label>
                        <label>Start date<input type="date" min={today()} value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
                    </div>
                    <fieldset className="roadmap-focus"><legend>What should this plan prioritize?</legend>{focusOptions.map(([value, label]) => <label key={value}><input type="checkbox" checked={focusAreas.includes(value)} onChange={() => toggleFocus(value)} /><span>{label}</span></label>)}</fieldset>
                    {error && <p className="roadmap-error" role="alert">{error}</p>}
                    <button className="button primary-button roadmap-submit" disabled={isSubmitting} type="submit">{isSubmitting ? "Building your plan..." : "Build Learning Roadmap"}</button>
                </form>
            </motion.section>
        </main>
    );
}
