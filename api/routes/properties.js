import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getFeaturedProperties
} from '../controllers/property.controller.js';

const router = express.Router();

// Get featured properties (public route)
router.get('/featured', getFeaturedProperties);

// Get all properties (protected route)
router.get('/', verifyToken, getAllProperties);

// Get property by ID (protected route)
router.get('/:id', verifyToken, getPropertyById);

// Create new property (protected route)
router.post('/', verifyToken, createProperty);

// Update property (protected route)
router.put('/:id', verifyToken, updateProperty);

// Delete property (protected route)
router.delete('/:id', verifyToken, deleteProperty);

export default router;
