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
        "name": "Functional Fitness",
        "description": "Workout program for improving movement patterns, mobility, and overall functional strength.",
        "image": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1000",
        "children": [
          {
            "name": "Movement Patterns",
            "description": "Focuses on the six fundamental movement patterns: squat, hinge, push, pull, carry, and rotate.",
            "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
            "products": [
              {
                "name": "Goblet Squat",
                "description": "Functional squat pattern with anterior load for proper mechanics.",
                "image": "https://images.unsplash.com/photo-1566241142559-40e1738b7ebb?q=80&w=1000",
                "category": "Movement",
                "youtubeVideo": "https://www.youtube.com/watch?v=MxsFDhcyFyE",
                "sets": "3",
                "reps": "12"
              },
              {
                "name": "Kettlebell Swing",
                "description": "Explosive hip hinge movement for power and posterior chain development.",
                "image": "https://images.unsplash.com/photo-1603287681836-aff69e939a98?q=80&w=1000",
                "category": "Movement",
                "youtubeVideo": "https://www.youtube.com/watch?v=YSxHifyI6s8",
                "sets": "4",
                "reps": "15"
              },
              {
                "name": "TRX Push-Up",
                "description": "Push pattern with added core stability challenge.",
                "image": "https://images.unsplash.com/photo-1597452485595-73c2d2d7078f?q=80&w=1000",
                "category": "Movement",
                "youtubeVideo": "https://www.youtube.com/watch?v=YmPxIUt7AEw",
                "sets": "3",
                "reps": "10"
              },
              {
                "name": "TRX Row",
                "description": "Horizontal pulling pattern with adjustable intensity.",
                "image": "https://images.unsplash.com/photo-1598266663439-2056e6900339?q=80&w=1000",
                "category": "Movement",
                "youtubeVideo": "https://www.youtube.com/watch?v=I3LaVsfw-co",
                "sets": "3",
                "reps": "12"
              },
              {
                "name": "Farmer's Walk",
                "description": "Loaded carry exercise for grip, core, and full-body stability.",
                "image": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000",
                "category": "Movement",
                "youtubeVideo": "https://www.youtube.com/watch?v=rt17lmnaLSM",
                "sets": "3",
                "reps": "40 yards"
              },
              {
                "name": "Russian Twist",
                "description": "Core rotational exercise for obliques and transverse abdominis.",
                "image": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000",
                "category": "Movement",
                "youtubeVideo": "https://www.youtube.com/watch?v=JyUqwkVpsi8",
                "sets": "3",
                "reps": "20 total"
              }
            ]
          },
          {
            "name": "Mobility & Stability",
            "description": "Exercises focusing on joint mobility and stability for injury prevention.",
            "image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000",
            "products": [
              {
                "name": "Thoracic Spine Mobility",
                "description": "Improves upper back mobility for better overhead movements.",
                "image": "https://images.unsplash.com/photo-1597452485595-73c2d2d7078f?q=80&w=1000",
                "category": "Mobility",
                "youtubeVideo": "https://www.youtube.com/watch?v=eh5rVF6-nVs",
                "sets": "3",
                "reps": "10 each side"
              },
              {
                "name": "Hip 90/90",
                "description": "Improves internal and external hip rotation mobility.",
                "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
                "category": "Mobility",
                "youtubeVideo": "https://www.youtube.com/watch?v=nLuvQCTPrcY",
                "sets": "2",
                "reps": "10 transitions each side"
              },
              {
                "name": "Shoulder CARs",
                "description": "Controlled articular rotations for shoulder health.",
                "image": "https://images.unsplash.com/photo-1590771998996-8589ec9b5ac6?q=80&w=1000",
                "category": "Mobility",
                "youtubeVideo": "https://www.youtube.com/watch?v=a4c2EwzP6m4",
                "sets": "2",
                "reps": "8 each direction"
              },
              {
                "name": "Bird Dog",
                "description": "Core stability exercise focusing on anti-rotation and limb coordination.",
                "image": "https://images.unsplash.com/photo-1597452485595-73c2d2d7078f?q=80&w=1000",
                "category": "Stability",
                "youtubeVideo": "https://www.youtube.com/watch?v=wiFNA3sqjCA",
                "sets": "3",
                "reps": "12 each side"
              },
              {
                "name": "Dead Bug",
                "description": "Core stability focusing on anterior core and coordination.",
                "image": "https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1000",
                "category": "Stability",
                "youtubeVideo": "https://www.youtube.com/watch?v=4XLEnwUr1d8",
                "sets": "3",
                "reps": "10 each side"
              }
            ]
          },
          {
            "name": "Conditioning Circuit",
            "description": "High-intensity functional circuit for cardiovascular conditioning.",
            "image": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1000",
            "products": [
              {
                "name": "Kettlebell Clean & Press",
                "description": "Full-body exercise combining strength and conditioning.",
                "image": "https://images.unsplash.com/photo-1591940742878-15845012e863?q=80&w=1000",
                "category": "Conditioning",
                "youtubeVideo": "https://www.youtube.com/watch?v=48qwJVY8WYA",
                "sets": "3",
                "reps": "30 seconds each side"
              },
              {
                "name": "Burpees",
                "description": "Full-body conditioning exercise with explosive component.",
                "image": "https://images.unsplash.com/photo-1596357395217-80de13130e92?q=80&w=1000",
                "category": "Conditioning",
                "youtubeVideo": "https://www.youtube.com/watch?v=dZgVxmf6jkA",
                "sets": "3",
                "reps": "45 seconds"
              },
              {
                "name": "Battle Ropes",
                "description": "Upper-body and core conditioning exercise.",
                "image": "https://images.unsplash.com/photo-1520823235542-74f993788155?q=80&w=1000",
                "category": "Conditioning",
                "youtubeVideo": "https://www.youtube.com/watch?v=r2Rzaf7SaGg",
                "sets": "3",
                "reps": "30 seconds"
              },
              {
                "name": "Mountain Climbers",
                "description": "Dynamic core exercise with cardiovascular benefit.",
                "image": "https://images.unsplash.com/photo-1598971639058-a4575d5c92e1?q=80&w=1000",
                "category": "Conditioning",
                "youtubeVideo": "https://www.youtube.com/watch?v=cnyTQDSE884",
                "sets": "3",
                "reps": "45 seconds"
              }
            ]
          }
        ]
      },
      {
        "name": "Bodyweight Mastery",
        "description": "Progressive calisthenics program using only bodyweight for complete physical development.",
        "image": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000",
        "children": [
          {
            "name": "Upper Body Push",
            "description": "Progressive bodyweight pushing exercises for chest, shoulders, and triceps.",
            "image": "https://images.unsplash.com/photo-1597076545399-91a3ff97a9de?q=80&w=1000",
            "products": [
              {
                "name": "Push-Up Progressions",
                "description": "Series of push-up variations from beginner to advanced.",
                "image": "https://images.unsplash.com/photo-1598971639058-a4575d5c92e1?q=80&w=1000",
                "category": "Bodyweight",
                "youtubeVideo": "https://www.youtube.com/watch?v=0pkjOk0EiAk",
                "sets": "4",
                "reps": "8-12"
              },
              {
                "name": "Pike Push-Ups",
                "description": "Vertical pushing movement targeting shoulders.",
                "image": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000",
                "category": "Bodyweight",
                "youtubeVideo": "https://www.youtube.com/watch?v=x7_I5SUAd00",
                "sets": "3",
                "reps": "10-15"
              },
              {
                "name": "Dips",
                "description": "Advanced pushing exercise for chest, shoulders and triceps.",
                "image": "https://images.unsplash.com/photo-1598971639058-a4575d5c92e1?q=80&w=1000",
                "category": "Bodyweight",
                "youtubeVideo": "https://www.youtube.com/watch?v=wjUmnZH528Y",
                "sets": "3",
                "reps": "8-12"
              },
              {
                "name": "Pseudo Planche Push-Ups",
                "description": "Advanced push-up variation for strength and preparation for planche.",
                "image": "https://images.unsplash.com/photo-1597076545399-91a3ff97a9de?q=80&w=1000",
                "category": "Bodyweight",
                "youtubeVideo": "https://www.youtube.com/watch?v=C-SML6xnVkI",
                "sets": "3",
                "reps": "6-10"
              }
            ]
          },
          {
            "name": "Upper Body Pull",
            "description": "Progressive bodyweight pulling exercises for back and biceps.",
            "image": "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000",
            "products": [
              {
                "name": "Pull-Up Progressions",
                "description": "Series of pull-up variations from beginner to advanced.",
                "image": "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000",
                "category": "Bodyweight",
                "youtubeVideo": "https://www.youtube.com/watch?v=3YvfRx31xDE",
                "sets": "4",
                "reps": "5-10"
              },
              {
                "name": "Australian Rows",
                "description": "Horizontal rowing progression using bodyweight.",
                "image": "https://images.unsplash.com/photo-1598266663439-2056e6900339?q=80&w=1000",
                "category": "Bodyweight",
                "youtubeVideo": "https://www.youtube.com/watch?v=G28OHe7Prg4",
                "sets": "3",
                "reps": "10-15"
              },
              {
                "name": "Scapular Pull-Ups",
                "description": "Foundational movement for scapular control and health.",
                "image": "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000",
                "category": "Bodyweight",
                "youtubeVideo": "https://www.youtube.com/watch?v=FgYoc4O-cio",
                "sets": "3",
                "reps": "10-12"
              },
              {
                "name": "Archer Pull-Ups",
                "description": "Advanced unilateral pull-up variation for strength.",
                "image": "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000",
                "category": "Bodyweight",
                "youtubeVideo": "https://www.youtube.com/watch?v=4hhSsIpvgHs",
                "sets": "3",
                "reps": "3-5 each side"
              }
            ]
          },
          {
            "name": "Lower Body",
            "description": "Progressive bodyweight leg exercises for strength and power.",
            "image": "https://images.unsplash.com/photo-1434608519344-49d77a124f88?q=80&w=1000",
            "products": [
              {
                "name": "Pistol Squat Progressions",
                "description": "Single-leg squat development from beginner to advanced.",
                "image": "https://images.unsplash.com/photo-1566241142559-40e1738b7ebb?q=80&w=1000",
                "category": "Bodyweight",
                "youtubeVideo": "https://www.youtube.com/watch?v=vq5-vdgJc0I",
                "sets": "3",
                "reps": "5-8 each leg"
              },
              {
                "name": "Shrimp Squats",
                "description": "Advanced single-leg squat variation with balance challenge.",
                "image": "https://images.unsplash.com/photo-1434608519344-49d77a124f88?q=80&w=1000",
                "category": "Bodyweight",
                "youtubeVideo": "https://www.youtube.com/watch?v=TKt0-c83GSc",
                "sets": "3",
                "reps": "6-10 each leg"
              },
              {
                "name": "Natural Hamstring Curls",
                "description": "Challenging posterior chain exercise using only bodyweight.",
                "image": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000",
                "category": "Bodyweight",
                "youtubeVideo": "https://www.youtube.com/watch?v=bEv6CCg2BC8",
                "sets": "3",
                "reps": "8-12"
              },
              {
                "name": "Jump Squats",
                "description": "Plyometric exercise for explosive lower body power.",
                "image": "https://images.unsplash.com/photo-1434608519344-49d77a124f88?q=80&w=1000",
                "category": "Bodyweight",
                "youtubeVideo": "https://www.youtube.com/watch?v=72BSr67SZ2E",
                "sets": "4",
                "reps": "10-15"
              }
            ]
          }
        ]
      },
      {
        "name": "Home Workout Essentials",
        "description": "Minimal equipment workouts that can be done at home with little to no equipment.",
        "image": "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000",
        "children": [
          {
            "name": "Full Body Circuit",
            "description": "Complete workout using minimal equipment targeting all major muscle groups.",
            "image": "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?q=80&w=1000",
            "products": [
              {
                "name": "Push-Up Variations",
                "description": "Series of push-up variations for upper body pushing.",
                "image": "https://images.unsplash.com/photo-1598971639058-a4575d5c92e1?q=80&w=1000",
                "category": "Home",
                "youtubeVideo": "https://www.youtube.com/watch?v=IODxDxX7oi4",
                "sets": "3",
                "reps": "10-15 each variation"
              },
              {
                "name": "Chair Dips",
                "description": "Tricep exercise using household furniture.",
                "image": "https://images.unsplash.com/photo-1596357395217-80de13130e92?q=80&w=1000",
                "category": "Home",
                "youtubeVideo": "https://www.youtube.com/watch?v=jdFzYGmvDyg",
                "sets": "3",
                "reps": "12-15"
              },
              {
                "name": "Bodyweight Rows",
                "description": "Back exercise using a table or sturdy surface.",
                "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000",
                "category": "Home",
                "youtubeVideo": "https://www.youtube.com/watch?v=G28OHe7Prg4",
                "sets": "3",
                "reps": "10-12"
              },
              {
                "name": "Lunges",
                "description": "Lower body exercise targeting quads, hamstrings and glutes.",
                "image": "https://images.unsplash.com/photo-1434608519344-49d77a124f88?q=80&w=1000",
                "category": "Home",
                "youtubeVideo": "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
                "sets": "3",
                "reps": "10-12 each leg"
              },
              {
                "name": "Plank Variations",
                "description": "Core strengthening exercises using multiple positions.",
                "image": "https://images.unsplash.com/photo-1566241142248-81031146da6c?q=80&w=1000",
                "category": "Home",
                "youtubeVideo": "https://www.youtube.com/watch?v=pSHjTRCQxIw",
                "sets": "3",
                "reps": "30-60 seconds each"
              }
            ]
          },
          {
            "name": "HIIT at Home",
            "description": "High-intensity interval training that can be done in limited space.",
            "image": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1000",
            "products": [
              {
                "name": "Bodyweight HIIT Circuit",
                "description": "Series of exercises done in rapid succession with minimal rest.",
                "image": "https://images.unsplash.com/photo-1546483875-ad9014c88eba?q=80&w=1000",
                "category": "Home",
                "youtubeVideo": "https://www.youtube.com/watch?v=ml6cT4AZdqI",
                "sets": "4",
                "reps": "40 seconds work, 20 seconds rest"
              },
              {
                "name": "Tabata Training",
                "description": "20 seconds on, 10 seconds off protocol for maximum intensity.",
                "image": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1000",
                "category": "Home",
                "youtubeVideo": "https://www.youtube.com/watch?v=XIeCMhNWFQQ",
                "sets": "8",
                "reps": "20 seconds work, 10 seconds rest"
              },
              {
                "name": "EMOM Workout",
                "description": "Every Minute On the Minute workout format for conditioning.",
                "image": "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?q=80&w=1000",
                "category": "Home",
                "youtubeVideo": "https://www.youtube.com/watch?v=DoZ2jP6HvKI",
                "sets": "10",
                "reps": "Work for 40-45 seconds, rest remainder of minute"
              }
            ]
          },
          {
            "name": "Resistance Band Workout",
            "description": "Complete workout using only resistance bands for added resistance.",
            "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
            "products": [
              {
                "name": "Band Pull-Aparts",
                "description": "Upper back and rear delt exercise using resistance band.",
                "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
                "category": "Home",
                "youtubeVideo": "https://www.youtube.com/watch?v=WSfn5e7QFCA",
                "sets": "3",
                "reps": "15-20"
              },
              {
                "name": "Band Squats",
                "description": "Lower body compound exercise with added band resistance.",
                "image": "https://images.unsplash.com/photo-1434608519344-49d77a124f88?q=80&w=1000",
                "category": "Home",
                "youtubeVideo": "https://www.youtube.com/watch?v=UY78FXegX9Q",
                "sets": "3",
                "reps": "15-20"
              },
              {
                "name": "Band Rows",
                "description": "Rowing movement for back development using anchor point.",
                "image": "https://images.unsplash.com/photo-1598266663439-2056e6900339?q=80&w=1000",
                "category": "Home",
                "youtubeVideo": "https://www.youtube.com/watch?v=1HBqtYlC2IA",
                "sets": "3",
                "reps": "12-15"
              },
              {
                "name": "Band Bicep Curls",
                "description": "Isolation exercise for biceps using resistance band.",
                "image": "https://images.unsplash.com/photo-1581009137042-c552e485697a?q=80&w=1000",
                "category": "Home",
                "youtubeVideo": "https://www.youtube.com/watch?v=9Beck1__4l8",
                "sets": "3",
                "reps": "12-15"
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

  console.log('Starting to populate functional fitness and bodyweight programs...');

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

  console.log('Functional fitness and bodyweight programs populated successfully!');
  process.exit();
};

run().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});