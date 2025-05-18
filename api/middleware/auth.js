import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const verifyToken = async (req, res, next) => {
  try {
    console.log('verifyToken middleware running');
    
    // Try to get token from cookie first
    let token = req.cookies.token;
    console.log('Token from cookie:', token ? `${token.substring(0, 10)}...` : 'No token in cookie');
    
    // If no token in cookie, try Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      console.log('Authorization header:', authHeader);
      
      if (authHeader) {
        token = authHeader.split(' ')[1];
        console.log('Token from header:', token ? `${token.substring(0, 10)}...` : 'No token in header');
      }
    }
    
    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      // Verify token
      console.log('Verifying token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log('Token decoded successfully. User ID:', decoded.id);
      
      // Find user by id
      console.log('Finding user in database...');
      const user = await User.findById(decoded.id);
      if (!user) {
        console.log('User not found with ID:', decoded.id);
        return res.status(401).json({ message: 'User not found' });
      }
      
      console.log('User found:', user._id, 'isAgent:', user.isAgent);
      
      // Add user info to request
      req.user = user;
      
      // Print the user object to ensure it's correctly set
      console.log('User set on request:', req.user ? 'Yes' : 'No');
      
      // Continue to next middleware
      next();
      
    } catch (error) {
      console.error('Token verification detailed error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'TokenExpiredError') {
        console.log('Token expired');
        return res.status(401).json({ message: 'Token expired' });
      }
      
      console.log('Invalid token');
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Refresh token middleware
export const refreshToken = async (req, res) => {
  try {
    // Get token from headers or cookies
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      
      // Find user by id
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Generate new token
      const newToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '24h' }
      );

      // Set cookie with new token
      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ token: newToken });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Token refresh error' });
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const verifyAgent = async (req, res, next) => {
  try {
    if (!req.user.isAgent) {
      return res.status(403).json({ message: 'Access denied. Agents only.' });
    }
    next();
  } catch (error) {
    console.error('Agent verification error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
