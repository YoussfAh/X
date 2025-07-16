import mongoose from 'mongoose';
import Collection from './models/collectionModel.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
}).then(async () => {
    console.log('MongoDB connected');

    // Get all root collections with their public status
    const collections = await Collection.find({ parentCollection: null })
        .select('name isPublic displayOrder')
        .sort({ displayOrder: 1 });

    console.log('Root Collections:');
    console.log('================');
    collections.forEach(c => {
        console.log(`- ${c.name} | isPublic: ${c.isPublic} | displayOrder: ${c.displayOrder}`);
    });

    console.log(`\nTotal root collections: ${collections.length}`);

    // Also check if there are any private collections
    const privateCollections = await Collection.find({
        parentCollection: null,
        isPublic: false
    }).select('name');

    console.log(`Private root collections: ${privateCollections.length}`);
    if (privateCollections.length > 0) {
        privateCollections.forEach(c => {
            console.log(`- ${c.name}`);
        });
    }

    process.exit(0);
}).catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
}); 