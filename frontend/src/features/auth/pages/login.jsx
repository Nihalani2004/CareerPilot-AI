import React, { useState } from "react";
import { useNavigate, Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import "../auth.form.scss";
import { useAuth } from "../hooks/useAuth";
import ParticleField from "../../../components/ParticleField";
import BrandLogo from "../../../components/BrandLogo";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate();

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loginError, setLoginError] = useState("")


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError("")
        try {
            await handleLogin({ email, password })
            navigate("/")
        } catch (error) {
            setLoginError(error.response?.status === 400
                ? "Invalid email or password."
                : "Unable to sign in right now. Please try again.");
        }
    }

    if (loading) {
        return (
            <main className="auth-loading">
                <div className="auth-spinner" />
                <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Authenticating...</span>
            </main>
        )
    }

    return (
        <main className="auth-page">
            <ParticleField />

            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <motion.div className="auth-brand" custom={0} variants={fadeUp} initial="initial" animate="animate">
                    <BrandLogo />
                </motion.div>

                <motion.h1 custom={1} variants={fadeUp} initial="initial" animate="animate">
                    Welcome Back
                </motion.h1>

                <motion.p className="auth-subtitle" custom={2} variants={fadeUp} initial="initial" animate="animate">
                    Sign in to continue your interview prep
                </motion.p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <motion.div className="auth-input-group" custom={3} variants={fadeUp} initial="initial" animate="animate">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name="email" placeholder="you@example.com" required
                        />
                    </motion.div>

                    <motion.div className="auth-input-group" custom={4} variants={fadeUp} initial="initial" animate="animate">
                        <label htmlFor="password">Password</label>
                        <div className="auth-password-field">
                            <input
                                onChange={(e) => { setPassword(e.target.value) }}
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                onClick={() => setShowPassword((visible) => !visible)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M3 3l18 18" />
                                        <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
                                        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9.3 4.6 10 8-.3 1.4-1.2 3.2-2.7 4.7" />
                                        <path d="M6.1 6.1C4.2 7.7 2.8 10 2 12c.8 3.4 4.5 8 10 8 1.6 0 3.1-.4 4.4-1.1" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </motion.div>

                    <AnimatePresence initial={false}>
                        {loginError && (
                            <motion.p
                                className="auth-form-error"
                                role="alert"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                            >
                                {loginError}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <motion.button
                        className="button primary-button"
                        custom={5}
                        variants={fadeUp}
                        initial="initial"
                        animate="animate"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Sign In
                    </motion.button>
                </form>

                <motion.p className="auth-footer" custom={6} variants={fadeUp} initial="initial" animate="animate">
                    Don't have an account?<Link to={"/register"}>Create one</Link>
                </motion.p>
            </motion.div>
        </main>
    )
}

export default Login;
