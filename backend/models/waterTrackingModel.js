import mongoose from 'mongoose';

const waterTrackingSchema = mongoose.Schema({
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      // Set to start of day in UTC
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  },
  glasses: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 50 // Reasonable upper limit
  },
  goal: {
    type: Number,
    default: 8 // Default daily goal of 8 glasses
  },
  entries: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      default: 1 // Number of glasses added in this entry
    },
    note: {
      type: String
    }
  }]
}, {
  timestamps: true
});

// Compound index to ensure one record per user per day
waterTrackingSchema.index({ user: 1, date: 1 }, { unique: true });

// Index for performance optimization
waterTrackingSchema.index({ user: 1, date: -1 });

// Method to add water glasses
waterTrackingSchema.methods.addWater = function(amount = 1, note = '') {
  this.glasses += amount;
  this.entries.push({
    amount: amount,
    note: note
  });
  return this.save();
};

// Method to remove water glasses
waterTrackingSchema.methods.removeWater = function(amount = 1) {
  this.glasses = Math.max(0, this.glasses - amount);
  this.entries.push({
    amount: -amount,
    note: 'Removed'
  });
  return this.save();
};

// Method to reset daily water intake
waterTrackingSchema.methods.resetWater = function() {
  this.glasses = 0;
  this.entries.push({
    amount: -this.glasses,
    note: 'Reset'
  });
  return this.save();
};

// Static method to get or create today's water tracking
waterTrackingSchema.statics.getTodaysTracking = async function(userId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  let tracking = await this.findOne({
    user: userId,
    date: startOfDay
  });
  
  if (!tracking) {
    tracking = new this({
      user: userId,
      date: startOfDay,
      glasses: 0
    });
    await tracking.save();
  }
  
  return tracking;
};

const WaterTracking = mongoose.model('WaterTracking', waterTrackingSchema);

export default WaterTracking; 