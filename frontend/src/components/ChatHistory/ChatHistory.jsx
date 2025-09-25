import React from 'react';

const ChatHistory = ({ history, onSelectChat }) => {
    return (
        // bg-gray-900 makes it the darkest part of the UI
        <div className="p-4 bg-gray-900 h-full overflow-y-auto">
            <h3 className="text-lg font-extrabold mb-4 border-b border-gray-700 pb-2 text-blue-400">
                Chat History
            </h3>
            <button className="w-full mb-4 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                + New Chat
            </button>
            <ul className="space-y-2">
                {history.map((chat) => (
                    <li
                        key={chat.id}
                        // Use a slightly lighter background for list items
                        className="p-3 rounded-lg bg-gray-800 hover:bg-blue-800 hover:text-white cursor-pointer transition-colors duration-200"
                        onClick={() => onSelectChat(chat.id)}
                    >
                        <p className="text-sm font-medium truncate">{chat.title}</p>
                        <p className="text-xs text-gray-400">{chat.lastUpdated}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ChatHistory;