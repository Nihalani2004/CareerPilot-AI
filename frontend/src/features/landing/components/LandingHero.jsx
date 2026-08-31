import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router";

const rise = (delay, distance = 26) => ({
  initial: { opacity: 0, y: distance },
  animate: { opacity: 1, y: 0, transition: { delay, duration: .78, ease: [0.22, 1, .36, 1] } },
});

export default function LandingHero({ onExplore }) {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const eyebrowY = useTransform(scrollYProgress, [0, 1], [0, -82]);
  const headlineY = useTransform(scrollYProgress, [0, 1], [0, -148]);
  const headlineOpacity = useTransform(scrollYProgress, [0, .67, .95], [1, .78, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const copyOpacity = useTransform(scrollYProgress, [0, .78, 1], [1, .82, 0]);
  const actionsY = useTransform(scrollYProgress, [0, 1], [0, -74]);
  const actionsOpacity = useTransform(scrollYProgress, [0, .85, 1], [1, .9, 0]);

  return <section ref={sectionRef} id="home" className="landing-hero landing-section" data-section="home">
    <div className="landing-hero__index" aria-hidden="true"><b>01</b><span>02</span><span>03</span><span>04</span><span>05</span><i>/05</i></div>
    <div className="landing-hero__content">
      <motion.p className="landing-eyebrow" style={reduceMotion ? undefined : { y: eyebrowY }} {...rise(.22, 16)}><span>✧</span> AI-POWERED CAREER READINESS</motion.p>
      <motion.h1 style={reduceMotion ? undefined : { y: headlineY, opacity: headlineOpacity }}>
        <motion.span className="landing-hero__headline" {...rise(.38, 32)}>Build a stronger case</motion.span>
        <motion.em {...rise(.53, 28)}>for your next interview.</motion.em>
      </motion.h1>
      <motion.p className="landing-hero__copy" style={reduceMotion ? undefined : { y: copyY, opacity: copyOpacity }} {...rise(.72, 22)}>CareerPilot turns your job description and real experience into interview strategy, ATS evidence, skill-gap priorities, and a focused plan to improve.</motion.p>
      <motion.div className="landing-hero__actions" style={reduceMotion ? undefined : { y: actionsY, opacity: actionsOpacity }} {...rise(.89, 18)}>
        <motion.button className="landing-button landing-button--primary" type="button" onClick={() => navigate("/login")} whileTap={{ scale: .97 }}>Create an interview plan <span>→</span></motion.button>
        <motion.button className="landing-button landing-button--secondary" type="button" onClick={onExplore} whileTap={{ scale: .97 }}>Explore capabilities</motion.button>
      </motion.div>
    </div>
    <motion.div className="landing-hero__scroll" aria-hidden="true" {...rise(1.01, 10)}><span /> Scroll to explore</motion.div>
  </section>;
}
