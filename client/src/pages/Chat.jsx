import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import ProfileAvatar from '../components/chat/ProfileAvatar';

export default function Chat() {
  const { user } = useAuth();
  const { 
    chats, 
    currentChat, 
    messages, 
    loading, 
    isTyping,
    unreadCounts,
    fetchChats, 
    openChat, 
    sendMessage,
    sendTypingStatus
  } = useChat();
  const [messageInput, setMessageInput] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch chats on component mount
  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to access chat');
      navigate('/signin', { state: { from: location.pathname } });
      return;
    }
    
    fetchChats();
  }, [user, fetchChats, navigate, location.pathname]);

  // Open chat from URL params or location state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatIdFromParams = params.get('id');
    const chatIdFromState = location.state?.chatId;
    
    const chatId = chatIdFromParams || chatIdFromState;
    
    if (chatId && chats.length > 0) {
      openChat(chatId);
    }
  }, [chats, location, openChat]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message input change with typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator
    sendTypingStatus(true);
    
    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Set new timeout
    const timeout = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
    
    setTypingTimeout(timeout);
  };

  // Send a message
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !currentChat) return;
    
    try {
      // Store current message to clear input immediately
      const currentMessage = messageInput;
      setMessageInput('');
      
      // Clear typing indicator
      if (typingTimeout) clearTimeout(typingTimeout);
      sendTypingStatus(false);
      
      // Send message after UI is updated
      await sendMessage(currentChat._id, currentMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get other participant in chat
  const getOtherParticipant = (chat) => {
    if (!chat || !chat.otherParticipant) return { username: 'Unknown', photo: '' };
    return chat.otherParticipant;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Chat List */}
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Conversations</h2>
          </div>
          
          {loading && chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Loading conversations...
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {chats.map((chat) => {
                const otherUser = getOtherParticipant(chat);
                const isActive = currentChat && currentChat._id === chat._id;
                const unreadCount = unreadCounts[chat._id] || 0;
                
                return (
                  <div 
                    key={chat._id}
                    onClick={() => openChat(chat._id)}
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isActive ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="relative">
                      <ProfileAvatar 
                        user={otherUser}
                        username={otherUser.username} 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{otherUser.username}</h3>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage.sender === user._id ? 'You: ' : ''}
                          {chat.lastMessage.content}
                        </p>
                      )}
                    </div>
                    
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-400">
                        {formatTime(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Chat Messages */}
        <div className="w-full md:w-2/3 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-[600px]">
          {currentChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                {currentChat.otherParticipant && (
                  <>
                    <ProfileAvatar 
                      user={currentChat.otherParticipant}
                      username={currentChat.otherParticipant.username} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium">{currentChat.otherParticipant.username}</h3>
                      {currentChat.otherParticipant.isAgent && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          Agent
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const isSender = message.sender._id === user._id;
                      const messageKey = message._id || `temp-${Date.now()}-${Math.random()}`;
                      
                      return (
                        <div 
                          key={messageKey}
                          className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="flex items-start gap-2">
                            {!isSender && (
                              <ProfileAvatar 
                                user={message.sender}
                                username={message.sender.username} 
                                className="w-8 h-8 rounded-full object-cover mt-1"
                              />
                            )}
                            <div className={`max-w-[70%] ${isSender ? 'bg-blue-600 text-white' : 'bg-white border'} rounded-lg px-4 py-2 shadow-sm`}>
                              <p>{message.content}</p>
                              <p className={`text-xs mt-1 ${isSender ? 'text-blue-200' : 'text-gray-500'}`}>
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                            {isSender && (
                              <ProfileAvatar 
                                user={user}
                                username={user.username} 
                                className="w-8 h-8 rounded-full object-cover mt-1"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 rounded-lg px-4 py-2 text-gray-500">
                          Typing...
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500">
              Select a conversation or start a new one
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
