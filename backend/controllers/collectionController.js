import asyncHandler from '../middleware/asyncHandler.js';
import Collection from '../models/collectionModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { syncUpdatedCollectionToUsers } from '../utils/updateUtils.js';

// @desc    Fetch all root collections (collections without a parent)
// @route   GET /api/collections
// @access  Private (Authenticated users only)
const getCollections = asyncHandler(async (req, res) => {
  console.log(
    `getCollections called with user: ${req.user ? req.user._id : 'no user'}`
  );

  // Initialize response structure
  const response = {
    publicCollections: [],
    assignedCollections: [],
    userInfo: req.user ? {
      _id: req.user._id,
      name: req.user.name,
      isAdmin: req.user.isAdmin
    } : null
  };

  // Build base query with tenant filtering
  const baseQuery = {
    parentCollection: null
  };
  
  // Add tenant filter if in tenant context
  if (req.tenantId) {
    baseQuery.tenantId = req.tenantId;
  }

  // If user is not logged in, just return public collections
  if (!req.user) {
    const publicCollections = await Collection.find({
      ...baseQuery,
      isPublic: true
    })
      .sort({ displayOrder: 1 })
      .populate({
        path: 'products.product',
        select: 'name image price rating numReviews',
      });

    response.publicCollections = publicCollections.map(doc => doc.toObject());
    return res.json(response);
  }

  // For admin users, return all collections (still filtered by tenant)
  if (req.user.isAdmin) {
    const allCollections = await Collection.find(baseQuery)
      .sort({ displayOrder: 1 })
      .populate({
        path: 'products.product',
        select: 'name image price rating numReviews',
      });

    response.publicCollections = allCollections.map(doc => doc.toObject());
    return res.json(response);
  }

  // For regular users, get both public collections and their assigned collections
  try {
    // 1. Get all public collections
    const publicCollections = await Collection.find({
      ...baseQuery,
      isPublic: true
    })
      .sort({ displayOrder: 1 })
      .populate({
        path: 'products.product',
        select: 'name image price rating numReviews',
      });

    response.publicCollections = publicCollections.map(doc => doc.toObject());

    // 2. Get user's assigned collections
    const user = await User.findById(req.user._id).select('assignedCollections');

    if (user && user.assignedCollections && user.assignedCollections.size > 0) {
      // Extract collection IDs from the Map
      const assignedCollectionIds = Array.from(user.assignedCollections.keys());
      console.log(`User has ${assignedCollectionIds.length} assigned collections:`, assignedCollectionIds);

      // Fetch all assigned collections (both public and private)
      const assignedCollections = await Collection.find({
        _id: { $in: assignedCollectionIds }
      })
        .sort({ displayOrder: 1 })
        .populate({
          path: 'products.product',
          select: 'name image price rating numReviews',
        });

      // Process assigned collections
      response.assignedCollections = assignedCollections.map(doc => {
        const collectionObj = doc.toObject();
        const assignmentDetails = user.assignedCollections.get(doc._id.toString());

        return {
          ...collectionObj,
          isAssignedToUser: true,
          assignmentDetails: {
            assignedAt: assignmentDetails.assignedAt,
            assignedBy: assignmentDetails.assignedBy,
            lastAccessedAt: assignmentDetails.lastAccessedAt,
            accessCount: assignmentDetails.accessCount,
            notes: assignmentDetails.notes,
            tags: assignmentDetails.tags
          }
        };
      });

      console.log(`Found ${response.assignedCollections.length} assigned collections for user`);

      // Remove assigned collections from public collections to avoid duplicates
      const assignedIds = new Set(assignedCollectionIds);
      response.publicCollections = response.publicCollections.filter(
        collection => !assignedIds.has(collection._id.toString())
      );

      console.log(`Filtered to ${response.publicCollections.length} non-assigned public collections`);
    }

    return res.json(response);
  } catch (error) {
    console.error('Error in getCollections:', error);
    res.status(500).json({
      message: 'Error fetching collections',
      error: error.message
    });
  }
});

