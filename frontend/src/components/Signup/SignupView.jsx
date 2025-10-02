import React from 'react';
import { Link } from 'react-router-dom';
import './Signup.css';

const SignupView = ({
    formData,
    error,
    message,
    isLoading,
    handleChange,
    handleSubmit
}) => {
    return (
        <div className="signup-container">
            <div className="signup-card">
                <h2 className="signup-title">Create Account</h2>
                <p className="signup-subtitle">Join our timesheet chatbot platform</p>
                
                {message && (
                    <div className="signup-success">
                        <strong>Success!</strong> {message}
                    </div>
                )}
                
                {error && (
                    <div className="signup-error">
                        <strong>Error!</strong> {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="signup-form">
                    {/* Username Field */}
                    <div className="form-row">
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={isLoading}
                            placeholder="Choose a username"
                            className="signup-input"
                            required
                            autoComplete="username"
                        />
                    </div>
                    
                    {/* Password Field */}
                    <div className="form-row">
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                            placeholder="Create a password (min. 6 characters)"
                            className="signup-input"
                            required
                            autoComplete="new-password"
                            minLength="6"
                        />
                    </div>
                    
                    {/* Full Name Field */}
                    <div className="form-row">
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            disabled={isLoading}
                            placeholder="Enter your full name"
                            className="signup-input"
                            required
                            autoComplete="name"
                        />
                    </div>
                    
                    {/* Email Field */}
                    <div className="form-row">
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            placeholder="Enter your email address"
                            className="signup-input"
                            required
                            autoComplete="email"
                        />
                    </div>
                    
                    {/* Phone Number Field */}
                    <div className="form-row">
                        <input
                            type="tel"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            disabled={isLoading}
                            placeholder="Enter your phone number"
                            className="signup-input"
                            required
                            autoComplete="tel"
                        />
                    </div>
                    
                    {/* Country Field */}
                    <div className="form-row">
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            disabled={isLoading}
                            placeholder="Enter your country"
                            className="signup-input"
                            required
                            autoComplete="country"
                        />
                    </div>
                    
                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="signup-button"
                    >
                        {isLoading ? (
                            <>
                                <span className="loading-spinner"></span>
                                Creating Account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                    
                    {/* Links Section */}
                    <div className="signup-links">
                        <p>
                            Already have an account? 
                            <Link to="/login" className="auth-link">
                                Log in here
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupView;