import React from 'react';
import './UploadButton.css'; // Make sure the path is correct

const UploadButton = ({ onFileUpload, disabled }) => {
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(file);
        }
        e.target.value = null; 
    };

    return (
        // Note: The outer div is often used by ChatPage for flex alignment
        <div>
            <label 
                htmlFor="file-upload" 
                // CRITICAL: Use the pure CSS class to apply royal blue
                className={`upload-label ${disabled ? 'disabled' : ''}`}
                title="Upload Timesheet CSV"
            >
                Upload
            </label>
            <input
                type="file"
                id="file-upload"
                className="upload-input" // This class hides the default file input
                onChange={handleFileChange}
                disabled={disabled}
                accept=".csv"
            />
        </div>
    );
};

export default UploadButton;