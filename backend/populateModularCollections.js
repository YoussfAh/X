import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Collection from './models/collectionModel.js';
import Product from './models/productModel.js';
import User from './models/userModel.js';
import connectDB from './config/db.js';

dotenv.config();

const configFile = './data/myModularWorkoutData.json';

const run = async () => {
  await connectDB();
  const adminUser = await User.findOne({ isAdmin: true });
  if (!adminUser) {
    console.error('No admin user found.');
    process.exit(1);
  }

  const data = {
    "collections": [
      {
        "name": "Strength Program2",
        "description": "A full body strength program.",
        "image": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1000",
        "children": [
          {
            "name": "Day 12 - Upper Body",
            "description": "Chest and arms focus.",
            "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd",
            "products": [
              {
                "name": "Push-Up",
                "description": "A basic push-up exercise.",
                "image": "https://www.inspireusafoundation.org/wp-content/uploads/2022/04/push-up-muscles-worked.jpg",
                "category": "Chest",
                "youtubeVideo": "https://www.youtube.com/watch?v=IODxDxX7oi4",
                "sets": "3",
                "reps": "12"
              }
            ]
          }
          
        ]
      }
    ]
  };

  if (!data.collections) {
    console.error('No collections found in data file.');
    process.exit(1);
  }

  // Optionally clear old data
//   await Collection.deleteMany({});
//   await Product.deleteMany({});

  for (const parent of data.collections) {
    const parentDoc = new Collection({
      name: parent.name,
      description: parent.description,
      image: parent.image,
      user: adminUser._id,
      isPublic: true,
      requiresCode: false,
      products: []
    });
    const savedParent = await parentDoc.save();

    for (const child of parent.children || []) {
      const childDoc = new Collection({
        name: child.name,
        description: child.description,
        image: child.image,
        user: adminUser._id,
        parentCollection: savedParent._id,
        isPublic: true,
        requiresCode: false,
        products: []
      });
      const savedChild = await childDoc.save();

      for (const prod of child.products || []) {
        const prodDoc = new Product({
          ...prod,
          user: adminUser._id,
          price: 0,
          countInStock: 999,
          rating: 5,
          numReviews: 0,
          brand: prod.category || 'Fitness'
        });
        const savedProd = await prodDoc.save();
        await Collection.findByIdAndUpdate(savedChild._id, {
          $push: { products: { product: savedProd._id, displayOrder: 0 } }
        });
      }
    }
  }

  console.log('Database populated successfully!');
  process.exit();
};

run();
