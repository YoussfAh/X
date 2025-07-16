import mongoose from 'mongoose';

const sleepEntrySchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    sleepTime: {
      type: Date,
      required: true,
    },
    wakeUpTime: {
      type: Date,
    },
    duration: {
      type: Number, // Duration in minutes
    },
    skippedSleep: {
      type: Boolean,
      default: false,
    },
    skippedWakeUp: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
sleepEntrySchema.index({ user: 1, date: -1 });

// virtual for duration
sleepEntrySchema.virtual('durationHours').get(function () {
  if (this.duration) {
    return this.duration / 60;
  }
  return null;
});

// Pre-save hook to calculate duration
sleepEntrySchema.pre('save', function (next) {
  if (
    this.sleepTime &&
    this.wakeUpTime &&
    (this.isModified('sleepTime') || this.isModified('wakeUpTime'))
  ) {
    const durationInMillis =
      this.wakeUpTime.getTime() - this.sleepTime.getTime();
    this.duration = Math.round(durationInMillis / (1000 * 60)); // in minutes
  }
  next();
});

const SleepEntry = mongoose.model('SleepEntry', sleepEntrySchema);

export default SleepEntry;
