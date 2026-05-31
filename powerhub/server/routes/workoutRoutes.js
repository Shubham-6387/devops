const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

// Apply auth middleware to all routes
router.use(protect);

// Profile
router.post('/profile', workoutController.createOrUpdateProfile);
router.get('/profile', workoutController.getProfile);

// Exercises
router.get('/exercises', workoutController.getExercises);
router.get('/exercises/:id', workoutController.getExerciseById);

// Routines
router.get('/routines/generate', workoutController.generateRoutine);
router.get('/routines', workoutController.getRoutines);
router.post('/routines', workoutController.createRoutine);
router.get('/routines/:id', workoutController.getRoutineById);

// Sessions
router.post('/sessions', workoutController.logSession);
router.get('/sessions', workoutController.getSessions);

// Weekly Plan
router.get('/weekly-plan', workoutController.getWeeklyPlan);
router.post('/weekly-plan', workoutController.saveWeeklyPlan);

// Progress
router.get('/progress', workoutController.getProgress);

// Notes
router.get('/notes', workoutController.getNotes);
router.post('/notes', workoutController.createNote);

// Tasks
router.get('/tasks', workoutController.getTasks);
router.post('/tasks', workoutController.createTask);
router.put('/tasks/:id', workoutController.updateTask);

// Reminders
router.get('/reminders', workoutController.getReminders);
router.post('/reminders', workoutController.createReminder);

module.exports = router;
