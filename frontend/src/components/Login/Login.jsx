import React, { useState, useEffect } from 'react';
import './Login.css';

const API_BASE_URL = 'http://127.0.0.1:5000'; 

const Login = ({ onLogin }) => {
    // State for login/signup credentials
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // State for all 5 sign-up fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(''); 
    const [country, setCountry] = useState('');         
    
    // UI State
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');

    // Clears fields when component mounts or authentication mode changes
    useEffect(() => {
        // ... (clearing logic remains the same)
        setUsername('');
        setPassword('');
        setEmail('');
        setFullName('');
        setPhoneNumber(''); 
        setCountry('');     
        setError('');
    }, [isSignUp]); 

    // Helper function to determine CSS class for messages
    const getErrorClass = () => {
        if (!error) return '';
        return error.includes('successful') ? 'login-success' : 'login-error';
    }

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        const url = isSignUp ? `${API_BASE_URL}/signup` : `${API_BASE_URL}/login`;

        // Body construction with all 7 fields for Sign Up
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body,
            });

            const data = await response.json();

            if (!response.ok) {
                setPassword('');
                throw new Error(data.error || 'Authentication failed.');
            }

            if (isSignUp) {
                setError('Sign-up successful! Please log in now.');
                setIsSignUp(false);
            } else if (data.session_token) {
                // *** CRITICAL FIX: Ensure the token is passed up ***
                onLogin(username, data.session_token); 
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleForgotPassword = () => {
        // Placeholder implementation
        setError('Password reset is not enabled for this prototype.');
        setTimeout(() => setError(''), 5000); 
    };

    const handleToggleAuth = () => {
        setIsSignUp(!isSignUp);
        setError(''); 
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">
                    {isSignUp ? 'Sign Up' : 'Log In'}
                </h2>
                <form onSubmit={handleAuth} className="login-form" autoComplete="off">
                    
                    {/* --- Sign Up Specific Fields (NEW) --- */}
                    {isSignUp && (
                        <>
                            <input type="text" placeholder="Full Name" className="login-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                            <input type="email" placeholder="Email" className="login-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                            <input type="tel" placeholder="Phone Number" className="login-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required autoComplete="tel" />
                            <input type="text" placeholder="Country" className="login-input" value={country} onChange={(e) => setCountry(e.target.value)} required autoComplete="country-name" />
                        </>
                    )}

                    {/* --- Common Fields --- */}
                    <input type="text" placeholder="Username" className="login-input" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="off" />
                    <input type="password" placeholder="Password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                    
                    {!isSignUp && (
                         <button type="button" onClick={handleForgotPassword} className="forgot-password-button">
                            Forgot Password?
                         </button>
                    )}
                    
                    {error && <div className={getErrorClass()}>{error}</div>}
                    
                    <button 
                        type="submit" 
                        className="login-button"
                        // Disable button if any required field is empty
                        disabled={!username.trim() || !password.trim() || 
                            (isSignUp && (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !country.trim()))
                        }
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