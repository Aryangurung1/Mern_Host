import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import ProfileAvatar from './ProfileAvatar';

export default function ChatHead() {
  const { chats, unreadCounts, getTotalUnreadCount, currentChat } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const navigate = useNavigate();
  
  // Get total unread count
  const totalUnread = getTotalUnreadCount();
  
  // Update recent chats when chats change
  useEffect(() => {
    // Get the 3 most recent chats
    const recent = [...chats]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 3);
    
    setRecentChats(recent);
  }, [chats]);
  
  // Don't show chat head if we're already in the chat page
  if (window.location.pathname === '/chat' || !chats.length) {
    return null;
  }
  
  const handleChatClick = (chatId) => {
    navigate(`/chat?id=${chatId}`);
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat head button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
      
      {/* Chat popup */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-3 bg-blue-600 text-white">
            <h3 className="font-medium">Recent Messages</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {recentChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No recent chats
              </div>
            ) : (
              <div className="divide-y">
                {recentChats.map(chat => {
                  const otherUser = chat.otherParticipant || {};
                  const unreadCount = unreadCounts[chat._id] || 0;
                  
                  return (
                    <div 
                      key={chat._id}
                      onClick={() => handleChatClick(chat._id)}
                      className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="relative">
                        <ProfileAvatar 
                          user={otherUser}
                          username={otherUser.username || 'User'} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{otherUser.username || 'Unknown User'}</h4>
                        {chat.lastMessage && (
                          <p className="text-xs text-gray-500 truncate">
                            {chat.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="p-3 bg-gray-50 border-t">
            <button
              onClick={() => navigate('/chat')}
              className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              View All Messages
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
