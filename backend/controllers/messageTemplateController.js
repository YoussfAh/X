import asyncHandler from '../middleware/asyncHandler.js';
import MessageTemplate from '../models/messageTemplateModel.js';

// @desc    Get all message templates
// @route   GET /api/message-templates
// @access  Private/Admin
const getMessageTemplates = asyncHandler(async (req, res) => {
    let templates = await MessageTemplate.find({ isActive: true })
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name email')
        .sort({ createdAt: -1 });

    // Auto-initialize default templates if none exist
    if (templates.length === 0) {
        const defaultTemplates = [
            {
                name: '🔴 Urgent - Expiring Soon',
                message: 'Hi [user]! ⚠️ Your subscription expires on [endDate] - only [daysUntilEnd] days left! Don\'t lose access to your benefits. Renew now to continue enjoying our services. 💪',
                category: 'urgent',
                icon: '🔴',
                isDefault: true,
                createdBy: req.user._id,
                lastModifiedBy: req.user._id
            },
            {
                name: '🟡 Friendly Reminder',
                message: 'Hello [user]! 😊 Just a friendly reminder that your subscription ends on [endDate] ([daysUntilEnd] days remaining). Would you like to renew to keep enjoying our premium features?',
                category: 'friendly',
                icon: '🟡',
                isDefault: true,
                createdBy: req.user._id,
                lastModifiedBy: req.user._id
            },
            {
                name: '🎯 Professional Follow-up',
                message: 'Dear [name], your subscription with us is scheduled to end on [endDate]. You have [daysUntilEnd] days remaining. Please let us know if you\'d like to discuss renewal options.',
                category: 'professional',
                icon: '🎯',
                isDefault: true,
                createdBy: req.user._id,
                lastModifiedBy: req.user._id
            },
            {
                name: '💪 Motivational',
                message: 'Hey [user]! 🔥 Don\'t let your progress stop! Your subscription expires on [endDate] ([daysUntilEnd] days left). Keep crushing your goals - renew today! 💯',
                category: 'motivational',
                icon: '💪',
                isDefault: true,
                createdBy: req.user._id,
                lastModifiedBy: req.user._id
            },
            {
                name: '📞 Personal Touch',
                message: 'Hi [user], hope you\'re doing well! Your subscription ends on [endDate] - [daysUntilEnd] days to go. I\'d love to help you continue your journey with us. Let\'s chat! 😊',
                category: 'personal',
                icon: '📞',
                isDefault: true,
                createdBy: req.user._id,
                lastModifiedBy: req.user._id
            }
        ];

        const createdTemplates = await MessageTemplate.insertMany(defaultTemplates);
        templates = await MessageTemplate.find({ isActive: true })
            .populate('createdBy', 'name email')
            .populate('lastModifiedBy', 'name email')
            .sort({ createdAt: -1 });
    }

    res.json({
        success: true,
        templates
    });
});

// @desc    Create new message template
// @route   POST /api/message-templates
// @access  Private/Admin
const createMessageTemplate = asyncHandler(async (req, res) => {
    const { name, message, category, icon } = req.body;

    if (!name || !message) {
        res.status(400);
        throw new Error('Template name and message are required');
    }

    const template = new MessageTemplate({
        name: name.trim(),
        message: message.trim(),
        category: category || 'custom',
        icon: icon || '💬',
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
    });

    const createdTemplate = await template.save();
    await createdTemplate.populate('createdBy', 'name email');
    await createdTemplate.populate('lastModifiedBy', 'name email');

    res.status(201).json({
        success: true,
        message: 'Template created successfully',
        template: createdTemplate
    });
});

// @desc    Update message template
// @route   PUT /api/message-templates/:id
// @access  Private/Admin
const updateMessageTemplate = asyncHandler(async (req, res) => {
    const { name, message, category, icon } = req.body;

    const template = await MessageTemplate.findById(req.params.id);

    if (!template) {
        res.status(404);
        throw new Error('Template not found');
    }

    // Update fields
    template.name = name?.trim() || template.name;
    template.message = message?.trim() || template.message;
    template.category = category || template.category;
    template.icon = icon || template.icon;
    template.lastModifiedBy = req.user._id;

    const updatedTemplate = await template.save();
    await updatedTemplate.populate('createdBy', 'name email');
    await updatedTemplate.populate('lastModifiedBy', 'name email');

    res.json({
        success: true,
        message: 'Template updated successfully',
        template: updatedTemplate
    });
});

