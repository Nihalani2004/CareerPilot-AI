import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router";
import BrandLogo from "../../../components/BrandLogo";

const paths = {
  home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />,
  spark: <><path d="m12 3-1.5 5.5L5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z" /><path d="m19 16-.6 2.4L16 19l2.4.6L19 22l.6-2.4L22 19l-2.4-.6L19 16Z" /></>,
  route: <><path d="M5 4v16M19 4v16M5 7h5M5 12h9M5 17h5M14 7h5M18 12h1M14 17h5" /></>,
  login: <><path d="m10 17 5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></>,
  register: <><circle cx="10" cy="8" r="3" /><path d="M4 20a6 6 0 0 1 12 0M19 8v6M16 11h6" /></>,
};
const Icon = ({ name }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;

function DockLabel({ children, isExpanded, width }) {
  return <motion.span
    className="landing-dock__label"
    aria-hidden={!isExpanded}
    initial={false}
    animate={{ width: isExpanded ? width : 0, opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -6, marginLeft: isExpanded ? 7 : 0 }}
    transition={{ duration: .34, ease: [0.22, 1, .36, 1] }}
  >{children}</motion.span>;
}

export default function FloatingLandingDock({ activeSection, onSectionChange }) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const items = [{ id: "home", label: "Home", icon: "home" }, { id: "capabilities", label: "Capabilities", icon: "spark" }, { id: "workflow", label: "Workflow", icon: "route" }];
  const collapseWhenFocusLeaves = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsExpanded(false);
  };

  return <motion.nav className="landing-dock" data-expanded={isExpanded} aria-label="Landing page navigation" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ opacity: { delay: 1.05, duration: .58, ease: [0.22, 1, .36, 1] }, y: { delay: 1.05, duration: .58, ease: [0.22, 1, .36, 1] }, layout: { duration: .42, ease: [0.22, 1, .36, 1] } }} layout="size" onHoverStart={() => setIsExpanded(true)} onHoverEnd={() => setIsExpanded(false)} onFocusCapture={() => setIsExpanded(true)} onBlurCapture={collapseWhenFocusLeaves}>
    <button className="landing-dock__brand" type="button" aria-label="Back to landing page hero" onClick={() => onSectionChange("home")}><BrandLogo /></button><span className="landing-dock__divider" />
    <div className="landing-dock__sections">{items.map((item) => { const active = activeSection === item.id; const labelWidths = { home: 46, capabilities: 98, workflow: 68 }; return <a key={item.id} href={`#${item.id}`} className={`landing-dock__item ${active ? "is-active" : ""}`} onClick={(event) => { event.preventDefault(); onSectionChange(item.id); }} aria-current={active ? "page" : undefined}>{active && <motion.span className="landing-dock__active" layoutId="landing-dock-active" transition={{ type: "spring", stiffness: 360, damping: 30 }} />}<Icon name={item.icon} /><DockLabel isExpanded={isExpanded} width={labelWidths[item.id]}>{item.label}</DockLabel></a>; })}</div>
    <div className="landing-dock__auth"><button type="button" onClick={() => navigate("/login")}><Icon name="login" /><DockLabel isExpanded={isExpanded} width={50}>Sign in</DockLabel></button><button type="button" onClick={() => navigate("/register")}><Icon name="register" /><DockLabel isExpanded={isExpanded} width={58}>Register</DockLabel></button></div>
  </motion.nav>;
}
