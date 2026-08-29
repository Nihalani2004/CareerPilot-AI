import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import ParticleField from "../../../components/ParticleField";
import ProfileMenu from "../../../components/ProfileMenu";
import { createResumeAtsScan, deleteResumeAtsScan, getResumeAtsScans } from "../services/resume-ats.api";
import "../style/resumeAts.scss";

const fileSize = (bytes) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const processingSteps = ["Extracting PDF text", "Checking resume sections", "Evaluating skills and evidence", "Generating recommendations", "Finalizing your ATS report"];
const pause = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export default function ResumeAtsLibrary() {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [scans, setScans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [deletingScanId, setDeletingScanId] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getResumeAtsScans()
            .then((result) => active && setScans(result.scans))
            .catch((requestError) => active && setError(requestError.response?.data?.message || "We could not load your resume scans."))
            .finally(() => active && setIsLoading(false));
        return () => { active = false; };
    }, []);

    const pickFile = (file) => {
        setError("");
        if (!file) return;
        if (!/\.(pdf|docx)$/i.test(file.name) && !["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
            setError("Upload a PDF or DOCX resume for a reliable parser check.");
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            setError("Resume PDFs must be 3 MB or smaller.");
            return;
        }
        setSelectedFile(file);
    };

    const scanResume = async () => {
        if (!selectedFile) {
            setError("Choose a PDF resume first.");
            return;
        }
        setError("");
        setProcessingStep(0);
        setIsScanning(true);
        try {
            const resultPromise = createResumeAtsScan(selectedFile).then(
                (result) => ({ result }),
                (requestError) => ({ requestError }),
            );
            for (let step = 0; step < processingSteps.length; step += 1) {
                setProcessingStep(step);
                await pause(step === processingSteps.length - 1 ? 1150 : 520);
            }
            setProcessingStep(processingSteps.length);
            await pause(500);
            const { result, requestError } = await resultPromise;
            if (requestError) throw requestError;
            // Preserve the ATS checker in browser history so Back returns to
            // the upload/history screen rather than skipping to the workspace.
            navigate(`/resume-ats/${result.scan._id}`);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "We could not scan this resume.");
        } finally {
            setIsScanning(false);
        }
    };

    const removeScan = async (event, scan) => {
        event.stopPropagation();
        if (!window.confirm(`Delete the saved ATS scan for "${scan.displayName}"? This cannot be undone.`)) return;
        setError("");
        setDeletingScanId(scan._id);
        try {
            await deleteResumeAtsScan(scan._id);
            setScans((currentScans) => currentScans.filter((item) => item._id !== scan._id));
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Scan could not be deleted.");
        } finally {
            setDeletingScanId("");
        }
    };

    if (isScanning) {
        const progress = Math.min(100, 20 + processingStep * 20);
        return <main className="resume-ats-page">
            <ProfileMenu /><ParticleField className="resume-ats-page__particles" />
            <motion.section className="resume-ats-processing" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
                <aside className="resume-ats-processing__score">
                    <span className="resume-ats-eyebrow">YOUR REPORT</span>
                    <div className="resume-ats-processing__ring" style={{ "--resume-progress": `${progress}%` }}><span>{progress}%</span></div>
                    <strong>Preparing score</strong>
                    <p>Your final ATS-readiness estimate will appear next.</p>
                </aside>
                <div className="resume-ats-processing__steps">
                    <span className="resume-ats-eyebrow">RESUME ANALYSIS</span>
                    <h1>Checking your resume.</h1>
                    <p>We are parsing the PDF and evaluating the same structure, contact, skills, and evidence checks used in your report.</p>
                    <ol>{processingSteps.map((step, index) => <li key={step} className={index < processingStep ? "is-complete" : index === processingStep ? "is-active" : ""}><i>{index < processingStep ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg> : index + 1}</i><span>{step}</span>{index === processingStep && <b>In progress</b>}</li>)}</ol>
                </div>
            </motion.section>
        </main>;
    }

    return <main className="resume-ats-page">
        <ProfileMenu /><ParticleField className="resume-ats-page__particles" />
        <section className="resume-ats-library">
            <motion.header className="resume-ats-library__header" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                <div><span className="resume-ats-eyebrow">RESUME ATS CHECKER</span><h1>Is your resume good enough?</h1><p>Upload your resume to see what an applicant-tracking parser can read, where structure may be lost, and which improvements will make your application easier to scan.</p></div>
            </motion.header>
            <section className="resume-ats-upload">
                <div className="resume-ats-upload__content"><span className="resume-ats-eyebrow">UPLOAD YOUR RESUME</span><h2>Start your private ATS check.</h2></div>
                <div className="resume-ats-upload__action">
                    <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={(event) => pickFile(event.target.files?.[0])} />
                    <button className={`resume-ats-dropzone ${isDragging ? "is-dragging" : ""}`} type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); pickFile(event.dataTransfer.files?.[0]); }}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0-4 4m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg>
                        {selectedFile ? <><strong>{selectedFile.name}</strong><span>{fileSize(selectedFile.size)} - Ready to parse</span></> : <><strong>Drop your resume here or choose a file</strong><span>PDF & DOCX only - maximum 3 MB</span></>}
                    </button>
                    <button className="button primary-button" type="button" disabled={!selectedFile} onClick={scanResume}>{selectedFile ? "Parse & generate report" : "Choose a resume first"}</button>
                    <small className="resume-ats-upload__privacy">Your resume is only used to create your saved ATS report.</small>
                </div>
            </section>
            <p className="resume-ats-disclaimer">This is a parser-readiness estimate, not a hiring prediction or a score from an employer's ATS.</p>
            {error && <p className="resume-ats-error" role="alert">{error}</p>}
            <section className="resume-ats-history">
                <header><div><span className="resume-ats-eyebrow">SAVED SCANS</span><h2>Your resume history</h2></div></header>
                {isLoading && <p className="resume-ats-state">Loading saved scans...</p>}
                {!isLoading && !scans.length && <p className="resume-ats-state">Your completed ATS checks will appear here.</p>}
                <div className="resume-ats-scan-grid">{scans.map((scan, index) => <motion.article key={scan._id} className="resume-ats-scan-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} onClick={() => navigate(`/resume-ats/${scan._id}`)}><div><span>{new Date(scan.createdAt).toLocaleDateString()}</span><h3>{scan.displayName}</h3><p>{fileSize(scan.fileSize)}</p></div><div className="resume-ats-scan-card__actions"><div className="resume-ats-scan-card__score"><strong>{scan.result.overallScore}</strong><span>/100<br />{scan.result.label}</span></div><button className="resume-ats-scan-card__delete" type="button" title={`Delete ${scan.displayName}`} aria-label={`Delete ${scan.displayName}`} disabled={deletingScanId === scan._id} onClick={(event) => removeScan(event, scan)}>{deletingScanId === scan._id ? <span className="resume-ats-scan-card__spinner" aria-label="Deleting" /> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M9 7l1-2h4l1 2m-9 0 1 13h10l1-13" /></svg>}</button></div></motion.article>)}</div>
            </section>
        </section>
    </main>;
}
