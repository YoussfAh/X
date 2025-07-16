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
        "name": "Hypertrophy Masterclass",
        "description": "Specialized training program designed to maximize muscle growth through volume, time under tension, and progressive overload.",
        "image": "https://images.unsplash.com/photo-1584863265045-f9d10ca7fa61?q=80&w=1000",
        "children": [
          {
            "name": "Chest & Triceps",
            "description": "Detailed workout focusing on chest development and tricep growth.",
            "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
            "products": [
              {
                "name": "Incline Dumbbell Press",
                "description": "Targets upper chest fibers for complete pectoral development.",
                "image": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=1000",
                "category": "Chest",
                "youtubeVideo": "https://www.youtube.com/watch?v=8iPEnn-ltC8",
                "sets": "4",
                "reps": "10-12"
              },
              {
                "name": "Cable Fly",
                "description": "Isolation movement providing constant tension throughout the range of motion.",
                "image": "https://images.unsplash.com/photo-1598632640487-6ea4a4e8b963?q=80&w=1000",
                "category": "Chest",
                "youtubeVideo": "https://www.youtube.com/watch?v=Iwe6AmxVf7o",
                "sets": "3",
                "reps": "12-15"
              },
              {
                "name": "Skull Crushers",
                "description": "Effective tricep isolation exercise for building arm thickness.",
                "image": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?q=80&w=1000",
                "category": "Arms",
                "youtubeVideo": "https://www.youtube.com/watch?v=d_KZxkY_0cM",
                "sets": "3",
                "reps": "10-12"
              },
              {
                "name": "Rope Pushdowns",
                "description": "Tricep isolation exercise focusing on muscle contraction at peak.",
                "image": "https://images.unsplash.com/photo-1584464599778-21b080ca4add?q=80&w=1000",
                "category": "Arms",
                "youtubeVideo": "https://www.youtube.com/watch?v=vB5OHsJ3EME",
                "sets": "3",
                "reps": "12-15"
              }
            ]
          },
          {
            "name": "Back & Biceps",
            "description": "Volume-based workout targeting all areas of the back and biceps.",
            "image": "https://images.unsplash.com/photo-1603287681836-aff69e939a98?q=80&w=1000",
            "products": [
              {
                "name": "Wide-Grip Lat Pulldown",
                "description": "Targets lat width and upper back development.",
                "image": "https://images.unsplash.com/photo-1597452485595-73c2d2d7078f?q=80&w=1000",
                "category": "Back",
                "youtubeVideo": "https://www.youtube.com/watch?v=CAwf7n6Luuc",
                "sets": "4",
                "reps": "10-12"
              },
              {
                "name": "Seated Cable Row",
                "description": "Builds mid-back thickness and improves posture.",
                "image": "https://images.unsplash.com/photo-1598266663439-2056e6900339?q=80&w=1000",
                "category": "Back",
                "youtubeVideo": "https://www.youtube.com/watch?v=GZbfZ033f74",
                "sets": "3",
                "reps": "12-15"
              },
              {
                "name": "Preacher Curls",
                "description": "Isolates the biceps with strict form for maximum growth.",
                "image": "https://images.unsplash.com/photo-1581009137042-c552e485697a?q=80&w=1000",
                "category": "Arms",
                "youtubeVideo": "https://www.youtube.com/watch?v=fIWP-FRFNU0",
                "sets": "3",
                "reps": "10-12"
              },
              {
                "name": "Hammer Curls",
                "description": "Targets the brachialis and brachioradialis for complete arm development.",
                "image": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000",
                "category": "Arms",
                "youtubeVideo": "https://www.youtube.com/watch?v=zC3nLlEvin4",
                "sets": "3",
                "reps": "12-15"
              }
            ]
          },
          {
            "name": "Legs & Shoulders",
            "description": "High-volume workout for leg growth and shoulder development.",
            "image": "https://images.unsplash.com/photo-1434608519344-49d77a124f88?q=80&w=1000",
            "products": [
              {
                "name": "Hack Squat",
                "description": "Machine-based quad-focused exercise with controlled form.",
                "image": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000",
                "category": "Legs",
                "youtubeVideo": "https://www.youtube.com/watch?v=0tn5K9NlCfo",
                "sets": "4",
                "reps": "10-12"
              },
              {
                "name": "Leg Extensions",
                "description": "Isolation exercise for quad development and muscle detail.",
                "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
                "category": "Legs",
                "youtubeVideo": "https://www.youtube.com/watch?v=YyvSfVjQeL0",
                "sets": "3",
                "reps": "12-15"
              },
              {
                "name": "Lateral Raises",
                "description": "Isolation movement for side deltoid development and shoulder width.",
                "image": "https://images.unsplash.com/photo-1581009137890-466ae70a3d7c?q=80&w=1000",
                "category": "Shoulders",
                "youtubeVideo": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
                "sets": "4",
                "reps": "12-15"
              },
              {
                "name": "Face Pulls",
                "description": "Targets rear delts and rotator cuffs for balanced shoulder development.",
                "image": "https://images.unsplash.com/photo-1584466977773-e625c37cdd50?q=80&w=1000",
                "category": "Shoulders",
                "youtubeVideo": "https://www.youtube.com/watch?v=rep-qVOkqgk",
                "sets": "3",
                "reps": "15-20"
              }
            ]
          }
        ]
      },
      {
        "name": "Bodybuilding Split",
        "description": "Traditional bodybuilding program dividing muscle groups across 5 days for maximum development.",
        "image": "https://images.unsplash.com/photo-1577221084712-45b0445d2b00?q=80&w=1000",
        "children": [
          {
            "name": "Chest Day",
            "description": "Comprehensive workout hitting all angles of the chest.",
            "image": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000",
            "children": [
              {
                "name": "Upper Chest Focus",
                "description": "Exercises targeting the often underdeveloped upper chest.",
                "image": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=1000",
                "products": [
                  {
                    "name": "Incline Barbell Press",
                    "description": "Compound movement emphasizing the upper chest fibers.",
                    "image": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000",
                    "category": "Chest",
                    "youtubeVideo": "https://www.youtube.com/watch?v=jPLdzuHckI8",
                    "sets": "4",
                    "reps": "8-10"
                  },
                  {
                    "name": "Incline Cable Fly",
                    "description": "Isolation movement with constant tension for upper chest.",
                    "image": "https://images.unsplash.com/photo-1584866155825-eafaf0c22f1e?q=80&w=1000",
                    "category": "Chest",
                    "youtubeVideo": "https://www.youtube.com/watch?v=Iwe6AmxVf7o",
                    "sets": "3",
                    "reps": "12-15"
                  }
                ]
              },
              {
                "name": "Mid & Lower Chest Focus",
                "description": "Exercises for complete mid and lower chest development.",
                "image": "https://images.unsplash.com/photo-1571388208497-71bedc66e932?q=80&w=1000",
                "products": [
                  {
                    "name": "Flat Dumbbell Press",
                    "description": "Compound movement allowing greater range of motion than barbell.",
                    "image": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000",
                    "category": "Chest",
                    "youtubeVideo": "https://www.youtube.com/watch?v=VmB1G1K7v94",
                    "sets": "4",
                    "reps": "10-12"
                  },
                  {
                    "name": "Decline Push-Ups",
                    "description": "Bodyweight exercise targeting the lower chest fibers.",
                    "image": "https://images.unsplash.com/photo-1597076545399-91a3ff97a9de?q=80&w=1000",
                    "category": "Chest",
                    "youtubeVideo": "https://www.youtube.com/watch?v=SKPab1YTOpo",
                    "sets": "3",
                    "reps": "15-20"
                  }
                ]
              }
            ]
          },
          {
            "name": "Back Day",
            "description": "Complete back development from all angles and grip positions.",
            "image": "https://images.unsplash.com/photo-1603287681836-aff69e939a98?q=80&w=1000",
            "products": [
              {
                "name": "Pull-Ups",
                "description": "Compound bodyweight exercise for back width and thickness.",
                "image": "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000",
                "category": "Back",
                "youtubeVideo": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
                "sets": "4",
                "reps": "8-12"
              },
              {
                "name": "T-Bar Row",
                "description": "Compound movement hitting the mid-back with heavy loads.",
                "image": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=1000",
                "category": "Back",
                "youtubeVideo": "https://www.youtube.com/watch?v=j3Igk5nyZE4",
                "sets": "4",
                "reps": "8-10"
              },
              {
                "name": "Straight Arm Pulldown",
                "description": "Isolation exercise for lat development with constant tension.",
                "image": "https://images.unsplash.com/photo-1598971639058-a4575d5c92e1?q=80&w=1000",
                "category": "Back",
                "youtubeVideo": "https://www.youtube.com/watch?v=TD-0u70rzxI",
                "sets": "3",
                "reps": "12-15"
              },
              {
                "name": "Single-Arm Dumbbell Row",
                "description": "Unilateral exercise for balanced back development.",
                "image": "https://images.unsplash.com/photo-1616803689943-5601631c7fec?q=80&w=1000",
                "category": "Back",
                "youtubeVideo": "https://www.youtube.com/watch?v=pYcpY20QaE8",
                "sets": "3",
                "reps": "10-12"
              }
            ]
          },
          {
            "name": "Shoulder Day",
            "description": "Dedicated workout targeting all three heads of the deltoid.",
            "image": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000",
            "products": [
              {
                "name": "Seated Dumbbell Press",
                "description": "Compound movement primarily targeting the front delts.",
                "image": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=1000",
                "category": "Shoulders",
                "youtubeVideo": "https://www.youtube.com/watch?v=qEwKCR5JCog",
                "sets": "4",
                "reps": "8-10"
              },
              {
                "name": "Cable Lateral Raises",
                "description": "Lateral raises with constant tension for side delt development.",
                "image": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000",
                "category": "Shoulders",
                "youtubeVideo": "https://www.youtube.com/watch?v=v_ZkxWzYnMc",
                "sets": "4",
                "reps": "12-15"
              },
              {
                "name": "Reverse Pec Deck",
                "description": "Machine exercise isolating the rear delts.",
                "image": "https://images.unsplash.com/photo-1584466977773-e625c37cdd50?q=80&w=1000",
                "category": "Shoulders",
                "youtubeVideo": "https://www.youtube.com/watch?v=0GSu5gn8hz4",
                "sets": "3",
                "reps": "12-15"
              },
              {
                "name": "Upright Rows",
                "description": "Compound exercise hitting side delts and traps.",
                "image": "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1000",
                "category": "Shoulders",
                "youtubeVideo": "https://www.youtube.com/watch?v=VG0nT5GZopg",
                "sets": "3",
                "reps": "10-12"
              }
            ]
          }
        ]
      },
      {
        "name": "Aesthetic Physique Plan",
        "description": "Program designed to build a balanced, aesthetic physique focusing on proportion and symmetry.",
        "image": "https://images.unsplash.com/photo-1550345332-09e3ac987658?q=80&w=1000",
        "children": [
          {
            "name": "Upper Body Focus",
            "description": "Workout targeting the V-taper upper body look.",
            "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
            "products": [
              {
                "name": "Wide-Grip Pull-Ups",
                "description": "Essential exercise for building width in the back.",
                "image": "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000",
                "category": "Back",
                "youtubeVideo": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
                "sets": "4",
                "reps": "8-12"
              },
              {
                "name": "Incline Dumbbell Press",
                "description": "Targets the aesthetic upper chest shelf.",
                "image": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000",
                "category": "Chest",
                "youtubeVideo": "https://www.youtube.com/watch?v=8iPEnn-ltC8",
                "sets": "4",
                "reps": "8-12"
              },
              {
                "name": "Lateral Raises",
                "description": "Key exercise for building shoulder width.",
                "image": "https://images.unsplash.com/photo-1581009137890-466ae70a3d7c?q=80&w=1000",
                "category": "Shoulders",
                "youtubeVideo": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
                "sets": "4",
                "reps": "12-15"
              }
            ]
          },
          {
            "name": "Core Aesthetics",
            "description": "Exercises targeting the abdominal region for definition.",
            "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
            "products": [
              {
                "name": "Hanging Leg Raises",
                "description": "Targets lower abs with full range of motion.",
                "image": "https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1000",
                "category": "Core",
                "youtubeVideo": "https://www.youtube.com/watch?v=JB2oyawG9KI",
                "sets": "4",
                "reps": "12-15"
              },
              {
                "name": "Cable Crunches",
                "description": "Weighted ab exercise for upper abdominal development.",
                "image": "https://images.unsplash.com/photo-1576941089067-2de3c901e126?q=80&w=1000",
                "category": "Core",
                "youtubeVideo": "https://www.youtube.com/watch?v=2fbujeH3F0E",
                "sets": "3",
                "reps": "15-20"
              },
              {
                "name": "Oblique Crunches",
                "description": "Targets the side abdominals for complete core definition.",
                "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
                "category": "Core",
                "youtubeVideo": "https://www.youtube.com/watch?v=9ZYg4-S_448",
                "sets": "3",
                "reps": "15 each side"
              }
            ]
          },
          {
            "name": "Arm Definition",
            "description": "Focused workout for sculpted arms.",
            "image": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000",
            "products": [
              {
                "name": "Incline Dumbbell Curls",
                "description": "Targets the long head of the biceps for peak development.",
                "image": "https://images.unsplash.com/photo-1581009137042-c552e485697a?q=80&w=1000",
                "category": "Arms",
                "youtubeVideo": "https://www.youtube.com/watch?v=soxrZlIl35U",
                "sets": "3",
                "reps": "10-12"
              },
              {
                "name": "Reverse Grip Tricep Pushdowns",
                "description": "Targets the lateral head of the triceps for definition.",
                "image": "https://images.unsplash.com/photo-1584464599778-21b080ca4add?q=80&w=1000",
                "category": "Arms",
                "youtubeVideo": "https://www.youtube.com/watch?v=VJg4i30-m_o",
                "sets": "3",
                "reps": "12-15"
              },
              {
                "name": "Overhead Tricep Extension",
                "description": "Isolates the long head of the triceps for complete arm development.",
                "image": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?q=80&w=1000",
                "category": "Arms",
                "youtubeVideo": "https://www.youtube.com/watch?v=_gsUck-7M74",
                "sets": "3",
                "reps": "10-12"
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

  console.log('Starting to populate hypertrophy training programs...');

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

      if (child.products && child.products.length > 0) {
        for (const prod of child.products) {
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

      // Handle nested collections (sub-children)
      if (child.children && child.children.length > 0) {
        for (const grandchild of child.children) {
          console.log(`Creating grandchild collection: ${grandchild.name}`);
          const grandchildDoc = new Collection({
            name: grandchild.name,
            description: grandchild.description,
            image: grandchild.image,
            user: adminUser._id,
            parentCollection: savedChild._id,
            isPublic: true,
            requiresCode: false,
            products: []
          });
          const savedGrandchild = await grandchildDoc.save();

          for (const prod of grandchild.products || []) {
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
            await Collection.findByIdAndUpdate(savedGrandchild._id, {
              $push: { products: { product: savedProd._id, displayOrder: 0 } }
            });
          }
        }
      }
    }
  }

  console.log('Hypertrophy training programs populated successfully!');
  process.exit();
};

run().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});