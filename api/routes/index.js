import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import agentRoutes from './agent.routes.js';
import propertiesRoutes from './properties.js';
import adminRoutes from './admin.routes.js';

const router = express.Router();

// Set up API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/agent', agentRoutes);
router.use('/properties', propertiesRoutes);
router.use('/admin', adminRoutes);

export default router; 