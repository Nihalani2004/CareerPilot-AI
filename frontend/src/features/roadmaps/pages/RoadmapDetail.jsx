import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import ParticleField from "../../../components/ParticleField";
import { getLearningRoadmap, updateLearningRoadmap, updateLearningTask } from "../services/learning-roadmaps.api";
import "../style/learningRoadmap.scss";

const priorityOrder = { high: 0, medium: 1, low: 2 };
const statusLabel = { todo: "To do", in_progress: "In progress", completed: "Completed", skipped: "Skipped" };

function ProgressRing({ score }) {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    return <div className="roadmap-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r={radius} /><circle className="roadmap-ring__value" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference - ((score || 0) / 100) * circumference} /></svg><div><strong>{score}</strong><span>/100</span></div></div>;
}

function TaskCard({ task, onUpdate, saving }) {
    const [open, setOpen] = useState(false);
    const nextStatus = task.status === "completed" ? "todo" : "completed";
    return <article className={`roadmap-task roadmap-task--${task.status}`}>
        <div className="roadmap-task__main">
            <button type="button" className="roadmap-task__check" disabled={saving} aria-label={`Mark ${task.title} as ${nextStatus}`} onClick={() => onUpdate(task, { status: nextStatus })}>{task.status === "completed" ? "✓" : ""}</button>
            <div><div className="roadmap-task__meta"><span className={`roadmap-priority roadmap-priority--${task.priority}`}>{task.priority}</span><span>{task.taskType.replace(/_/g, " ")}</span><span>{task.estimatedMinutes} min</span></div><h3>{task.title}</h3><p>{task.description}</p></div>
        </div>
        <div className="roadmap-task__actions"><select aria-label={`Status for ${task.title}`} value={task.status} disabled={saving} onChange={(event) => onUpdate(task, { status: event.target.value })}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={() => setOpen((current) => !current)}>{open ? "Hide resources" : "Resources"}</button></div>
        {open && <div className="roadmap-task__resources">{task.resources.map((resource) => <a key={resource.resourceId} href={resource.url} target={resource.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer"><span>{resource.provider}</span>{resource.title}<small>~{resource.estimatedMinutes} min</small></a>)}</div>}
    </article>;
}

export default function RoadmapDetail() {
    const { roadmapId } = useParams();
    const navigate = useNavigate();
    const [roadmap, setRoadmap] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState("");
    const [savingTaskId, setSavingTaskId] = useState("");
    const [isSavingTitle, setIsSavingTitle] = useState(false);

    const load = async () => {
        setError("");
        try {
            const result = await getLearningRoadmap(roadmapId);
            setRoadmap(result.roadmap);
            setTasks(result.tasks);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "We could not load this learning roadmap.");
        }
    };

    useEffect(() => { load(); }, [roadmapId]);

    const weeklyTasks = useMemo(() => tasks.reduce((weeks, task) => {
        const key = task.week;
        weeks[key] = weeks[key] || [];
        weeks[key].push(task);
        return weeks;
    }, {}), [tasks]);

    const updateTask = async (task, payload) => {
        const previousTasks = tasks;
        const previousRoadmap = roadmap;
        setSavingTaskId(task._id);
        setTasks((current) => current.map((item) => item._id === task._id ? { ...item, ...payload } : item));
        try {
            const result = await updateLearningTask(roadmapId, task._id, payload);
            setTasks((current) => current.map((item) => item._id === task._id ? result.task : item));
            setRoadmap((current) => ({ ...current, readiness: result.readiness }));
        } catch (requestError) {
            setTasks(previousTasks);
            setRoadmap(previousRoadmap);
            setError(requestError.response?.data?.message || "Task progress could not be saved.");
        } finally {
            setSavingTaskId("");
        }
    };

    const rename = async () => {
        const title = window.prompt("Roadmap name", roadmap.title);
        if (!title || title.trim() === roadmap.title) return;
        setIsSavingTitle(true);
        try {
            const result = await updateLearningRoadmap(roadmapId, { title: title.trim() });
            setRoadmap(result.roadmap);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Roadmap name could not be updated.");
        } finally { setIsSavingTitle(false); }
    };

    if (!roadmap && !error) return <main className="roadmap-page roadmap-state-page"><span>Loading your personalized roadmap...</span></main>;
    if (!roadmap) return <main className="roadmap-page roadmap-state-page"><section className="roadmap-empty"><h1>Roadmap unavailable</h1><p>{error}</p><button type="button" className="button primary-button" onClick={() => navigate("/roadmaps")}>Return to roadmaps</button></section></main>;

    const { readiness } = roadmap;
    return <main className="roadmap-page">
        <ParticleField className="roadmap-page__particles" />
        <section className="roadmap-detail">
            <header className="roadmap-detail__header"><div><button className="roadmap-back" type="button" onClick={() => navigate("/roadmaps")}>← My roadmaps</button><span className="roadmap-eyebrow">ACTIVE IMPROVEMENT PLAN</span><h1>{roadmap.title}</h1><p>For <strong>{roadmap.source.targetRole}</strong> · {roadmap.settings.durationWeeks} weeks · {roadmap.settings.hoursPerWeek} hours/week</p></div><div className="roadmap-detail__buttons"><button type="button" onClick={rename} disabled={isSavingTitle}>Rename</button><button type="button" onClick={() => navigate(`/interview/${roadmap.source.interviewReport}`)}>Open report</button></div></header>
            {error && <p className="roadmap-error" role="alert">{error}</p>}
            <section className="roadmap-readiness"><ProgressRing score={readiness.score} /><div><span className="roadmap-eyebrow">INTERVIEW-READINESS PROGRESS</span><h2>Progress you can explain.</h2><p>This score reflects completion of your personalized tasks—not a prediction of an employer’s decision.</p></div><div className="roadmap-readiness__metrics"><span><b>{readiness.weightedCompletion}%</b> weighted completion</span><span><b>{readiness.highPriorityCompletion}%</b> high-priority coverage</span><span><b>{readiness.scheduleAdherence}%</b> plan adherence</span></div></section>
            {roadmap.summary.criticalGaps.length > 0 && <section className="roadmap-critical"><span>Critical gaps to address</span>{roadmap.summary.criticalGaps.map((gap) => <b key={gap}>{gap}</b>)}</section>}
            <section className="roadmap-weeks">{Object.entries(weeklyTasks).map(([week, weekTasks]) => <section className="roadmap-week" key={week}><header><div><span>WEEK {week}</span><h2>{weekTasks.filter((task) => task.status === "completed").length} of {weekTasks.length} tasks complete</h2></div><small>{weekTasks.reduce((total, task) => total + task.estimatedMinutes, 0)} min planned</small></header><div>{[...weekTasks].sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority]).map((task) => <TaskCard key={task._id} task={task} saving={savingTaskId === task._id} onUpdate={updateTask} />)}</div></section>)}</section>
        </section>
    </main>;
}
