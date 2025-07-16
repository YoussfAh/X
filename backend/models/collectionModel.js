import mongoose from 'mongoose';

const collectionSchema = mongoose.Schema(
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
    description: {
      type: String,
      required: true,
    },
    adminDescription: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      required: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    orderNumber: {
      type: String,
      default: '',
    },
    accessCode: {
      type: String,
      default: '',
    },
    requiresCode: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true, // By default collections are public
    },
    codeUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        displayOrder: {
          type: Number,
          default: 0,
        },
      },
    ],
    parentCollection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;
