import React, { useState, useEffect, useRef } from 'react';
import './ChatPage.css'; 
import ChatPageView from './ChatPageView'; // Import the new view component

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
        if (sessionToken) {
            fetchChatHistory();
        }
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
            setMessages(data.history || []);

        } catch (error) {
            console.error("Error fetching chat history:", error);
            setError("Could not load chat history.");
        }
    };
    
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
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ query: userQuery, timestamp: newMessage.timestamp }),
            });

            if (response.status === 401) {
                onSignOut();
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
        if (isLoading || !sessionToken) return;
        setIsLoading(true);
        setError('');
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    // NOTE: Fetch API automatically sets Content-Type for FormData, 
                    // but the Authorization header is manually required.
                    'Authorization': `Bearer ${sessionToken}` 
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

    // Consolidate props for the view component
    const viewProps = {
        // State & Refs
        user, messages, input, setInput, isLoading, error, chatEndRef, onSignOut,
        
        // Handlers
        handleSendMessage, handleFileUpload,
    };


    return (
        <ChatPageView {...viewProps} />
    );
};

export default ChatPage;