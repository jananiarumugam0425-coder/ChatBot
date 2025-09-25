import React, { useState } from 'react';

const AuthPage = ({ setIsLoggedIn, setSessionToken }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');
        const endpoint = isSignUp ? '/signup' : '/login';
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error);
            }
            if (data.session_token) {
                setSessionToken(data.session_token);
                setIsLoggedIn(true);
            }
        } catch (err) {
            setAuthError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-800 p-4">
            <div className="bg-slate-700 p-8 rounded-xl shadow-lg w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-6 text-center text-white">{isSignUp ? 'Sign Up' : 'Log In'}</h2>
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 rounded-lg bg-slate-600 text-white border-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded-lg bg-slate-600 text-white border-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    />
                    {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
                    <button type="submit" className="w-full p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 font-bold">
                        {isSignUp ? 'Sign Up' : 'Log In'}
                    </button>
                </form>
                <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-sm text-blue-400 mt-4 underline hover:text-blue-300 transition-colors duration-300">
                    {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
                </button>
            </div>
        </div>
    );
};

export default AuthPage;