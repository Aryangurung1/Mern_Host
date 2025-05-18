import express from 'express';
import { getChats, getChat, createChat, sendMessage, markMessagesAsRead } from '../controllers/chat.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all chat routes
router.use(verifyToken);

// Get all chats for the current user
router.get('/', getChats);

// Get a specific chat by ID
router.get('/:id', getChat);

// Create a new chat
router.post('/', createChat);

// Send a message in a chat
router.post('/message', sendMessage);

// Mark all messages in a chat as read
router.put('/:chatId/read', markMessagesAsRead);

export default router;
