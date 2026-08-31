import { motion } from "framer-motion";
const credentials = [
  ["Secure sessions", "JWT cookie sessions, trusted-origin checks, and token blacklisting protect authenticated workflows."],
  ["Scoped data access", "Saved reports, roadmaps, comparisons, and resume scans are tied to the authenticated user."],
  ["Bounded AI work", "Rate limits, daily usage controls, queues, timeouts, and duplicate-work protection keep generation controlled."],
];
export default function LandingTrust() {
  return <section className="landing-trust landing-section" data-section="trust"><div className="landing-trust__heading"><span className="landing-eyebrow">BUILT WITH INTENT</span><h2>Your preparation data should stay connected to <em>you.</em></h2><p>CareerPilot is designed around evidence-based guidance, controlled generation, and user-scoped career workspaces.</p></div><div className="landing-trust__list">{credentials.map(([title, body], index) => <motion.article key={title} initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .5 }} transition={{ delay: index * .08, duration: .45 }}><span>0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></motion.article>)}</div></section>;
}
