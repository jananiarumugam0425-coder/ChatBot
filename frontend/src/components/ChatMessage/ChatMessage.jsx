import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ sender, text }) => {
    const messageClass = sender === 'user' ? 'user-message' : 'bot-message';
    return (
        <div className={`message ${messageClass}`}>
            <p>{text}</p>
        </div>
    );
};

export default ChatMessage;