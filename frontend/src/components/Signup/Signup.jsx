import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignupView from './SignupView';

const API_BASE_URL = 'http://127.0.0.1:5000';

const Signup = ({ onLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        email: '',
        phone_number: '',
        country: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (!formData.username || !formData.full_name || !formData.email || !formData.phone_number || !formData.country) {
            setError("All fields are required.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    full_name: formData.full_name,
                    email: formData.email,
                    phone_number: formData.phone_number,
                    country: formData.country
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Sign-up failed.');
            }

            // Success - redirect to login with success message
            navigate('/login', { 
                state: { 
                    message: 'Sign-up successful! Please log in.' 
                } 
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Pass all data and handlers to the view component
    const viewProps = {
        formData,
        error,
        isLoading,
        handleChange,
        handleSubmit
    };

    return <SignupView {...viewProps} />;
};

export default Signup;