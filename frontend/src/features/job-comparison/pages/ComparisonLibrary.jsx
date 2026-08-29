import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import ParticleField from "../../../components/ParticleField";
import ProfileMenu from "../../../components/ProfileMenu";
import { getJobComparisons } from "../services/job-comparison.api";
import "../style/jobComparison.scss";

export default function ComparisonLibrary() {
    const navigate = useNavigate();
    const [comparisons, setComparisons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getJobComparisons().then((result) => active && setComparisons(result.comparisons)).catch((requestError) => active && setError(requestError.response?.data?.message || "We could not load your job market comparisons.")).finally(() => active && setIsLoading(false));
        return () => { active = false; };
    }, []);

    return <main className="comparison-page">
        <ProfileMenu />
        <ParticleField className="comparison-page__particles" />
        <section className="comparison-library">
            <motion.header className="comparison-library__header" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                <div><span className="comparison-eyebrow">JOB MARKET INTELLIGENCE</span><h1>Compare target roles with evidence.</h1><p>Find what companies repeatedly ask for, then focus your preparation on the skills with the strongest market signal.</p></div>
                <button type="button" className="button primary-button" onClick={() => navigate("/job-comparisons/new")}>Compare job descriptions</button>
            </motion.header>
            {isLoading && <p className="comparison-state">Loading comparisons…</p>}
            {!isLoading && error && <p className="comparison-error">{error}</p>}
            {!isLoading && !error && !comparisons.length && <section className="comparison-empty"><h2>No market comparison yet</h2><p>Add two or more roles for the same target position. The analysis is deterministic, transparent, and stored privately in your account.</p><button type="button" className="button primary-button" onClick={() => navigate("/job-comparisons/new")}>Create first comparison</button></section>}
            <div className="comparison-grid">{comparisons.map((comparison, index) => <motion.article key={comparison._id} className="comparison-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} onClick={() => navigate(`/job-comparisons/${comparison._id}`)}>
                <header><span>{comparison.analysis.totalDescriptions} job descriptions</span><time>{new Date(comparison.updatedAt).toLocaleDateString()}</time></header>
                <h2>{comparison.name}</h2><p>{comparison.targetRole}{comparison.location ? ` · ${comparison.location}` : ""}</p>
                <div className="comparison-card__score"><strong>{comparison.analysis.readiness.score}</strong><span>/100<br />role readiness</span></div>
                <div className="comparison-progress"><i style={{ width: `${comparison.analysis.readiness.score}%` }} /></div>
                <footer>{comparison.analysis.repeatedSkills.slice(0, 3).map((skill) => <b key={skill.key}>{skill.label}</b>)}</footer>
            </motion.article>)}</div>
        </section>
    </main>;
}
