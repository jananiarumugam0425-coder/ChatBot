import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login.jsx';      
import Signup from './components/Signup/Signup.jsx';
import ForgotPassword from './components/ForgotPassword/ForgotPassword.jsx';
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

                {/* 2. LOGIN ROUTE */}
                <Route
                    path="/login"
                    element={
                        sessionToken ? <Navigate to="/chat" replace /> : <Login onLogin={handleLogin} />
                    }
                />
                
                {/* 3. SIGNUP ROUTE */}
                <Route
                    path="/signup"
                    element={
                        sessionToken ? <Navigate to="/chat" replace /> : <Signup onLogin={handleLogin} />
                    }
                />

                {/* 4. FORGOT PASSWORD ROUTE */}
                <Route
                    path="/forgot-password"
                    element={
                        sessionToken ? <Navigate to="/chat" replace /> : <ForgotPassword />
                    }
                />

                {/* 5. MAIN CHAT ROUTE: Shows chat sessions list */}
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

                {/* 6. INDIVIDUAL CHAT SESSION ROUTES */}
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