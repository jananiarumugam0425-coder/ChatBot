import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordView from './ForgotPasswordView';

const API_BASE_URL = 'http://127.0.0.1:5000';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Verify username, 2: Reset password
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleVerifyUsername = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!username.trim()) {
            setError('Please enter your username.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/verify_username`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Username verification failed.');
            }

            setMessage("Username verified. Please set a new password.");
            setStep(2);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!username.trim()) {
            setError('Error: Username state lost. Please restart the process.');
            setStep(1);
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

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/reset_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username, 
                    new_password: newPassword 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Password reset failed.');
            }

            setMessage(data.message);
            
            // Redirect to login after successful reset
            setTimeout(() => {
                navigate('/login', { 
                    state: { 
                        message: 'Password successfully reset. Please log in with your new password.' 
                    } 
                });
            }, 3000);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const resetProcess = () => {
        setStep(1);
        setUsername('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setMessage('');
    };

    // Pass all data and handlers to the view component
    const viewProps = {
        step,
        username,
        newPassword,
        confirmPassword,
        error,
        message,
        isLoading,
        setUsername,
        setNewPassword,
        setConfirmPassword,
        handleVerifyUsername,
        handleResetPassword,
        resetProcess
    };

    return <ForgotPasswordView {...viewProps} />;
};

export default ForgotPassword;