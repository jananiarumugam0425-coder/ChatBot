import React from 'react';
import { Link } from 'react-router-dom';
import ChatMessage from '../ChatMessage/ChatMessage';
import UploadButton from '../UploadButton/UploadButton';

const ChatPageView = ({
    user, messages, input, setInput, isLoading, error, chatEndRef, onSignOut,
    currentChatId, chatSessions, hasLoadedSessions,
    handleSendMessage, handleFileUpload,
    createNewChatSession, loadChatSession, deleteChatSession,
    setError
}) => {
    
    const handleNewChatClick = () => {
        createNewChatSession();
    };

    const handleSendWithChatCheck = (e) => {
        e.preventDefault();
        const userQuery = input.trim();
        
        if (!userQuery) return;
        
        // If no chat is selected, show a message instead of automatically creating one
        if (!currentChatId) {
            setError("Please select a chat session or create a new one first.");
            return;
        }
        
        handleSendMessage(e);
    };

    const handleUploadWithChatCheck = (file) => {
        // If no chat is selected, show a message instead of automatically creating one
        if (!currentChatId) {
            setError("Please select a chat session or create a new one first.");
            return;
        }
        
        handleFileUpload(file);
    };

    const handleSessionClick = (chatId) => {
        loadChatSession(chatId);
    };

    return (
        <div className="chat-container">
            <div className="chat-card">
                {/* Sidebar for Chat Sessions */}
                <div className="chat-sidebar">
                    <div className="sidebar-header">
                        <h3>Chat Sessions</h3>
                        <button 
                            onClick={handleNewChatClick}
                            className="new-chat-button"
                            disabled={isLoading}
                        >
                            + New Chat
                        </button>
                    </div>
                    <div className="sessions-list">
                        {chatSessions.map(session => (
                            <div 
                                key={session.chat_id}
                                className={`session-item ${currentChatId === session.chat_id ? 'active' : ''}`}
                            >
                                <Link 
                                    to={`/chat/${session.chat_id}`}
                                    className="session-name-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleSessionClick(session.chat_id);
                                    }}
                                    title={session.session_name}
                                >
                                    <div className="session-name">
                                        {session.session_name}
                                    </div>
                                </Link>
                                <button 
                                    onClick={() => deleteChatSession(session.chat_id)}
                                    className="delete-session-button"
                                    title="Delete chat"
                                    disabled={isLoading}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {hasLoadedSessions && chatSessions.length === 0 && (
                            <div className="no-sessions-message">
                                No chat sessions yet. Click "New Chat" to start!
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="chat-main">
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
                        {!currentChatId ? (
                            <div className="welcome-message">
                                <p>Welcome back, <strong>{user}</strong>!</p>
                                <p>Select a chat session from the sidebar or create a new one to start chatting.</p>
                            </div>
                        ) : messages.length === 0 && !isLoading ? (
                            <div className="welcome-message">
                                <p>Hello <strong>{user}</strong>! This is a new chat session.</p>
                                <p>Upload a CSV file or ask a question about your timesheet data.</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <ChatMessage key={index} sender={msg.sender} text={msg.text} />
                            ))
                        )}
                        {isLoading && <ChatMessage sender="bot" text="Thinking..." />} 
                        <div ref={chatEndRef} />
                    </main>

                    <footer className="chat-footer">
                        {error && <div className="chat-error">{error}</div>}
                        <div className="chat-input-form">
                            <UploadButton 
                                onFileUpload={handleUploadWithChatCheck} 
                                disabled={isLoading || !currentChatId} 
                            /> 
                            
                            <form onSubmit={handleSendWithChatCheck} className="chat-input-form-inner">
                                <input
                                    type="text"
                                    placeholder={
                                        !currentChatId 
                                            ? "Select or create a chat session first..." 
                                            : isLoading 
                                            ? "Processing, please wait..." 
                                            : "Ask a question about the timesheet..."
                                    }
                                    className="chat-input"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={isLoading || !currentChatId}
                                />
                                <button 
                                    type="submit" 
                                    className="send-button" 
                                    disabled={!input.trim() || isLoading || !currentChatId}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="send-icon">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default ChatPageView;