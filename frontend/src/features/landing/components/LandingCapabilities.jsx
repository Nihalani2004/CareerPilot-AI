import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { landingCapabilities } from "../data/landingContent";

function FeatureVisual({ type }) {
  if (type === "interview") return <div className="landing-preview landing-preview--interview"><span className="landing-preview__label">TECHNICAL QUESTIONS</span><article><b>Q1</b><p>Explain the trade-offs behind a production-ready API design.</p><i>Interviewer intent</i></article><article><b>Q2</b><p>How would you show ownership when a requirement changes?</p><i>Model answer guidance</i></article></div>;
  if (type === "ats") return <div className="landing-preview landing-preview--ats"><span className="landing-preview__label">ROLE EVIDENCE</span><div className="landing-preview__ring"><strong>Fit</strong></div><ul><li className="is-found"><span>React.js</span><b>Evidence found</b></li><li className="is-focus"><span>CI/CD</span><b>Focus area</b></li><li className="is-focus"><span>System design</span><b>Focus area</b></li></ul></div>;
  if (type === "roadmap") return <div className="landing-preview landing-preview--roadmap"><span className="landing-preview__label">ACTIVE ROADMAP</span><article><b>Week 1</b><p>Strengthen role fundamentals</p><i>Tasks · resources · progress</i></article><article><b>Week 2</b><p>Practice applied scenarios</p><i>Tasks · resources · progress</i></article><div className="landing-preview__progress"><span>Interview readiness</span><i><b /></i></div></div>;
  if (type === "market") return <div className="landing-preview landing-preview--market"><span className="landing-preview__label">RECURRING DEMAND</span><p>Skills repeatedly requested across the roles you selected.</p><div><b>JavaScript</b><b>REST APIs</b><b>MongoDB</b><b>Docker</b><b>Testing</b></div><i>Compare descriptions to see the pattern.</i></div>;
  return <div className="landing-preview landing-preview--resume"><span className="landing-preview__label">PARSER-READINESS CHECK</span><div className="landing-preview__document"><i /><i /><i /><i /></div><ul><li><span>Contact details</span><b>Detected</b></li><li><span>Resume sections</span><b>Detected</b></li><li><span>Achievement evidence</span><b>Improve</b></li></ul></div>;
}

export default function LandingCapabilities() {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "start 42%"] });
  const headerY = useTransform(scrollYProgress, [0, .22, 1], [170, 110, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, .24, .72, 1], [0, .16, .8, 1]);

  return <section ref={sectionRef} id="capabilities" className="landing-capabilities landing-section" data-section="capabilities">
    <motion.header className="landing-section-heading" style={reduceMotion ? undefined : { y: headerY, opacity: headerOpacity, willChange: "transform, opacity" }}>
      <span className="landing-eyebrow">CAPABILITIES</span>
      <h2>Everything you need to prepare with <em>intent.</em></h2>
      <p>CareerPilot keeps the role, your evidence, and the next action in the same focused workflow.</p>
    </motion.header>
    <div className="landing-capabilities__list">{landingCapabilities.map((feature, index) => <motion.article className={`landing-capability landing-capability--${feature.id}`} key={feature.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .24 }} transition={{ duration: .64, delay: index % 2 ? .08 : 0, ease: [0.22, 1, .36, 1] }}><div className="landing-capability__copy"><span className="landing-capability__number">0{index + 1}</span><p className="landing-eyebrow">{feature.eyebrow}</p><h3>{feature.title}</h3><p>{feature.body}</p><div className="landing-capability__tags">{feature.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><FeatureVisual type={feature.id} /></motion.article>)}</div>
  </section>;
}
