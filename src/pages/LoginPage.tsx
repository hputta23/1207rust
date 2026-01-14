import { useState } from 'react';
import { useAuth } from '../state/auth-context';

export function LoginPage() {
    const { login, isLoading, error } = useAuth();

    // Form State
    const [username, setUsername] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(username);
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            background: '#05070a',
            color: '#fff',
        }}>
            {/* Left Side - Brand / Visual */}
            <div className="login-brand-panel" style={{
                flex: '1',
                background: 'radial-gradient(circle at 10% 20%, rgb(4, 9, 30) 0%, rgb(11, 23, 54) 90.1%)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '80px',
                overflow: 'hidden'
            }}>
                {/* Decorative Elements */}
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                    zIndex: 1
                }} />

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        marginBottom: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <img src="/logo.png" alt="Seventeen29 Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>

                    <h1 style={{
                        fontSize: '56px',
                        fontWeight: 800,
                        marginBottom: '24px',
                        lineHeight: 1.1,
                        letterSpacing: '-1px',
                        background: 'linear-gradient(to right, #fff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Seventeen29 <br /> Trading Intelligence
                    </h1>

                    <p style={{
                        fontSize: '20px',
                        color: '#64748b',
                        lineHeight: 1.6,
                        maxWidth: '520px',
                        fontWeight: 400
                    }}>
                        Advanced market signals and institutional-grade analytics for the modern trader.
                    </p>
                </div>
            </div>

            {/* Mobile / Left Panel Style helper */}
            <style>{`
                @media (max-width: 900px) {
                    .login-brand-panel { display: none !important; }
                }
            `}</style>

            {/* Right Side - Form */}
            <div style={{
                flex: '0 0 550px',
                maxWidth: '100%',
                background: '#05070a',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center', // Centering vertically
                alignItems: 'center',     // Centering horizontally
                padding: '40px',
                borderLeft: '1px solid #1e293b'
            }}>
                <div style={{ width: '100%', maxWidth: '360px' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
                            Sign in to your account
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>
                            Enter your username to access the terminal
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '13px',
                            marginBottom: '24px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Trader1"
                                style={{
                                    padding: '14px 16px',
                                    background: '#0f172a',
                                    border: '1px solid #1e293b',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#1e293b'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                marginTop: '8px',
                                padding: '14px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1,
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            {isLoading ? (
                                <span className="spinner" style={{
                                    width: '18px', height: '18px',
                                    border: '2px solid #fff', borderTopColor: 'transparent',
                                    borderRadius: '50%', display: 'inline-block',
                                    animation: 'spin 0.8s linear infinite'
                                }} />
                            ) : (
                                'Sign In'
                            )}
                        </button>
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </form>

                    <div style={{
                        marginTop: '60px',
                        textAlign: 'center',
                        color: '#475569',
                        fontSize: '12px'
                    }}>
                        © 2024 Seventeen29. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
