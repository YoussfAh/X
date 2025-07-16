import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function checkDatabaseContent() {
    console.log('🔍 CHECKING DATABASE CONTENT...\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check Collections
        console.log('📚 COLLECTIONS:');
        const Collection = mongoose.model('Collection', new mongoose.Schema({}, { strict: false }));
        const collections = await Collection.find({});
        console.log(`Found ${collections.length} collections:`);
        collections.forEach((col, index) => {
            console.log(`  ${index + 1}. ${col.name || col.title || 'Unnamed'} (ID: ${col._id})`);
        });

        // Check Users
        console.log('\n👥 USERS:');
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const users = await User.find({});
        console.log(`Found ${users.length} users:`);
        users.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name || user.email || 'Unnamed'} (ID: ${user._id})`);
        });

        // Check Quizzes
        console.log('\n📝 QUIZZES:');
        const Quiz = mongoose.model('Quiz', new mongoose.Schema({}, { strict: false }));
        const quizzes = await Quiz.find({});
        console.log(`Found ${quizzes.length} quizzes:`);
        quizzes.forEach((quiz, index) => {
            console.log(`  ${index + 1}. ${quiz.name || quiz.title || 'Unnamed'} (ID: ${quiz._id})`);
        });

        // Check Products
        console.log('\n🛍️ PRODUCTS:');
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        const products = await Product.find({});
        console.log(`Found ${products.length} products:`);
        products.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.name || product.title || 'Unnamed'} (ID: ${product._id})`);
        });

        console.log('\n✅ Database check complete');

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

checkDatabaseContent();
