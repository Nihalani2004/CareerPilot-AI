import { useTheme } from "../theme.context";
import { AnimatePresence, motion } from "framer-motion";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isLightMode = theme === "light";

    return (
        <motion.button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isLightMode ? "Switch to dark mode" : "Switch to light mode"}
            title={isLightMode ? "Switch to dark mode" : "Switch to light mode"}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span key={theme} className="theme-toggle__icon" aria-hidden="true" initial={{ opacity: 0, rotate: -35, scale: 0.72 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 35, scale: 0.72 }} transition={{ duration: 0.18 }}>
                    {isLightMode ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /><circle cx="12" cy="12" r="4" /></svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" /></svg>
                    )}
                </motion.span>
            </AnimatePresence>
            <span className="theme-toggle__label">{isLightMode ? "Light" : "Dark"}</span>
        </motion.button>
    );
}
