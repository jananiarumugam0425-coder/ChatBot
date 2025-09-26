import React from 'react';
import UploadButtonView from './UploadButtonView'; // Import the new view component
import './UploadButton.css';

const UploadButton = ({ onFileUpload, disabled }) => {
    
    // Logic to handle file selection and propogate it upwards
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(file);
        }
        // Clears the file input value so that selecting the same file again triggers the onChange event
        e.target.value = null; 
    };

    // We pass the necessary props and the handler down to the view component
    return (
        <UploadButtonView 
            handleFileChange={handleFileChange}
            disabled={disabled}
        />
    );
};

export default UploadButton;