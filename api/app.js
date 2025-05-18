import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import multer from 'multer';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import agentRoutes from './routes/agent.routes.js';
import propertiesRoutes from './routes/properties.js';
import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';
import connectToDatabase from './db/db.js';
import createAdminUser from './controllers/auth.controller.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
console.log('Full uploads directory path:', uploadsDir);
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory at:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Saving file to:', uploadsDir);
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests from localhost, 127.0.0.1, and deployed domains
    if (!origin || 
        origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://localhost:5175') ||
        origin.startsWith('http://localhost:5008') ||
        origin === 'https://gharelu.vercel.app') {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Set up uploads directory path for static files
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
const uploadsPath = path.join(__dirname, 'uploads');
console.log('Setting up static file serving from:', uploadsPath);

// Ensure uploads directory exists before serving
if (!fs.existsSync(uploadsPath)) {
  console.log('Creating uploads directory for static serving');
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve static files from uploads directory with additional options
app.use('/uploads', express.static(uploadsPath, {
  dotfiles: 'allow',
  etag: true,
  fallthrough: true,
  index: false,
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now());
    res.set('Cache-Control', 'public, max-age=31557600'); // Cache for 1 year
  }
}));

// Add a test route to check if files exist
app.get('/check-file/:filename', (req, res) => {
  const filePath = path.join(uploadsPath, req.params.filename);
  console.log('Checking file:', filePath);
  if (fs.existsSync(filePath)) {
    res.json({ exists: true, path: filePath });
  } else {
    res.json({ exists: false, path: filePath });
  }
});

// Test route to verify server is running
app.get('/', (req, res) => {
  res.send('API is running');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'MulterError') {
    return res.status(400).json({ 
      message: 'File upload error',
      error: err.message
    });
  }

  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MongoDB URI is missing in environment variables');
  process.exit(1);
}

// Start server
const PORT = process.env.PORT || 5000;
let server;

const startServer = async (port) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB successfully');
    }

    await createAdminUser();
    
    return new Promise((resolve, reject) => {
      // Create HTTP server
      const httpServer = createServer(app);
      
      // Initialize Socket.io
      const io = new Server(httpServer, {
        cors: {
          origin: ['http://localhost:5175', 'http://127.0.0.1:5175', 'http://localhost:5009', 'http://127.0.0.1:5009'],
          methods: ['GET', 'POST'],
          credentials: true
        }
      });
      
      // Socket.io connection handler
      io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);
        
        // Join a chat room
        socket.on('join_chat', (chatId) => {
          socket.join(chatId);
          console.log(`User joined chat: ${chatId}`);
        });
        
        // Leave a chat room
        socket.on('leave_chat', (chatId) => {
          socket.leave(chatId);
          console.log(`User left chat: ${chatId}`);
        });
        
        // Send a message
        socket.on('send_message', (messageData) => {
          console.log('Message received:', messageData);
          io.to(messageData.chatId).emit('receive_message', messageData);
        });
        
        // User is typing
        socket.on('typing', (data) => {
          socket.to(data.chatId).emit('typing', data);
        });
        
        // User stopped typing
        socket.on('stop_typing', (data) => {
          socket.to(data.chatId).emit('stop_typing', data);
        });
        
        // Handle disconnection
        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id);
        });
      });
      
      // Start the server
      server = httpServer.listen(port, () => {
        console.log(`✅ Server is running on port ${port}`);
        resolve();
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`⚠️ Port ${port} is in use, trying ${port + 1}`);
          server.close();
          resolve(startServer(parseInt(port) + 1));
        } else {
          reject(err);
        }
      });

      // Handle graceful shutdown
      const cleanup = () => {
        server.close(() => {
          console.log('HTTP server closed');
          mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
          });
        });
      };

      process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        cleanup();
      });

      process.on('SIGINT', () => {
        console.log('SIGINT signal received: closing HTTP server');
        cleanup();
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(PORT).catch(error => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
