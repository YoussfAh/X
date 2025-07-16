import mongoose from 'mongoose';

/**
 * Validates and cleans assigned collections array
 * Removes any entries that are missing required fields or have invalid ObjectIds
 * @param {Array} assignedCollections - Array of assigned collection objects
 * @param {boolean} strict - If true, also validates that ObjectIds are valid MongoDB ObjectIds
 * @returns {Array} - Cleaned array of valid assigned collections
 */
export const validateAndCleanAssignedCollections = (assignedCollections, strict = false) => {
  if (!Array.isArray(assignedCollections)) {
    return [];
  }

  return assignedCollections.filter(collection => {
    // Check required fields exist and are not empty
    if (!collection.collectionId || !collection.name || !collection.assignedBy) {
      return false;
    }

    // Strict validation: check if ObjectIds are valid
    if (strict) {
      if (!mongoose.Types.ObjectId.isValid(collection.collectionId) || 
          !mongoose.Types.ObjectId.isValid(collection.assignedBy)) {
        return false;
      }
    }

    // Check that required fields are not just empty strings
    if (typeof collection.name !== 'string' || collection.name.trim() === '') {
      return false;
    }

    return true;
  });
};

/**
 * Creates a properly formatted assignment data object
 * @param {Object} params - Parameters for creating assignment
 * @param {string} params.collectionId - Collection ObjectId
 * @param {string} params.name - Collection name
 * @param {string} params.assignedBy - Admin user ObjectId
 * @param {Object} params.collection - Optional full collection object for additional data
 * @param {string} params.notes - Optional notes
 * @param {Array} params.tags - Optional tags array
 * @param {string} params.status - Optional status (defaults to 'active')
 * @returns {Object} - Properly formatted assignment object
 */
export const createAssignmentData = ({
  collectionId,
  name,
  assignedBy,
  collection = null,
  notes = '',
  tags = [],
  status = 'active'
}) => {
  // Validate required fields
  if (!collectionId || !name || !assignedBy) {
    throw new Error('Missing required fields: collectionId, name, and assignedBy are required');
  }

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(collectionId) || !mongoose.Types.ObjectId.isValid(assignedBy)) {
    throw new Error('Invalid ObjectId provided');
  }

  // Validate name is not empty
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error('Collection name cannot be empty');
  }

  return {
    collectionId: new mongoose.Types.ObjectId(collectionId),
    name: name.trim(),
    description: collection?.description || '',
    image: collection?.image || '/images/sample.jpg',
    displayOrder: collection?.displayOrder || 0,
    isPublic: collection?.isPublic !== undefined ? collection.isPublic : true,
    assignedAt: new Date(),
    assignedBy: new mongoose.Types.ObjectId(assignedBy),
    lastAccessedAt: null,
    accessCount: 0,
    notes: notes || '',
    status: status || 'active',
    tags: Array.isArray(tags) ? tags : [],
  };
};

/**
 * Middleware function to clean assignedCollections before saving user
 * @param {Object} user - User document
 */
export const cleanAssignedCollectionsBeforeSave = (user) => {
  if (user.assignedCollections) {
    user.assignedCollections = validateAndCleanAssignedCollections(user.assignedCollections, true);
  }
}; 