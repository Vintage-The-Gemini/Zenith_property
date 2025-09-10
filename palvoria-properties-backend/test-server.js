import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Basic middleware
app.use(cors());
app.use(express.json());

// Test MongoDB connection
const testMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    return { status: 'connected', host: mongoose.connection.host };
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error.message);
    return { status: 'failed', error: error.message };
  }
};

// Test Cloudinary connection
const testCloudinary = async () => {
  try {
    const result = await cloudinary.api.ping();
    logger.info('✅ Cloudinary Connected:', result);
    return { status: 'connected', result };
  } catch (error) {
    logger.error('❌ Cloudinary connection failed:', error.message);
    return { status: 'failed', error: error.message };
  }
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const mongoStatus = await testMongoDB();
  const cloudinaryStatus = await testCloudinary();
  
  res.json({
    status: 'OK',
    service: 'Palvoria Properties Backend - Test Server',
    timestamp: new Date().toISOString(),
    connections: {
      mongodb: mongoStatus,
      cloudinary: cloudinaryStatus
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      mongoUri: process.env.MONGODB_URI ? 'configured' : 'not configured',
      cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME || 'not configured'
    }
  });
});

// Basic property routes for testing
app.use('/api/properties', (req, res) => {
  res.json({ message: 'Property routes available', method: req.method, path: req.path });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('🚀 Test Server running on http://localhost:' + PORT);
  console.log('📊 Health Check: http://localhost:' + PORT + '/api/health');
});