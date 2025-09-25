import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
    // State for login/signup credentials
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // State for additional sign-up fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    
    // UI State
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        const apiUrl = 'http://127.0.0.1:5000';
        const url = isSignUp ? `${apiUrl}/signup` : `${apiUrl}/login`;

        // Prepare the body with required fields. Add extra fields only for sign up.
        const body = isSignUp 
            ? JSON.stringify({ username, password, full_name: fullName, email }) 
            : JSON.stringify({ username, password });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body,
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle authentication/signup errors
                throw new Error(data.error || 'Authentication failed.');
            }

            if (isSignUp) {
                // Sign-up success: Show message, clear fields, switch to Login
                setError('Sign-up successful! Please log in now.');
                setUsername('');
                setPassword('');
                setFullName(''); 
                setEmail('');
                setIsSignUp(false);
                
            } else if (data.session_token) {
                // Successful login
                onLogin(username, data.session_token);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleForgotPassword = () => {
        // Updated placeholder message and timeout for error display
        setError('Password reset is not enabled for this prototype. Please ensure you are using the correct credentials.');
        
        setTimeout(() => {
            setError('');
        }, 5000); 
    };

    const handleToggleAuth = () => {
        // Clear fields and error when toggling between forms
        setIsSignUp(!isSignUp);
        setError(''); 
        setUsername('');
        setPassword('');
        setFullName('');
        setEmail('');
    }

    // Function to handle the custom success class for styling
    const getErrorClass = () => {
        if (!error) return '';
        return error.includes('successful') ? 'login-success' : 'login-error';
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">
                    {isSignUp ? 'Sign Up' : 'Log In'}
                </h2>
                <form onSubmit={handleAuth} className="login-form" autoComplete="off">
                    
                    {/* --- Sign Up Specific Fields --- */}
                    {isSignUp && (
                        <>
                            <input
                                type="text"
                                placeholder="Full Name"
                                className="login-input"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                autoComplete="name" // Good practice for full name
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                className="login-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email" // Good practice for email
                            />
                        </>
                    )}

                    {/* --- Common Fields --- */}
                    <input
                        type="text"
                        placeholder="Username"
                        className="login-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="off" // Prevents saved usernames
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password" // Helps prevent filling with old credentials
                    />
                    
                    {/* --- Forgot Password Button --- */}
                    {!isSignUp && (
                         <button type="button" onClick={handleForgotPassword} className="forgot-password-button">
                            Forgot Password?
                         </button>
                    )}
                    
                    {/* Error/Success Message */}
                    {error && <div className={getErrorClass()}>{error}</div>}
                    
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={!username.trim() || !password.trim() || (isSignUp && (!fullName.trim() || !email.trim()))}
                    >
                        {isSignUp ? 'Sign Up' : 'Log In'}
                    </button>
                    
                </form>
                
                <button
                    onClick={handleToggleAuth}
                    className="toggle-auth-button"
                >
                    {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
                </button>
            </div>
        </div>
    );
};

export default Login;