// @desc    Fetch all collections for admin (including non-public ones)
// @route   GET /api/collections/admin
// @access  Private/Admin
const getAdminCollections = asyncHandler(async (req, res) => {
  // Check if we should skip pagination (useful for dropdowns and collection assignments)
  const skipPagination = req.query.skipPagination === 'true';

  const pageSize = 10; // Display 10 collections per page
  const page = Number(req.query.pageNumber) || 1;
  const keyword = req.query.keyword
    ? {
      $or: [
        { name: { $regex: req.query.keyword, $options: 'i' } },
        { description: { $regex: req.query.keyword, $options: 'i' } },
          { adminDescription: { $regex: req.query.keyword, $options: 'i' } },
      ],
    }
    : {};

  const visibilityFilter = req.query.visibility === 'public'
    ? { isPublic: true }
    : req.query.visibility === 'private'
      ? { isPublic: false }
      : {};

  // Build query with search, visibility, and tenant filter
  const query = {
    parentCollection: null,
    ...keyword,
    ...visibilityFilter,
  };
  
  // Add tenant filtering
  if (req.tenantId) {
    query.tenantId = req.tenantId;
  }

  const count = await Collection.countDocuments(query);

  // Create the database query, but don't apply pagination limits if skipPagination is true
  let collectionsQuery = Collection.find(query)
    .sort({ displayOrder: 1 }) // Sort by displayOrder instead of createdAt
    .populate({
      path: 'products.product',
      select: 'name image price rating numReviews',
    });

  // Apply pagination limits only if not skipping pagination
  if (!skipPagination) {
    collectionsQuery = collectionsQuery
      .limit(pageSize)
      .skip(pageSize * (page - 1));
  }

  // Execute the query
  const collections = await collectionsQuery;

  // Debug: Check if there are any sub-collections in the database at all
  const totalSubCollections = await Collection.countDocuments({
    parentCollection: { $ne: null }
  });
  console.log(`Total sub-collections in database: ${totalSubCollections}`);

  // Add sub-collections count for each root collection
  const collectionsWithSubCount = await Promise.all(
    collections.map(async (collection) => {
      try {
        const subCollectionQuery = {
          parentCollection: collection._id,
        };
        
        // Add tenant filtering for sub-collections
        if (req.tenantId) {
          subCollectionQuery.tenantId = req.tenantId;
        }
        
        const subCollectionCount = await Collection.countDocuments(subCollectionQuery);

        const collectionObj = collection.toObject();

        // Ensure we have a subCollections property with the correct structure
        // that works with frontend Array.isArray() and .length checks
        collectionObj.subCollections = new Array(subCollectionCount).fill({});

        // Log for debugging (can be removed later)
        console.log(`Collection "${collection.name}" (${collection._id}) has ${subCollectionCount} sub-collections`);

        return collectionObj;
      } catch (error) {
        console.error(`Error counting sub-collections for ${collection.name}:`, error);
        // Fallback: return collection with empty subCollections array
        const collectionObj = collection.toObject();
        collectionObj.subCollections = [];
        return collectionObj;
      }
    })
  );

  res.json({
    collections: collectionsWithSubCount,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  });
});

// @desc  --  Fetch single collection with its products and sub-collections
// @route   GET /api/collections/:id
// @access  Public
const getCollectionById = asyncHandler(async (req, res) => {
  // Reduced logging to avoid console spam
  // Only log when explicitly debugging
  if (process.env.DEBUG_API === 'true') {
    console.log(
      `getCollectionById called for ID ${req.params.id} by user: ${req.user ? req.user._id : 'no user'
      }`
    );
  }

  // Build query with tenant filtering
  const query = { _id: req.params.id };
  if (req.tenantId) {
    query.tenantId = req.tenantId;
  }

  const collection = await Collection.findOne(query)
    .populate({
      path: 'products.product',
      select:
        'name image price brand category rating numReviews countInStock description youtubeVideo',
    })
    .populate({
      path: 'parentCollection',
      select: 'name image description',
    });

  if (collection) {
    const isAssigned = req.user
      ? await isCollectionAssignedToUser(collection._id, req.user._id)
      : false;

    // Admin can access anything.
    // Regular users can access public collections or collections assigned to them.
    if (collection.isPublic || (req.user && req.user.isAdmin) || isAssigned) {
      // User has access - continue with collection details
      // Sort products by displayOrder
      collection.products.sort((a, b) => a.displayOrder - b.displayOrder);

      // Get all subcollections regardless of visibility
      let subCollectionsQuery = {
        parentCollection: collection._id,
      };
      
      // Add tenant filtering for sub-collections
      if (req.tenantId) {
        subCollectionsQuery.tenantId = req.tenantId;
      }

      // Get sub-collections without visibility filtering
      const subCollections = await Collection.find(subCollectionsQuery)
        .sort({ displayOrder: 1 })
        .populate({
          path: 'products.product',
          select: 'name image price rating numReviews',
        })
        .select(
          'name image description _id requiresCode codeUpdatedAt isPublic products'
        );

      console.log(
        `Found ${subCollections.length} sub-collections for collection ${collection._id}`
      );

      // Return collection with its products and sub-collections
      return res.json({
        ...collection.toObject(),
        subCollections,
        // Mark if this collection is assigned to the user (for UI purposes only)
        isAssignedToUser: isAssigned,
      });
    } else {
      res.status(403);
      throw new Error('Not authorized to access this collection');
    }
  } else {
    res.status(404);
    throw new Error('Collection not found');
  }
});

