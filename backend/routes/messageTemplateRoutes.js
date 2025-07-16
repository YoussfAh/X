import express from 'express';
const router = express.Router();
import {
    getMessageTemplates,
    createMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
    incrementTemplateUsage,
    initializeDefaultTemplates
} from '../controllers/messageTemplateController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// All routes require authentication and admin privileges
router.use(protect);
router.use(admin);

router.route('/')
    .get(getMessageTemplates)
    .post(createMessageTemplate);

router.route('/initialize-defaults')
    .post(initializeDefaultTemplates);

router.route('/:id')
    .put(updateMessageTemplate)
    .delete(deleteMessageTemplate);

router.route('/:id/use')
    .post(incrementTemplateUsage);

export default router; 