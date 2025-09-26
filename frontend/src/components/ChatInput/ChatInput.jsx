import React from 'react';
import ChatInputView from './ChatInputView'; // Import the new view component
import './ChatInput.css'; 

const ChatInput = ({ onChatSubmit, isLoading, input, setInput }) => {
    
    // Logic: Prevent form submission on empty message and call the parent handler
    const handleSubmit = (e) => {
        e.preventDefault();
        const message = input.trim();
        if (message) {
            // Pass the original event up to the parent component's submit handler
            onChatSubmit(e); 
        }
    };
    
    // Pass the necessary props and the handler down to the view component
    return (
        <ChatInputView 
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            input={input}
            setInput={setInput}
        />
    );
};

export default ChatInput;