// @desc    Fetch single collection with its products and sub-collections (admin version)
// @route   GET /api/collections/:id/admin
// @access  Private/Admin
const getAdminCollectionById = asyncHandler(async (req, res) => {
  // Build query with tenant filtering
  const query = { _id: req.params.id };
  if (req.tenantId) {
    query.tenantId = req.tenantId;
  }

  const collection = await Collection.findOne(query)
    .populate({
      path: 'products.product',
      select:
        'name image price brand category rating numReviews countInStock description youtubeVideo',
    })
    .populate({
      path: 'parentCollection',
      select: 'name image description',
    });

  if (collection) {
    // Sort products by displayOrder
    collection.products.sort((a, b) => a.displayOrder - b.displayOrder);

    // Build query for sub-collections - no visibility filters for admin
    const subCollectionsQuery = {
      parentCollection: collection._id,
    };
    
    // Add tenant filtering for sub-collections
    if (req.tenantId) {
      subCollectionsQuery.tenantId = req.tenantId;
    }

    // Get all sub-collections regardless of visibility status
    const subCollections = await Collection.find(subCollectionsQuery)
      .sort({ displayOrder: 1 })
      .populate({
        path: 'products.product',
        select: 'name image price rating numReviews',
      })
      .select(
        'name image description _id requiresCode codeUpdatedAt isPublic isActive products'
      );

    // Return collection with its products and sub-collections
    return res.json({
      ...collection.toObject(),
      subCollections,
    });
  } else {
    res.status(404);
    throw new Error('Collection not found');
  }
});

// @desc    Fetch all sub-collections for a parent collection
// @route   GET /api/collections/:id/subcollections
// @access  Public
const getSubCollections = asyncHandler(async (req, res) => {
  const parentId = req.params.id;

  // Build query - show all subcollections regardless of visibility to all users
  let query = {
    parentCollection: parentId,
  };

  // No visibility filter at all - all subcollections will be shown to everyone

  const subCollections = await Collection.find(query)
    .sort({ displayOrder: 1 })
    .populate({
      path: 'products.product',
      select: 'name image price rating numReviews',
    })
    .select('name image description _id requiresCode codeUpdatedAt isPublic products');

  // Mark which sub-collections are assigned to the user (if user is logged in and not admin)
  // This is just for UI purposes, not for filtering access
  const markedSubCollections =
    !req.user || req.user.isAdmin
      ? subCollections
      : await markAssignedCollections(subCollections, req.user._id);

  console.log(
    `Found ${subCollections.length} sub-collections for parent ${parentId}`
  );

  res.json(markedSubCollections);
});

// Helper function to mark collections that are assigned to a user
const markAssignedCollections = async (collections, userId) => {
  // Get the user's assigned collections
  const user = await User.findById(userId).select('assignedCollections');
  if (!user || !user.assignedCollections) return collections;

  // Get array of assigned collection IDs for easier lookup
  const assignedIds = [];
  user.assignedCollections.forEach((value, key) => {
    assignedIds.push(key);
  });

  // Mark collections that are assigned to the user
  return collections.map((collection) => {
    const collObj = collection.toObject();
    collObj.isAssignedToUser = assignedIds.includes(collection._id.toString());
    return collObj;
  });
};

// Helper function to check if a collection is assigned to a user
const isCollectionAssignedToUser = async (collectionId, userId) => {
  const user = await User.findById(userId).select('assignedCollections');
  if (!user || !user.assignedCollections || user.assignedCollections.length === 0) {
    return false;
  }

  // Use .some() to check if any assigned collection matches the ID
  return user.assignedCollections.some(
    (assigned) => assigned.collectionId.toString() === collectionId.toString()
  );
};

