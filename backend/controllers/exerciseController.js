import asyncHandler from '../middleware/asyncHandler.js';
import Exercise from '../models/exerciseModel.js';

// @desc    Fetch all exercises
// @route   GET /api/exercises
// @access  Private (Authenticated users only)
const getExercises = asyncHandler(async (req, res) => {
    const pageSize = Math.min(Number(req.query.pageSize) || 20, 20); // Max 20 exercises per page
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword
        ? {
            name: {
                $regex: req.query.keyword,
                $options: 'i',
            },
        }
        : {};

    // Add tenant filter
    const filter = { ...keyword };
    if (req.tenantId) {
        filter.tenantId = req.tenantId;
    }

    const count = await Exercise.countDocuments(filter);
    const exercises = await Exercise.find(filter)
        .sort({ createdAt: -1 }) // Sort by creation date, newest first
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({ exercises, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Fetch single exercise
// @route   GET /api/exercises/:id
// @access  Private (Authenticated users only)
const getExerciseById = asyncHandler(async (req, res) => {
    const exercise = await Exercise.findById(req.params.id);
    if (exercise) {
        return res.json(exercise);
    } else {
        res.status(404);
        throw new Error('Exercise not found');
    }
});

// @desc    Create an exercise
// @route   POST /api/exercises
// @access  Private/Admin
const createExercise = asyncHandler(async (req, res) => {
    const exercise = new Exercise({
        tenantId: req.tenantId || null,
        name: 'name',
        user: req.user._id,
        image: '/images/sample.jpg',
        category: 'category',
        description: ' description',
        // youtubeVideo field removed so it will use the schema default
        isMealDiet: false,
    });

    const createdExercise = await exercise.save();
    res.status(201).json(createdExercise);
});

// @desc    Update an exercise
// @route   PUT /api/exercises/:id
// @access  Private/Admin
const updateExercise = asyncHandler(async (req, res) => {
    const { name, description, image, category, youtubeVideo, isMealDiet } = req.body;

    const exercise = await Exercise.findById(req.params.id);

    if (exercise) {
        exercise.name = name;
        exercise.description = description;
        exercise.image = image;
        exercise.category = category;
        exercise.youtubeVideo = youtubeVideo || exercise.youtubeVideo; // Use existing if not provided
        exercise.isMealDiet = isMealDiet !== undefined ? isMealDiet : exercise.isMealDiet;

        const updatedExercise = await exercise.save();
        res.json(updatedExercise);
    } else {
        res.status(404);
        throw new Error('Exercise not found');
    }
});

// @desc    Delete an exercise
// @route   DELETE /api/exercises/:id
// @access  Private/Admin
const deleteExercise = asyncHandler(async (req, res) => {
    const exercise = await Exercise.findById(req.params.id);

    if (exercise) {
        await Exercise.deleteOne({ _id: exercise._id });
        res.json({ message: 'Exercise removed' });
    } else {
        res.status(404);
        throw new Error('Exercise not found');
    }
});

// @desc    Get featured exercises
// @route   GET /api/exercises/top
// @access  Private (Authenticated users only)
const getTopExercises = asyncHandler(async (req, res) => {
    const exercises = await Exercise.find({}).limit(3);
    res.json(exercises);
});

export {
    getExercises,
    getExerciseById,
    createExercise,
    updateExercise,
    deleteExercise,
    getTopExercises,
}; 