import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react'

const Protected = ({ children }) => {

    const { loading, user } = useAuth()

    if (loading) {
        return (
            <main className="auth-loading">
                <div className="auth-spinner" />
                <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Loading...</span>
            </main>
        )
    }
    if (!user) {
        return <Navigate to={'/login'} />
    }
    return children
}

export default Protected