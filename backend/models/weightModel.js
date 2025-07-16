import mongoose from 'mongoose';

const weightSchema = mongoose.Schema(
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
    weight: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'lbs'],
      default: 'kg',
    },
    date: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Weight = mongoose.model('Weight', weightSchema);

export default Weight; 