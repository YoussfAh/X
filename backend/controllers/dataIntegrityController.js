import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/userModel.js';
import Collection from '../models/collectionModel.js';
import { validateAndCleanAssignedCollections } from '../utils/assignedCollectionsValidator.js';

// @desc    Check data integrity for all users
// @route   GET /api/admin/data-integrity/check
// @access  Private/Admin
const checkDataIntegrity = asyncHandler(async (req, res) => {
  const results = {
    totalUsers: 0,
    usersWithIssues: 0,
    issuesFound: [],
    summary: {}
  };

  try {
    const users = await User.find({ 
      assignedCollections: { $exists: true, $ne: [] } 
    }).select('email assignedCollections');

    results.totalUsers = users.length;

    for (const user of users) {
      const userIssues = [];
      
      if (user.assignedCollections && Array.isArray(user.assignedCollections)) {
        // Check for malformed entries
        const invalidEntries = user.assignedCollections.filter(collection => {
          return !collection.collectionId || !collection.name || !collection.assignedBy;
        });

        if (invalidEntries.length > 0) {
          userIssues.push({
            type: 'malformed_assigned_collections',
            count: invalidEntries.length,
            details: invalidEntries.map(entry => ({
              collectionId: entry.collectionId || 'missing',
              name: entry.name || 'missing',
              assignedBy: entry.assignedBy || 'missing'
            }))
          });
        }
      }

      if (userIssues.length > 0) {
        results.usersWithIssues++;
        results.issuesFound.push({
          userId: user._id,
          email: user.email,
          issues: userIssues
        });
      }
    }

    results.summary = {
      malformedCollections: results.issuesFound.reduce((sum, user) => {
        const malformed = user.issues.find(i => i.type === 'malformed_assigned_collections');
        return sum + (malformed ? malformed.count : 0);
      }, 0)
    };

    res.json(results);
  } catch (error) {
    res.status(500);
    throw new Error(`Data integrity check failed: ${error.message}`);
  }
});

// @desc    Fix data integrity issues for all users
// @route   POST /api/admin/data-integrity/fix
// @access  Private/Admin
const fixDataIntegrity = asyncHandler(async (req, res) => {
  const results = {
    totalUsers: 0,
    usersFixed: 0,
    itemsFixed: {
      malformedRemoved: 0,
      orphanedRemoved: 0,
      duplicatesRemoved: 0
    },
    errors: []
  };

  try {
    // Get all users with assignedCollections
    const users = await User.find({ 
      assignedCollections: { $exists: true, $ne: [] } 
    });

    results.totalUsers = users.length;

    for (const user of users) {
      let userModified = false;
      const originalCount = user.assignedCollections ? user.assignedCollections.length : 0;

      try {
        if (user.assignedCollections && Array.isArray(user.assignedCollections)) {
          // Remove malformed entries
          const beforeMalformed = user.assignedCollections.length;
          user.assignedCollections = validateAndCleanAssignedCollections(user.assignedCollections, true);
          const malformedRemoved = beforeMalformed - user.assignedCollections.length;
          
          if (malformedRemoved > 0) {
            results.itemsFixed.malformedRemoved += malformedRemoved;
            userModified = true;
          }

          // Remove orphaned collections (collections that no longer exist)
          const validCollections = [];
          for (const assignment of user.assignedCollections) {
            const collectionExists = await Collection.findById(assignment.collectionId);
            if (collectionExists) {
              validCollections.push(assignment);
            } else {
              results.itemsFixed.orphanedRemoved++;
              userModified = true;
            }
          }
          user.assignedCollections = validCollections;

          // Remove duplicate assignments (keep the first occurrence)
          const seenCollections = new Set();
          const uniqueCollections = [];
          for (const assignment of user.assignedCollections) {
            const collectionId = assignment.collectionId.toString();
            if (!seenCollections.has(collectionId)) {
              seenCollections.add(collectionId);
              uniqueCollections.push(assignment);
            } else {
              results.itemsFixed.duplicatesRemoved++;
              userModified = true;
            }
          }
          user.assignedCollections = uniqueCollections;

          if (userModified) {
            await user.save();
            results.usersFixed++;
          }
        }
      } catch (userError) {
        results.errors.push({
          userId: user._id,
          email: user.email,
          error: userError.message
        });
      }
    }

    res.json({
      message: 'Data integrity fix completed',
      results
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Data integrity fix failed: ${error.message}`);
  }
});

// @desc    Get system health status
// @route   GET /api/admin/data-integrity/health
// @access  Private/Admin
const getSystemHealth = asyncHandler(async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        withAssignedCollections: await User.countDocuments({ 
          assignedCollections: { $exists: true, $ne: [] } 
        })
      },
      collections: {
        total: await Collection.countDocuments(),
        public: await Collection.countDocuments({ isPublic: true }),
        private: await Collection.countDocuments({ isPublic: false })
      },
      lastCheck: new Date()
    };

    // Quick integrity check
    const usersWithIssues = await User.aggregate([
      { $match: { assignedCollections: { $exists: true, $ne: [] } } },
      { $project: { 
          email: 1,
          hasIssues: {
            $anyElementTrue: {
              $map: {
                input: "$assignedCollections",
                as: "assignment",
                in: {
                  $or: [
                    { $eq: ["$$assignment.collectionId", null] },
                    { $eq: ["$$assignment.name", null] },
                    { $eq: ["$$assignment.assignedBy", null] },
                    { $eq: ["$$assignment.name", ""] }
                  ]
                }
              }
            }
          }
        }
      },
      { $match: { hasIssues: true } },
      { $count: "usersWithIssues" }
    ]);

    stats.integrity = {
      usersWithIssues: usersWithIssues.length > 0 ? usersWithIssues[0].usersWithIssues : 0,
      status: usersWithIssues.length > 0 && usersWithIssues[0].usersWithIssues > 0 ? 'warning' : 'healthy'
    };

    res.json(stats);
  } catch (error) {
    res.status(500);
    throw new Error(`System health check failed: ${error.message}`);
  }
});

export { checkDataIntegrity, fixDataIntegrity, getSystemHealth }; 