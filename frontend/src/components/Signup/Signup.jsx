import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignupView from './SignupView';
import './Signup.css';

const API_BASE_URL = 'http://127.0.0.1:5000';

const Signup = ({ onLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        email: '',
        phone_number: '',
        country: ''
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Validate all fields are filled
        const { username, password, full_name, email, phone_number, country } = formData;
        if (!username || !password || !full_name || !email || !phone_number || !country) {
            setError('Please fill in all fields.');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Sending signup request with data:', { ...formData, password: '***' });
            
            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            console.log('Signup response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed. Please try again.');
            }

            // Successful signup - show message and redirect to login
            setMessage(data.message || 'Signup successful! Please log in.');
            
            // Clear form
            setFormData({
                username: '',
                password: '',
                full_name: '',
                email: '',
                phone_number: '',
                country: ''
            });

            // Redirect to login after successful signup
            setTimeout(() => {
                navigate('/login', { 
                    state: { message: 'Signup successful! Please log in.' } 
                });
            }, 2000);

        } catch (err) {
            console.error('Signup error:', err);
            setError(err.message);
            // Clear password on error
            setFormData(prev => ({ ...prev, password: '' }));
        } finally {
            setIsLoading(false);
        }
    };

    // Props to pass to SignupView
    const viewProps = {
        formData,
        error,
        message,
        isLoading,
        handleChange,
        handleSubmit
    };

    return <SignupView {...viewProps} />;
};

export default Signup;