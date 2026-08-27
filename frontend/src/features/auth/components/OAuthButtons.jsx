import { motion } from "framer-motion";
import { getOAuthSignInUrl } from "../services/auth.api";

function GoogleIcon() {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.21-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.79h3.6c2.1-1.94 3.31-4.8 3.31-7.75Z" /><path fill="#34A853" d="M12 21.75c2.62 0 4.81-.87 6.41-2.36l-3.6-2.79c-1 .67-2.27 1.07-3.81 1.07-2.93 0-5.41-1.98-6.3-4.64H.98v2.88A9.68 9.68 0 0 0 12 21.75Z" /><path fill="#FBBC05" d="M4.7 13.03a5.8 5.8 0 0 1 0-3.69V6.46H.98a9.68 9.68 0 0 0 0 9.45l3.72-2.88Z" /><path fill="#EA4335" d="M12 5.1c1.74 0 3.31.6 4.54 1.77l3.4-3.4C16.81.55 14.62-.25 12-.25A9.68 9.68 0 0 0 .98 6.46L4.7 9.34C5.59 7.08 8.07 5.1 12 5.1Z" /></svg>;
}

function GitHubIcon() {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .7a11.3 11.3 0 0 0-3.57 22.02c.57.1.78-.25.78-.55v-2.15c-3.18.7-3.85-1.35-3.85-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.52-2.54-.29-5.21-1.27-5.21-5.65 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.12 1.17A10.84 10.84 0 0 1 12 5.1c.96 0 1.93.13 2.83.38 2.16-1.48 3.12-1.17 3.12-1.17.62 1.58.23 2.75.11 3.04.73.8 1.18 1.82 1.18 3.07 0 4.39-2.68 5.35-5.23 5.64.41.35.78 1.02.78 2.06v3.05c0 .3.2.66.79.55A11.3 11.3 0 0 0 12 .7Z" /></svg>;
}

const PROVIDERS = [
    { id: "google", label: "Continue with Google", icon: <GoogleIcon /> },
    { id: "github", label: "Continue with GitHub", icon: <GitHubIcon /> },
];

export default function OAuthButtons() {
    const startOAuth = (provider) => {
        window.location.assign(getOAuthSignInUrl(provider));
    };

    return (
        <div className="auth-oauth" aria-label="Social sign-in options">
            <div className="auth-oauth__divider"><span /> <em>or continue with</em> <span /></div>
            <div className="auth-oauth__buttons">
                {PROVIDERS.map((provider) => (
                    <motion.button
                        key={provider.id}
                        type="button"
                        className="auth-oauth__button"
                        onClick={() => startOAuth(provider.id)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {provider.icon}<span>{provider.label}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
