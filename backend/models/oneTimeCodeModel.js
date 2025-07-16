import mongoose from 'mongoose';

const oneTimeCodeSchema = mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Collection',
    },
    collectionName: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    // New fields for multiple usage support
    maxUses: {
      type: Number,
      default: 1, // Default to single use for backward compatibility
      min: 1,
    },
    currentUses: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageHistory: [{
      usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      usedAt: {
        type: Date,
        default: Date.now,
      },
      ipAddress: String,
      userAgent: String,
    }],
    isUniversal: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: function () {
        // Default expiration is 30 days from creation
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to check if code is still available for use
oneTimeCodeSchema.virtual('isAvailable').get(function () {
  return this.currentUses < this.maxUses && new Date() < this.expiresAt;
});

// Virtual to check if code is fully exhausted
oneTimeCodeSchema.virtual('isExhausted').get(function () {
  return this.currentUses >= this.maxUses;
});

// Index for faster lookups and to enforce uniqueness
oneTimeCodeSchema.index({ code: 1 }, { unique: true });
oneTimeCodeSchema.index({ collectionId: 1 });
oneTimeCodeSchema.index({ isUsed: 1 });
oneTimeCodeSchema.index({ expiresAt: 1 });
oneTimeCodeSchema.index({ isUniversal: 1 });
oneTimeCodeSchema.index({ currentUses: 1 });
oneTimeCodeSchema.index({ maxUses: 1 });

const OneTimeCode = mongoose.model('OneTimeCode', oneTimeCodeSchema);

export default OneTimeCode;
