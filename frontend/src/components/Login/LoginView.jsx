import React from 'react';
import { Link } from 'react-router-dom';

const LoginView = ({
    username,
    password,
    error,
    message,
    isLoading,
    setUsername,
    setPassword,
    handleSubmit
}) => {
    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Log In</h2>

                {message && <div className="login-success">{message}</div>}
                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Username"
                            className="login-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-row">
                        <input
                            type="password"
                            placeholder="Password"
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="forgot-password-link">
                        <Link to="/forgot-password" className="auth-link">
                            Forgot your password?
                        </Link>
                    </div>

                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <div className="login-links">
                    <p>
                        Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;