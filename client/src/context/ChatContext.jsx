import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user, api } = useAuth();
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const newSocket = io(API_URL, {
        withCredentials: true,
      });
      
      setSocket(newSocket);
      
      // Clean up on unmount
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, API_URL]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Handle incoming messages
    socket.on('receive_message', (messageData) => {
      console.log('Received message via socket:', messageData);
      
      if (currentChat && currentChat._id === messageData.chatId) {
        // Add message to current chat
        setMessages((prev) => [...prev, messageData]);
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.error('Could not play notification sound:', err));
      } else {
        // Update unread count for other chats
        setUnreadCounts((prev) => ({
          ...prev,
          [messageData.chatId]: (prev[messageData.chatId] || 0) + 1
        }));
        
        // Show simple toast notification
        toast.success(`New message from ${messageData.sender.username}`, {
          duration: 4000,
          position: 'bottom-right',
          icon: '💬',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
        
        // Also show custom toast with more details
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <img 
                    className="h-10 w-10 rounded-full" 
                    src={messageData.sender.photo ? (messageData.sender.photo.startsWith('http') ? messageData.sender.photo : `${API_URL}${messageData.sender.photo}`) : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"} 
                    alt="" 
                    onError={(e) => {
                      e.target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
                    }}
                  />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{messageData.sender.username}</p>
                  <p className="mt-1 text-sm text-gray-500">{messageData.content}</p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  openChat(messageData.chatId);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
              >
                View
              </button>
            </div>
          </div>
        ), { duration: 5000, position: 'bottom-right', id: `message-${messageData._id || Date.now()}` });
      }
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
      if (currentChat && currentChat._id === data.chatId) {
        setIsTyping(true);
      }
    });
    
    socket.on('stop_typing', (data) => {
      if (currentChat && currentChat._id === data.chatId) {
        setIsTyping(false);
      }
    });
    
    return () => {
      socket.off('receive_message');
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [socket, currentChat]);

  // Fetch user's chats
  const fetchChats = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await api.get('/api/chat');
      setChats(response.data);
      
      // Initialize unread counts
      const counts = {};
      response.data.forEach(chat => {
        counts[chat._id] = chat.unreadCount || 0;
      });
      setUnreadCounts(counts);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setLoading(false);
    }
  }, [user, api]);

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/api/chat/${chatId}`);
      setMessages(response.data.messages || []);
      
      // Reset unread count for this chat
      setUnreadCounts(prev => ({
        ...prev,
        [chatId]: 0
      }));
      
      // Mark messages as read
      await api.put(`/api/chat/${chatId}/read`);
      
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
      return null;
    }
  }, [api]);

  // Create a new chat or get existing one
  const createChat = useCallback(async (receiverId) => {
    try {
      setLoading(true);
      const response = await api.post('/api/chat', { receiverId });
      
      // If chat already exists, just open it
      if (response.data.alreadyExists) {
        const chatId = response.data.chatId;
        const existingChat = chats.find(c => c._id === chatId);
        if (existingChat) {
          setCurrentChat(existingChat);
          await fetchMessages(chatId);
          // Join socket room
          socket?.emit('join_chat', chatId);
          return existingChat;
        }
      }
      
      // Otherwise add the new chat to the list
      const newChat = response.data;
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      
      // Join socket room
      socket?.emit('join_chat', newChat._id);
      
      setLoading(false);
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      setLoading(false);
      return null;
    }
  }, [api, chats, fetchMessages, socket]);

  // Send a message
  const sendMessage = useCallback(async (chatId, content) => {
    if (!chatId || !content.trim()) return null;
    
    try {
      // Show sending indicator
      const sendingToastId = toast.loading('Sending message...', {
        position: 'bottom-right'
      });
      
      const response = await api.post('/api/chat/message', {
        chatId,
        content
      });
      
      // Dismiss sending toast
      toast.dismiss(sendingToastId);
      
      const newMessage = response.data;
      
      // Don't add the message to the state here, as it will be added
      // when the socket receives the message event
      // This prevents duplicate messages
      
      // Emit socket event
      if (socket) {
        console.log('Emitting send_message event:', {
          ...newMessage,
          chatId
        });
        socket.emit('send_message', {
          ...newMessage,
          chatId
        });
      } else {
        // If socket is not available, update the messages manually
        setMessages(prev => [...prev, newMessage]);
      }
      
      // Update last message in chat list
      setChats(prev => 
        prev.map(chat => 
          chat._id === chatId 
            ? {
                ...chat,
                lastMessage: {
                  content,
                  timestamp: new Date(),
                  sender: user._id
                }
              }
            : chat
        )
      );
      
      // Show success toast
      toast.success('Message sent', {
        duration: 2000,
        position: 'bottom-right'
      });
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message', {
        duration: 3000,
        position: 'bottom-right'
      });
      return null;
    }
  }, [api, socket, user]);

  // Open a chat
  const openChat = useCallback(async (chatId) => {
    // Leave previous chat room if any
    if (currentChat && socket) {
      socket.emit('leave_chat', currentChat._id);
    }
    
    const chat = chats.find(c => c._id === chatId);
    if (chat) {
      setCurrentChat(chat);
      await fetchMessages(chatId);
      
      // Join new chat room
      if (socket) {
        socket.emit('join_chat', chatId);
      }
      
      return chat;
    }
    return null;
  }, [chats, currentChat, fetchMessages, socket]);

  // Handle typing indicators
  const sendTypingStatus = useCallback((isTyping) => {
    if (!socket || !currentChat) return;
    
    if (isTyping) {
      socket.emit('typing', {
        chatId: currentChat._id,
        userId: user._id
      });
    } else {
      socket.emit('stop_typing', {
        chatId: currentChat._id,
        userId: user._id
      });
    }
  }, [socket, currentChat, user]);

  // Get total unread messages count
  const getTotalUnreadCount = useCallback(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

  // Context value
  const value = {
    socket,
    chats,
    currentChat,
    setCurrentChat,
    messages,
    loading,
    isTyping,
    unreadCounts,
    fetchChats,
    fetchMessages,
    createChat,
    sendMessage,
    openChat,
    sendTypingStatus,
    getTotalUnreadCount
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
