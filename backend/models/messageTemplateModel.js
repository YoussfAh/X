import mongoose from 'mongoose';

const messageTemplateSchema = mongoose.Schema(
    {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['urgent', 'friendly', 'professional', 'motivational', 'personal', 'custom'],
            default: 'custom'
        },
        icon: {
            type: String,
            default: '💬'
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        lastModifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        usageCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
    }
);

// Index for better performance
messageTemplateSchema.index({ category: 1, isActive: 1 });
messageTemplateSchema.index({ createdBy: 1 });

const MessageTemplate = mongoose.model('MessageTemplate', messageTemplateSchema);

export default MessageTemplate; 