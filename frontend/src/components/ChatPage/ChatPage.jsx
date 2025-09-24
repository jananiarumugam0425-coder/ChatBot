import React, { useState, useEffect } from 'react';
import ChatInput from '../ChatInput/ChatInput';
import ChatMessage from '../ChatMessage/ChatMessage';
import './ChatPage.css';

const API_URL = "http://127.0.0.1:5000/review";

const ChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const welcomeMessage = { sender: 'bot', text: 'Hi there! Just a quick update on John Doe’s timesheet: he worked a total of 37.0 hours.' };
        setMessages([welcomeMessage]);
    }, []);

    const handleSendMessage = async (query) => {
        if (!query) return;

        const newUserMessage = { sender: 'user', text: query };
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        setLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            const data = await response.json();
            const newBotMessage = { sender: 'bot', text: data.answer };
            setMessages(prevMessages => [...prevMessages, newBotMessage]);
        } catch (error) {
            console.error("Error fetching bot response:", error);
            const errorMessage = { sender: 'bot', text: "Sorry, I couldn't get a response. Please try again." };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="main-content">
                <header className="chat-header">
                    <h2>Timesheet Reviewer Bot</h2>
                    <span className="status-online">
                        <span className="status-dot"></span> Status: Online
                    </span>
                </header>
                <div className="chat-area">
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <ChatMessage key={index} sender={msg.sender} text={msg.text} />
                        ))}
                        {loading && <div className="loading-message">Bot is typing...</div>}
                    </div>
                    <ChatInput onSend={handleSendMessage} disabled={loading} />
                </div>
            </div>
        </div>
    );
};

export default ChatPage;