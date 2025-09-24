import React, { useState } from 'react';
import { LuSendHorizontal } from 'react-icons/lu';
import { FaFileCsv } from 'react-icons/fa';
import { ImSpinner2 } from 'react-icons/im';
import './ChatInput.css';

const API_UPLOAD_URL = "http://127.0.0.1:5000/upload";

const ChatInput = ({ onSend, loading }) => {
    const [query, setQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploading(true);
            setMessage('Uploading file...');
            
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(API_UPLOAD_URL, {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                if (response.ok) {
                    setMessage(`Update successful: ${data.message}`);
                } else {
                    setMessage(`Update failed: ${data.error}`);
                }
            } catch (error) {
                console.error("Upload error:", error);
                setMessage("Upload failed: Could not connect to the server.");
            } finally {
                setUploading(false);
                setTimeout(() => setMessage(''), 5000); // Clear message after 5 seconds
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSend(query);
        setQuery('');
    };

    return (
        <div className="chat-input-container">
            <div className="upload-section">
                <input
                    type="file"
                    id="file-upload"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <button
                    className="update-button"
                    onClick={() => document.getElementById('file-upload').click()}
                    disabled={uploading}
                >
                    {uploading ? <ImSpinner2 className="spinner" /> : "Update"}
                </button>
            </div>
            <form onSubmit={handleSubmit} className="input-form">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Ask a question about the timesheet..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading || uploading}
                />
                <button type="submit" className="send-button" disabled={loading || uploading}>
                    <LuSendHorizontal className="send-icon" />
                </button>
            </form>
            {message && <div className="upload-message">{message}</div>}
        </div>
    );
};

export default ChatInput;