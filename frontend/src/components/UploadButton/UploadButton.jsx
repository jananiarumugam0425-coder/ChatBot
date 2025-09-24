import React, { useState } from 'react';
import './UploadButton.css';

const UPLOAD_API_URL = "http://127.0.0.1:5000/upload";

const UploadButton = () => {
    const [status, setStatus] = useState('');

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        setStatus('Uploading...');

        try {
            const response = await fetch(UPLOAD_API_URL, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setStatus('Upload successful!');
            } else {
                setStatus(`Upload failed: ${data.error}`);
            }
        } catch (error) {
            setStatus('Upload failed. Server error.');
            console.error('Upload error:', error);
        }
    };

    return (
        <div className="upload-container">
            <label htmlFor="file-upload" className="upload-btn">
                <span className="upload-icon">📁</span> Upload Timesheet
            </label>
            <input 
                id="file-upload" 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
            />
            {status && <span className="upload-status">{status}</span>}
        </div>
    );
};

export default UploadButton;