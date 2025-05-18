import express from 'express';
import { verifyToken, verifyAgent } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  createProperty,
  getAgentProperties,
  updateProperty,
  deleteProperty,
  registerAgent,
  updateAgentStatus,
  clearOwnAgentRequest,
  getAgentById,
  getAllAgents,
  updateAgentProfile,
  getAgentReviews,
  createAgentReview,
  deleteAgentReview
} from '../controllers/agent.controller.js';

const router = express.Router();

// Property routes
router.post('/properties', verifyToken, verifyAgent, upload.array('propertyImages', 10), createProperty);
router.get('/properties', verifyToken, verifyAgent, getAgentProperties);
router.put('/properties/:propertyId', verifyToken, verifyAgent, upload.array('images', 10), updateProperty);
router.delete('/properties/:propertyId', verifyToken, verifyAgent, deleteProperty);

// Agent profile route
router.put('/profile', verifyToken, verifyAgent, upload.fields([
  { name: 'profilePhoto', maxCount: 1 }
]), updateAgentProfile);

// Agent registration route
router.post('/register', verifyToken, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'citizenshipPhoto', maxCount: 1 }
]), registerAgent);

// Agent status route
router.put('/status/:userId', verifyToken, updateAgentStatus);

// Clear own agent request
router.delete('/clear-own-request', verifyToken, clearOwnAgentRequest);

// Get all agents
router.get('/', getAllAgents);

// Get agent by ID
router.get('/:id', getAgentById);

// Agent reviews routes
router.get('/:id/reviews', getAgentReviews);
router.post('/:id/reviews', verifyToken, createAgentReview);
router.delete('/:id/reviews/:reviewId', verifyToken, deleteAgentReview);

export default router;
