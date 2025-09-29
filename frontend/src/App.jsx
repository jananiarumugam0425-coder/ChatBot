import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// FIX 1: Use the corrected paths with explicit .jsx extension
// based on your file structure (src/components/Login.jsx)
import Login from './components/Login/Login.jsx';      
import ChatPage from './components/ChatPage/ChatPage.jsx';  

// NOTE: You should ensure index.css is imported in your main entry file (index.jsx/main.jsx)
// or put the import back here if necessary: import './index.css'; 

// --- ROUTE PROTECTION COMPONENT ---
// Ensures a user is logged in before accessing a route.
const ProtectedRoute = ({ children, sessionToken }) => {
    if (!sessionToken) {
        // FIX: Redirects the user to the /login path
        return <Navigate to="/login" replace />; 
    }
    return children;
};


const App = () => {
    const [user, setUser] = useState(null);
    const [sessionToken, setSessionToken] = useState(null);

    const handleLogin = (username, token) => {
        setUser(username);
        setSessionToken(token);
    };

    const handleSignOut = () => {
        setUser(null);
        setSessionToken(null);
    };

    // FIX 2: The entire application must be wrapped in <Router>
    return (
        <Router>
            <Routes>
                {/* 1. ROOT ROUTE: Redirects to /chat or /login */}
                <Route 
                    path="/" 
                    element={
                        sessionToken 
                            ? <Navigate to="/chat" replace /> 
                            : <Navigate to="/login" replace />
                    } 
                />

                {/* 2. LOGIN ROUTE: Unprotected */}
                <Route
                    path="/login"
                    element={
                        // Redirect if user is already authenticated
                        sessionToken ? <Navigate to="/chat" replace /> : <Login onLogin={handleLogin} />
                    }
                />
                
                {/* 3. SIGNUP ROUTE: Redirects to /login (where the signup form is rendered) */}
                <Route path="/signup" element={<Navigate to="/login" replace />} />


                {/* 4. CHAT ROUTE: Protected, requires a sessionToken */}
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute sessionToken={sessionToken}>
                            <ChatPage 
                                user={user} 
                                sessionToken={sessionToken} 
                                onSignOut={handleSignOut} 
                            />
                        </ProtectedRoute>
                    }
                />
                
                {/* Fallback for 404 pages */}
                <Route path="*" element={<h1 style={{ color: 'white', padding: '50px' }}>404 | Page Not Found</h1>} />
            </Routes>
        </Router>
    );
};

export default App;