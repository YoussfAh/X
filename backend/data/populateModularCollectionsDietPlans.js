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
        "name": "Weight Loss Meal Plans",
        "description": "Scientifically-designed meal plans for sustainable weight loss with balanced nutrition.",
        "image": "https://images.unsplash.com/photo-1511690078903-71de64ac006c?q=80&w=1000",
        "children": [
          {
            "name": "1200-1500 Calorie Plans",
            "description": "Carefully structured meal plans for gradual weight loss, suitable for smaller individuals or those with lower activity levels.",
            "image": "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?q=80&w=1000",
            "products": [
              {
                "name": "7-Day Low-Calorie Starter Plan",
                "description": "Week-long meal plan with grocery list and prep instructions.",
                "image": "https://images.unsplash.com/photo-1466637574441-749b8f19452f?q=80&w=1000",
                "category": "Meal Plan",
                "youtubeVideo": "https://www.youtube.com/watch?v=8YJJHbIZGmI",
                "nutritionInfo": "1200-1500 calories daily, 40% carbs, 30% protein, 30% fat",
                "mealPlan": "Breakfast: 300-350 cal, Lunch: 350-400 cal, Dinner: 400-450 cal, Snacks: 150-300 cal"
              },
              {
                "name": "Quick & Easy Low-Cal Recipes",
                "description": "15-30 minute recipes perfect for busy lifestyles.",
                "image": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=VA3GFCfh3p0",
                "cookingTips": "Meal prep strategies, time-saving techniques, portion control guides"
              },
              {
                "name": "Low-Calorie Breakfast Ideas",
                "description": "Filling breakfast options under 300 calories.",
                "image": "https://images.unsplash.com/photo-1494597564530-871f2b93ac55?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=M5KW5Mt8B5A",
                "recipes": "Protein oats, egg white frittatas, Greek yogurt parfaits, smoothie bowls"
              },
              {
                "name": "Satisfying Low-Cal Lunches",
                "description": "Lunch recipes that keep you full without excess calories.",
                "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=vqZs-5rZUVA",
                "recipes": "Mason jar salads, protein wraps, Buddha bowls, veggie-packed soups"
              },
              {
                "name": "Light & Filling Dinners",
                "description": "Evening meals under 450 calories.",
                "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=7JgqcFl0Geg",
                "recipes": "Sheet pan meals, stir-fries, zoodle dishes, lean protein with roasted vegetables"
              },
              {
                "name": "Smart Snacking Guide",
                "description": "Low-calorie snacks to manage hunger between meals.",
                "image": "https://images.unsplash.com/photo-1511690078903-71de64ac006c?q=80&w=1000",
                "category": "Guide",
                "youtubeVideo": "https://www.youtube.com/watch?v=GOvxzXuV9U0",
                "snackIdeas": "Greek yogurt with berries, apple with almond butter, veggie sticks with hummus"
              }
            ]
          },
          {
            "name": "1500-1800 Calorie Plans",
            "description": "Balanced meal plans for moderate weight loss, suitable for active individuals or those with higher caloric needs.",
            "image": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000",
            "products": [
              {
                "name": "14-Day Balanced Weight Loss Plan",
                "description": "Two-week meal plan with shopping lists and prep guides.",
                "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
                "category": "Meal Plan",
                "youtubeVideo": "https://www.youtube.com/watch?v=wtH5zR6EQMI",
                "nutritionInfo": "1500-1800 calories daily, 45% carbs, 30% protein, 25% fat",
                "mealStructure": "3 main meals + 2-3 snacks, balanced macronutrients"
              },
              {
                "name": "Protein-Rich Breakfast Options",
                "description": "High-protein breakfast recipes for sustained energy.",
                "image": "https://images.unsplash.com/photo-1494597564530-871f2b93ac55?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=7iBNTmkEr8M",
                "recipes": "Protein pancakes, egg scrambles, protein smoothie bowls, overnight oats"
              },
              {
                "name": "Power Lunch Recipes",
                "description": "Energizing lunch options for busy days.",
                "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=DCwchSaQU_A",
                "recipes": "Quinoa bowls, lean protein salads, whole grain wraps, power bowls"
              },
              {
                "name": "Family-Friendly Dinners",
                "description": "Healthy dinner recipes the whole family will enjoy.",
                "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=u1w7zqbBiXM",
                "recipes": "Turkey meatballs, fish tacos, chicken stir-fry, veggie-loaded pasta"
              },
              {
                "name": "Pre/Post Workout Snacks",
                "description": "Optimized snacks for exercise performance and recovery.",
                "image": "https://images.unsplash.com/photo-1511690078903-71de64ac006c?q=80&w=1000",
                "category": "Guide",
                "youtubeVideo": "https://www.youtube.com/watch?v=0gZL83SR5gk",
                "timing": "Pre-workout: 1-2 hours before, Post-workout: within 30 minutes"
              }
            ]
          },
          {
            "name": "1800-2200 Calorie Plans",
            "description": "Higher calorie plans for active individuals or those with higher metabolic needs.",
            "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
            "products": [
              {
                "name": "Active Lifestyle Meal Plan",
                "description": "High-energy meal plan for active individuals.",
                "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
                "category": "Meal Plan",
                "youtubeVideo": "https://www.youtube.com/watch?v=k_yBU0EoAoE",
                "nutritionInfo": "1800-2200 calories, 50% carbs, 25% protein, 25% fat",
                "mealTiming": "5-6 meals per day, timed around workouts"
              },
              {
                "name": "Performance Breakfast Guide",
                "description": "Energy-packed breakfast options.",
                "image": "https://images.unsplash.com/photo-1494597564530-871f2b93ac55?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=zu98FT_D9pE",
                "recipes": "Power oatmeal, protein waffles, breakfast burritos, energy smoothies"
              }
            ]
          }
        ]
      },
      {
        "name": "Specialized Diet Plans",
        "description": "Comprehensive meal plans for specific dietary needs and preferences.",
        "image": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000",
        "children": [
          {
            "name": "Ketogenic Diet Plans",
            "description": "Low-carb, high-fat meal plans for ketosis.",
            "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
            "products": [
              {
                "name": "Keto Starter Guide",
                "description": "Complete guide to starting a ketogenic diet.",
                "image": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000",
                "category": "Guide",
                "youtubeVideo": "https://www.youtube.com/watch?v=RuOvn4UqznU",
                "macroRatios": "70-80% fat, 20-25% protein, 5-10% carbs",
                "guidelines": "Net carbs tracking, ketosis monitoring, electrolyte management"
              },
              {
                "name": "7-Day Keto Meal Plan",
                "description": "Week-long keto-compliant meal plan.",
                "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
                "category": "Meal Plan",
                "youtubeVideo": "https://www.youtube.com/watch?v=Q9-_TH3qY8Y",
                "mealStructure": "3 main meals, 1-2 keto snacks, focus on healthy fats"
              },
              {
                "name": "Keto Breakfast Recipes",
                "description": "Low-carb breakfast options.",
                "image": "https://images.unsplash.com/photo-1494597564530-871f2b93ac55?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=e0I_6-RTUKU",
                "recipes": "Egg muffins, keto pancakes, breakfast casseroles, smoothie bowls"
              },
              {
                "name": "Keto Lunch & Dinner Ideas",
                "description": "Main meal recipes for keto diet.",
                "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=RsFwPTGp3_g",
                "recipes": "Zucchini pasta, cauliflower rice dishes, keto bowls, protein-based meals"
              }
            ]
          },
          {
            "name": "Plant-Based Plans",
            "description": "Nutritionally complete vegan and vegetarian meal plans.",
            "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000",
            "products": [
              {
                "name": "Vegan Starter Guide",
                "description": "Complete guide to plant-based nutrition.",
                "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000",
                "category": "Guide",
                "youtubeVideo": "https://www.youtube.com/watch?v=E7J4lmHj7S8",
                "nutritionFocus": "Complete proteins, B12, iron, omega-3s, calcium sources"
              },
              {
                "name": "High-Protein Vegan Plan",
                "description": "Plant-based meal plan emphasizing protein.",
                "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
                "category": "Meal Plan",
                "youtubeVideo": "https://www.youtube.com/watch?v=lwCRZneD3Vw",
                "proteinSources": "Legumes, tofu, tempeh, seitan, quinoa, plant-based protein powders"
              },
              {
                "name": "Plant-Based Breakfast Ideas",
                "description": "Protein-rich vegan breakfast recipes.",
                "image": "https://images.unsplash.com/photo-1494597564530-871f2b93ac55?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=gC3L8TpNBQk",
                "recipes": "Tofu scramble, chickpea pancakes, protein smoothies, overnight oats"
              }
            ]
          },
          {
            "name": "Mediterranean Diet Plans",
            "description": "Heart-healthy Mediterranean-style meal plans.",
            "image": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000",
            "products": [
              {
                "name": "Mediterranean Basics Guide",
                "description": "Principles and guidelines of Mediterranean eating.",
                "image": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000",
                "category": "Guide",
                "youtubeVideo": "https://www.youtube.com/watch?v=_JCc4Q-2bZk",
                "keyComponents": "Olive oil, fish, whole grains, vegetables, fruits, legumes, nuts"
              },
              {
                "name": "14-Day Mediterranean Plan",
                "description": "Two-week Mediterranean meal plan.",
                "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
                "category": "Meal Plan",
                "youtubeVideo": "https://www.youtube.com/watch?v=E9g-rP1PoFM",
                "mealStructure": "Plant-forward meals, fish 2-3 times weekly, limited red meat"
              }
            ]
          }
        ]
      },
      {
        "name": "Athletic Performance Plans",
        "description": "Nutrition plans optimized for different types of athletic performance.",
        "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
        "children": [
          {
            "name": "Strength Training Nutrition",
            "description": "Meal plans for maximum muscle growth and strength gains.",
            "image": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000",
            "products": [
              {
                "name": "Muscle Building Basics",
                "description": "Fundamental nutrition principles for muscle growth.",
                "image": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000",
                "category": "Guide",
                "youtubeVideo": "https://www.youtube.com/watch?v=bY_0CgBR2MY",
                "requirements": "Caloric surplus, high protein intake, nutrient timing, recovery nutrition"
              },
              {
                "name": "3000+ Calorie Meal Plan",
                "description": "High-calorie plan for muscle gain.",
                "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
                "category": "Meal Plan",
                "youtubeVideo": "https://www.youtube.com/watch?v=tS6dp8H-JyM",
                "mealStructure": "6 meals daily, 1g protein per lb bodyweight, emphasis on complex carbs"
              },
              {
                "name": "Pre/Post Workout Nutrition",
                "description": "Optimal nutrition timing for performance.",
                "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
                "category": "Guide",
                "youtubeVideo": "https://www.youtube.com/watch?v=0rBWJYJgvG8",
                "timing": "Pre: Complex carbs + protein, Post: Fast-digesting carbs + protein"
              }
            ]
          },
          {
            "name": "Endurance Sports Nutrition",
            "description": "Nutrition plans for endurance athletes.",
            "image": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000",
            "products": [
              {
                "name": "Endurance Nutrition Guide",
                "description": "Comprehensive guide for endurance athletes.",
                "image": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000",
                "category": "Guide",
                "youtubeVideo": "https://www.youtube.com/watch?v=0FsK7GaUM5Q",
                "focus": "Carb loading, electrolyte balance, hydration strategies, energy gels"
              },
              {
                "name": "Race Day Nutrition Plan",
                "description": "Pre, during, and post-race nutrition strategies.",
                "image": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000",
                "category": "Guide",
                "youtubeVideo": "https://www.youtube.com/watch?v=szqPAPKE5tQ",
                "timing": "Pre-race meals, during-event fueling, recovery nutrition"
              }
            ]
          },
          {
            "name": "Sports Recovery Nutrition",
            "description": "Optimizing nutrition for athletic recovery.",
            "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
            "products": [
              {
                "name": "Recovery Nutrition Basics",
                "description": "Essential principles of post-exercise nutrition.",
                "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
                "category": "Guide",
                "youtubeVideo": "https://www.youtube.com/watch?v=0FsK7GaUM5Q",
                "principles": "Glycogen replenishment, protein synthesis, hydration, inflammation management"
              },
              {
                "name": "Recovery Meal Recipes",
                "description": "Quick and effective post-workout meals.",
                "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=szqPAPKE5tQ",
                "recipes": "Protein smoothies, recovery bowls, protein pancakes, overnight oats"
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

  console.log('Starting to populate comprehensive diet plan collections...');

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
        // Add nutrition-focused details to the description for these items
        let enhancedDescription = prod.description;
        
        // Add specific nutritional details if available
        if (prod.nutritionInfo) {
          enhancedDescription += ` Nutrition Information: ${prod.nutritionInfo}.`;
        }
        if (prod.mealPlan) {
          enhancedDescription += ` Meal Structure: ${prod.mealPlan}.`;
        }
        if (prod.recipes) {
          enhancedDescription += ` Featured Recipes: ${prod.recipes}.`;
        }
        if (prod.cookingTips) {
          enhancedDescription += ` Cooking Tips: ${prod.cookingTips}.`;
        }
        if (prod.snackIdeas) {
          enhancedDescription += ` Recommended Snacks: ${prod.snackIdeas}.`;
        }
        if (prod.mealStructure) {
          enhancedDescription += ` Meal Structure: ${prod.mealStructure}.`;
        }
        if (prod.timing) {
          enhancedDescription += ` Timing Guidelines: ${prod.timing}.`;
        }
        if (prod.macroRatios) {
          enhancedDescription += ` Macro Ratios: ${prod.macroRatios}.`;
        }
        if (prod.guidelines) {
          enhancedDescription += ` Key Guidelines: ${prod.guidelines}.`;
        }
        if (prod.nutritionFocus) {
          enhancedDescription += ` Nutrition Focus: ${prod.nutritionFocus}.`;
        }
        if (prod.proteinSources) {
          enhancedDescription += ` Protein Sources: ${prod.proteinSources}.`;
        }
        if (prod.keyComponents) {
          enhancedDescription += ` Key Components: ${prod.keyComponents}.`;
        }
        if (prod.requirements) {
          enhancedDescription += ` Requirements: ${prod.requirements}.`;
        }
        if (prod.focus) {
          enhancedDescription += ` Focus Areas: ${prod.focus}.`;
        }
        if (prod.principles) {
          enhancedDescription += ` Key Principles: ${prod.principles}.`;
        }
        
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

  console.log('Diet plan collections populated successfully!');
  process.exit();
};

run().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});