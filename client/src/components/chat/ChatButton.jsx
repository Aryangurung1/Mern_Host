import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import toast from 'react-hot-toast';

export default function ChatButton({ agentId, agentName }) {
  const { user } = useAuth();
  const { createChat } = useChat();
  const navigate = useNavigate();

  const handleContactAgent = async () => {
    if (!user) {
      toast.error('Please sign in to contact the agent');
      navigate('/signin', { state: { from: window.location.pathname } });
      return;
    }

    // Don't allow agents to contact themselves
    if (user._id === agentId) {
      toast.error('You cannot contact yourself');
      return;
    }

    try {
      toast.loading('Initializing chat...', { id: 'chat-loading' });
      const chat = await createChat(agentId);
      toast.dismiss('chat-loading');
      
      if (chat) {
        toast.success(`Chat with ${agentName} started!`);
        navigate('/chat', { state: { chatId: chat._id } });
      } else {
        toast.error('Failed to start chat. Please try again.');
      }
    } catch (error) {
      toast.dismiss('chat-loading');
      toast.error('Failed to start chat. Please try again.');
      console.error('Error starting chat:', error);
    }
  };

  return (
    <button
      onClick={handleContactAgent}
      className="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md transition-colors duration-200"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      Contact Agent
    </button>
  );
}
