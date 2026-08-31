import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router";

const transitionStats = [
  ["01", "INTERVIEW STRATEGY"],
  ["02", "ATS INTELLIGENCE"],
  ["03", "LEARNING ROADMAPS"],
  ["04", "MARKET INSIGHTS"],
];

const rise = (delay, distance = 26) => ({
  initial: { opacity: 0, y: distance },
  animate: { opacity: 1, y: 0, transition: { delay, duration: .78, ease: [0.22, 1, .36, 1] } },
});

export default function LandingHero({ onExplore }) {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });

  // The stage remains in view long enough for the hero to fade into the network,
  // rather than simply leaving with normal document scrolling.
  const compositionY = useTransform(scrollYProgress, [0, .1, .29, .43, 1], [0, -18, -164, -318, -362]);
  const compositionOpacity = useTransform(scrollYProgress, [0, .12, .28, .43, 1], [1, .98, .56, .05, 0]);
  const scrollPromptY = useTransform(scrollYProgress, [0, .4, 1], [0, -68, -92]);
  const scrollPromptOpacity = useTransform(scrollYProgress, [0, .2, .42], [1, .45, 0]);
  const statsY = useTransform(scrollYProgress, [0, .15, .36, .62], [156, 102, 0, -26]);
  const statsOpacity = useTransform(scrollYProgress, [0, .12, .3, .62], [0, .05, .92, 1]);

  return <section ref={sectionRef} id="home" className="landing-hero landing-section" data-section="home">
    <div className="landing-hero__index" aria-hidden="true"><b>01</b><span>02</span><span>03</span><span>04</span><span>05</span><i>/05</i></div>
    <div className="landing-hero__stage">
      <motion.div className="landing-hero__content" style={reduceMotion ? undefined : { y: compositionY, opacity: compositionOpacity, willChange: "transform, opacity" }}>
        <motion.p className="landing-eyebrow" {...rise(.22, 16)}><span>✧</span> AI-Powered Career Readiness</motion.p>
        <motion.h1>
          <motion.span className="landing-hero__headline" {...rise(.38, 32)}>Build a stronger case</motion.span>
          <motion.em {...rise(.53, 28)}>for your next interview.</motion.em>
        </motion.h1>
        <motion.p className="landing-hero__copy" {...rise(.72, 22)}>CareerPilot turns your job description and real experience into interview strategy, ATS evidence, skill-gap priorities, and a focused plan to improve.</motion.p>
        <motion.div className="landing-hero__actions" {...rise(.89, 18)}>
          <motion.button className="landing-button landing-button--primary" type="button" onClick={() => navigate("/login")} whileTap={{ scale: .97 }}>Create an interview plan <span>→</span></motion.button>
          <motion.button className="landing-button landing-button--secondary" type="button" onClick={onExplore} whileTap={{ scale: .97 }}>Explore capabilities</motion.button>
        </motion.div>
      </motion.div>
      <motion.div className="landing-hero__scroll" aria-hidden="true" style={reduceMotion ? undefined : { y: scrollPromptY, opacity: scrollPromptOpacity }} {...rise(1.01, 10)}><span /> Scroll to explore</motion.div>
      <motion.div className="landing-hero__stats" aria-label="CareerPilot platform capabilities" style={reduceMotion ? undefined : { y: statsY, opacity: statsOpacity, willChange: "transform, opacity" }}>
        {transitionStats.map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}
      </motion.div>
    </div>
  </section>;
}
