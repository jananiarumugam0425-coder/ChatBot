import React, { useState, useEffect, useRef } from 'react';
import './ChatPage.css'; 
// Assuming you have ChatMessage and UploadButton components
import ChatMessage from '../ChatMessage/ChatMessage';
import UploadButton from '../UploadButton/UploadButton'; 

const API_BASE_URL = 'http://127.0.0.1:5000';

const ChatPage = ({ user, sessionToken, onSignOut }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const chatEndRef = useRef(null);

    // Scroll to the bottom of the chat area when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Fetch chat history on component mount or whenever the token is set/changes
    useEffect(() => {
        if (sessionToken) { // CRITICAL: Only attempt to fetch if the token is valid
            fetchChatHistory();
        }
    }, [sessionToken]); // Dependency ensures this runs after successful login

    const fetchChatHistory = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat_history`, {
                headers: {
                    // *** CRITICAL FIX: Correct Authorization header format ***
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            if (response.status === 401) {
                // If the token fails verification, sign out the user
                onSignOut(); 
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch history.");
            }

            const data = await response.json();
            setMessages(data.history || []);

        } catch (error) {
            console.error("Error fetching chat history:", error);
            setError("Could not load chat history.");
        }
    };
    
    // ... (handleSendMessage, handleFileUpload and other functions)
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const userQuery = input.trim();
        if (!userQuery || isLoading || !sessionToken) return;

        setIsLoading(true);
        setInput('');
        setError('');

        const newMessage = { sender: 'user', text: userQuery, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, newMessage]);

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}` // Must include token
                },
                body: JSON.stringify({ query: userQuery, timestamp: newMessage.timestamp }),
            });

            if (response.status === 401) {
                onSignOut(); // Sign out on chat 401
                return;
            }
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response from chatbot.');
            }

            const botMessage = { sender: 'bot', text: data.answer, timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, botMessage]);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (file) => {
        // ... (File upload logic - must also use sessionToken)
        if (isLoading || !sessionToken) return;
        setIsLoading(true);
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionToken}` // Must include token
                },
                body: formData,
            });

            if (response.status === 401) {
                onSignOut();
                return;
            }
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'File upload failed.');
            }
            
            // Add bot confirmation message
            const botMessage = { sender: 'bot', text: data.message, timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, botMessage]);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="chat-container">
            <div className="chat-card">
                <header className="chat-header">
                    <h1 className="chat-title">Timesheet Chatbot</h1>
                    <div className="user-controls">
                        <span className="user-info">Logged in as: <strong>{user}</strong></span>
                        <button onClick={onSignOut} className="sign-out-button">
                            Sign Out
                        </button>
                    </div>
                </header>

                <main className="chat-messages">
                    {messages.length === 0 && !isLoading ? (
                        <div className="welcome-message">
                            <p>Hello **{user}**! Welcome to the Timesheet Chatbot. Upload a CSV file to begin asking questions about your data.</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <ChatMessage key={index} sender={msg.sender} text={msg.text} />
                        ))
                    )}
                    {isLoading && <ChatMessage sender="bot" text="Thinking..." />}
                    <div ref={chatEndRef} />
                </main>

                <footer className="chat-footer">
                     {error && <div className="chat-error">{error}</div>}
                    <div className="chat-input-form">
                        {/* UploadButton component must be updated to use the new prop names if necessary */}
                        <UploadButton onFileUpload={handleFileUpload} disabled={isLoading} /> 
                        
                        <form onSubmit={handleSendMessage} className="chat-input-form-inner">
                            <input
                                type="text"
                                placeholder={isLoading ? "Processing, please wait..." : "Ask a question about the timesheet..."}
                                className="chat-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                            />
                            <button type="submit" className="send-button" disabled={!input.trim() || isLoading}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="send-icon">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ChatPage;