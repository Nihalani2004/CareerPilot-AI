import { motion } from "framer-motion";
import { landingWorkflow } from "../data/landingContent";
export default function LandingWorkflow() {
  return <section id="workflow" className="landing-workflow landing-section" data-section="workflow"><header className="landing-section-heading landing-section-heading--center"><span className="landing-eyebrow">WORKFLOW</span><h2>Four steps to a more focused <em>application.</em></h2></header><div className="landing-workflow__steps">{landingWorkflow.map((step, index) => <motion.article key={step.number} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .38 }} transition={{ duration: .5, delay: index * .07 }}><span>{step.number}</span><h3>{step.title}</h3><p>{step.body}</p>{index !== landingWorkflow.length - 1 && <i aria-hidden="true">→</i>}</motion.article>)}</div></section>;
}
