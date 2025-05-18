import express from 'express';
import { 
  signup,
  signin,
  google,
  signout,
  getMe,
  refreshToken,
  forgotPassword
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/google', google);
router.post('/forgot-password', forgotPassword);
router.get('/signout', signout);
router.get('/refresh', refreshToken);

// Protected routes
router.get('/me', verifyToken, getMe);

export default router;