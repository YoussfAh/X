import mongoose from 'mongoose';

const mealItemSchema = mongoose.Schema(
  {
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    unit: {
      type: String,
      enum: ['serving', 'grams', 'pieces', 'cups', 'tablespoons', 'oz', 'ml'],
      default: 'serving',
    },
    notes: {
      type: String,
    },
  },
  { _id: false }
);

const dietEntrySchema = mongoose.Schema(
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
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        return !this.isCustomMeal;
      },
      ref: 'Product',
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'],
      default: 'other',
    },
    items: [mealItemSchema],
    feeling: {
      type: String,
      enum: ['very-satisfied', 'satisfied', 'neutral', 'hungry', 'very-hungry'],
      default: 'satisfied',
    },
    energyLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    comments: {
      type: String,
    },
    calories: {
      type: Number,
      default: 0,
    },
    protein: {
      type: Number,
      default: 0,
    },
    carbs: {
      type: Number,
      default: 0,
    },
    fat: {
      type: Number,
      default: 0,
    },
    fiber: {
      type: Number,
      default: 0,
    },
    isCustomMeal: {
      type: Boolean,
      default: false,
    },
    customMealName: {
      type: String,
    },
    customMealDescription: {
      type: String,
    },
    customNutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
dietEntrySchema.index({ user: 1, date: -1 });
dietEntrySchema.index({ product: 1, user: 1 });
dietEntrySchema.index({ collectionId: 1, user: 1 });
dietEntrySchema.index({ mealType: 1, user: 1 });
dietEntrySchema.index({ date: 1, user: 1, mealType: 1 });

const DietEntry = mongoose.model('DietEntry', dietEntrySchema);

export default DietEntry;
