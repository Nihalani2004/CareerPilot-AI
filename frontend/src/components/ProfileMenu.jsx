import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useTheme } from "../theme.context";

function initialsFrom(name = "") {
    const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("");
    return initials.toUpperCase() || "U";
}

function Icon({ name }) {
    const icons = {
        chevron: <path d="m8 10 4 4 4-4" />,
        plans: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5A2.5 2.5 0 0 0 17.5 16H4Z" /><path d="M4 5.5V21a2.5 2.5 0 0 1 2.5-2.5H20" /><path d="M8 7h8M8 10.5h6" /></>,
        sun: <><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /><circle cx="12" cy="12" r="4" /></>,
        moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />,
        logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></>,
    };
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}

export default function ProfileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const { user, handleLogout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const closeOnOutsideClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false);
        };
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("mousedown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, []);

    const scrollToPlans = () => {
        document.getElementById("recent-reports")?.scrollIntoView({ behavior: "smooth", block: "start" });
        setIsOpen(false);
    };

    const signOut = async () => {
        setIsSigningOut(true);
        try {
            await handleLogout();
            navigate("/login", { replace: true });
        } finally {
            setIsSigningOut(false);
        }
    };

    if (!user) return null;

    return (
        <div className="profile-menu" ref={menuRef}>
            <motion.button className="profile-menu__trigger" type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen} aria-haspopup="menu" aria-label="Open profile menu" whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                <span className="profile-menu__avatar">{initialsFrom(user.username)}</span>
                <span className="profile-menu__name">{user.username}</span>
                <Icon name="chevron" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div className="profile-menu__panel" role="menu" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                        <div className="profile-menu__identity">
                            <span className="profile-menu__avatar profile-menu__avatar--large">{initialsFrom(user.username)}</span>
                            <div><strong>{user.username}</strong><span>{user.email}</span></div>
                        </div>
                        <div className="profile-menu__divider" />
                        <button type="button" role="menuitem" className="profile-menu__item" onClick={scrollToPlans}><Icon name="plans" /><span>My interview plans</span></button>
                        <button type="button" role="menuitem" className="profile-menu__item" onClick={toggleTheme}><Icon name={theme === "light" ? "sun" : "moon"} /><span>Appearance</span><em>{theme === "light" ? "Light" : "Dark"}</em></button>
                        <div className="profile-menu__divider" />
                        <button type="button" role="menuitem" className="profile-menu__item profile-menu__item--logout" onClick={signOut} disabled={isSigningOut}><Icon name="logout" /><span>{isSigningOut ? "Signing out..." : "Log out"}</span></button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
