import { useNavigate } from "react-router";
import BrandLogo from "../../../components/BrandLogo";

export default function LandingFooter({ onSectionChange }) {
  const navigate = useNavigate();
  return <>
    <section className="landing-final landing-section" data-section="final">
      <span className="landing-eyebrow">START WITH THE ROLE YOU WANT</span>
      <h2>Build a more confident case for your <em>next opportunity.</em></h2>
      <p>Bring the job description. CareerPilot will help you understand what to prepare, what to improve, and where to focus.</p>
      <div><button className="landing-button landing-button--primary" type="button" onClick={() => navigate("/register")}>Create your account <span>→</span></button><button className="landing-button landing-button--secondary" type="button" onClick={() => navigate("/login")}>Sign in</button></div>
    </section>
    <footer className="landing-footer">
      <button type="button" onClick={() => onSectionChange("home")}><BrandLogo /></button>
      <p>AI-powered interview strategy, ATS Intelligence, learning roadmaps, and job-market comparison.<small>Built by Mayank</small></p>
      <nav aria-label="Footer navigation"><button type="button" onClick={() => onSectionChange("capabilities")}>Capabilities</button><button type="button" onClick={() => onSectionChange("workflow")}>Workflow</button><button type="button" onClick={() => navigate("/login")}>Sign in</button><button type="button" onClick={() => navigate("/register")}>Register</button></nav>
    </footer>
  </>;
}