// @desc    Fetch all sub-collections for a parent collection (admin version)
// @route   GET /api/collections/:id/admin-subcollections
// @access  Private/Admin
const getAdminSubCollections = asyncHandler(async (req, res) => {
  const parentId = req.params.id;

  // Build query: Only filter by parent, don't filter by visibility or active status
  const query = {
    parentCollection: parentId,
  };
  
  // Add tenant filtering
  if (req.tenantId) {
    query.tenantId = req.tenantId;
  }

  const subCollections = await Collection.find(query)
    .sort({ displayOrder: 1 })
    .populate({
      path: 'products.product',
      select: 'name image price rating numReviews',
    })
    .select(
      'name image description _id requiresCode codeUpdatedAt isPublic isActive products'
    );

  console.log(`Found ${subCollections.length} sub-collections for parent ${parentId}`);

  // Debug: Log product counts for each sub-collection
  subCollections.forEach(subCollection => {
    console.log(`Sub-collection "${subCollection.name}" has ${subCollection.products?.length || 0} products`);
  });

  res.json(subCollections);
});

// @desc    Create a collection
// @route   POST /api/collections
// @access  Private/Admin
const createCollection = asyncHandler(async (req, res) => {
  const {
    parentCollectionId,
    name = 'Sample Collection',
    description = 'Sample description',
    adminDescription = '',
    image = '/images/sample.jpg',
    requiresCode = false,
    accessCode = '',
    isPublic = true,
    displayOrder = null, // Accept explicit display order
    orderNumber = null, // Accept explicit order number
  } = req.body;

  // If specific displayOrder is provided, use it, otherwise find the highest order and add 1
  let finalDisplayOrder;
  let finalOrderNumber;

  if (displayOrder !== null && displayOrder !== undefined) {
    // Use the explicitly provided display order
    finalDisplayOrder = Number(displayOrder);

    // Reorder existing collections if necessary to make space for the new one
    const existingCollections = await Collection.find({
      parentCollection: parentCollectionId || null,
      displayOrder: { $gte: finalDisplayOrder },
    }).sort({ displayOrder: 1 });

    // Shift collections with display order >= the specified one
    if (existingCollections.length > 0) {
      // Move all affected collections one position up
      for (const coll of existingCollections) {
        coll.displayOrder = coll.displayOrder + 1;
        await coll.save();
      }
    }
  } else {
    // Find the highest displayOrder for collections with same parent
    const highestOrderCollection = await Collection.findOne({
      parentCollection: parentCollectionId || null,
    }).sort({ displayOrder: -1 });

    // Set the display order to be one more than the current highest
    finalDisplayOrder = highestOrderCollection
      ? highestOrderCollection.displayOrder + 1
      : 0;
  }

  // Handle order number
  if (orderNumber !== null && orderNumber !== undefined) {
    // Use the explicitly provided order number
    finalOrderNumber = orderNumber;
  } else {
    // Set a default order number based on display order
    finalOrderNumber = `${finalDisplayOrder + 1}`;
  }

  const collection = new Collection({
    name,
    user: req.user._id,
    image,
    description,
    adminDescription,
    products: [],
    parentCollection: parentCollectionId || null,
    requiresCode,
    accessCode,
    displayOrder: finalDisplayOrder,
    orderNumber: finalOrderNumber,
    isPublic,
    tenantId: req.tenantId, // Add tenant context
  });

  const createdCollection = await collection.save();

  // Normalize display orders to ensure consistency
  await normalizeCollectionOrders(parentCollectionId);

  res.status(201).json(createdCollection);
});

// @desc    Update a collection
// @route   PUT /api/collections/:id
// @access  Private/Admin
const updateCollection = asyncHandler(async (req, res) => {
  const {
    name,
    image,
    description,
    adminDescription,
    parentCollection,
    requiresCode,
    accessCode,
    isPublic,
    orderNumber,
  } = req.body;

  const collection = await Collection.findById(req.params.id);

  if (collection) {
    // --- OPTIMIZATION ---
    // Store the original values *before* we update them.
    const originalName = collection.name;
    const originalDescription = collection.description;
    const originalImage = collection.image;

    // Don't allow circular references
    if (parentCollection && parentCollection === req.params.id) {
      res.status(400);
      throw new Error('A collection cannot be its own parent');
    }

    collection.name = name || collection.name;
    collection.image = image || collection.image;
    collection.description = description || collection.description;
    collection.adminDescription = adminDescription !== undefined ? adminDescription : collection.adminDescription;
    collection.parentCollection =
      parentCollection || collection.parentCollection;
    collection.isPublic =
      isPublic !== undefined ? isPublic : collection.isPublic;

    // Set order number if provided
    if (orderNumber !== undefined) {
      collection.orderNumber = orderNumber;
    }

    // Check if access code is being changed
    if (accessCode !== undefined && accessCode !== collection.accessCode) {
      collection.accessCode = accessCode;
      collection.codeUpdatedAt = new Date(); // Update the timestamp when code changes
    }

    collection.requiresCode =
      requiresCode !== undefined ? requiresCode : collection.requiresCode;

    // Save the updated collection
    const updatedCollection = await collection.save();

    // --- OPTIMIZATION ---
    // Check if any of the key fields have actually changed.
    const needsSync =
      updatedCollection.name !== originalName ||
      updatedCollection.description !== originalDescription ||
      updatedCollection.image !== originalImage;

    if (needsSync) {
      // Trigger the background sync only if necessary.
      console.log(
        '[Sync Triggered] Core collection fields changed. Starting background sync for users.'
      );
      syncUpdatedCollectionToUsers(updatedCollection._id);
    } else {
      console.log(
        '[Sync Skipped] No critical fields (name, description, image) were changed.'
      );
    }

    res.json(updatedCollection);
  } else {
    res.status(404);
    throw new Error('Collection not found');
  }
});

