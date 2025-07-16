import asyncHandler from '../middleware/asyncHandler.js';
import ProgressImage from '../models/progressImageModel.js';

// @desc    Save progress images (receives URLs from frontend)
// @route   POST /api/progress-images
// @access  Private
const saveProgressImages = asyncHandler(async (req, res) => {
  const { images } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    res.status(400);
    throw new Error('No image data provided.');
  }

  // Create new progress image group
  const progressImage = await ProgressImage.create({
    user: req.user._id,
    images: images.map(img => ({
      ...img,
      uploadedAt: new Date(),
    })),
    uploadDate: new Date(),
    groupName: req.body.groupName || `Progress Images ${new Date().toLocaleDateString()}`,
  });

  res.status(201).json(progressImage);
});

// @desc    Get user progress images
// @route   GET /api/progress-images
// @access  Private
const getUserProgressImages = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 9;

  let progressImages = await ProgressImage.find({ user: req.user._id })
    .sort({ uploadDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean(); // Use lean() for better performance and to allow modification

  const total = await ProgressImage.countDocuments({ user: req.user._id });

  const baseUrl = `${req.protocol}://${req.get('host')}`;

  // Ensure all image URLs are absolute
  progressImages = progressImages.map(group => {
    group.images = group.images.map(image => {
      if (image.url && !image.url.startsWith('http')) {
        image.url = `${baseUrl}${image.url.startsWith('/') ? '' : '/'}${image.url}`;
      }
      if (image.thumbnail && !image.thumbnail.startsWith('http')) {
        image.thumbnail = `${baseUrl}${image.thumbnail.startsWith('/') ? '' : '/'}${image.thumbnail}`;
      }
      return image;
    });
    return group;
  });

  res.json({
    progressImages,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

// @desc    Delete progress image group
// @route   DELETE /api/progress-images/:id
// @access  Private
const deleteProgressImageGroup = asyncHandler(async (req, res) => {
  try {
    if (!req.params.id) {
      res.status(400);
      throw new Error('Invalid group ID');
    }

    const progressImage = await ProgressImage.findById(req.params.id);

    if (!progressImage) {
      res.status(404);
      throw new Error('Progress image group not found');
    }

    if (progressImage.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete these images');
    }

    // No need to delete files from local filesystem since we're using Cloudinary
    // Images will remain on Cloudinary but that's acceptable

    await progressImage.deleteOne();

    res.json({ message: 'Progress image group removed' });
  } catch (error) {
    console.error('Error deleting progress image group:', error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

export {
  saveProgressImages,
  getUserProgressImages,
  deleteProgressImageGroup,
}; 