import React, { useState, useEffect } from 'react';
import './Login.css';

// Set the base URL for the Flask backend
const API_BASE_URL = 'http://127.0.0.1:5000'; 

// Define states for the different views/pages
const VIEW_STATES = {
    AUTH: 'auth', // Default view (handles Login and Sign Up toggle)
    VERIFY_USERNAME: 'verify_username', // Step 1 of Forgot Password
    RESET_PASSWORD: 'reset_password', // Step 2 of Forgot Password
};

const Login = ({ onLogin }) => {
    // --- AUTHENTICATION STATE ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(''); 
    const [country, setCountry] = useState('');    
    
    // --- UI & RESET STATE ---
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [currentView, setCurrentView] = useState(VIEW_STATES.AUTH); 
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');


    // Effect to manage state cleanup when switching modes/views
    useEffect(() => {
        // Clear unnecessary fields when switching between views
        if (currentView === VIEW_STATES.AUTH) {
            setPassword('');
            setNewPassword('');
            setConfirmPassword('');
            // Only clear username if we're switching between login/signup mode
            if (isSignUp) { 
                setFullName('');
                setEmail('');
                setPhoneNumber(''); 
                setCountry(''); 
            } else {
                 setFullName('');
                 setEmail('');
                 setPhoneNumber(''); 
                 setCountry(''); 
            }
        }
        
        // Always clear messages when the view or mode changes
        setError('');
        setMessage('');
        
    }, [isSignUp, currentView]); 

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
                setIsSignUp(false); // Switch back to login view
            } else if (data.session_token) {
                // Successful login
                onLogin(username, data.session_token); 
            }
        } catch (err) {
            setError(err.message);
        }
    };
    
    // Toggles between Login and Sign Up forms
    const handleToggleAuth = () => {
        setIsSignUp(!isSignUp);
        setUsername(''); // Clear username on toggle for fresh start
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
                // Displays "User not found." error from backend
                throw new Error(data.error || 'Username verification failed.');
            }

            // Success! Move to password reset step, keeping username in state
            setMessage("Username verified. Set a new password.");
            setCurrentView(VIEW_STATES.RESET_PASSWORD); 

        } catch (err) {
            setError(err.message);
        }
    };

    // Step 2: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!username.trim()) {
            setError('Error: Username state lost. Please restart the process.');
            setCurrentView(VIEW_STATES.AUTH);
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
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
            
            // Redirect back to login after successful reset
            setTimeout(() => {
                setUsername(''); 
                setPassword('');
                setCurrentView(VIEW_STATES.AUTH);
                setMessage('Success! You can now log in with your new password.');
            }, 3000);

        } catch (err) {
            setError(err.message);
        }
    };


    /* -------------------------------------------
       --- RENDER FUNCTIONS ---
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

            {/* Common Fields */}
            <input type="text" placeholder="Username" className="login-input" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
            <input type="password" placeholder="Password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={isSignUp ? "new-password" : "current-password"} />
            
            {/* Forgot Password Link (Only on Login View) */}
            {!isSignUp && (
                 <button 
                    type="button" 
                    onClick={() => {
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
            >
                {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
            
        </form>
    );

    const renderVerifyUsernameForm = () => (
        <form onSubmit={handleVerifyUsername} className="login-form">
            <p className='login-info'>Enter your **username** to find your account.</p>
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
                autoComplete="new-password"
            />
            <input
                type="password"
                placeholder="Confirm New Password"
                className="login-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
            />
            <button type="submit" className="login-button" disabled={!newPassword || newPassword !== confirmPassword || !username.trim()}>
                Reset Password
            </button>
        </form>
    );

    // --- RENDER MAIN CARD ---

    let title;
    let content;

    switch (currentView) {
        case VIEW_STATES.VERIFY_USERNAME:
            title = 'Forgot Password';
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
                
                {/* Toggle Button / Back to Login Button */}
                {currentView === VIEW_STATES.AUTH ? (
                    <button
                        onClick={handleToggleAuth}
                        className="toggle-auth-button"
                    >
                        {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
                    </button>
                ) : (
                     <button
                        onClick={() => {
                            // Only clear username if we're going from Reset back to Login
                            if (currentView === VIEW_STATES.RESET_PASSWORD) {
                                setUsername(''); 
                            }
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