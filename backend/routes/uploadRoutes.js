import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { protect } from '../middleware/authMiddleware.js';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get Cloudinary configuration (for debugging) - PROTECTED
const router = express.Router();
router.get('/config', protect, (req, res) => {
  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
    configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  });
});

// Log Cloudinary configuration (without exposing actual credentials)
console.log('Cloudinary Configuration:');
console.log('API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set');
console.log('API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set');
console.log('CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not Set');
console.log('UPLOAD_PRESET:', process.env.CLOUDINARY_UPLOAD_PRESET ? 'Set' : 'Not Set');

// CORS headers middleware for upload routes
const addCorsHeaders = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

// Apply CORS headers to all routes
router.use(addCorsHeaders);

// Generate signature for direct frontend uploads to Cloudinary - PROTECTED
router.get('/signature', protect, (req, res) => {
  try {
    console.log('Signature request received');
    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary configuration');
      return res.status(500).json({
        message: 'Server configuration error - missing Cloudinary settings'
      });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);

    // Generate signature for upload
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: 'app-uploads', // your desired folder
      },
      process.env.CLOUDINARY_API_SECRET
    );

    console.log('Signature generated successfully');

    // Return the data needed for frontend direct upload
    res.status(200).json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error('Error generating signature:', error);
    res.status(500).json({
      message: 'Error generating upload signature',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Endpoint to record uploaded image details in your database - PROTECTED
router.post('/complete', protect, express.json(), (req, res) => {
  try {
    console.log('Upload completion notification received');
    const { imageUrl, publicId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    console.log('Upload completed:', {
      url: imageUrl,
      publicId: publicId
    });

    // Here you would typically save the image URL to your database
    // const result = await YourModel.create({ imageUrl, publicId });

    res.status(200).json({
      message: 'Image upload recorded successfully',
      image: imageUrl
    });
  } catch (error) {
    console.error('Error recording image upload:', error);
    res.status(500).json({
      message: 'Error recording image upload',
      error: error.message
    });
  }
});

// Simplified compatibility endpoint - returns direct upload URL - PROTECTED
router.post('/', protect, express.json(), (req, res) => {
  try {
    console.log('Legacy upload endpoint called');
    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_UPLOAD_PRESET) {
      console.error('Missing Cloudinary configuration');
      return res.status(500).json({
        message: 'Server configuration error - missing Cloudinary settings'
      });
    }

    // Inform the frontend that it needs to use the new direct upload approach
    console.log('Returning direct upload instructions');

    // Return direct upload information
    res.status(200).json({
      message: 'Please use direct upload to Cloudinary',
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      type: 'direct-upload'
    });
  } catch (error) {
    console.error('Error in compatibility endpoint:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
