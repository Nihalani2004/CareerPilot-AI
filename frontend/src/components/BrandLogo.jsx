import { motion } from "framer-motion";

export default function BrandLogo({ className = "" }) {
    return (
        <div className={`brand-logo ${className}`.trim()} aria-label="CareerPilot AI">
            <motion.svg
                className="brand-logo__mark"
                viewBox="0 0 40 40"
                role="img"
                aria-hidden="true"
                initial={{ opacity: 0, rotate: -18, scale: 0.72 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 250, damping: 17 }}
            >
                <defs>
                    <linearGradient id="careerpilot-gradient" x1="5" y1="4" x2="35" y2="37" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#a78bfa" />
                        <stop offset="0.52" stopColor="#7c3aed" />
                        <stop offset="1" stopColor="#06b6d4" />
                    </linearGradient>
                    <filter id="careerpilot-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.8" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#careerpilot-gradient)" />
                <motion.path
                    d="M11 24.5c3.2-7.7 8.8-11.9 17.8-13.1-2 8.8-6.4 14.4-14.1 17.1"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.35"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.22, duration: 0.72, ease: "easeOut" }}
                />
                <motion.path
                    d="M12.2 28.4 17 23.6m1.5-7.7 4.6 4.6"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.35"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.58, duration: 0.45, ease: "easeOut" }}
                />
                <motion.circle
                    cx="29.5"
                    cy="10.5"
                    r="2"
                    fill="#dffbff"
                    filter="url(#careerpilot-glow)"
                    animate={{ scale: [1, 1.45, 1], opacity: [0.75, 1, 0.75] }}
                    transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                />
            </motion.svg>
            <span className="brand-logo__wordmark"><strong>CareerPilot</strong><em>AI</em></span>
        </div>
    );
}
