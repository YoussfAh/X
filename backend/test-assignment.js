import mongoose from 'mongoose';
import User from './backend/models/userModel.js';
import Collection from './backend/models/collectionModel.js';
import dotenv from 'dotenv';

dotenv.config();

const testAssignments = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find a user with assigned collections
        const usersWithAssignments = await User.find({
            'assignedCollections': { $exists: true, $ne: {} }
        }).limit(1);

        if (usersWithAssignments.length === 0) {
            console.log('No users with assignments found');
            return;
        }

        const user = usersWithAssignments[0];
        console.log('\n=== USER DATA ===');
        console.log('User ID:', user._id);
        console.log('User Name:', user.name);
        console.log('Assigned Collections Type:', typeof user.assignedCollections);
        console.log('Is Map:', user.assignedCollections instanceof Map);
        console.log('Raw assigned collections:', user.assignedCollections);

        // Get all assigned collection IDs
        let assignedIds = [];
        if (user.assignedCollections instanceof Map) {
            assignedIds = Array.from(user.assignedCollections.keys());
            console.log('Map keys:', assignedIds);
        } else if (typeof user.assignedCollections === 'object') {
            assignedIds = Object.keys(user.assignedCollections);
            console.log('Object keys:', assignedIds);
        }

        console.log('Assigned Collection IDs:', assignedIds);

        // Test with the first assigned collection
        if (assignedIds.length > 0) {
            const testCollectionId = assignedIds[0];
            console.log('\n=== TESTING ASSIGNMENT CHECK ===');
            console.log('Testing with collection ID:', testCollectionId);

            // Test the checking function
            const isCollectionAssignedToUser = async (collectionId, userId) => {
                const userDoc = await User.findById(userId).select('assignedCollections');
                if (!userDoc || !userDoc.assignedCollections) return false;

                const collectionIdStr = collectionId.toString();

                if (userDoc.assignedCollections instanceof Map) {
                    return userDoc.assignedCollections.has(collectionIdStr);
                }

                if (typeof userDoc.assignedCollections === 'object') {
                    return Object.keys(userDoc.assignedCollections).includes(collectionIdStr);
                }

                return false;
            };

            const isAssigned = await isCollectionAssignedToUser(testCollectionId, user._id);
            console.log('Assignment check result:', isAssigned);

            // Test different string formats
            console.log('\n=== TESTING DIFFERENT ID FORMATS ===');
            console.log('Original ID:', testCollectionId);
            console.log('toString():', testCollectionId.toString());
            console.log('Direct Map check:', user.assignedCollections.has(testCollectionId));
            console.log('String Map check:', user.assignedCollections.has(testCollectionId.toString()));

            // Try to find the collection to make sure it exists
            const collection = await Collection.findById(testCollectionId);
            if (collection) {
                console.log('Collection found:', collection.name, 'Public:', collection.isPublic);
            } else {
                console.log('Collection not found in database');
            }
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        await mongoose.disconnect();
    }
};

testAssignments(); 