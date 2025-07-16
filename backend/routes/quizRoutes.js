import express from 'express';
const router = express.Router();
import {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  submitQuizAnswers,
  getQuizResultsForUser,
  getActiveQuizForUser,
  assignQuizToUser,
  unassignQuizFromUser,
  autoAssignQuizzes,
  getFutureQuizAssignments,
  removeFutureQuizAssignment,
} from '../controllers/quizController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// Routes for creating and getting all quizzes
router
  .route('/')
  .post(protect, admin, createQuiz)
  .get(protect, admin, getQuizzes);

// Route for getting the active quiz for the logged-in user
router.route('/active-for-user').get(protect, getActiveQuizForUser);

// Simple route alias for frontend compatibility
router.route('/active').get(protect, getActiveQuizForUser);

// Route for submitting quiz answers (using quiz ID)
router.route('/submit').post(protect, submitQuizAnswers);

// Route for auto-assigning time-based quizzes (can be called by cron job)
router.route('/auto-assign').post(protect, admin, autoAssignQuizzes);

// Routes for a specific quiz by ID (must come after specific routes)
router
  .route('/:id')
  .get(getQuizById) // Public access to get quiz details for taking it
  .put(protect, admin, updateQuiz)
  .delete(protect, admin, deleteQuiz);

// Route for an admin to get a user's quiz results
// Route for getting a specific user's quiz results
router.route('/results/:userId').get(protect, admin, getQuizResultsForUser);

// Route for assigning a quiz to a specific user by an admin
router.route('/assign/:userId/:quizId').post(protect, admin, assignQuizToUser);

// Route for un-assigning a quiz from a specific user by an admin
// Supports both removing all quizzes and removing a specific quiz
router
  .route('/unassign/:userId/:quizId?')
  .delete(protect, admin, unassignQuizFromUser);

// Route for auto-assigning time-based quizzes (can be called by cron job)
router.route('/auto-assign').post(protect, admin, autoAssignQuizzes);

// Route for getting future quiz assignments for a user
router
  .route('/future-assignments/:userId')
  .get(protect, admin, getFutureQuizAssignments);

// Route for removing a future quiz assignment
router
  .route('/future-assignments/:userId/:quizId')
  .delete(protect, admin, removeFutureQuizAssignment);

export default router;
