import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
// Fix model imports with correct paths
import Collection from '../models/collectionModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import connectDB from '../config/db.js';

dotenv.config();

// Define day structure once for reuse
const dayTemplates = [
  {
    name: 'Pull #1 (Lat Focused)',
    description: 'Emphasize lat stretch and contraction. Warm-ups at low RPE.',
    image: 'https://source.unsplash.com/featured/?pull,day1',
    products: [
      { name: 'Neutral‑Grip Pullup', description: 'Keep torso vertical; full lat stretch; 3x9 reps; rest ~2–3 min.', category: 'Pull', youtubeVideo: 'https://youtu.be/ijgSR2yriyg?si=OPa2ojil3TSfRlU5', alternativeExercises: ['Chin‑Ups', 'Lat Pulldown'] },
      { name: 'Nordic Ham Curl', description: 'Control negative; 2x6 reps; rest ~3–4 min.', category: 'Pull', youtubeVideo: 'https://youtu.be/0eQQwveeQzw?si=qqLXhXn3xBGf6t2E', alternativeExercises: ['Glute‑Ham Raise', 'Seated Leg Curl'] },
      { name: 'Helms Row', description: 'Elbows flared 45°; squeeze scapula; 3x9 reps; rest ~2–3 min.', category: 'Pull', youtubeVideo: 'https://youtu.be/yv0aAY7M1mk?si=j3yJRloK4DtagbP5', alternativeExercises: ['Chest‑Supported Row', 'Bent‑Over Barbell Row'] },
      { name: 'DB Lat Pullover', description: 'Lean forward for stretch; 3x9‑10 reps; rest ~1–2 min.', category: 'Pull', youtubeVideo: 'https://youtu.be/FMSCZYu1JhE?si=qf0xxDfSOpmwI4Rm', alternativeExercises: ['Cable Pullover', 'Machine Pullover'] },
      { name: 'Hammer Curl', description: 'Neutral grip; bottom ¾ ROM; 3x9‑10 reps; rest ~1–2 min.', category: 'Pull', youtubeVideo: 'https://youtu.be/TWUnnDK8rck?si=NmqKbwgMcHmaDp6T', alternativeExercises: ['Cable Hammer Curl', 'Reverse Curl'] },
      { name: 'Bent‑Over Reverse DB Flye', description: 'Pause 1–2s in squeeze; 3x9‑10 reps; rest ~1–2 min.', category: 'Pull', youtubeVideo: 'https://youtu.be/uFbNtqP966A?si=GUxx2NQWlj0PCLgz', alternativeExercises: ['Reverse Pec Deck', 'Face Pull'] },
      { name: 'Half‑Kneeling 1‑Arm Lat Pulldown', description: 'Drive elbow; 1x6‑7 reps; rest 10s; 2 sets each arm.', category: 'Pull', youtubeVideo: 'https://youtu.be/S6DTPNZ_-F4?si=y3rx6TaVEuUONiI2', alternativeExercises: ['Straight‑Arm Pulldown', 'Band Pulldown'] },
      { name: 'DB RDL', description: 'Control negative; hamstring stretch; 2x10 reps; rest 1 min.', category: 'Pull', youtubeVideo: 'https://youtu.be/S6DTPNZ_-F4?si=y3rx6TaVEuUONiI2', alternativeExercises: ['Barbell RDL', 'Single‑Leg RDL'] },
      { name: 'Chest‑Supported T‑Bar Row', description: 'Lead with chest; mid‑back squeeze; 1x10 reps; rest 1 min.', category: 'Pull', youtubeVideo: 'https://youtu.be/r8K1Fkch5go?si=uI9s4q0rLvAsHKtb', alternativeExercises: ['T‑Bar Row', 'Seal Row'] },
      { name: 'Machine Lat Pullover', description: 'Keep arms straight; lat focus; 1x10 reps; rest 1 min.', category: 'Pull', youtubeVideo: 'https://youtu.be/r8K1Fkch5go?si=uI9s4q0rLvAsHKtb', alternativeExercises: ['Cable Pullover', 'DB Pullover'] },
      { name: 'Fat‑Grip Preacher Curl', description: 'Bottom ¾ ROM; 1x10‑12 reps; rest 10s.', category: 'Pull', youtubeVideo: 'https://youtu.be/8RwbLtfLu6A?si=WbzR0z0xfok9M1fp', alternativeExercises: ['EZ‑Bar Curl', 'Spider Curl'] },
      { name: 'Rope Face Pull', description: 'Pause in squeeze; 1x8‑10 reps; rest 10s.', category: 'Pull', youtubeVideo: 'https://youtu.be/V8uasBf-Es8?si=gQnazxPhJYq_AQuY', alternativeExercises: ['Band Pull‑Apart', 'Reverse Flye'] }
    ]
  },
  {
    name: 'Push #1',
    description: 'Focus on chest & arms; warm‑up sets RPE 5; moderate volume.',
    image: 'https://source.unsplash.com/featured/?push,day1',
    products: [
      { name: 'Incline Barbell Press', description: 'Pause 1s bottom; 3x9 reps; rest ~2 min.', category: 'Push', youtubeVideo: 'https://youtu.be/PrwC-5NTCCs?si=TgycMfMHzfsT9QEh', alternativeExercises: ['Dumbbell Press', 'Smith Press'] },
      { name: 'Dips', description: 'Lean forward; 3x9 reps; rest ~2 min.', category: 'Push', youtubeVideo: 'https://youtu.be/Zjzt4MRbAlc?si=Z5K9MxycnTyrnB1N', alternativeExercises: ['Bench Dip', 'Machine Dip'] },
      { name: 'Cable Crossover Low‑to‑High', description: 'Stretch pecs; 3x10 reps; rest ~1.5 min.', category: 'Push', youtubeVideo: 'https://youtu.be/CWH5J_7kzjM?si=cMCtRVtRmwt39Qjf', alternativeExercises: ['Pec Deck', 'Dumbbell Flye'] },
      { name: 'Decline Barbell Press', description: '2x8‑9 reps; rest ~2 min.', category: 'Push', youtubeVideo: 'https://youtu.be/b0ypSz63UGo?si=dMxuJGtxkR4jnUbb', alternativeExercises: ['Decline DB Press', 'Decline Machine'] },
      { name: 'Machine Shoulder Press', description: '3x10 reps; rest ~1.5 min.', category: 'Push', youtubeVideo: 'https://youtu.be/AOsdioes78c?si=XT64ctRyclTbi31x', alternativeExercises: ['DB Shoulder Press', 'Arnold Press'] },
      { name: 'DB Lateral Raise', description: '2x10‑12 reps; rest ~1 min.', category: 'Push', youtubeVideo: 'https://youtu.be/WtokJfvWl-I?si=mtvBsZgakHTbhP4c', alternativeExercises: ['Cable Lateral Raise', 'Machine Lateral'] }
    ]
  },
  {
    name: 'Legs #1',
    description: 'Quad & hamstring focus; moderate volume; technique emphasis.',
    image: 'https://source.unsplash.com/featured/?legs,day1',
    products: [
      { name: 'Front Squat', description: '3x9 reps; rest ~3‑5 min; torso upright.', category: 'Legs', youtubeVideo: 'https://youtu.be/fzpYiRtzmFA?si=CkMtVj1347I0qQOd', alternativeExercises: ['Goblet Squat', 'Hack Squat'] },
      { name: 'Nordic Ham Curl', description: '2x6 reps; rest ~1‑2 min.', category: 'Legs', youtubeVideo: 'https://youtu.be/D-kqUKEQZZ0?si=3tbb6I_kCXyuWMz8', alternativeExercises: ['Seated Leg Curl', 'Lying Leg Curl'] },
      { name: 'Leg Press', description: '3x9 reps; rest ~1‑2 min.', category: 'Legs', youtubeVideo: 'https://youtu.be/6GYTbv-LtV0?si=9ApT8Vb6y5rElWFE', alternativeExercises: ['Smith Machine Squat', 'Bulgarian Split Squat'] },
      { name: 'Cable Hip Adduction', description: '10‑12 reps; rest ~1 min.', category: 'Legs', youtubeVideo: 'https://youtu.be/sX4tGtcc62k?si=Jgp67uGQNFMU3O8Y', alternativeExercises: ['Machine Hip Adduction', 'Band Adduction'] },
      { name: 'Calf Raise (Donkey or Seated)', description: '4x12‑15; rest ~1 min.', category: 'Legs', youtubeVideo: 'https://youtu.be/YrcnBlH8XDA?si=cJ0tdsbirapsyDza', alternativeExercises: ['Standing Calf Raise', 'Smith Calf Raise'] }
    ]
  },
  {
    name: 'Arms & Weak Points #1',
    description: 'Target arms & choose 1 weak‑point exercise from hypertrophy handbook.',
    image: 'https://source.unsplash.com/featured/?arms,day1',
    products: [
      { name: 'DB Scott Curl', description: 'Bottom 2/3 ROM; 3x9 reps; rest ~1‑3 min.', category: 'Arms', youtubeVideo: 'https://youtu.be/jBIvbpyb99M?si=4tzkpKJGs95kLfBS', alternativeExercises: ['EZ‑Bar Curl', 'Spider Curl'] },
      { name: 'DB Skull Crusher', description: '3x9 reps; rest ~1‑3 min; full stretch.', category: 'Arms', youtubeVideo: 'https://youtu.be/YdUUYFgpA7g?si=v5wLi1Cdzjh501X2', alternativeExercises: ['EZ‑Skull Crusher', 'Cable Triceps Pushdown'] },
      { name: 'Reverse Crunch', description: '3x10‑20; rest ~1‑2 min; control lower back.', category: 'Core', youtubeVideo: 'https://youtu.be/CrfvmSGfT2c?si=hsWBdUyeIyjzr_7h', alternativeExercises: ['Hanging Leg Raise', 'Cable Crunch'] },
      { name: 'Weak‑Point Exercise 1', description: 'See Weak Point Table; perform at RPE 9‑10; 3x…', category: 'Arms', youtubeVideo: '', alternativeExercises: ['Cable Preacher Curl', 'Seated DB French Press'] }
    ]
  }
];

