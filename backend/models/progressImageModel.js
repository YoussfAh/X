import mongoose from 'mongoose';

const progressImageSchema = mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        thumbnail: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          default: '',
        },
        metadata: {
          width: Number,
          height: Number,
          size: Number, // in bytes
          format: String,
        },
      },
    ],
    uploadDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    groupName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by user and date
progressImageSchema.index({ user: 1, uploadDate: -1 });

const ProgressImage = mongoose.model('ProgressImage', progressImageSchema);

export default ProgressImage; 