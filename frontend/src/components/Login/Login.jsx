import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginView from './LoginView';
import './Login.css';

const API_BASE_URL = 'http://127.0.0.1:5000';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Check for success message from navigation state
    useEffect(() => {
        if (location.state?.message) {
            setMessage(location.state.message);
            // Clear the state to prevent showing the message again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed.');
            }

            // Successful login
            onLogin(username, data.session_token);

        } catch (err) {
            setError(err.message);
            setPassword(''); // Clear password on error
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LoginView
            username={username}
            password={password}
            error={error}
            message={message}
            isLoading={isLoading}
            setUsername={setUsername}
            setPassword={setPassword}
            handleSubmit={handleSubmit}
        />
    );
};

export default Login;
