import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getAgents,
  getPendingAgentRequests,
  updateAgentStatus,
  revokeAgentStatus,
  createRegularUser,
  resetToRegularUsers,
  clearAgentData
} from '../controllers/admin.controller.js';

const router = express.Router();

// Get all approved agents
router.get('/agents', verifyToken, getAgents);

// Get pending agent requests
router.get('/pending-requests', verifyToken, getPendingAgentRequests);

// Update agent status (approve or reject)
router.put('/agent-status/:userId', verifyToken, updateAgentStatus);

// Revoke agent status (change user to regular user)
router.post('/revoke/:userId', verifyToken, revokeAgentStatus);

// Clear all agent data for a user
router.delete('/clear-agent-data/:userId', verifyToken, clearAgentData);

// Create a new regular user
router.post('/create-user', verifyToken, createRegularUser);

// Reset all non-admin users to regular users
router.post('/reset-to-regular', verifyToken, resetToRegularUsers);

export default router;
