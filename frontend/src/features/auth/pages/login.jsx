import React, { useState } from "react";
import { useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import "../auth.form.scss";
import { useAuth } from "../hooks/useAuth";
import ParticleField from "../../../components/ParticleField";

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


    const handleSubmit = async (e) => {
        e.preventDefault();
        await handleLogin({ email, password })
        navigate("/")
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
                    <span className="auth-brand__icon">✦</span>
                    CareerPilot AI
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
                            type="email" id="email" name="email" placeholder="you@example.com"
                        />
                    </motion.div>

                    <motion.div className="auth-input-group" custom={4} variants={fadeUp} initial="initial" animate="animate">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name="password" placeholder="Enter your password"
                        />
                    </motion.div>

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