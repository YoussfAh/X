import mongoose from 'mongoose';

const aiAnalysisSchema = mongoose.Schema(
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
      ref: 'User'
    },
    prompt: {
      type: String,
      required: true,
      trim: true
    },
    analysisType: {
      type: String,
      required: true,
      enum: ['comprehensive', 'workout', 'nutrition', 'recovery', 'progress', 'custom'],
      default: 'comprehensive'
    },
    response: {
      type: String,
      required: true
    },
    rawResponse: {
      type: String,
      // Store original unformatted response for reference
    },
    summary: {
      keyInsights: [String],
      sections: [String],
      recommendations: [String],
      metrics: [String]
    },
    dataUsed: {
      workoutsCount: { type: Number, default: 0 },
      dietCount: { type: Number, default: 0 },
      sleepCount: { type: Number, default: 0 },
      weightCount: { type: Number, default: 0 },
      quizzesCount: { type: Number, default: 0 },
      dateRange: {
        startDate: Date,
        endDate: Date
      },
      dataTypes: [String]
    },
    metadata: {
      responseTime: { type: Number }, // in milliseconds
      tokenCount: { type: Number },
      model: { type: String, default: 'gemini-1.5-flash' }
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    tags: [String], // User can add custom tags
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  {
    timestamps: true
  }
);

// Index for better query performance
aiAnalysisSchema.index({ user: 1, createdAt: -1 });
aiAnalysisSchema.index({ user: 1, analysisType: 1 });
aiAnalysisSchema.index({ user: 1, isFavorite: 1 });

const AiAnalysis = mongoose.model('AiAnalysis', aiAnalysisSchema);

export default AiAnalysis;
