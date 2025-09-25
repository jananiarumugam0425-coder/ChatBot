import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ sender, text }) => {
    // This class determines alignment and styling based on the sender
    const messageClass = sender === 'user' ? 'user-message' : 'bot-message';
    
    // The message content is rendered directly, so it can be a string or contain HTML like a list
    const messageContent = { __html: text };

    return (
        <div className={`message ${messageClass}`}>
            <div 
                className="message-bubble" 
                dangerouslySetInnerHTML={messageContent}
            ></div>
        </div>
    );
};

export default ChatMessage;