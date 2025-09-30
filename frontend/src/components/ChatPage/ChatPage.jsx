import React, { useState, useEffect, useRef } from 'react';
import './ChatPage.css'; 
import ChatPageView from './ChatPageView';

const API_BASE_URL = 'http://127.0.0.1:5000';

const ChatPage = ({ user, sessionToken, onSignOut }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentChatId, setCurrentChatId] = useState(null);
    const [chatSessions, setChatSessions] = useState([]);
    const [hasLoadedSessions, setHasLoadedSessions] = useState(false);
    const chatEndRef = useRef(null);

    // Fetch chat sessions on component mount
    useEffect(() => {
        if (sessionToken) {
            fetchChatSessions();
        }
    }, [sessionToken]);

    const fetchChatSessions = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            if (response.status === 401) {
                onSignOut(); 
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch chat sessions.");
            }

            const data = await response.json();
            setChatSessions(data.sessions || []);
            setHasLoadedSessions(true);

        } catch (error) {
            console.error("Error fetching chat sessions:", error);
            setError("Could not load chat sessions.");
            setHasLoadedSessions(true);
        }
    };

    const createNewChatSession = async (sessionName = null) => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ session_name: sessionName })
            });

            if (response.status === 401) {
                onSignOut();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create chat session.');
            }

            setCurrentChatId(data.chat_id);
            setMessages([]);
            await fetchChatSessions(); // Refresh sessions list

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadChatSession = async (chatId) => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/chat/sessions/${chatId}`, {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            if (response.status === 401) {
                onSignOut();
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to load chat session.");
            }

            const data = await response.json();
            setMessages(data.messages || []);
            setCurrentChatId(chatId);

        } catch (error) {
            console.error("Error loading chat session:", error);
            setError("Could not load chat session.");
        } finally {
            setIsLoading(false);
        }
    };

    const deleteChatSession = async (chatId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/sessions/${chatId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            if (response.status === 401) {
                onSignOut();
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to delete chat session.");
            }

            // If we're deleting the current chat, clear the current view
            if (currentChatId === chatId) {
                setCurrentChatId(null);
                setMessages([]);
            }

            await fetchChatSessions(); // Refresh sessions list

        } catch (error) {
            console.error("Error deleting chat session:", error);
            setError("Could not delete chat session.");
        }
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const userQuery = input.trim();
        
        // If no current chat exists, create one first
        if (!currentChatId) {
            await createNewChatSession();
            // Wait a moment for the chat to be created, then send the message
            setTimeout(() => {
                sendMessageToChat(userQuery);
            }, 100);
            return;
        }
        
        if (!userQuery || isLoading || !sessionToken) return;
        
        sendMessageToChat(userQuery);
    };

    const sendMessageToChat = async (userQuery) => {
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
                body: JSON.stringify({ 
                    query: userQuery, 
                    chat_id: currentChatId,
                    timestamp: newMessage.timestamp 
                }),
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
        // If no current chat exists, create one first
        if (!currentChatId) {
            await createNewChatSession();
            // Wait a moment for the chat to be created, then upload the file
            setTimeout(() => {
                uploadFileToChat(file);
            }, 100);
            return;
        }
        
        if (isLoading || !sessionToken) return;
        
        uploadFileToChat(file);
    };

    const uploadFileToChat = async (file) => {
        setIsLoading(true);
        setError('');
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
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
        user, messages, input, setInput, isLoading, error, chatEndRef, onSignOut,
        currentChatId, chatSessions, hasLoadedSessions,
        handleSendMessage, handleFileUpload,
        createNewChatSession, loadChatSession, deleteChatSession,
        setError // ADD THIS LINE - pass setError as prop
    };

    return (
        <ChatPageView {...viewProps} />
    );
};

export default ChatPage;