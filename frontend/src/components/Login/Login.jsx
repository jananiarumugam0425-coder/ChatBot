import React, { useState, useEffect } from 'react';
import './Login.css';
import AuthForms from './AuthForms'; // Import the new rendering component

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
            // Clear all sign-up specific fields regardless of whether we are switching modes or coming from a non-auth view.
            setFullName('');
            setEmail('');
            setPhoneNumber(''); 
            setCountry(''); 
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

    // Consolidated props object to pass to the AuthForms component
    const formProps = {
        // State
        username, setUsername, 
        password, setPassword,
        fullName, setFullName, 
        email, setEmail, 
        phoneNumber, setPhoneNumber, 
        country, setCountry, 
        isSignUp, 
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        currentView, setCurrentView,
        VIEW_STATES,

        // Handlers
        handleAuth, 
        handleVerifyUsername, 
        handleResetPassword,
        handleToggleAuth,

        // UI Helpers
        title: isSignUp ? 'Sign Up' : 'Log In',
        error, message, getMessageClass
    };


    return (
        <div className="login-container">
            <div className="login-card">
                <AuthForms {...formProps} />
            </div>
        </div>
    );
};

export default Login;