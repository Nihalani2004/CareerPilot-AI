import { useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthContext } from "../features/auth/auth.context";
import "./workspaceMenu.scss";

function MenuIcon({ type }) {
    const icons = {
        menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
        close: <><path d="m6 6 12 12M18 6 6 18" /></>,
        home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /></>,
        plan: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5A2.5 2.5 0 0 0 17.5 16H4Z" /><path d="M4 5.5V21a2.5 2.5 0 0 1 2.5-2.5H20" /><path d="M8 7h8M8 10.5h6" /></>,
        compare: <><path d="M5 4v16M19 4v16M5 7h5M5 12h9M5 17h5M14 7h5M18 12h1M14 17h5" /></>,
    };
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[type]}</svg>;
}

export default function WorkspaceMenu() {
    const { user } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        const onKeyDown = (event) => event.key === "Escape" && setIsOpen(false);
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    const isAuthPage = ["/login", "/register"].includes(window.location.pathname);
    if (!user || isAuthPage) return null;
    // This menu is mounted beside RouterProvider, so use a normal location
    // change instead of a router hook that would require a router ancestor.
    const goTo = (path) => { setIsOpen(false); window.location.assign(path); };

    return <div className="workspace-menu" ref={panelRef}>
        <motion.button className="workspace-menu__trigger" type="button" aria-label={isOpen ? "Close workspace menu" : "Open workspace menu"} aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)} whileTap={{ scale: .95 }}>
            <MenuIcon type={isOpen ? "close" : "menu"} />
        </motion.button>
        <AnimatePresence>
            {isOpen && <>
                <motion.button className="workspace-menu__backdrop" type="button" aria-label="Close workspace menu" onClick={() => setIsOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                <motion.aside className="workspace-menu__panel" aria-label="Workspace navigation" initial={{ x: -278, opacity: .7 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -278, opacity: .7 }} transition={{ type: "spring", stiffness: 330, damping: 30 }}>
                    <span className="workspace-menu__eyebrow">CAREERPILOT WORKSPACE</span>
                    <h2>Build your next move.</h2>
                    <p>Start a focused interview plan or compare the roles you are targeting.</p>
                    <nav>
                        <button type="button" className="workspace-menu__home" onClick={() => goTo("/")}><MenuIcon type="home" /><span><strong>Home</strong><small>Return to your interview workspace</small></span></button>
                        <button type="button" onClick={() => goTo("/")}><MenuIcon type="plan" /><span><strong>Create Custom Interview Plan</strong><small>Analyze one role and your profile</small></span></button>
                        <button type="button" onClick={() => goTo("/job-comparisons")}><MenuIcon type="compare" /><span><strong>Job Market Comparison</strong><small>Find recurring demand across roles</small></span></button>
                    </nav>
                </motion.aside>
            </>}
        </AnimatePresence>
    </div>;
}
