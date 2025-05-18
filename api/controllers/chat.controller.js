import Chat from '../models/chat.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';

export const getChats = async (req, res) => {
  const userId = req.user._id;

  try {
    // Find all chats where the user is a participant
    const chats = await Chat.find({
      participants: userId
    })
    .populate({
      path: 'participants',
      select: 'username photo _id isAgent agentRequest'
    })
    .populate({
      path: 'messages.sender',
      select: 'username photo _id'
    })
    .sort({ updatedAt: -1 }); // Sort by most recent activity

    // Format the response
    const formattedChats = chats.map(chat => {
      // Find the other participant (not the current user)
      const otherParticipant = chat.participants.find(
        participant => participant._id.toString() !== userId.toString()
      );

      return {
        _id: chat._id,
        otherParticipant: otherParticipant,
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt,
        unreadCount: chat.messages.filter(
          msg => !msg.read && msg.sender._id.toString() !== userId.toString()
        ).length
      };
    });

    res.status(200).json(formattedChats);
  } catch (err) {
    console.error('Error fetching chats:', err);
    res.status(500).json({ message: "Failed to get chats!" });
  }
};

export const getChat = async (req, res) => {
  const userId = req.user._id;
  const chatId = req.params.id;

  try {
    // Validate chat ID
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID format" });
    }

    // Find the chat and ensure the user is a participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    })
    .populate({
      path: 'participants',
      select: 'username photo _id isAgent agentRequest'
    })
    .populate({
      path: 'messages.sender',
      select: 'username photo _id'
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Mark all messages as read for this user
    await Chat.updateOne(
      { 
        _id: chatId,
        'messages.sender': { $ne: userId },
        'messages.read': false
      },
      { $set: { 'messages.$[unread].read': true } },
      { 
        arrayFilters: [{ 'unread.sender': { $ne: userId }, 'unread.read': false }],
        multi: true
      }
    );

    res.status(200).json(chat);
  } catch (err) {
    console.error('Error fetching chat:', err);
    res.status(500).json({ message: "Failed to get chat!" });
  }
};

export const createChat = async (req, res) => {
  const userId = req.user._id;
  const { receiverId } = req.body;

  try {
    // Validate receiver ID
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID format" });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Check if chat already exists between these users
    const existingChat = await Chat.findOne({
      participants: { $all: [userId, receiverId] }
    });

    if (existingChat) {
      return res.status(200).json({ chatId: existingChat._id, alreadyExists: true });
    }

    // Create new chat
    const newChat = await Chat.create({
      participants: [userId, receiverId],
      messages: []
    });

    // Populate participant information
    const populatedChat = await Chat.findById(newChat._id)
      .populate({
        path: 'participants',
        select: 'username photo _id isAgent agentRequest'
      });

    res.status(201).json(populatedChat);
  } catch (err) {
    console.error('Error creating chat:', err);
    res.status(500).json({ message: "Failed to create chat!" });
  }
};

export const sendMessage = async (req, res) => {
  const userId = req.user._id;
  const { chatId, content } = req.body;

  try {
    // Validate chat ID
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID format" });
    }

    // Find the chat and ensure the user is a participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Add the new message
    const newMessage = {
      sender: userId,
      content,
      timestamp: new Date(),
      read: false
    };

    chat.messages.push(newMessage);
    chat.lastMessage = {
      content,
      timestamp: new Date(),
      sender: userId
    };

    await chat.save();

    // Return the populated message
    const updatedChat = await Chat.findById(chatId)
      .populate({
        path: 'messages.sender',
        select: 'username photo _id'
      });

    const sentMessage = updatedChat.messages[updatedChat.messages.length - 1];

    res.status(201).json(sentMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: "Failed to send message!" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  try {
    // Validate chat ID
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID format" });
    }

    // Update all unread messages sent by others
    const result = await Chat.updateOne(
      { 
        _id: chatId,
        participants: userId
      },
      { $set: { 'messages.$[unread].read': true } },
      { 
        arrayFilters: [{ 'unread.sender': { $ne: userId }, 'unread.read': false }],
        multi: true
      }
    );

    res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ message: "Failed to mark messages as read!" });
  }
};
