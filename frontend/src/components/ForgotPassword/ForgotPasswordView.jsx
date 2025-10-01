import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPasswordView = ({
    email,
    error,
    message,
    isLoading,
    setEmail,
    handleSubmit
}) => {
    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <h2 className="forgot-password-title">Reset Password</h2>

                {message && <div className="forgot-password-success">{message}</div>}
                {error && <div className="forgot-password-error">{error}</div>}

                <form onSubmit={handleSubmit} className="forgot-password-form">
                    <div className="form-row">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="forgot-password-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="forgot-password-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="forgot-password-links">
                    <p>
                        Remember your password? <Link to="/login" className="auth-link">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordView;