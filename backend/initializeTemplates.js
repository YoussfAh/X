import dotenv from 'dotenv';
import connectDB from './config/db.js';
import MessageTemplate from './models/messageTemplateModel.js';
import User from './models/userModel.js';

dotenv.config();

const initializeTemplates = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        // Find an admin user to assign as creator
        const adminUser = await User.findOne({ isAdmin: true });
        if (!adminUser) {
            console.error('No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        // Check if templates already exist
        const existingTemplates = await MessageTemplate.find();
        if (existingTemplates.length > 0) {
            console.log(`Found ${existingTemplates.length} existing templates. Skipping initialization.`);
            process.exit(0);
        }

        const defaultTemplates = [
            {
                name: '🔴 Urgent - Expiring Soon',
                message: 'Hi [user]! ⚠️ Your subscription expires on [endDate] - only [daysUntilEnd] days left! Don\'t lose access to your benefits. Renew now to continue enjoying our services. 💪',
                category: 'urgent',
                icon: '🔴',
                isDefault: true,
                createdBy: adminUser._id,
                lastModifiedBy: adminUser._id
            },
            {
                name: '🟡 Friendly Reminder',
                message: 'Hello [user]! 😊 Just a friendly reminder that your subscription ends on [endDate] ([daysUntilEnd] days remaining). Would you like to renew to keep enjoying our premium features?',
                category: 'friendly',
                icon: '🟡',
                isDefault: true,
                createdBy: adminUser._id,
                lastModifiedBy: adminUser._id
            },
            {
                name: '🎯 Professional Follow-up',
                message: 'Dear [name], your subscription with us is scheduled to end on [endDate]. You have [daysUntilEnd] days remaining. Please let us know if you\'d like to discuss renewal options.',
                category: 'professional',
                icon: '🎯',
                isDefault: true,
                createdBy: adminUser._id,
                lastModifiedBy: adminUser._id
            },
            {
                name: '💪 Motivational',
                message: 'Hey [user]! 🔥 Don\'t let your progress stop! Your subscription expires on [endDate] ([daysUntilEnd] days left). Keep crushing your goals - renew today! 💯',
                category: 'motivational',
                icon: '💪',
                isDefault: true,
                createdBy: adminUser._id,
                lastModifiedBy: adminUser._id
            },
            {
                name: '📞 Personal Touch',
                message: 'Hi [user], hope you\'re doing well! Your subscription ends on [endDate] - [daysUntilEnd] days to go. I\'d love to help you continue your journey with us. Let\'s chat! 😊',
                category: 'personal',
                icon: '📞',
                isDefault: true,
                createdBy: adminUser._id,
                lastModifiedBy: adminUser._id
            }
        ];

        const createdTemplates = await MessageTemplate.insertMany(defaultTemplates);
        console.log(`✅ Successfully created ${createdTemplates.length} default message templates:`);

        createdTemplates.forEach(template => {
            console.log(`   - ${template.icon} ${template.name}`);
        });

        console.log('\n🎉 Template initialization completed!');
        process.exit(0);

    } catch (error) {
        console.error('Error initializing templates:', error);
        process.exit(1);
    }
};

initializeTemplates(); 