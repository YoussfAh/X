import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/productModel.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Private (Authenticated users only)
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Math.min(Number(req.query.pageSize) || 20, 20); // Max 20 products per page
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  // Build query with tenant filtering
  const query = { ...keyword };
  if (req.tenantId) {
    query.tenantId = req.tenantId;
  }

  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort({ createdAt: -1 }) // Sort by creation date, newest first
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Private (Authenticated users only)
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    return res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { 
    name, 
    description, 
    image, 
    category, 
    youtubeVideo, 
    isMealDiet,
    isViewOnly,
    nutrition,
    mealType,
    dietaryRestrictions,
    preparationTime,
    ingredients,
    muscleGroups,
    primaryMuscleGroup,
    exerciseType,
    difficulty,
    equipmentNeeded,
    instructions,
    safetyTips,
    isCompound,
    isIsolation
  } = req.body;

  const productData = {
    name: name || 'Sample Exercise',
    user: req.user._id,
    image: image || '/images/sample.jpg',
    category: category || 'Fitness',
    description: description || 'Sample description',
    youtubeVideo,
    isMealDiet: isMealDiet || false,
    isViewOnly: isViewOnly || false,
    muscleGroups: muscleGroups || ['chest'],
    primaryMuscleGroup: primaryMuscleGroup || 'chest',
    exerciseType: exerciseType || 'strength',
    difficulty: difficulty || 'intermediate',
    equipmentNeeded: equipmentNeeded || [],
    instructions: instructions || [],
    safetyTips: safetyTips || [],
    isCompound: isCompound || false,
    isIsolation: isIsolation || false,
  };
  
  // Add tenant ID if in tenant context
  if (req.tenantId) {
    productData.tenantId = req.tenantId;
  }

  // Add nutrition fields if it's a meal/diet product
  if (isMealDiet && nutrition) {
    productData.nutrition = {
      calories: nutrition.calories || 0,
      protein: nutrition.protein || 0,
      carbs: nutrition.carbs || 0,
      fat: nutrition.fat || 0,
      fiber: nutrition.fiber || 0,
      sugar: nutrition.sugar || 0,
      sodium: nutrition.sodium || 0,
      servingSize: nutrition.servingSize || '1 serving',
      servingWeight: nutrition.servingWeight || 100
    };
    productData.mealType = mealType || [];
    productData.dietaryRestrictions = dietaryRestrictions || [];
    productData.preparationTime = preparationTime || 0;
    productData.ingredients = ingredients || [];
  }

  const product = new Product(productData);
  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { 
    name, 
    description, 
    image, 
    category, 
    youtubeVideo, 
    isMealDiet,
    isViewOnly,
    nutrition,
    mealType,
    dietaryRestrictions,
    preparationTime,
    ingredients,
    muscleGroups,
    primaryMuscleGroup,
    exerciseType,
    difficulty,
    equipmentNeeded,
    instructions,
    safetyTips,
    isCompound,
    isIsolation
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name;
    product.description = description;
    product.image = image;
    product.category = category;
    product.youtubeVideo = youtubeVideo || product.youtubeVideo;
    product.isMealDiet = isMealDiet !== undefined ? isMealDiet : product.isMealDiet;
    product.isViewOnly = isViewOnly !== undefined ? isViewOnly : product.isViewOnly;
    
    // Update nutrition fields for diet/meal products
    if (isMealDiet && nutrition) {
      product.nutrition = {
        calories: nutrition.calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fat: nutrition.fat || 0,
        fiber: nutrition.fiber || 0,
        sugar: nutrition.sugar || 0,
        sodium: nutrition.sodium || 0,
        servingSize: nutrition.servingSize || '1 serving',
        servingWeight: nutrition.servingWeight || 100
      };
      product.mealType = mealType || product.mealType;
      product.dietaryRestrictions = dietaryRestrictions || product.dietaryRestrictions;
      product.preparationTime = preparationTime !== undefined ? preparationTime : product.preparationTime;
      product.ingredients = ingredients || product.ingredients;
    }
    
    // Update workout-specific fields
    product.muscleGroups = muscleGroups || product.muscleGroups;
    product.primaryMuscleGroup = primaryMuscleGroup || product.primaryMuscleGroup || 'chest';
    product.exerciseType = exerciseType || product.exerciseType;
    product.difficulty = difficulty || product.difficulty;
    product.equipmentNeeded = equipmentNeeded || product.equipmentNeeded;
    product.instructions = instructions || product.instructions;
    product.safetyTips = safetyTips || product.safetyTips;
    product.isCompound = isCompound !== undefined ? isCompound : product.isCompound;
    product.isIsolation = isIsolation !== undefined ? isIsolation : product.isIsolation;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get featured products
// @route   GET /api/products/top
// @access  Private (Authenticated users only)
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).limit(3);
  res.json(products);
});

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getTopProducts,
};
