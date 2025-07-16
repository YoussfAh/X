import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
dotenv.config();
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
import oneTimeCodeRoutes from './routes/oneTimeCodeRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import workoutSessionRoutes from './routes/workoutSessionRoutes.js';
import dietRoutes from './routes/dietRoutes.js';
import systemSettingsRoutes from './routes/systemSettingsRoutes.js';
import messageTemplateRoutes from './routes/messageTemplateRoutes.js';
import waterTrackingRoutes from './routes/waterTrackingRoutes.js';
import sleepRoutes from './routes/sleepRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import weightRoutes from './routes/weightRoutes.js';
import dataIntegrityRoutes from './routes/dataIntegrityRoutes.js';
import nutritionRoutes from './routes/nutritionRoutes.js';
import aiAnalysisRoutes from './routes/aiAnalysisRoutes.js';
import progressImageRoutes from './routes/progressImageRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { autoAssignQuizzes } from './controllers/quizController.js';
import { identifyTenant, ensureTenantAccess, setTenantContext } from './middleware/tenantMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 5000;
const app = express();

// Middleware to handle favicon.ico requests and prevent 404 errors
app.get('/favicon.ico', (req, res) => res.status(204));

// CORS configuration
const whitelist = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://192.168.1.2:3000',
  process.env.FRONTEND_URL, // Your main production frontend URL
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log(`CORS: Checking origin: ${origin}`);
    
    // Allow server-to-server requests (no origin)
    if (!origin) {
      console.log('CORS: No origin - allowing server-to-server request');
      callback(null, true);
      return;
    }
    
    // Check if origin is in whitelist
    if (whitelist.includes(origin)) {
      console.log(`CORS: Origin in whitelist: ${origin}`);
      callback(null, true);
      return;
    }
    
    // Heuristic: If the origin is a Vercel URL, allow it.
    // This is useful for preview deployments where the URL is dynamic.
    const isVercel = origin.endsWith('.vercel.app');
    if (isVercel) {
      console.log(`CORS: Vercel deployment allowed: ${origin}`);
      callback(null, true);
      return;
    }
    
    // Check for localhost subdomain patterns (for tenant access like main.localhost:3000)
    const isLocalhostSubdomain = /^https?:\/\/[^.]+\.localhost:300[0-9]$/.test(origin);
    if (isLocalhostSubdomain) {
      console.log(`CORS: Localhost subdomain allowed: ${origin}`);
      callback(null, true);
      return;
    }
    
    // Check for custom domains (for tenant deployments)
    const isCustomDomain = origin.match(/^https?:\/\/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/);
    if (isCustomDomain && process.env.NODE_ENV === 'production') {
      console.log(`CORS: Custom domain allowed in production: ${origin}`);
      callback(null, true);
      return;
    }
    
    // Check for development patterns
    if (process.env.NODE_ENV === 'development') {
      console.log(`CORS: Development mode - allowing origin: ${origin}`);
      callback(null, true);
      return;
    }
    
    // Reject all other origins
    console.error(`CORS ERROR: The origin "${origin}" was blocked by the CORS policy.`);
    callback(new Error('This origin is not allowed by CORS.'));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Middleware Setup
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// DB Connection Middleware
const connectDBMiddleware = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection middleware error:', error);
    res.status(503).send('Service Unavailable: Could not connect to the database.');
  }
};
// Apply middleware to all API routes to ensure DB is connected.
app.use('/api', connectDBMiddleware);

// Tenant middleware - identify tenant from request
app.use('/api', identifyTenant);
app.use('/api', setTenantContext);
// Note: ensureTenantAccess is applied after authentication in specific routes

// API Routes
// Super admin routes (no tenant context required)
app.use('/api/super-admin/tenants', tenantRoutes);

// Regular routes (tenant context required)
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/one-time-codes', oneTimeCodeRoutes);
app.use('/api/workout', workoutRoutes);
app.use('/api/workout-sessions', workoutSessionRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/system-settings', systemSettingsRoutes);
app.use('/api/system', systemSettingsRoutes);
app.use('/api/message-templates', messageTemplateRoutes);
app.use('/api/water-tracking', waterTrackingRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/admin/data-integrity', dataIntegrityRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/ai-analysis', aiAnalysisRoutes);
app.use('/api/progress-images', progressImageRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.get('/api/config/paypal', (req, res) =>
  res.send({ clientId: process.env.PAYPAL_CLIENT_ID })
);

app.get('/', (req, res) => {
  res.send('API is running....');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// --- Server Startup Logic ---
const startServer = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected for local development.');

    app.listen(port, () =>
      console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${port}`
      )
    );

    // Start automatic quiz assignment scheduler
    console.log('Starting automatic quiz assignment scheduler...');
    setInterval(async () => {
      try {
        console.log('Running automatic quiz assignment check...');
        await autoAssignQuizzes();
      } catch (error) {
        console.error('Error in automatic quiz assignment:', error);
      }
    }, 5 * 60 * 1000);

    // Run once on startup after a delay
    setTimeout(async () => {
      try {
        console.log('Running initial quiz assignment check...');
        await autoAssignQuizzes();
      } catch (error) {
        console.error('Error in initial quiz assignment:', error);
      }
    }, 30000);

  } catch (error) {
    console.error('Failed to connect to MongoDB and start server', error);
    process.exit(1);
  }
};

// Only run the full server startup if not in a Vercel serverless environment.
// In Vercel, the 'app' is just exported and the middleware handles the connection.
if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
