import React from 'react';

// Note: We don't need to import the CSS here if it's imported in the main component, 
// but including it is good practice if this component might be used elsewhere.

const UploadButtonView = ({ handleFileChange, disabled }) => {
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
                onChange={handleFileChange} // The logic handler is passed down as a prop
                disabled={disabled}
                accept=".csv"
            />
        </div>
    );
};

export default UploadButtonView;