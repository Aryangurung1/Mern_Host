import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/user.controller.js';
import { verifyToken } from '../middleware/auth.js';
import { upload, multerErrorHandler } from '../middleware/upload.js';

const router = express.Router();

// Get user profile 
router.get('/profile', verifyToken, getUserProfile);

// Update user profile
router.put('/profile',
  verifyToken,
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 }
  ]),
  multerErrorHandler,
  updateUserProfile
);

export default router; 