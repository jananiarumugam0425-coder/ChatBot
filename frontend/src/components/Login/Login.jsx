import React, { useState, useEffect } from 'react';
import './Login.css';

const API_BASE_URL = 'http://127.0.0.1:5000'; 

const VIEW_STATES = {
    AUTH: 'auth',
    VERIFY_USERNAME: 'verify_username', 
    RESET_PASSWORD: 'reset_password', 
};

const Login = ({ onLogin }) => {
    // Auth State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(''); 
    const [country, setCountry] = useState('');    
    
    // UI State
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [currentView, setCurrentView] = useState(VIEW_STATES.AUTH); 
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');


    // --- CRITICAL FIX HERE ---
    // Clears fields ONLY when changing between AUTH mode (Login/Signup) or when returning to AUTH view.
    // It must NOT clear 'username' when moving from VERIFY_USERNAME to RESET_PASSWORD.
    useEffect(() => {
        // Clear all fields when switching authentication mode
        if (currentView === VIEW_STATES.AUTH) {
            setPassword('');
            setFullName('');
            setEmail('');
            setPhoneNumber(''); 
            setCountry('');     
        }
        
        // Always clear messages on state change
        setError('');
        setMessage('');
        setNewPassword('');
        setConfirmPassword('');
        
        // When switching from VERIFY to RESET, we intentionally keep 'username' state intact.
        
    }, [isSignUp, currentView]); // Keep dependencies as they are, but adjust logic inside

    // Helper function to determine CSS class for messages
    const getMessageClass = () => {
        if (error) return 'login-error';
        if (message) return 'login-success';
        return '';
    }

    /* -------------------------------------------
       --- AUTHENTICATION LOGIC (Login / Sign Up)---
       ------------------------------------------- */

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        const url = isSignUp ? `${API_BASE_URL}/signup` : `${API_BASE_URL}/login`;

        const body = isSignUp 
            ? JSON.stringify({ 
                username, 
                password, 
                full_name: fullName, 
                email,
                phone_number: phoneNumber,
                country: country
            }) 
            : JSON.stringify({ username, password });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body,
            });

            const data = await response.json();

            if (!response.ok) {
                setPassword('');
                throw new Error(data.error || 'Authentication failed.');
            }

            if (isSignUp) {
                setMessage('Sign-up successful! Please log in now.');
                setIsSignUp(false);
            } else if (data.session_token) {
                onLogin(username, data.session_token); 
            }
        } catch (err) {
            setError(err.message);
        }
    };
    
    const handleToggleAuth = () => {
        setIsSignUp(!isSignUp);
        // CRITICAL: We also need to clear username here when toggling between signup/login
        setUsername(''); 
        setError(''); 
    }

    /* -------------------------------------------
       --- PASSWORD RESET LOGIC ---
       ------------------------------------------- */

    // Step 1: Verify Username
    const handleVerifyUsername = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // NOTE: username state is already set by the input field in the render function.

        if (!username.trim()) {
            setError('Please enter your username.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/verify_username`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            const data = await response.json();

            if (!response.ok) {
                // If backend returns a 404/400/error
                throw new Error(data.error || 'Username verification failed.');
            }

            // Success! The username is validated and stored in the state.
            setMessage("Username verified. Please set your new password.");
            setCurrentView(VIEW_STATES.RESET_PASSWORD); // Move to password reset step

        } catch (err) {
            setError(err.message);
        }
    };

    // Step 2: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // CRITICAL CHECK: Ensure username is still present in state
        if (!username.trim()) {
            setError('Cannot reset password: Username was lost. Please restart the process.');
            setCurrentView(VIEW_STATES.AUTH);
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/reset_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, new_password: newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Password reset failed.');
            }

            setMessage(data.message);
            
            // Redirect back to login after a short delay
            setTimeout(() => {
                setUsername(''); // Clear username only after successful reset
                setCurrentView(VIEW_STATES.AUTH);
                setMessage('You can now log in with your new password.');
            }, 3000);

        } catch (err) {
            setError(err.message);
        }
    };


    /* -------------------------------------------
       --- RENDER LOGIC ---
       ------------------------------------------- */

    const renderAuthForm = () => (
        <form onSubmit={handleAuth} className="login-form" autoComplete="off">
            
            {/* Sign Up Specific Fields */}
            {isSignUp && (
                <>
                    <input type="text" placeholder="Full Name" className="login-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                    <input type="email" placeholder="Email" className="login-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                    <input type="tel" placeholder="Phone Number" className="login-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required autoComplete="tel" />
                    <input type="text" placeholder="Country" className="login-input" value={country} onChange={(e) => setCountry(e.target.value)} required autoComplete="country-name" />
                </>
            )}

            {/* Common Fields (Username will be cleared on toggle/auth) */}
            <input type="text" placeholder="Username" className="login-input" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="off" />
            <input type="password" placeholder="Password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            
            {/* Forgot Password Button */}
            {!isSignUp && (
                 <button 
                    type="button" 
                    onClick={() => {
                        // Clear password field but KEEP username if it was partially entered
                        setPassword(''); 
                        setCurrentView(VIEW_STATES.VERIFY_USERNAME);
                    }} 
                    className="forgot-password-button"
                 >
                    Forgot Password?
                 </button>
            )}
            
            <button 
                type="submit" 
                className="login-button"
                disabled={!username.trim() || !password.trim() || 
                    (isSignUp && (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !country.trim()))
                }
            >
                {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
            
        </form>
    );

    const renderVerifyUsernameForm = () => (
        <form onSubmit={handleVerifyUsername} className="login-form">
            <p className='login-info'>Enter your username to begin the password reset process.</p>
            <input
                type="text"
                placeholder="Enter Username"
                className="login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <button type="submit" className="login-button">
                Verify Username
            </button>
        </form>
    );

    const renderResetPasswordForm = () => (
        <form onSubmit={handleResetPassword} className="login-form">
            <p className='login-info'>Set a new password for user: **{username}**</p>
            <input
                type="password"
                placeholder="New Password (min 6 chars)"
                className="login-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Confirm New Password"
                className="login-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />
            <button type="submit" className="login-button" disabled={!newPassword || newPassword !== confirmPassword || !username.trim()}>
                Reset Password
            </button>
        </form>
    );

    let title;
    let content;

    switch (currentView) {
        case VIEW_STATES.VERIFY_USERNAME:
            title = 'Verify Username';
            content = renderVerifyUsernameForm();
            break;
        case VIEW_STATES.RESET_PASSWORD:
            title = 'Set New Password';
            content = renderResetPasswordForm();
            break;
        case VIEW_STATES.AUTH:
        default:
            title = isSignUp ? 'Sign Up' : 'Log In';
            content = renderAuthForm();
            break;
    }


    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">{title}</h2>
                
                {/* Message/Error Display */}
                {(message || error) && <div className={getMessageClass()}>{message || error}</div>}
                
                {content}
                
                {/* Back to Login/Toggle Auth Button */}
                {currentView === VIEW_STATES.AUTH && (
                    <button
                        onClick={handleToggleAuth}
                        className="toggle-auth-button"
                    >
                        {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
                    </button>
                )}
                 {currentView !== VIEW_STATES.AUTH && (
                    <button
                        onClick={() => {
                            setUsername(''); // Clear username when going back
                            setCurrentView(VIEW_STATES.AUTH);
                        }}
                        className="toggle-auth-button"
                    >
                        &larr; Back to Log In
                    </button>
                )}
            </div>
        </div>
    );
};

export default Login;