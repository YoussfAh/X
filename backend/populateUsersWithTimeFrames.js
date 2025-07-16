import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import bcrypt from 'bcryptjs';
import User from './models/userModel.js';
import connectDB from './config/db.js';

// Load env vars
dotenv.config();

// Sample users with realistic timeframes
const usersWithTimeFrames = [
    // Active users with various time remaining
    {
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        password: bcrypt.hashSync('password123', 10),
        isAdmin: false,
        whatsAppPhoneNumber: '+1234567890',
        age: 28,
        fitnessGoal: 'build muscle',
        timeFrame: {
            startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // Started 20 days ago
            duration: 30,
            durationType: 'days',
            endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Ends in 10 days
            isWithinTimeFrame: true,
            timeFrameSetAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
        lastContactedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Contacted 3 days ago
    },
    {
        name: 'Bob Smith',
        email: 'bob.smith@example.com',
        password: bcrypt.hashSync('password123', 10),
        isAdmin: false,
        whatsAppPhoneNumber: '+1234567891',
        age: 35,
        fitnessGoal: 'lose weight',
        timeFrame: {
            startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // Started 25 days ago
            duration: 30,
            durationType: 'days',
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Ends in 5 days (urgent)
            isWithinTimeFrame: true,
            timeFrameSetAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        },
        lastContactedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Contacted 10 days ago (needs contact)
    },
    {
        name: 'Carol Wilson',
        email: 'carol.wilson@example.com',
        password: bcrypt.hashSync('password123', 10),
        isAdmin: false,
        whatsAppPhoneNumber: '+1234567892',
        age: 32,
        fitnessGoal: 'get lean',
        timeFrame: {
            startDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), // Started 29 days ago
            duration: 30,
            durationType: 'days',
            endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Ends in 1 day (very urgent)
            isWithinTimeFrame: true,
            timeFrameSetAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
        },
        lastContactedAt: null, // Never contacted (needs contact)
    },
    {
        name: 'David Brown',
        email: 'david.brown@example.com',
        password: bcrypt.hashSync('password123', 10),
        isAdmin: false,
        whatsAppPhoneNumber: '+1234567893',
        age: 40,
        fitnessGoal: 'build muscle',
        timeFrame: {
            startDate: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000), // Started 2 months ago
            duration: 3,
            durationType: 'months',
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Ends in 30 days
            isWithinTimeFrame: true,
            timeFrameSetAt: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000),
        },
        lastContactedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Contacted yesterday
    },
    {
        name: 'Eva Davis',
        email: 'eva.davis@example.com',
        password: bcrypt.hashSync('password123', 10),
        isAdmin: false,
        whatsAppPhoneNumber: '+1234567894',
        age: 26,
        fitnessGoal: 'maintain',
        timeFrame: {
            startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // Started 45 days ago
            duration: 30,
            durationType: 'days',
            endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Expired 15 days ago
            isWithinTimeFrame: false,
            timeFrameSetAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        },
        lastContactedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Contacted 5 days ago
    },
    {
        name: 'Frank Miller',
        email: 'frank.miller@example.com',
        password: bcrypt.hashSync('password123', 10),
        isAdmin: false,
        whatsAppPhoneNumber: '+1234567895',
        age: 38,
        fitnessGoal: 'lose weight',
        timeFrame: {
            startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // Started 40 days ago
            duration: 30,
            durationType: 'days',
            endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expired 10 days ago
            isWithinTimeFrame: false,
            timeFrameSetAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        },
        lastContactedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // Contacted 20 days ago (needs contact)
    },
    {
        name: 'Grace Lee',
        email: 'grace.lee@example.com',
        password: bcrypt.hashSync('password123', 10),
        isAdmin: false,
        whatsAppPhoneNumber: '+1234567896',
        age: 29,
        fitnessGoal: 'build muscle',
        timeFrame: {
            startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Started 15 days ago
            duration: 60,
            durationType: 'days',
            endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // Ends in 45 days
            isWithinTimeFrame: true,
            timeFrameSetAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
        lastContactedAt: new Date(), // Contacted today
    },
    {
        name: 'Henry Taylor',
        email: 'henry.taylor@example.com',
        password: bcrypt.hashSync('password123', 10),
        isAdmin: false,
        whatsAppPhoneNumber: '+1234567897',
        age: 31,
        fitnessGoal: 'get lean',
        timeFrame: {
            startDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // Started 18 days ago
            duration: 30,
            durationType: 'days',
            endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // Ends in 12 days (ending soon)
            isWithinTimeFrame: true,
            timeFrameSetAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        },
        lastContactedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Contacted 2 days ago
    },
    {
        name: 'Ivy Chen',
        email: 'ivy.chen@example.com',
        password: bcrypt.hashSync('password123', 10),
        isAdmin: false,
        whatsAppPhoneNumber: '+1234567898',
        age: 27,
        fitnessGoal: 'maintain',
        timeFrame: {
            startDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), // Started 23 days ago
            duration: 30,
            durationType: 'days',
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days (ending soon)
            isWithinTimeFrame: true,
            timeFrameSetAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
        },
        lastContactedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Contacted 15 days ago (needs contact)
    },
    {
        name: 'Jack Robinson',
        email: 'jack.robinson@example.com',
        password: bcrypt.hashSync('password123', 10),
        isAdmin: false,
        age: 33,
        fitnessGoal: 'lose weight',
        // No timeframe set - will show in "Need Contact" if admin wants to follow up
    },
    {
        name: 'Kelly Martinez',
        email: 'kelly.martinez@example.com',
        password: bcrypt.hashSync('password123', 10),
        isAdmin: false,
        whatsAppPhoneNumber: '+1234567899',
        age: 30,
        fitnessGoal: 'build muscle',
        // No timeframe set
        lastContactedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Contacted a week ago
    },
    {
        name: 'Liam Anderson',
        email: 'liam.anderson@example.com',
        password: bcrypt.hashSync('password123', 10),
        isAdmin: false,
        whatsAppPhoneNumber: '+1234567800',
        age: 36,
        fitnessGoal: 'get lean',
        timeFrame: {
            startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Starts in 5 days (future)
            duration: 30,
            durationType: 'days',
            endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // Ends in 35 days
            isWithinTimeFrame: false,
            timeFrameSetAt: new Date(),
        },
        lastContactedAt: new Date(), // Contacted today
    },
];

