import React from 'react';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPasswordView = ({
    formData,
    step,
    error,
    message,
    isLoading,
    verifiedEmail,
    handleChange,
    handleEmailVerification,
    handlePasswordReset,
    handleBackToEmail
}) => {
    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <h2 className="forgot-password-title">Reset Password</h2>
                
                {message && (
                    <div className="forgot-password-success">
                        <strong>Success!</strong> {message}
                    </div>
                )}
                
                {error && (
                    <div className="forgot-password-error">
                        <strong>Error!</strong> {error}
                    </div>
                )}
                
                {step === 1 ? (
                    // Step 1: Email Verification
                    <form onSubmit={handleEmailVerification} className="forgot-password-form">
                        <p className="forgot-password-subtitle">
                            Enter your email address to reset your password. We'll verify your account first.
                        </p>
                        
                        <div className="form-row">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                                placeholder="Enter your registered email address"
                                className="forgot-password-input"
                                required
                                autoComplete="email"
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="forgot-password-button"
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Verifying Email...
                                </>
                            ) : (
                                'Verify Email'
                            )}
                        </button>
                    </form>
                ) : (
                    // Step 2: Password Reset
                    <form onSubmit={handlePasswordReset} className="forgot-password-form">
                        <p className="forgot-password-subtitle">
                            Set your new password for <strong>{verifiedEmail}</strong>. Make sure it's at least 6 characters long.
                        </p>
                        
                        <div className="form-row">
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                disabled={isLoading}
                                placeholder="Enter new password (min. 6 characters)"
                                className="forgot-password-input"
                                required
                                minLength="6"
                                autoComplete="new-password"
                            />
                        </div>
                        
                        <div className="form-row">
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={isLoading}
                                placeholder="Confirm new password"
                                className="forgot-password-input"
                                required
                                minLength="6"
                                autoComplete="new-password"
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="forgot-password-button"
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Resetting Password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                        
                        <button 
                            type="button"
                            onClick={handleBackToEmail}
                            disabled={isLoading}
                            className="back-button"
                        >
                            ← Use Different Email
                        </button>
                    </form>
                )}
                
                <div className="forgot-password-links">
                    <p>
                        Remember your password? 
                        <Link to="/login" className="auth-link">
                            Log in here
                        </Link>
                    </p>
                    <p>
                        Don't have an account? 
                        <Link to="/signup" className="auth-link">
                            Sign up here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordView;