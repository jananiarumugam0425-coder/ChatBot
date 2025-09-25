import React from 'react';
import './ChatInput.css'; 
// Import SVG component if you use it, or ensure the SVG is inline in the button

const ChatInput = ({ onChatSubmit, isLoading, input, setInput }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const message = input.trim();
        if (message) {
            onChatSubmit(e); 
        }
    };
    
    return (
        // The form takes up the flexible space (flex-1) in the input bar
        <form onSubmit={handleSubmit} className="chat-input-form-inner">
            <input
                type="text"
                placeholder={isLoading ? "Processing, please wait..." : "Ask a question about the timesheet..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                // Use the correct CSS class
                className="chat-input" 
                disabled={isLoading}
            />
            <button 
                type="submit" 
                // Use the correct CSS class for royal blue button
                className="send-button" 
                disabled={isLoading || !input.trim()}
                title="Send Message"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" style={{width:'20px', height:'20px', fill:'white'}}>
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
            </button>
        </form>
    );
};

export default ChatInput;