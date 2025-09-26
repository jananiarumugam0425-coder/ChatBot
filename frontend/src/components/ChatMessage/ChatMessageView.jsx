import React from 'react';

const ChatMessageView = ({ messageClass, messageContent }) => {
    return (
        <div className={`message ${messageClass}`}>
            <div 
                className="message-bubble" 
                // Using dangerouslySetInnerHTML as per the original component's requirement
                dangerouslySetInnerHTML={messageContent}
            ></div>
        </div>
    );
};

export default ChatMessageView;