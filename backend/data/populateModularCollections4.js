import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Collection from '../models/collectionModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import connectDB from '../config/db.js';

dotenv.config();

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
        "name": "Sports Performance",
        "description": "Sport-specific training programs to enhance athletic performance in various sports.",
        "image": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000",
        "children": [
          {
            "name": "Basketball Performance",
            "description": "Training program designed to improve basketball-specific skills and athleticism.",
            "image": "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?q=80&w=1000",
            "products": [
              {
                "name": "Vertical Jump Training",
                "description": "Plyometric exercises to increase explosive jumping ability.",
                "image": "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?q=80&w=1000",
                "category": "Sports",
                "youtubeVideo": "https://www.youtube.com/watch?v=7_3AQTdnlzQ",
                "sets": "4",
                "reps": "6-8"
              },
              {
                "name": "Lateral Quickness Drills",
                "description": "Exercises to improve defensive footwork and reaction time.",
                "image": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000",
                "category": "Sports",
                "youtubeVideo": "https://www.youtube.com/watch?v=G8x5U-HC7hM",
                "sets": "3",
                "reps": "30 seconds each"
              },
              {
                "name": "Core Rotational Power",
                "description": "Exercises to improve shooting and passing power.",
                "image": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000",
                "category": "Sports",
                "youtubeVideo": "https://www.youtube.com/watch?v=0y1ycNO5FYs",
                "sets": "3",
                "reps": "10-12 each side"
              },
              {
                "name": "Acceleration Training",
                "description": "Drills to improve first-step quickness and sprint speed.",
                "image": "https://images.unsplash.com/photo-1546483875-ad9014c88eba?q=80&w=1000",
                "category": "Sports",
                "youtubeVideo": "https://www.youtube.com/watch?v=JBwLRIQlFxM",
                "sets": "4",
                "reps": "20 yards x 5"
              }
            ]
          },
          {
            "name": "Soccer Performance",
            "description": "Training program designed to improve soccer-specific skills and endurance.",
            "image": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000",
            "products": [
              {
                "name": "Agility Ladder Drills",
                "description": "Footwork exercises to improve coordination and quick feet.",
                "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
                "category": "Sports",
                "youtubeVideo": "https://www.youtube.com/watch?v=iICTuTZCJyM",
                "sets": "3",
                "reps": "45 seconds each drill"
              },
              {
                "name": "Lower Body Power",
                "description": "Exercises to improve kicking power and jumping ability.",
                "image": "https://images.unsplash.com/photo-1434608519344-49d77a124f88?q=80&w=1000",
                "category": "Sports",
                "youtubeVideo": "https://www.youtube.com/watch?v=GKgJG7Jj5uM",
                "sets": "4",
                "reps": "8-10"
              },
              {
                "name": "Interval Endurance",
                "description": "High-intensity intervals to mimic match conditions.",
                "image": "https://images.unsplash.com/photo-1526676307800-7b6a8d8cede7?q=80&w=1000",
                "category": "Sports",
                "youtubeVideo": "https://www.youtube.com/watch?v=J0u90eQE4dQ",
                "sets": "6",
                "reps": "30 seconds on, 30 seconds off"
              },
              {
                "name": "Core Stability",
                "description": "Exercises to improve balance and injury resistance.",
                "image": "https://images.unsplash.com/photo-1566241142248-81031146da6c?q=80&w=1000",
                "category": "Sports",
                "youtubeVideo": "https://www.youtube.com/watch?v=HQzteyXbqNg",
                "sets": "3",
                "reps": "45 seconds each"
              }
            ]
          },
          {
            "name": "Tennis Performance",
            "description": "Training program designed to improve tennis-specific skills and movement.",
            "image": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1000",
            "products": [
              {
                "name": "Rotational Power",
                "description": "Exercises to improve serve and groundstroke power.",
                "image": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000",
                "category": "Sports",
                "youtubeVideo": "https://www.youtube.com/watch?v=z-p84S56h3U",
                "sets": "3",
                "reps": "10 each side"
              },
              {
                "name": "Multi-directional Speed",
                "description": "Drills to improve court coverage and change of direction.",
                "image": "https://images.unsplash.com/photo-1535743686920-55e4145369b9?q=80&w=1000",
                "category": "Sports",
                "youtubeVideo": "https://www.youtube.com/watch?v=PrimFbUKGSs",
                "sets": "4",
                "reps": "30 seconds each drill"
              },
              {
                "name": "Shoulder Stability",
                "description": "Exercises to improve shoulder health and prevent injuries.",
                "image": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=1000",
                "category": "Sports",
                "youtubeVideo": "https://www.youtube.com/watch?v=A-MnL8wGnD8",
                "sets": "3",
                "reps": "12-15"
              },
              {
                "name": "Deceleration Training",
                "description": "Exercises to improve stopping ability and injury prevention.",
                "image": "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1000",
                "category": "Sports",
                "youtubeVideo": "https://www.youtube.com/watch?v=xZXJbHoGJPY",
                "sets": "3",
                "reps": "8 each side"
              }
            ]
          }
        ]
      },
      {
        "name": "Rehabilitation & Prehab",
        "description": "Programs designed for injury prevention and rehabilitation of common issues.",
        "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
        "children": [
          {
            "name": "Lower Back Health",
            "description": "Program to address and prevent lower back pain.",
            "image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000",
            "products": [
              {
                "name": "McGill Big 3",
                "description": "Core stability exercises developed by spine expert Dr. Stuart McGill.",
                "image": "https://images.unsplash.com/photo-1566241142248-81031146da6c?q=80&w=1000",
                "category": "Rehab",
                "youtubeVideo": "https://www.youtube.com/watch?v=6Q7J1vKGUoA",
                "sets": "3",
                "reps": "8-10 each"
              },
              {
                "name": "Hip Mobility",
                "description": "Exercises to improve hip function and reduce back stress.",
                "image": "https://images.unsplash.com/photo-1434608519344-49d77a124f88?q=80&w=1000",
                "category": "Rehab",
                "youtubeVideo": "https://www.youtube.com/watch?v=3B-3Khbht5s",
                "sets": "2",
                "reps": "30 seconds each"
              },
              {
                "name": "Posterior Chain Strengthening",
                "description": "Exercises to build strength in the back and glutes.",
                "image": "https://images.unsplash.com/photo-1597452485595-73c2d2d7078f?q=80&w=1000",
                "category": "Rehab",
                "youtubeVideo": "https://www.youtube.com/watch?v=vLQZI4RR7B0",
                "sets": "3",
                "reps": "12-15"
              },
              {
                "name": "Movement Pattern Correction",
                "description": "Learning proper bending and lifting mechanics.",
                "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
                "category": "Rehab",
                "youtubeVideo": "https://www.youtube.com/watch?v=tDUXbJvTbWs",
                "sets": "2",
                "reps": "10 with perfect form"
              }
            ]
          },
          {
            "name": "Shoulder Recovery",
            "description": "Program for shoulder pain relief and prevention.",
            "image": "https://images.unsplash.com/photo-1590771998996-8589ec9b5ac6?q=80&w=1000",
            "products": [
              {
                "name": "Rotator Cuff Strengthening",
                "description": "Exercises targeting the small stabilizer muscles of the shoulder.",
                "image": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=1000",
                "category": "Rehab",
                "youtubeVideo": "https://www.youtube.com/watch?v=WURJ03Cu9M0",
                "sets": "3",
                "reps": "15-20"
              },
              {
                "name": "Scapular Stability",
                "description": "Exercises to improve shoulder blade function and position.",
                "image": "https://images.unsplash.com/photo-1598971639058-a4575d5c92e1?q=80&w=1000",
                "category": "Rehab",
                "youtubeVideo": "https://www.youtube.com/watch?v=d8aeHZUmb3o",
                "sets": "3",
                "reps": "12-15"
              },
              {
                "name": "Thoracic Mobility",
                "description": "Improving upper back mobility to reduce shoulder stress.",
                "image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000",
                "category": "Rehab",
                "youtubeVideo": "https://www.youtube.com/watch?v=eh5rVF6-nVs",
                "sets": "2",
                "reps": "8-10 each direction"
              },
              {
                "name": "Progressive Loading",
                "description": "Gradually increasing strength in pain-free ranges of motion.",
                "image": "https://images.unsplash.com/photo-1584863265045-f9d10ca7fa61?q=80&w=1000",
                "category": "Rehab",
                "youtubeVideo": "https://www.youtube.com/watch?v=l-5VFmHr_G8",
                "sets": "3",
                "reps": "10-12"
              }
            ]
          },
          {
            "name": "Knee Health",
            "description": "Program for knee pain management and prevention.",
            "image": "https://images.unsplash.com/photo-1556746834-1cb5b8fabd54?q=80&w=1000",
            "products": [
              {
                "name": "VMO Strengthening",
                "description": "Targeted exercises for the inner quad muscle that stabilizes the knee.",
                "image": "https://images.unsplash.com/photo-1434608519344-49d77a124f88?q=80&w=1000",
                "category": "Rehab",
                "youtubeVideo": "https://www.youtube.com/watch?v=ydBWUW0MeIw",
                "sets": "3",
                "reps": "15-20"
              },
              {
                "name": "Hip External Rotator Strength",
                "description": "Exercises targeting hip muscles that affect knee alignment.",
                "image": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000",
                "category": "Rehab",
                "youtubeVideo": "https://www.youtube.com/watch?v=WOfk1khUbWU",
                "sets": "3",
                "reps": "12-15 each side"
              },
              {
                "name": "Balance & Proprioception",
                "description": "Exercises to improve knee joint awareness and stability.",
                "image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000",
                "category": "Rehab",
                "youtubeVideo": "https://www.youtube.com/watch?v=1ty9B9yvNqs",
                "sets": "2",
                "reps": "30 seconds each leg"
              },
              {
                "name": "Proper Landing Mechanics",
                "description": "Training for safe movement patterns to reduce knee stress.",
                "image": "https://images.unsplash.com/photo-1434608519344-49d77a124f88?q=80&w=1000",
                "category": "Rehab",
                "youtubeVideo": "https://www.youtube.com/watch?v=v0lOv-s3Ht4",
                "sets": "3",
                "reps": "10 with perfect form"
              }
            ]
          }
        ]
      },
      {
        "name": "Senior Fitness",
        "description": "Age-appropriate exercise programs for maintaining health, mobility, and independence.",
        "image": "https://images.unsplash.com/photo-1568659585069-facb248756e9?q=80&w=1000",
        "children": [
          {
            "name": "Functional Strength",
            "description": "Strength training exercises to support daily activities and independence.",
            "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
            "products": [
              {
                "name": "Sit to Stand",
                "description": "Functional exercise to strengthen lower body for daily tasks.",
                "image": "https://images.unsplash.com/photo-1434608519344-49d77a124f88?q=80&w=1000",
                "category": "Senior",
                "youtubeVideo": "https://www.youtube.com/watch?v=U3B7J5BQY_0",
                "sets": "3",
                "reps": "10-12"
              },
              {
                "name": "Wall Push-Ups",
                "description": "Modified upper body strengthening for seniors.",
                "image": "https://images.unsplash.com/photo-1598971639058-a4575d5c92e1?q=80&w=1000",
                "category": "Senior",
                "youtubeVideo": "https://www.youtube.com/watch?v=PkLPFi2L4nY",
                "sets": "2",
                "reps": "10-15"
              },
              {
                "name": "Resistance Band Rows",
                "description": "Back strengthening for improved posture.",
                "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
                "category": "Senior",
                "youtubeVideo": "https://www.youtube.com/watch?v=1HBqtYlC2IA",
                "sets": "2",
                "reps": "12-15"
              },
              {
                "name": "Farmer's Carry",
                "description": "Functional exercise for grip strength and daily tasks.",
                "image": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000",
                "category": "Senior",
                "youtubeVideo": "https://www.youtube.com/watch?v=rt17lmnaLSM",
                "sets": "2",
                "reps": "20 steps each direction"
              }
            ]
          },
          {
            "name": "Balance & Mobility",
            "description": "Exercises to improve balance, coordination, and reduce fall risk.",
            "image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000",
            "products": [
              {
                "name": "Single Leg Balance",
                "description": "Progressive balance exercises with various difficulty levels.",
                "image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000",
                "category": "Senior",
                "youtubeVideo": "https://www.youtube.com/watch?v=jSGlLQovZRw",
                "sets": "2",
                "reps": "30 seconds each side"
              },
              {
                "name": "Heel-Toe Walking",
                "description": "Exercise to improve walking stability and coordination.",
                "image": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1000",
                "category": "Senior",
                "youtubeVideo": "https://www.youtube.com/watch?v=SpscBQXZdVE",
                "sets": "2",
                "reps": "20 steps"
              },
              {
                "name": "Ankle Mobility",
                "description": "Exercises to improve ankle strength and range of motion.",
                "image": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1000",
                "category": "Senior",
                "youtubeVideo": "https://www.youtube.com/watch?v=1RJZ-l4TaA8",
                "sets": "2",
                "reps": "12 each direction"
              },
              {
                "name": "Sit & Reach",
                "description": "Gentle flexibility exercise for hamstrings and lower back.",
                "image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000",
                "category": "Senior",
                "youtubeVideo": "https://www.youtube.com/watch?v=ihG-IXh0Qvo",
                "sets": "2",
                "reps": "Hold for 20-30 seconds"
              }
            ]
          },
          {
            "name": "Joint Health",
            "description": "Gentle exercises to maintain joint function and reduce stiffness.",
            "image": "https://images.unsplash.com/photo-1573384424320-64a9f089e205?q=80&w=1000",
            "products": [
              {
                "name": "Gentle Joint Rotations",
                "description": "Mobility exercises for all major joints.",
                "image": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=1000",
                "category": "Senior",
                "youtubeVideo": "https://www.youtube.com/watch?v=SXl5wl6FLwA",
                "sets": "1",
                "reps": "10 each joint"
              },
              {
                "name": "Water Exercise",
                "description": "Low-impact movements performed in water for joint health.",
                "image": "https://images.unsplash.com/photo-1576013551627-0ae1a0639090?q=80&w=1000",
                "category": "Senior",
                "youtubeVideo": "https://www.youtube.com/watch?v=xVsjCJfLGnQ",
                "sets": "1",
                "reps": "10-15 each movement"
              },
              {
                "name": "Chair Yoga",
                "description": "Modified yoga poses performed seated for joint mobility.",
                "image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000",
                "category": "Senior",
                "youtubeVideo": "https://www.youtube.com/watch?v=1DYH5ud3zHo",
                "sets": "1",
                "reps": "Hold each pose 20-30 seconds"
              },
              {
                "name": "Gentle Stretching",
                "description": "Full body stretching routine to maintain mobility.",
                "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
                "category": "Senior",
                "youtubeVideo": "https://www.youtube.com/watch?v=kVFy0wsjbVU",
                "sets": "1",
                "reps": "Hold each stretch 20-30 seconds"
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

  console.log('Starting to populate specialized workout programs...');

  for (const parent of data.collections) {
    console.log(`Creating parent collection: ${parent.name}`);
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
      console.log(`Creating child collection: ${child.name}`);
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
        console.log(`Creating product: ${prod.name}`);
        const prodDoc = new Product({
          name: prod.name,
          description: prod.description,
          image: prod.image,
          category: prod.category,
          youtubeVideo: prod.youtubeVideo,
          user: adminUser._id,
          rating: 5,
          numReviews: 0,
        });
        const savedProd = await prodDoc.save();
        await Collection.findByIdAndUpdate(savedChild._id, {
          $push: { products: { product: savedProd._id, displayOrder: 0 } }
        });
      }
    }
  }

  console.log('Specialized workout programs populated successfully!');
  process.exit();
};

run().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});