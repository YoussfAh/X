import mongoose from 'mongoose';

const setSchema = mongoose.Schema({
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: false,
      index: true
    },
  weight: {
    type: Number,
    required: true
  },
  reps: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  }
}, { _id: false });

const workoutEntrySchema = mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product'
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutSession'
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  },
  parentCollection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  sets: [setSchema],
  feeling: {
    type: String,
    enum: ['easy', 'moderate', 'hard', 'extreme'],
    default: 'moderate'
  },
  comments: {
    type: String
  },
  restTime: {
    type: Number, // Rest time in seconds between sets
    default: 90
  },
  personalRecord: {
    type: Boolean,
    default: false
  },
  exerciseOrder: {
    type: Number, // Order within the session
    default: 1
  },
  supersetWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutEntry'
  },
  dropset: {
    type: Boolean,
    default: false
  },
  warmupSets: {
    type: Number,
    default: 0
  },
  workingSets: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
workoutEntrySchema.index({ user: 1, date: -1 });
workoutEntrySchema.index({ product: 1, user: 1 });
workoutEntrySchema.index({ session: 1, user: 1 });
workoutEntrySchema.index({ collectionId: 1, user: 1 });
workoutEntrySchema.index({ parentCollection: 1, user: 1 });
workoutEntrySchema.index({ exerciseOrder: 1 });
workoutEntrySchema.index({ tenantId: 1, user: 1 });

const WorkoutEntry = mongoose.model('WorkoutEntry', workoutEntrySchema);

export default WorkoutEntry;
