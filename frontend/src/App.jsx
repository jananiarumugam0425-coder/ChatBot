import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login.jsx';      
import ChatPage from './components/ChatPage/ChatPage.jsx';  

// --- ROUTE PROTECTION COMPONENT ---
const ProtectedRoute = ({ children, sessionToken }) => {
    if (!sessionToken) {
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
                        sessionToken ? <Navigate to="/chat" replace /> : <Login onLogin={handleLogin} />
                    }
                />
                
                {/* 3. SIGNUP ROUTE: Redirects to /login */}
                <Route path="/signup" element={<Navigate to="/login" replace />} />

                {/* 4. MAIN CHAT ROUTE: Shows chat sessions list */}
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

                {/* 5. INDIVIDUAL CHAT SESSION ROUTES */}
                <Route
                    path="/chat/:chatId"
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