// @desc    Delete a collection
// @route   DELETE /api/collections/:id
// @access  Private/Admin
const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);

  if (collection) {
    // Delete all sub-collections first
    const subCollections = await Collection.find({
      parentCollection: req.params.id,
    });

    // Delete sub-collections
    if (subCollections.length > 0) {
      await Collection.deleteMany({ parentCollection: req.params.id });
    }

    // OPTIMIZATION: Use bulk operations for removing the collection from users
    try {
      // This single database operation efficiently removes the collection from all users
      // without loading their full documents into memory
      const bulkUpdateResult = await User.updateMany(
        { [`assignedCollections.${req.params.id}`]: { $exists: true } },
        { $unset: { [`assignedCollections.${req.params.id}`]: "" } }
      );

      console.log(`Bulk removed collection ${req.params.id} from ${bulkUpdateResult.modifiedCount} users`);
    } catch (syncError) {
      // Log error but don't prevent collection deletion from succeeding
      console.error(`Error removing collection from users: ${syncError.message}`);
    }

    // Delete the main collection
    await Collection.deleteOne({ _id: collection._id });

    // Normalize the order numbers for remaining collections
    await normalizeCollectionOrders(collection.parentCollection);

    res.json({ message: 'Collection and all sub-collections removed and unassigned from users' });
  } else {
    res.status(404);
    throw new Error('Collection not found');
  }
});

// @desc    Add product to collection
// @route   POST /api/collections/:id/products
// @access  Private/Admin
const addProductToCollection = asyncHandler(async (req, res) => {
  const { productId, displayOrder = 0 } = req.body;
  const collection = await Collection.findById(req.params.id);
  const product = await Product.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (collection) {
    // Check if product is already in collection
    const existingProduct = collection.products.find(
      (p) => p.product.toString() === productId
    );

    if (existingProduct) {
      // Update display order if product already exists
      existingProduct.displayOrder = displayOrder;
    } else {
      // Add product to collection
      collection.products.push({
        product: productId,
        displayOrder,
      });
    }

    const updatedCollection = await collection.save();
    res.status(201).json(updatedCollection);
  } else {
    res.status(404);
    throw new Error('Collection not found');
  }
});

// @desc    Remove product from collection
// @route   DELETE /api/collections/:id/products/:productId
// @access  Private/Admin
const removeProductFromCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);

  if (collection) {
    const productExists = collection.products.find(
      (p) => p.product.toString() === req.params.productId
    );

    if (!productExists) {
      res.status(404);
      throw new Error('Product not found in collection');
    }

    collection.products = collection.products.filter(
      (p) => p.product.toString() !== req.params.productId
    );

    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } else {
    res.status(404);
    throw new Error('Collection not found');
  }
});

// @desc    Update product order in collection
// @route   PUT /api/collections/:id/products/reorder
// @access  Private/Admin
const updateProductsOrder = asyncHandler(async (req, res) => {
  const { productOrders } = req.body;
  const collection = await Collection.findById(req.params.id);

  if (collection) {
    // productOrders is an array of { productId, displayOrder }
    for (const order of productOrders) {
      const productIndex = collection.products.findIndex(
        (p) => p.product.toString() === order.productId
      );

      if (productIndex !== -1) {
        collection.products[productIndex].displayOrder = order.displayOrder;
      }
    }

    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } else {
    res.status(404);
    throw new Error('Collection not found');
  }
});

