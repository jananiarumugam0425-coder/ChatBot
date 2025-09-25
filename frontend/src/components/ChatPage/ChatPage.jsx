import React, { useState, useEffect, useRef } from 'react';
import './ChatPage.css';
import UploadButton from '../UploadButton/UploadButton'; 
// Import the message component
import ChatMessage from '../ChatMessage/ChatMessage'; 

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

    // Fetch chat history on component mount
    useEffect(() => {
        fetchChatHistory();
    }, [sessionToken]);

    const fetchChatHistory = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat_history`, {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            if (response.status === 401) {
                onSignOut();
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch history.");
            }

            const data = await response.json();
            if (data.history) {
                setMessages(data.history);
            }
        } catch (err) {
            console.error("Error fetching chat history:", err);
        }
    };

    const handleFileUpload = async (file) => {
        if (isLoading) return;
        setIsLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        const tempBotMessage = {
            sender: 'bot', 
            text: `Processing file: ${file.name}... Please wait.`, 
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempBotMessage]);

        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: formData
            });

            const data = await response.json();

            setMessages(prev => {
                const updated = [...prev];
                updated.pop(); 
                if (response.ok) {
                    updated.push({ sender: 'bot', text: data.message, timestamp: new Date().toISOString() });
                } else {
                    updated.push({ sender: 'bot', text: `Upload Error: ${data.error || 'Unknown issue.'}`, timestamp: new Date().toISOString() });
                }
                return updated;
            });

        } catch (err) {
            console.error("Upload error:", err);
            setMessages(prev => {
                const updated = [...prev];
                updated.pop();
                updated.push({ sender: 'bot', text: 'Critical Network Error: Could not reach the server.', timestamp: new Date().toISOString() });
                return updated;
            });
            setError('File upload failed. Check server status.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { sender: 'user', text: input.trim(), timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError('');
        
        const thinkingMessage = { sender: 'bot', text: 'Thinking...', timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, thinkingMessage]);

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ query: userMessage.text })
            });

            const data = await response.json();

            setMessages(prev => {
                const updated = [...prev];
                updated.pop(); 
                if (response.ok) {
                    updated.push({ sender: 'bot', text: data.answer, timestamp: new Date().toISOString() });
                } else {
                    updated.push({ sender: 'bot', text: `LLM Error: ${data.error || 'An unexpected error occurred.'}`, timestamp: new Date().toISOString() });
                }
                return updated;
            });

        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => {
                const updated = [...prev];
                updated.pop();
                updated.push({ sender: 'bot', text: 'Critical Network Error: Could not send message to server.', timestamp: new Date().toISOString() });
                return updated;
            });
            setError('Failed to get a response from the server.');
        } finally {
            setIsLoading(false);
        }
    };

    // Use the imported ChatMessage component
    const MessageComponent = ({ msg }) => (
        <ChatMessage sender={msg.sender} text={msg.text} />
    );

    // --- Render ---
    return (
        <div className="chat-container">
            <div className="chat-card">
                <header className="chat-header">
                    <h1 className="chat-title">Timesheet Chatbot</h1>
                    <div className="flex items-center space-x-4">
                        <span className="user-info">Logged in as: <strong>{user}</strong></span>
                        <button onClick={onSignOut} className="sign-out-button">Sign Out</button>
                    </div>
                </header>

                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <MessageComponent key={index} msg={msg} />
                    ))}
                    {error && <MessageComponent msg={{ sender: 'bot', text: `System Alert: ${error}` }} />}
                    <div ref={chatEndRef} />
                </div>
                
                {/* FINAL CRITICAL FIX: Aligning the upload button and the form */}
                <div className="chat-input-form-outer"> {/* New wrapper for separation */}
                    <UploadButton onFileUpload={handleFileUpload} disabled={isLoading} />
                    
                    {/* The form structure from ChatInput.jsx is brought inline/adapted here */}
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
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;