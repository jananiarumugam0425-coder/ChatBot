import React from 'react';
import ChatMessageView from './ChatMessageView'; // Import the new view component
import './ChatMessage.css';

const ChatMessage = ({ sender, text }) => {
    
    // Logic: Determine the CSS class based on the sender
    const messageClass = sender === 'user' ? 'user-message' : 'bot-message';
    
    // Prepare the content for dangerouslySetInnerHTML
    const messageContent = { __html: text };

    // Pass the calculated props to the presentation component
    return (
        <ChatMessageView 
            messageClass={messageClass} 
            messageContent={messageContent}
        />
    );
};

export default ChatMessage;