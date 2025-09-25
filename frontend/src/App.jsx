import React, { useState } from 'react';
import Login from './components/Login/Login'; 
import ChatPage from './components/ChatPage/ChatPage'; 
import './index.css';

const App = () => {
    // The state for user and token
    const [user, setUser] = useState(null);
    const [sessionToken, setSessionToken] = useState(null);

    const handleLogin = (username, token) => {
        setUser(username);
        setSessionToken(token);
    };

    const handleSignOut = () => {
        // You might want to implement a backend call to invalidate the token here too
        setUser(null);
        setSessionToken(null);
    };

    // Conditional rendering based on user authentication
    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    return <ChatPage user={user} sessionToken={sessionToken} onSignOut={handleSignOut} />;
};

export default App;