// @desc    Delete message template
// @route   DELETE /api/message-templates/:id
// @access  Private/Admin
const deleteMessageTemplate = asyncHandler(async (req, res) => {
    const template = await MessageTemplate.findById(req.params.id);

    if (!template) {
        res.status(404);
        throw new Error('Template not found');
    }

    // Log deletion of default templates for audit purposes
    if (template.isDefault) {
        console.log(`⚠️ WARNING: Default template "${template.name}" is being deleted by user ${req.user.email}`);
    }

    // Soft delete by setting isActive to false
    template.isActive = false;
    template.lastModifiedBy = req.user._id;
    await template.save();

    res.json({
        success: true,
        message: 'Template deleted successfully'
    });
});

// @desc    Increment template usage count
// @route   POST /api/message-templates/:id/use
// @access  Private/Admin
const incrementTemplateUsage = asyncHandler(async (req, res) => {
    const template = await MessageTemplate.findById(req.params.id);

    if (!template) {
        res.status(404);
        throw new Error('Template not found');
    }

    template.usageCount += 1;
    await template.save();

    res.json({
        success: true,
        message: 'Template usage recorded',
        usageCount: template.usageCount
    });
});

// @desc    Initialize default templates (run once)
// @route   POST /api/message-templates/initialize-defaults
// @access  Private/Admin
const initializeDefaultTemplates = asyncHandler(async (req, res) => {
    // Check if default templates already exist
    const existingDefaults = await MessageTemplate.find({ isDefault: true });

    if (existingDefaults.length > 0) {
        return res.json({
            success: true,
            message: 'Default templates already exist',
            count: existingDefaults.length
        });
    }

    const defaultTemplates = [
        {
            name: '🔴 Urgent - Expiring Soon',
            message: 'Hi [user]! ⚠️ Your subscription expires on [endDate] - only [daysUntilEnd] days left! Don\'t lose access to your benefits. Renew now to continue enjoying our services. 💪',
            category: 'urgent',
            icon: '🔴',
            isDefault: true,
            createdBy: req.user._id,
            lastModifiedBy: req.user._id
        },
        {
            name: '🟡 Friendly Reminder',
            message: 'Hello [user]! 😊 Just a friendly reminder that your subscription ends on [endDate] ([daysUntilEnd] days remaining). Would you like to renew to keep enjoying our premium features?',
            category: 'friendly',
            icon: '🟡',
            isDefault: true,
            createdBy: req.user._id,
            lastModifiedBy: req.user._id
        },
        {
            name: '🎯 Professional Follow-up',
            message: 'Dear [name], your subscription with us is scheduled to end on [endDate]. You have [daysUntilEnd] days remaining. Please let us know if you\'d like to discuss renewal options.',
            category: 'professional',
            icon: '🎯',
            isDefault: true,
            createdBy: req.user._id,
            lastModifiedBy: req.user._id
        },
        {
            name: '💪 Motivational',
            message: 'Hey [user]! 🔥 Don\'t let your progress stop! Your subscription expires on [endDate] ([daysUntilEnd] days left). Keep crushing your goals - renew today! 💯',
            category: 'motivational',
            icon: '💪',
            isDefault: true,
            createdBy: req.user._id,
            lastModifiedBy: req.user._id
        },
        {
            name: '📞 Personal Touch',
            message: 'Hi [user], hope you\'re doing well! Your subscription ends on [endDate] - [daysUntilEnd] days to go. I\'d love to help you continue your journey with us. Let\'s chat! 😊',
            category: 'personal',
            icon: '📞',
            isDefault: true,
            createdBy: req.user._id,
            lastModifiedBy: req.user._id
        }
    ];

    const createdTemplates = await MessageTemplate.insertMany(defaultTemplates);

    res.status(201).json({
        success: true,
        message: 'Default templates initialized successfully',
        count: createdTemplates.length,
        templates: createdTemplates
    });
});

export {
    getMessageTemplates,
    createMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
    incrementTemplateUsage,
    initializeDefaultTemplates
}; 