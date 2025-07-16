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
    collections: [
      {
        name: "Comprehensive Weight Loss Plans",
        description: "A variety of calorie-based and lifestyle-based weight loss meal plans for all needs.",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
        children: [
          {
            name: "1200 Calorie Plan",
            description: "A strict, nutritionally complete plan for rapid but safe weight loss.",
            image: "https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?q=80&w=1000",
            products: [
              {
                name: "7-Day 1200 Calorie Menu",
                description: "A full week of breakfast, lunch, dinner, and snacks.",
                image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?q=80&w=1000",
                category: "Meal Plan",
                youtubeVideo: "https://www.youtube.com/watch?v=8YJJHbIZGmI",
                nutritionInfo: "1200 kcal/day, 40% carbs, 30% protein, 30% fat",
                mealPlan: "Day 1: Greek yogurt parfait, grilled chicken salad, salmon & veggies, apple slices. Day 2: ... (see PDF)"
              },
              {
                name: "Quick 1200 Calorie Recipes",
                description: "Easy, fast, and filling recipes for low-calorie days.",
                image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?q=80&w=1000",
                category: "Recipes",
                youtubeVideo: "https://www.youtube.com/watch?v=VA3GFCfh3p0",
                recipes: "Egg white omelet, zucchini noodles, turkey lettuce wraps, berry smoothie."
              },
              {
                name: "1200 Calorie Shopping List",
                description: "All groceries needed for a week of healthy eating.",
                image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?q=80&w=1000",
                category: "Guide",
                youtubeVideo: "https://www.youtube.com/watch?v=ykVXEwu9LnI",
                tips: "Buy in bulk, focus on lean proteins, lots of veggies, low-calorie snacks."
              }
            ]
          },
          {
            name: "1500 Calorie Plan",
            description: "A balanced plan for steady weight loss and active lifestyles.",
            image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
            products: [
              {
                name: "14-Day 1500 Calorie Menu",
                description: "Two weeks of meal plans with variety and flavor.",
                image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?q=80&w=1000",
                category: "Meal Plan",
                youtubeVideo: "https://www.youtube.com/watch?v=wtH5zR6EQMI",
                nutritionInfo: "1500 kcal/day, 45% carbs, 30% protein, 25% fat",
                mealPlan: "Includes: protein pancakes, quinoa bowls, chicken stir-fry, veggie chili, fruit snacks."
              },
              {
                name: "High-Protein 1500 Calorie Recipes",
                description: "Protein-rich meals to keep you full and energized.",
                image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
                category: "Recipes",
                youtubeVideo: "https://www.youtube.com/watch?v=7iBNTmkEr8M",
                recipes: "Egg muffins, grilled salmon, turkey chili, cottage cheese bowls."
              },
              {
                name: "Meal Prep for 1500 Calorie Diet",
                description: "Batch cooking and prep strategies for the week.",
                image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?q=80&w=1000",
                category: "Guide",
                youtubeVideo: "https://www.youtube.com/watch?v=9meKKZLQ7oY",
                tips: "Cook grains in bulk, portion proteins, pre-chop veggies, use containers."
              }
            ]
          },
          {
            name: "Intermittent Fasting Plans",
            description: "Meal plans and strategies for 16:8, 5:2, and alternate day fasting.",
            image: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?q=80&w=1000",
            products: [
              {
                name: "16:8 IF Meal Plan",
                description: "Meals and snacks for an 8-hour eating window.",
                image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?q=80&w=1000",
                category: "Meal Plan",
                youtubeVideo: "https://www.youtube.com/watch?v=7nJgHBbEgsE",
                mealPlan: "12pm: protein smoothie, 3pm: chicken salad, 7pm: salmon & quinoa, snacks: nuts, fruit."
              },
              {
                name: "5:2 Fasting Plan",
                description: "Two low-calorie days, five normal days per week.",
                image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?q=80&w=1000",
                category: "Guide",
                youtubeVideo: "https://www.youtube.com/watch?v=Q9-_TH3qY8Y",
                tips: "Low-cal days: soups, salads, lean protein; normal days: balanced meals."
              },
              {
                name: "IF Success Tips",
                description: "How to stay full, energized, and consistent with fasting.",
                image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?q=80&w=1000",
                category: "Guide",
                youtubeVideo: "https://www.youtube.com/watch?v=E7J4lmHj7S8",
                tips: "Hydrate, eat fiber, break fast with protein, avoid sugar spikes."
              }
            ]
          }
        ]
      },
      {
        name: "Muscle Gain & Athletic Diets",
        description: "Meal plans and recipes for muscle building, sports, and high-energy needs.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000",
        children: [
          {
            name: "2500 Calorie Muscle Gain Plan",
            description: "A full week of high-protein, high-carb meals for muscle growth.",
            image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?q=80&w=1000",
            products: [
              {
                name: "7-Day Muscle Gain Menu",
                description: "Breakfast, lunch, dinner, snacks, and shakes for muscle gain.",
                image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
                category: "Meal Plan",
                youtubeVideo: "https://www.youtube.com/watch?v=tS6dp8H-JyM",
                nutritionInfo: "2500 kcal/day, 50% carbs, 25% protein, 25% fat",
                mealPlan: "Oats & eggs, chicken & rice, beef stir-fry, protein bars, fruit, nuts."
              },
              {
                name: "High-Calorie Smoothie Recipes",
                description: "Delicious shakes for extra calories and nutrients.",
                image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?q=80&w=1000",
                category: "Recipes",
                youtubeVideo: "https://www.youtube.com/watch?v=zu98FT_D9pE",
                recipes: "Banana PB smoothie, berry oat shake, chocolate almond shake."
              },
              {
                name: "Meal Prep for Muscle Gain",
                description: "How to prep and portion big meals for the week.",
                image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?q=80&w=1000",
                category: "Guide",
                youtubeVideo: "https://www.youtube.com/watch?v=9meKKZLQ7oY",
                tips: "Cook proteins in bulk, use rice cooker, prep veggies, store in large containers."
              }
            ]
          },
          {
            name: "Athlete Performance Diets",
            description: "Meal plans for endurance, strength, and team sports athletes.",
            image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000",
            products: [
              {
                name: "Endurance Athlete Plan",
                description: "Carb-focused plan for runners, cyclists, and swimmers.",
                image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
                category: "Meal Plan",
                youtubeVideo: "https://www.youtube.com/watch?v=0FsK7GaUM5Q",
                mealPlan: "Oatmeal, pasta, sweet potatoes, lean meats, fruit, sports drinks."
              },
              {
                name: "Strength Athlete Plan",
                description: "Protein and calorie-dense plan for powerlifters and bodybuilders.",
                image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
                category: "Meal Plan",
                youtubeVideo: "https://www.youtube.com/watch?v=bY_0CgBR2MY",
                mealPlan: "Eggs, steak, rice, potatoes, protein shakes, nut butters."
              },
              {
                name: "Game Day Nutrition Guide",
                description: "What to eat before, during, and after competition.",
                image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000",
                category: "Guide",
                youtubeVideo: "https://www.youtube.com/watch?v=szqPAPKE5tQ",
                tips: "Pre: carbs & protein, During: hydration & quick carbs, Post: protein & electrolytes."
              }
            ]
          }
        ]
      },
      {
        name: "Plant-Based & Mediterranean Diets",
        description: "Healthy, evidence-based plans for plant-based, vegetarian, and Mediterranean eating.",
        image: "https://images.unsplash.com/photo-1516901775525-fca05873be32?q=80&w=1000",
        children: [
          {
            name: "Vegan Nutrition Plan",
            description: "A week of balanced, protein-rich vegan meals.",
            image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000",
            products: [
              {
                name: "7-Day Vegan Menu",
                description: "Breakfast, lunch, dinner, and snacks for plant-based eaters.",
                image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000",
                category: "Meal Plan",
                youtubeVideo: "https://www.youtube.com/watch?v=lwCRZneD3Vw",
                mealPlan: "Tofu scramble, lentil soup, chickpea salad, veggie stir-fry, fruit, nuts."
              },
              {
                name: "High-Protein Vegan Recipes",
                description: "Delicious vegan meals with extra protein.",
                image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000",
                category: "Recipes",
                youtubeVideo: "https://www.youtube.com/watch?v=gC3L8TpNBQk",
                recipes: "Tempeh tacos, seitan stir-fry, quinoa bowls, protein smoothies."
              },
              {
                name: "Vegan Grocery List",
                description: "Everything you need for a week of plant-based eating.",
                image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?q=80&w=1000",
                category: "Guide",
                youtubeVideo: "https://www.youtube.com/watch?v=ykVXEwu9LnI",
                tips: "Buy beans, lentils, tofu, whole grains, nuts, seeds, lots of veggies."
              }
            ]
          },
          {
            name: "Mediterranean Diet Plan",
            description: "A heart-healthy, anti-inflammatory eating pattern.",
            image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
            products: [
              {
                name: "14-Day Mediterranean Menu",
                description: "Two weeks of Mediterranean-inspired meals.",
                image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
                category: "Meal Plan",
                youtubeVideo: "https://www.youtube.com/watch?v=E9g-rP1PoFM",
                mealPlan: "Greek salad, grilled fish, olive oil, whole grains, nuts, fruit, legumes."
              },
              {
                name: "Mediterranean Snack & Dessert Ideas",
                description: "Healthy snacks and desserts from the Mediterranean region.",
                image: "https://images.unsplash.com/photo-1516901775525-fca05873be32?q=80&w=1000",
                category: "Recipes",
                youtubeVideo: "https://www.youtube.com/watch?v=_JCc4Q-2bZk",
                recipes: "Hummus, baba ganoush, fruit with yogurt, nut bars."
              },
              {
                name: "Mediterranean Shopping List",
                description: "Staples for a Mediterranean kitchen.",
                image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?q=80&w=1000",
                category: "Guide",
                youtubeVideo: "https://www.youtube.com/watch?v=ykVXEwu9LnI",
                tips: "Buy olive oil, fish, whole grains, legumes, nuts, fresh produce."
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

  console.log('Starting to populate expanded diet plan collections...');

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
        let enhancedDescription = prod.description;
        if (prod.nutritionInfo) enhancedDescription += ` Nutrition: ${prod.nutritionInfo}`;
        if (prod.mealPlan) enhancedDescription += ` Meal Plan: ${prod.mealPlan}`;
        if (prod.recipes) enhancedDescription += ` Recipes: ${prod.recipes}`;
        if (prod.tips) enhancedDescription += ` Tips: ${prod.tips}`;
        if (prod.mealStructure) enhancedDescription += ` Meal Structure: ${prod.mealStructure}`;
        if (prod.cookingTips) enhancedDescription += ` Cooking Tips: ${prod.cookingTips}`;
        if (prod.snackIdeas) enhancedDescription += ` Snack Ideas: ${prod.snackIdeas}`;
        if (prod.timing) enhancedDescription += ` Timing: ${prod.timing}`;
        if (prod.macroRatios) enhancedDescription += ` Macro Ratios: ${prod.macroRatios}`;
        if (prod.guidelines) enhancedDescription += ` Guidelines: ${prod.guidelines}`;
        if (prod.nutritionFocus) enhancedDescription += ` Nutrition Focus: ${prod.nutritionFocus}`;
        if (prod.proteinSources) enhancedDescription += ` Protein Sources: ${prod.proteinSources}`;
        if (prod.keyComponents) enhancedDescription += ` Key Components: ${prod.keyComponents}`;
        if (prod.requirements) enhancedDescription += ` Requirements: ${prod.requirements}`;
        if (prod.focus) enhancedDescription += ` Focus: ${prod.focus}`;
        if (prod.principles) enhancedDescription += ` Principles: ${prod.principles}`;
        const prodDoc = new Product({
          name: prod.name,
          description: enhancedDescription,
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

  console.log('Expanded diet plan collections populated successfully!');
  process.exit();
};

run().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
