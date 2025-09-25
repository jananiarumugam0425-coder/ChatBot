import React from 'react';
import './UploadButton.css';

const UploadButton = ({ onFileUpload, disabled }) => {
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(file);
        }
        e.target.value = null; 
    };

    return (
        <div>
            <label 
                htmlFor="file-upload" 
                className={`upload-label ${disabled ? 'disabled' : ''}`}
                title="Upload Timesheet CSV"
            >
                Upload
            </label>
            <input
                type="file"
                id="file-upload"
                className="upload-input" 
                onChange={handleFileChange}
                disabled={disabled}
                accept=".csv"
            />
        </div>
    );
};

export default UploadButton;