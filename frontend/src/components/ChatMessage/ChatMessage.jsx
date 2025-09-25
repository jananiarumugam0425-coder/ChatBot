import React from 'react';
import './ChatMessage.css'; // Make sure this CSS file is used

const ChatMessage = ({ sender, text }) => {
    // Uses the custom CSS classes defined in ChatMessage.css
    const messageClass = sender === 'user' ? 'user-message' : 'bot-message';
    
    return (
        <div className={`message ${messageClass}`}>
            <p>{text}</p>
        </div>
    );
};

export default ChatMessage;