import React from 'react';
import ChatMessage from '../ChatMessage/ChatMessage'; // Used for rendering messages
import UploadButton from '../UploadButton/UploadButton'; // Used for file uploads

const ChatPageView = ({
    user, messages, input, setInput, isLoading, error, chatEndRef, onSignOut,
    handleSendMessage, handleFileUpload
}) => {
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
                    {/* The thinking message remains in the view for immediate feedback */}
                    {isLoading && <ChatMessage sender="bot" text="Thinking..." />} 
                    <div ref={chatEndRef} />
                </main>

                <footer className="chat-footer">
                     {error && <div className="chat-error">{error}</div>}
                    <div className="chat-input-form">
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

export default ChatPageView;