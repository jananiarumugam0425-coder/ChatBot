import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordView from './ForgotPasswordView';
import './ForgotPassword.css';

const API_BASE_URL = 'http://127.0.0.1:5000';

const ForgotPassword = () => {
    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [step, setStep] = useState(1); // 1: email verification, 2: password reset
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [verifiedEmail, setVerifiedEmail] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleEmailVerification = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!formData.email) {
            setError('Please enter your email address.');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Verifying email with backend:', formData.email);
            
            const response = await fetch(`${API_BASE_URL}/forgot-password/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            });

            const data = await response.json();
            console.log('Email verification response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Email verification failed.');
            }

            setVerifiedEmail(formData.email);
            setMessage('Email verified successfully! You can now set your new password.');
            setStep(2);

        } catch (err) {
            console.error('Email verification error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!formData.newPassword || !formData.confirmPassword) {
            setError('Please fill in all password fields.');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match. Please try again.');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Resetting password for email:', verifiedEmail);
            
            const response = await fetch(`${API_BASE_URL}/forgot-password/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: verifiedEmail,
                    new_password: formData.newPassword 
                }),
            });

            const data = await response.json();
            console.log('Password reset response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Password reset failed. Please try again.');
            }

            setMessage('Password reset successfully! Redirecting to login...');
            
            // Reset form
            setFormData({
                email: '',
                newPassword: '',
                confirmPassword: ''
            });
            
            // Redirect to login after delay
            setTimeout(() => {
                navigate('/login', { 
                    state: { 
                        message: 'Password reset successfully! Please log in with your new password.' 
                    } 
                });
            }, 2000);

        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToEmail = () => {
        setStep(1);
        setError('');
        setMessage('');
        setFormData(prev => ({
            ...prev,
            newPassword: '',
            confirmPassword: ''
        }));
    };

    // Props to pass to ForgotPasswordView
    const viewProps = {
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
    };

    return <ForgotPasswordView {...viewProps} />;
};

export default ForgotPassword;