// Full 10‑week Push/Pull/Legs & Arms program, including all exercises, YouTube links, notes, rest, sets, reps, and alternative options.
const data = {
  collections: [
    // Week 1
    {
      name: 'Week 1 – Push/Pull/Legs & Arms',
      description: 'Introduction week: moderate volume to establish technique. Includes 4 training days: Pull #1, Push #1, Legs #1, Arms & Weak Points #1.',
      image: 'https://source.unsplash.com/featured/?workout,week1',
      children: dayTemplates
    },
    // Weeks 2–10 similar structure: each week as parent, 4 children days with products
    ...Array.from({ length: 9 }, (_, i) => ({
      name: `Week ${i + 2} – Push/Pull/Legs & Arms`,
      description: `Week ${i + 2} progression: adjust sets/reps as per program.`, 
      image: `https://source.unsplash.com/featured/?workout,week${i + 2}`,
      children: dayTemplates // now using the predefined templates
    }))
  ]
};

const run = async () => {
  await connectDB();
  const adminUser = await User.findOne({ isAdmin: true });
  if (!adminUser) {
    console.error('No admin user found.');
    process.exit(1);
  }

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
          name: prod.name,
          description: prod.description + (prod.alternativeExercises ? '\nAlternatives: ' + prod.alternativeExercises.join(', ') : ''),
          image: prod.image || `https://source.unsplash.com/featured/?${encodeURIComponent(prod.name)}`,
          category: prod.category,
          youtubeVideo: prod.youtubeVideo,
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




/* 



add the data and do it contuie  like that but add more 3 root collection with the data inside them 

like the first one  but add more 3 from the pdf 














*/ 