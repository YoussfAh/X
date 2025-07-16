import mongoose from 'mongoose';

const workoutSessionSchema = mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: false, // Make optional for main app compatibility
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      default: function() {
        return `Workout Session - ${new Date().toLocaleDateString()}`;
      }
    },
    workoutType: {
      type: String,
      enum: ['strength', 'cardio', 'flexibility', 'mixed'],
      default: 'strength'
    },
    targetMuscleGroups: [{
      type: String
    }],
    exercises: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutEntry'
    }],
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active'
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number, // in minutes
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

// Auto-complete session when marked as completed
workoutSessionSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.endTime) {
    this.endTime = new Date();
    this.duration = Math.round((this.endTime - this.startTime) / 60000); // in minutes
  }
  next();
});

const WorkoutSession = mongoose.model('WorkoutSession', workoutSessionSchema);

export default WorkoutSession; 