import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: false, // Allow null for main app data
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    youtubeVideo: {
      type: String,
      default: 'https://youtu.be/IODxDxX7oi4?list=TLGGWLWbutk_1M4yMTA0MjAyNQ',
    },
    isMealDiet: {
      type: Boolean,
      default: false,
    },
    isViewOnly: {
      type: Boolean,
      default: false,
    },
    // Nutritional information for diet/meal products
    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 }, // in grams
      carbs: { type: Number, default: 0 }, // in grams
      fat: { type: Number, default: 0 }, // in grams
      fiber: { type: Number, default: 0 }, // in grams
      sugar: { type: Number, default: 0 }, // in grams
      sodium: { type: Number, default: 0 }, // in mg
      servingSize: { type: String, default: '1 serving' },
      servingWeight: { type: Number, default: 100 } // in grams
    },
    // Diet-specific fields
    mealType: [{
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'drink', 'dessert']
    }],
    dietaryRestrictions: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'low-carb', 'high-protein']
    }],
    preparationTime: {
      type: Number, // in minutes
      default: 0
    },
    ingredients: [String],
    // Enhanced workout-specific fields
    muscleGroups: [{
      type: String,
      enum: [
        'chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps', 
        'forearms', 'core', 'abs', 'obliques', 'legs', 'quadriceps', 
        'hamstrings', 'glutes', 'calves', 'full-body'
      ]
    }],
    primaryMuscleGroup: {
      type: String,
      enum: [
        'chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps', 
        'forearms', 'core', 'abs', 'obliques', 'legs', 'quadriceps', 
        'hamstrings', 'glutes', 'calves', 'full-body'
      ]
    },
    exerciseType: {
      type: String,
      enum: ['strength', 'cardio', 'flexibility', 'sports', 'rehabilitation'],
      default: 'strength'
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    equipmentNeeded: [{
      type: String,
      enum: [
        'barbell', 'dumbbell', 'kettlebell', 'resistance-bands', 
        'cable-machine', 'bodyweight', 'machines', 'cardio-equipment',
        'suspension-trainer', 'medicine-ball', 'foam-roller', 'other'
      ]
    }],
    instructions: [{
      step: Number,
      description: String
    }],
    safetyTips: [String],
    commonMistakes: [String],
    alternatives: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    estimatedCaloriesPerMinute: {
      type: Number,
      default: 5
    },
    averageDuration: {
      type: Number, // in minutes
      default: 15
    },
    isCompound: {
      type: Boolean,
      default: false
    },
    isIsolation: {
      type: Boolean,
      default: false
    },
    restTimeRecommended: {
      min: { type: Number, default: 60 }, // seconds
      max: { type: Number, default: 180 }
    },
    repRange: {
      min: { type: Number, default: 8 },
      max: { type: Number, default: 12 }
    },
    tags: [String],
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    index: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