// @desc    Track accessed collections for a user
// @route   POST /api/collections/accessed
// @access  Private
const trackAccessedCollection = asyncHandler(async (req, res) => {
  const { collectionId, name } = req.body;

  if (!collectionId || !name) {
    res.status(400);
    throw new Error('Collection ID and name are required');
  }

  // Verify the collection exists
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if collection is already in user's accessedCollections
  const collectionIndex = user.accessedCollections.findIndex(
    (c) => c.collectionId.toString() === collectionId
  );

  if (collectionIndex >= 0) {
    // Update the access timestamp if collection was already accessed
    user.accessedCollections[collectionIndex].accessedAt = new Date();
  } else {
    // Add the collection to the user's accessed collections
    user.accessedCollections.push({
      collectionId,
      name,
      accessedAt: new Date(),
    });
  }

  await user.save();

  res.status(200).json({
    success: true,
    accessedCollections: user.accessedCollections,
  });
});

// @desc    Move collection up in order
// @route   PUT /api/collections/:id/move-up
// @access  Private/Admin
const moveCollectionUp = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);

  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  // Check if this is a hierarchical number (contains dot)
  const isHierarchical = collection.orderNumber && collection.orderNumber.includes('.');
  
  if (isHierarchical) {
    // For hierarchical numbers, only change the decimal part
    const parts = collection.orderNumber.split('.');
    const decimalPart = parseInt(parts[1]) || 1;
    
    if (decimalPart > 1) {
      // Decrease decimal part by 0.1
      parts[1] = (decimalPart - 1).toString();
      collection.orderNumber = parts.join('.');
      await collection.save();
      
      // Normalize orders to ensure proper sequencing
      await normalizeCollectionOrders(collection.parentCollection);
      
      return res.json({ 
        message: 'Collection moved up in hierarchy',
        newOrderNumber: collection.orderNumber 
      });
    } else {
      return res.status(400).json({ 
        message: 'Cannot move up - already at top of hierarchy level' 
      });
    }
  }

  // For non-hierarchical numbers, use standard logic
  const query = {
    parentCollection: collection.parentCollection,
    _id: { $ne: collection._id },
  };

  // Find collection with next lower displayOrder value
  const prevCollection = await Collection.findOne({
    ...query,
    displayOrder: { $lt: collection.displayOrder },
  }).sort({ displayOrder: -1 });

  if (!prevCollection) {
    return res.status(400).json({ message: 'Collection is already at the top' });
  }

  // Swap display orders
  const tempOrder = prevCollection.displayOrder;
  prevCollection.displayOrder = collection.displayOrder;
  collection.displayOrder = tempOrder;

  // Swap order numbers for simple sequential numbering
  if (collection.orderNumber && prevCollection.orderNumber) {
        const temp = collection.orderNumber;
        collection.orderNumber = prevCollection.orderNumber;
        prevCollection.orderNumber = temp;
  }

  await prevCollection.save();
  await collection.save();

  // Normalize display orders to prevent duplicates
  await normalizeCollectionOrders(collection.parentCollection);

  res.json({ 
    message: 'Collection moved up successfully',
    newOrderNumber: collection.orderNumber 
  });
});

// @desc    Move collection down in order
// @route   PUT /api/collections/:id/move-down
// @access  Private/Admin
const moveCollectionDown = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);

  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  // Check if this is a hierarchical number (contains dot)
  const isHierarchical = collection.orderNumber && collection.orderNumber.includes('.');
  
  if (isHierarchical) {
    // For hierarchical numbers, only change the decimal part
    const parts = collection.orderNumber.split('.');
    const decimalPart = parseInt(parts[1]) || 1;
    
    // Increase decimal part by 1 (e.g., 1.1 -> 1.2)
    parts[1] = (decimalPart + 1).toString();
    collection.orderNumber = parts.join('.');
    await collection.save();
    
    // Normalize orders to ensure proper sequencing
    await normalizeCollectionOrders(collection.parentCollection);
    
    return res.json({ 
      message: 'Collection moved down in hierarchy',
      newOrderNumber: collection.orderNumber 
    });
  }

  // For non-hierarchical numbers, use standard logic
  const query = {
    parentCollection: collection.parentCollection,
    _id: { $ne: collection._id },
  };

  // Find collection with next higher displayOrder value
  const nextCollection = await Collection.findOne({
    ...query,
    displayOrder: { $gt: collection.displayOrder },
  }).sort({ displayOrder: 1 });

  if (!nextCollection) {
    return res.status(400).json({ message: 'Collection is already at the bottom' });
  }

  // Swap display orders
  const tempOrder = nextCollection.displayOrder;
  nextCollection.displayOrder = collection.displayOrder;
  collection.displayOrder = tempOrder;

  // Swap order numbers for simple sequential numbering
  if (collection.orderNumber && nextCollection.orderNumber) {
        const temp = collection.orderNumber;
        collection.orderNumber = nextCollection.orderNumber;
        nextCollection.orderNumber = temp;
  }

  await nextCollection.save();
  await collection.save();

  // Normalize display orders to prevent duplicates
  await normalizeCollectionOrders(collection.parentCollection);

  res.json({ 
    message: 'Collection moved down successfully',
    newOrderNumber: collection.orderNumber 
  });
});