const importUsers = async () => {
    try {
        await connectDB();

        // Get admin user to set as the one who created timeframes
        const adminUser = await User.findOne({ isAdmin: true });
        if (!adminUser) {
            console.log('No admin user found. Creating one...'.yellow);
            const newAdmin = new User({
                name: 'Admin User',
                email: 'admin@example.com',
                password: bcrypt.hashSync('admin123', 10),
                isAdmin: true,
            });
            await newAdmin.save();
            console.log('Admin user created'.green);
        }

        const admin = await User.findOne({ isAdmin: true });

        // Clear existing non-admin users (optional)
        await User.deleteMany({ isAdmin: false });
        console.log('Existing non-admin users cleared'.yellow);

        // Create users with timeframes
        const createdUsers = [];
        for (const userData of usersWithTimeFrames) {
            const user = new User(userData);

            // Set timeframe admin reference if timeframe exists
            if (user.timeFrame && user.timeFrame.startDate) {
                user.timeFrame.timeFrameSetBy = admin._id;

                // Add to timeframe history
                user.timeFrameHistory = [{
                    startDate: user.timeFrame.startDate,
                    duration: user.timeFrame.duration,
                    durationType: user.timeFrame.durationType,
                    endDate: user.timeFrame.endDate,
                    isActive: true,
                    setAt: user.timeFrame.timeFrameSetAt,
                    setBy: admin._id,
                    notes: 'Initial timeframe setup'
                }];
            }

            // Set lastContactedBy if they were contacted
            if (user.lastContactedAt) {
                user.lastContactedBy = admin._id;
            }

            await user.save();
            createdUsers.push(user);
        }

        console.log(`${createdUsers.length} users with timeframes imported successfully!`.green.inverse);
        console.log('Sample users created:'.cyan);
        createdUsers.forEach(user => {
            const timeFrameStatus = user.timeFrame?.isWithinTimeFrame ?
                (user.timeFrame.endDate && new Date() > new Date(user.timeFrame.endDate) ? 'Expired' : 'Active') :
                (user.timeFrame?.startDate ? 'Future' : 'No Timeframe');
            console.log(`- ${user.name} (${user.email}) - ${timeFrameStatus}`.gray);
        });

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`.red.inverse);
        process.exit(1);
    }
};

const destroyUsers = async () => {
    try {
        await connectDB();
        await User.deleteMany({ isAdmin: false });
        console.log('Non-admin users destroyed!'.red.inverse);
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`.red.inverse);
        process.exit(1);
    }
};

// Check command line arguments
if (process.argv[2] === '-d') {
    destroyUsers();
} else {
    importUsers();
} 