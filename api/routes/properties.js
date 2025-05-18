import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty
} from '../controllers/property.controller.js';

const router = express.Router();

// Get all properties
router.get('/', verifyToken, getAllProperties);

// Get property by ID
router.get('/:id', verifyToken, getPropertyById);

// Create new property
router.post('/', verifyToken, createProperty);

// Update property
router.put('/:id', verifyToken, updateProperty);

// Delete property
router.delete('/:id', verifyToken, deleteProperty);

export default router;
