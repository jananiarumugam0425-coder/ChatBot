import React from 'react';
import { Link } from 'react-router-dom';

const SignupView = ({
    username,
    email,
    password,
    confirmPassword,
    error,
    message,
    isLoading,
    setUsername,
    setEmail,
    setPassword,
    setConfirmPassword,
    handleSubmit
}) => {
    return (
        <div className="signup-container">
            <div className="signup-card">
                <h2 className="signup-title">Sign Up</h2>

                {message && <div className="signup-success">{message}</div>}
                {error && <div className="signup-error">{error}</div>}

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Username"
                            className="signup-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-row">
                        <input
                            type="email"
                            placeholder="Email"
                            className="signup-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-row">
                        <input
                            type="password"
                            placeholder="Password"
                            className="signup-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-row">
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            className="signup-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="signup-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="signup-links">
                    <p>
                        Already have an account? <Link to="/login" className="auth-link">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupView;