import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import users from './data/users.js';
import products from './data/products.js';
import collections from './data/collections.js';
import User from './models/userModel.js';
import Product from './models/productModel.js';
import Order from './models/orderModel.js';
import Collection from './models/collectionModel.js';

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'.green.bold))
  .catch((err) => {
    console.error(`Error: ${err.message}`.red.bold);
    process.exit(1);
  });

const importData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Collection.deleteMany();

    const createdUsers = await User.insertMany(users);

    const adminUser = createdUsers[0]._id;

    const sampleProducts = products.map((product) => {
      return { ...product, user: adminUser };
    });

    const createdProducts = await Product.insertMany(sampleProducts);

    // Distribute products among collections more evenly
    const productChunks = [];
    const chunkSize = Math.ceil(
      createdProducts.length / (collections.length * 2)
    ); // Divide products between main collections and subcollections
//commented here 
    for (let i = 0; i < createdProducts.length; i += chunkSize) {
      productChunks.push(createdProducts.slice(i, i + chunkSize));
    }

    // Create parent collections
    for (let i = 0; i < collections.length; i++) {
      const collectionData = collections[i];
      const { subCollections, ...parentCollectionData } = collectionData;

      // Get products for this collection (with unique display order)
      const mainCollectionProducts = productChunks[
        i % productChunks.length
      ].map((product, index) => ({
        product: product._id,
        displayOrder: index,
      }));

      // Add user to parent collection
      const parentCollection = new Collection({
        ...parentCollectionData,
        user: adminUser,
        products: mainCollectionProducts,
      });

      const savedParentCollection = await parentCollection.save();

      // Create sub-collections
      if (subCollections && subCollections.length > 0) {
        for (let j = 0; j < subCollections.length; j++) {
          const subCollectionData = subCollections[j];

          // Get different products for subcollections with unique display orders
          const subChunkIndex = (i + j + 1) % productChunks.length;
          const subCollectionProducts = productChunks[subChunkIndex].map(
            (product, index) => ({
              product: product._id,
              displayOrder: index,
            })
          );

          // Add user and parent to sub-collection
          const subCollection = new Collection({
            ...subCollectionData,
            user: adminUser,
            parentCollection: savedParentCollection._id,
            products: subCollectionProducts,
          });

          await subCollection.save();
        }
      }
    }

    console.log('Data Imported!'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Collection.deleteMany();

    console.log('Data Destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
