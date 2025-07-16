import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
    {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: false,
      index: true
    },
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const exerciseSchema = mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            required: false,
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
        image: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        youtubeVideo: {
            type: String,
            default: 'https://youtu.be/IODxDxX7oi4?list=TLGGWLWbutk_1M4yMTA0MjAyNQ',
        },
        isMealDiet: {
            type: Boolean,
            default: false,
        },
        reviews: [reviewSchema],
        rating: {
            type: Number,
            required: true,
            default: 0,
        },
        numReviews: {
            type: Number,
            required: true,
            default: 0,
        },
        index: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Use the same collection name to preserve existing data
const Exercise = mongoose.model('Exercise', exerciseSchema, 'products');

export default Exercise; 