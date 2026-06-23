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

const Register = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const { loading, handleRegister } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault();
        await handleRegister({ username, email, password })
        navigate("/")
    }

    if (loading) {
        return (
            <main className="auth-loading">
                <div className="auth-spinner" />
                <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Creating your account...</span>
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
                    Create Account
                </motion.h1>

                <motion.p className="auth-subtitle" custom={2} variants={fadeUp} initial="initial" animate="animate">
                    Start your AI-powered interview preparation
                </motion.p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <motion.div className="auth-input-group" custom={3} variants={fadeUp} initial="initial" animate="animate">
                        <label htmlFor="username">Username</label>
                        <input
                            onChange={(e) => { setUsername(e.target.value) }}
                            type="text" id="username" name="username" placeholder="Choose a username"
                        />
                    </motion.div>

                    <motion.div className="auth-input-group" custom={4} variants={fadeUp} initial="initial" animate="animate">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name="email" placeholder="you@example.com"
                        />
                    </motion.div>

                    <motion.div className="auth-input-group" custom={5} variants={fadeUp} initial="initial" animate="animate">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name="password" placeholder="Create a strong password"
                        />
                    </motion.div>

                    <motion.button
                        className="button primary-button"
                        custom={6}
                        variants={fadeUp}
                        initial="initial"
                        animate="animate"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Create Account
                    </motion.button>
                </form>

                <motion.p className="auth-footer" custom={7} variants={fadeUp} initial="initial" animate="animate">
                    Already have an account?<Link to={"/login"}>Sign in</Link>
                </motion.p>
            </motion.div>
        </main>
    )
}
export default Register;