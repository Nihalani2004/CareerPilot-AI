import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import ParticleField from "../../../components/ParticleField";
import ProfileMenu from "../../../components/ProfileMenu";
import { getLearningRoadmaps } from "../services/learning-roadmaps.api";
import "../style/learningRoadmap.scss";

const scoreLabel = (score) => score >= 80 ? "Strong momentum" : score >= 50 ? "Making progress" : "Getting started";

export default function RoadmapLibrary() {
    const navigate = useNavigate();
    const [roadmaps, setRoadmaps] = useState([]);
    const [status, setStatus] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setIsLoading(true);
        getLearningRoadmaps({ status }).then((result) => {
            if (active) setRoadmaps(result.roadmaps);
        }).catch((requestError) => {
            if (active) setError(requestError.response?.data?.message || "We could not load your learning roadmaps.");
        }).finally(() => active && setIsLoading(false));
        return () => { active = false; };
    }, [status]);

    return (
        <main className="roadmap-page">
            <ProfileMenu />
            <ParticleField className="roadmap-page__particles" />
            <section className="roadmap-library">
                <motion.header className="roadmap-library__header" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                    <div><span className="roadmap-eyebrow">IMPROVEMENT SYSTEM</span><h1>My Learning Roadmaps</h1><p>Track the work that closes your real role and interview gaps.</p></div>
                    <button type="button" className="button secondary-button" onClick={() => navigate("/")}>Create from an interview plan</button>
                </motion.header>
                <div className="roadmap-library__toolbar"><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All roadmaps</option><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label></div>
                {isLoading && <p className="roadmap-state">Loading your roadmaps...</p>}
                {!isLoading && error && <p className="roadmap-error">{error}</p>}
                {!isLoading && !error && !roadmaps.length && <section className="roadmap-empty"><h2>No learning roadmaps yet</h2><p>Generate an interview strategy, then turn its skill gaps into a structured improvement plan.</p><button type="button" className="button primary-button" onClick={() => navigate("/")}>Go to interview plans</button></section>}
                <div className="roadmap-grid">{roadmaps.map((roadmap, index) => <motion.article key={roadmap._id} className="roadmap-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} onClick={() => navigate(`/roadmaps/${roadmap._id}`)}>
                    <div className="roadmap-card__top"><span className={`roadmap-status roadmap-status--${roadmap.status}`}>{roadmap.status}</span><span>{new Date(roadmap.updatedAt).toLocaleDateString()}</span></div>
                    <h2>{roadmap.title}</h2><p>{roadmap.source.targetRole}</p>
                    <div className="roadmap-card__score"><strong>{roadmap.readiness.score}</strong><span>/100<br />{scoreLabel(roadmap.readiness.score)}</span></div>
                    <div className="roadmap-progress"><i style={{ width: `${roadmap.readiness.score}%` }} /></div>
                    <footer><span>{roadmap.summary.taskCount} focused tasks</span><span>{roadmap.settings.durationWeeks} weeks</span></footer>
                </motion.article>)}</div>
            </section>
        </main>
    );
}