/**
 * normalizeCollectionOrders - Ensures all collections under a parent have sequential orderNumber and displayOrder fields.
 * Use this function after any operation that changes order (move, duplicate, manual edit).
 * @param {ObjectId|null} parentCollectionId - The parent collection ID (or null for root collections)
 * @returns {Promise<void>}
 */
const normalizeCollectionOrders = async (parentCollectionId) => {
  try {
    // Get all collections with the same parent
    const collections = await Collection.find({
      parentCollection: parentCollectionId || null
    }).sort({ displayOrder: 1 });

    if (collections.length === 0) {
      return true;
    }

    // Sort collections first by their current order numbers
    const sortedCollections = collections.sort((a, b) => {
      const aNum = parseInt(a.orderNumber) || 0;
      const bNum = parseInt(b.orderNumber) || 0;
      return aNum - bNum;
    });

    // Reassign sequential numbers starting from 1
    let hasChanges = false;
    for (let i = 0; i < sortedCollections.length; i++) {
      const collection = sortedCollections[i];
      const newOrderNumber = (i + 1).toString();
      
      // Update if order number or display order needs to change
      if (collection.orderNumber !== newOrderNumber || collection.displayOrder !== i) {
        collection.orderNumber = newOrderNumber;
        collection.displayOrder = i;
        await collection.save();
        hasChanges = true;
      }
    }

    if (hasChanges) {
      console.log(`Normalized ${collections.length} collections under parent: ${parentCollectionId || 'root'}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error normalizing collection orders:', error);
    return false;
  }
};

// @desc    Update a collection's order number
// @route   PUT /api/collections/:id/order
// @access  Private/Admin
const updateCollectionOrder = asyncHandler(async (req, res) => {
  const { orderNumber } = req.body;

  if (orderNumber === undefined) {
    res.status(400);
    throw new Error('Order number is required');
  }

  const collection = await Collection.findById(req.params.id);

  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  // Check if another collection has the same order number in the same parent context
  const conflictingCollection = await Collection.findOne({
    _id: { $ne: collection._id },
    parentCollection: collection.parentCollection,
    orderNumber: orderNumber
  });

  if (conflictingCollection) {
    // Get all collections in the same parent context
    const allCollections = await Collection.find({
      parentCollection: collection.parentCollection
    }).sort({ displayOrder: 1 });

    // Create a map of desired positions
    const targetOrderNum = parseInt(orderNumber) || 1;
    
    // Reorder all collections to make room for the new position
    let currentPosition = 1;
    for (const coll of allCollections) {
      if (coll._id.toString() === collection._id.toString()) {
        // This is our target collection
        coll.orderNumber = orderNumber;
        coll.displayOrder = targetOrderNum - 1;
        await coll.save();
        continue;
      }
      
      // For other collections, assign sequential numbers, skipping the target position
      if (currentPosition === targetOrderNum) {
        currentPosition++; // Skip the position we want to reserve
      }
      
      coll.orderNumber = currentPosition.toString();
      coll.displayOrder = currentPosition - 1;
      await coll.save();
      currentPosition++;
    }
  } else {
    // No conflict, just update the order number
  collection.orderNumber = orderNumber;
    const targetOrderNum = parseInt(orderNumber) || 1;
    collection.displayOrder = targetOrderNum - 1;
  await collection.save();
  }

  // Normalize the display orders to ensure proper ordering on the home screen
  await normalizeCollectionOrders(collection.parentCollection);

  res.json({ 
    message: 'Collection order updated successfully',
    collection: await Collection.findById(req.params.id)
  });
});

// @desc    Fix all collection orders system-wide
// @route   PUT /api/collections/fix-all-orders
// @access  Private/Admin
const fixAllCollectionOrders = asyncHandler(async (req, res) => {
  try {
    // Get all unique parent collection IDs (including null for root collections)
    const parentIds = await Collection.distinct('parentCollection');
    
    let totalFixed = 0;
    const results = [];

    // Fix root collections (parentCollection: null)
    console.log('Fixing root collections...');
    const rootResult = await normalizeCollectionOrders(null);
    if (rootResult) {
      const rootCount = await Collection.countDocuments({ parentCollection: null });
      totalFixed += rootCount;
      results.push({ parent: 'root', count: rootCount, status: 'fixed' });
    }

    // Fix each parent collection's subcollections
    for (const parentId of parentIds) {
      if (parentId !== null) { // Skip null as we already handled it
        console.log(`Fixing subcollections for parent: ${parentId}`);
        const subResult = await normalizeCollectionOrders(parentId);
        if (subResult) {
          const subCount = await Collection.countDocuments({ parentCollection: parentId });
          totalFixed += subCount;
          results.push({ parent: parentId, count: subCount, status: 'fixed' });
        }
      }
    }

    res.json({ 
      message: `Successfully fixed ordering for ${totalFixed} collections across ${results.length} collection groups`,
      results,
      totalFixed
    });
  } catch (error) {
    console.error('Error fixing all collection orders:', error);
    res.status(500);
    throw new Error('Failed to fix collection orders');
  }
});

// @desc    Duplicate a collection with all its subcollections
// @route   POST /api/collections/:id/duplicate
// @access  Private/Admin
const duplicateCollection = asyncHandler(async (req, res) => {
  try {
    const originalCollection = await Collection.findById(req.params.id).populate('products.product');

    if (!originalCollection) {
      res.status(404);
      throw new Error('Collection not found');
    }

    // Helper function to recursively duplicate collections
    const duplicateCollectionRecursive = async (sourceCollection, newParentId = null, orderOffset = 0) => {
      // Find all sibling collections in the same parent context, ordered by displayOrder
      const siblings = await Collection.find({
        parentCollection: newParentId || sourceCollection.parentCollection,
      }).sort({ displayOrder: 1 });

      // Find the source collection's current order number
      const sourceOrderNum = parseInt(sourceCollection.orderNumber) || 0;
      const nextOrderNumber = (sourceOrderNum + 1).toString();

      // Shift up all collections that have order numbers >= nextOrderNumber
      for (const sibling of siblings) {
        const siblingOrderNum = parseInt(sibling.orderNumber) || 0;
        if (siblingOrderNum >= sourceOrderNum + 1) {
          sibling.orderNumber = (siblingOrderNum + 1).toString();
          sibling.displayOrder += 1;
          await sibling.save();
        }
      }

      // Create the new collection with the next number after source
      const newCollection = new Collection({
        name: `${sourceCollection.name} (Copy)`,
        user: req.user._id,
        image: sourceCollection.image,
        description: sourceCollection.description,
        adminDescription: sourceCollection.adminDescription,
        parentCollection: newParentId || sourceCollection.parentCollection,
        requiresCode: sourceCollection.requiresCode,
        accessCode: sourceCollection.accessCode,
        isPublic: sourceCollection.isPublic,
        products: sourceCollection.products.map(productRef => ({
          product: productRef.product._id,
          displayOrder: productRef.displayOrder
        })),
        displayOrder: sourceCollection.displayOrder + 1,
        orderNumber: nextOrderNumber
      });

      const savedCollection = await newCollection.save();

      // Find and duplicate subcollections
      const subCollections = await Collection.find({ 
        parentCollection: sourceCollection._id 
      }).populate('products.product');

      let subOrderOffset = 0;
      for (const subCollection of subCollections) {
        await duplicateCollectionRecursive(subCollection, savedCollection._id, subOrderOffset);
        subOrderOffset++;
      }

      return savedCollection;
    };

    // Duplicate the main collection and all its subcollections
    const duplicatedCollection = await duplicateCollectionRecursive(originalCollection);

    // Normalize orders to ensure proper sequencing
    await normalizeCollectionOrders(originalCollection.parentCollection);

    res.status(201).json({
      message: 'Collection duplicated successfully',
      originalCollection: originalCollection._id,
      duplicatedCollection: duplicatedCollection._id
    });

  } catch (error) {
    console.error('Error duplicating collection:', error);
    res.status(500);
    throw new Error('Failed to duplicate collection');
  }
});

export {
  getCollections,
  getAdminCollections,
  getCollectionById,
  getAdminCollectionById,
  getSubCollections,
  getAdminSubCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addProductToCollection,
  removeProductFromCollection,
  updateProductsOrder,
  trackAccessedCollection,
  moveCollectionUp,
  moveCollectionDown,
  normalizeCollectionOrders, // Export the helper function
  updateCollectionOrder,
  fixAllCollectionOrders,
  duplicateCollection,
};
