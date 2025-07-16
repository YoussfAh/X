import express from 'express';
const router = express.Router();
import { checkDataIntegrity } from '../controllers/dataIntegrityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/check').get(protect, admin, checkDataIntegrity);

export default router; 