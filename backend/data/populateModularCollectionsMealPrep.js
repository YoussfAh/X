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
        "name": "Meal Prep Essentials",
        "description": "Comprehensive guide to efficient and effective meal preparation for a healthier lifestyle.",
        "image": "https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=1000",
        "children": [
          {
            "name": "Batch Cooking Basics",
            "description": "Learn the fundamentals of batch cooking to save time and maintain a healthy diet.",
            "image": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1000",
            "products": [
              {
                "name": "Protein Batch Cooking",
                "description": "Methods for preparing multiple servings of protein sources for the week.",
                "image": "https://images.unsplash.com/photo-1607103058027-4c5ff5db8c4f?q=80&w=1000",
                "category": "Meal Prep",
                "youtubeVideo": "https://www.youtube.com/watch?v=TCekwiL2cHY",
                "nutritionInfo": "High protein, customizable macros based on protein choices."
              },
              {
                "name": "Grain & Carb Preparation",
                "description": "Techniques for cooking and storing rice, quinoa, and other healthy carbohydrates.",
                "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=1000",
                "category": "Meal Prep",
                "youtubeVideo": "https://www.youtube.com/watch?v=45z7aYzTA4w",
                "nutritionInfo": "Complex carbohydrates, fiber-rich options, portion control guidance."
              },
              {
                "name": "Vegetable Prepping",
                "description": "Methods for washing, chopping, and storing vegetables to maintain freshness and nutrition.",
                "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1000",
                "category": "Meal Prep",
                "youtubeVideo": "https://www.youtube.com/watch?v=sLX2CaAglCc",
                "nutritionInfo": "High fiber, micronutrient-rich, low calorie."
              },
              {
                "name": "Meal Prep Containers",
                "description": "Guide to selecting and using the right containers for meal storage and portion control.",
                "image": "https://images.unsplash.com/photo-1531089073319-17596b946d42?q=80&w=1000",
                "category": "Meal Prep",
                "youtubeVideo": "https://www.youtube.com/watch?v=RB10lqDVkV0",
                "storageInfo": "BPA-free, microwave/freezer safe options, compartmentalized containers."
              }
            ]
          },
          {
            "name": "Weekly Meal Planning",
            "description": "Strategies and templates for effective weekly meal planning.",
            "image": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=1000",
            "products": [
              {
                "name": "Grocery Shopping Strategy",
                "description": "Efficient and budget-friendly grocery shopping plans.",
                "image": "https://images.unsplash.com/photo-1579113800032-c38bd7635818?q=80&w=1000",
                "category": "Meal Planning",
                "youtubeVideo": "https://www.youtube.com/watch?v=ykVXEwu9LnI",
                "tips": "Create organized shopping lists, shop the perimeter first, buy seasonal produce."
              },
              {
                "name": "Meal Planning Templates",
                "description": "Downloadable templates and digital tools for streamlined meal planning.",
                "image": "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=1000",
                "category": "Meal Planning",
                "youtubeVideo": "https://www.youtube.com/watch?v=i1aQy05BT1Y",
                "resources": "Printable weekly planner, digital meal planning apps, recipe organization."
              },
              {
                "name": "Budget-Friendly Meal Plans",
                "description": "Strategies for eating healthy while keeping costs down.",
                "image": "https://images.unsplash.com/photo-1551504734-5ee1c4a3479b?q=80&w=1000",
                "category": "Meal Planning",
                "youtubeVideo": "https://www.youtube.com/watch?v=DCwchSaQU_A",
                "savingTips": "Bulk buying, seasonal shopping, plant-based protein alternatives, reducing food waste."
              },
              {
                "name": "Time-Saving Meal Prep Day",
                "description": "Structured approach to a weekly meal prep session for maximum efficiency.",
                "image": "https://images.unsplash.com/photo-1495546968767-f0573cca821e?q=80&w=1000",
                "category": "Meal Planning",
                "youtubeVideo": "https://www.youtube.com/watch?v=9meKKZLQ7oY",
                "workflow": "Pre-planning, batch cooking, multi-tasking, efficient cleanup strategies."
              }
            ]
          },
          {
            "name": "Meal Prep Recipes",
            "description": "Collection of recipes specifically designed for meal prepping.",
            "image": "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000",
            "products": [
              {
                "name": "High-Protein Lunch Bowls",
                "description": "Balanced bowls featuring lean protein, complex carbs, and vegetables.",
                "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=z93CvSVjuJo",
                "nutritionInfo": "350-500 calories, 25-30g protein, 40-50g carbs, 10-15g fat per serving."
              },
              {
                "name": "Overnight Oats Variations",
                "description": "Make-ahead breakfast options with different flavor combinations.",
                "image": "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=ecOlbSZ8Lbc",
                "nutritionInfo": "300-400 calories, 10-15g protein, 50-60g carbs, 5-10g fat per serving."
              },
              {
                "name": "Sheet Pan Dinners",
                "description": "One-pan meals that are easy to prepare and portion for the week.",
                "image": "https://images.unsplash.com/photo-1564834724105-918b73f56ce5?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=JcR9RQuUxWw",
                "nutritionInfo": "400-600 calories, 30-40g protein, 20-30g carbs, 15-20g fat per serving."
              },
              {
                "name": "Healthy Snack Prep",
                "description": "Prepared snacks to prevent unhealthy choices during busy days.",
                "image": "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=1000",
                "category": "Recipes",
                "youtubeVideo": "https://www.youtube.com/watch?v=Gl9DI9gsWsg",
                "nutritionInfo": "100-200 calories per serving, balanced macros, portion-controlled."
              }
            ]
          }
        ]
      },
      {
        "name": "Diet Planning",
        "description": "Evidence-based diet approaches for various health and fitness goals.",
        "image": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000",
        "children": [
          {
            "name": "Macronutrient-Focused Plans",
            "description": "Diet plans based on specific macronutrient ratios for different goals.",
            "image": "https://images.unsplash.com/photo-1494390248081-4e521a5940db?q=80&w=1000",
            "products": [
              {
                "name": "High-Protein Diet",
                "description": "Meal plans and guidelines for protein-focused nutrition.",
                "image": "https://images.unsplash.com/photo-1432139509613-5c4255815697?q=80&w=1000",
                "category": "Diet",
                "youtubeVideo": "https://www.youtube.com/watch?v=hJNF4_sIhBE",
                "macroRatio": "30-35% protein, 30-35% carbs, 25-30% fat"
              },
              {
                "name": "Low-Carb Approach",
                "description": "Guidelines and meal ideas for reduced carbohydrate intake.",
                "image": "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000",
                "category": "Diet",
                "youtubeVideo": "https://www.youtube.com/watch?v=4XeZFXBKZlw",
                "macroRatio": "20-25% protein, 5-20% carbs, 60-75% fat"
              },
              {
                "name": "Balanced Macros",
                "description": "Flexible dieting approach focusing on balanced macronutrient intake.",
                "image": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?q=80&w=1000",
                "category": "Diet",
                "youtubeVideo": "https://www.youtube.com/watch?v=aT0_aGPB6z8",
                "macroRatio": "25-30% protein, 40-50% carbs, 20-30% fat"
              },
              {
                "name": "Plant-Based Protein Sources",
                "description": "Guide to meeting protein needs on plant-based or vegetarian diets.",
                "image": "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?q=80&w=1000",
                "category": "Diet",
                "youtubeVideo": "https://www.youtube.com/watch?v=Nv3ztlJ0_rA",
                "proteinSources": "Legumes, tofu, tempeh, seitan, quinoa, nutritional yeast, plant protein powders."
              }
            ]
          },
          {
            "name": "Goal-Specific Nutrition",
            "description": "Tailored nutrition approaches for specific fitness and health goals.",
            "image": "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=1000",
            "products": [
              {
                "name": "Weight Loss Nutrition",
                "description": "Sustainable approaches to creating caloric deficit while maintaining nutrition.",
                "image": "https://images.unsplash.com/photo-1574484284002-952d92456975?q=80&w=1000",
                "category": "Diet",
                "youtubeVideo": "https://www.youtube.com/watch?v=EjQzhFbJ2pA",
                "strategy": "Moderate caloric deficit (300-500 calories), high protein, fiber focus, adequate hydration."
              },
              {
                "name": "Muscle Building Nutrition",
                "description": "Nutritional strategies to support muscle growth and recovery.",
                "image": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000",
                "category": "Diet",
                "youtubeVideo": "https://www.youtube.com/watch?v=bY_0CgBR2MY",
                "strategy": "Caloric surplus (300-500 calories), high protein (1.6-2.2g per kg body weight), nutrient timing."
              },
              {
                "name": "Athletic Performance Fueling",
                "description": "Nutrition strategies for optimal energy, performance and recovery.",
                "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000",
                "category": "Diet",
                "youtubeVideo": "https://www.youtube.com/watch?v=0rBWJYJgvG8",
                "strategy": "Periodized nutrition, carb timing, pre/during/post workout nutrition, hydration strategies."
              },
              {
                "name": "Maintenance & Lifestyle Nutrition",
                "description": "Sustainable eating patterns for long-term health and weight maintenance.",
                "image": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1000",
                "category": "Diet",
                "youtubeVideo": "https://www.youtube.com/watch?v=j14LrJ-mFtk",
                "strategy": "Balanced calories, 80/20 principle, mindful eating, dietary diversity, habit formation."
              }
            ]
          },
          {
            "name": "Diet Approaches Comparison",
            "description": "Breakdown of popular diet approaches with evidence-based assessment.",
            "image": "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?q=80&w=1000",
            "products": [
              {
                "name": "Intermittent Fasting Guide",
                "description": "Overview of different IF protocols, benefits, and implementation strategies.",
                "image": "https://images.unsplash.com/photo-1545397045-6bbcbc9b7c20?q=80&w=1000",
                "category": "Diet",
                "youtubeVideo": "https://www.youtube.com/watch?v=7nJgHBbEgsE",
                "protocols": "16/8 method, 5:2 approach, Eat-Stop-Eat, alternate day fasting, circadian rhythm fasting."
              },
              {
                "name": "Mediterranean Diet Principles",
                "description": "Core principles and health benefits of the Mediterranean eating pattern.",
                "image": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000",
                "category": "Diet",
                "youtubeVideo": "https://www.youtube.com/watch?v=_JCc4Q-2bZk",
                "keyComponents": "Olive oil, fish, legumes, nuts, whole grains, vegetables, fruits, moderate wine consumption."
              },
              {
                "name": "Plant-Based Diet Approach",
                "description": "Guidelines for implementing whole-food plant-based eating patterns.",
                "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000",
                "category": "Diet",
                "youtubeVideo": "https://www.youtube.com/watch?v=E7J4lmHj7S8",
                "keyComponents": "Whole grains, legumes, vegetables, fruits, nuts, seeds, minimal processed foods."
              },
              {
                "name": "Ketogenic Diet Essentials",
                "description": "Core principles, benefits, and considerations for ketogenic eating.",
                "image": "https://images.unsplash.com/photo-1525498128493-380d1990a112?q=80&w=1000",
                "category": "Diet",
                "youtubeVideo": "https://www.youtube.com/watch?v=Q9-_TH3qY8Y",
                "macroRatio": "5-10% carbs, 15-25% protein, 70-80% fat, ketosis monitoring, electrolyte management."
              }
            ]
          }
        ]
      },
      {
        "name": "Healthy Food Guide",
        "description": "Comprehensive resource on nutritious foods and how to incorporate them into your diet.",
        "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000",
        "children": [
          {
            "name": "Nutrient-Dense Foods",
            "description": "Guide to foods with high nutritional value relative to calories.",
            "image": "https://images.unsplash.com/photo-1533321942807-08e4008b2025?q=80&w=1000",
            "products": [
              {
                "name": "Superfood Guide",
                "description": "Evidence-based breakdown of foods with exceptional nutritional profiles.",
                "image": "https://images.unsplash.com/photo-1490885578174-acda8905c2c6?q=80&w=1000",
                "category": "Nutrition",
                "youtubeVideo": "https://www.youtube.com/watch?v=SYmvj0JKT0E",
                "topChoices": "Berries, fatty fish, leafy greens, nuts, fermented foods, cruciferous vegetables, eggs."
              },
              {
                "name": "Protein Quality Comparison",
                "description": "Guide to protein sources and their complete amino acid profiles.",
                "image": "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?q=80&w=1000",
                "category": "Nutrition",
                "youtubeVideo": "https://www.youtube.com/watch?v=hJNF4_sIhBE",
                "comparison": "Animal proteins, plant proteins, protein combining, bioavailability, PDCAAS ratings."
              },
              {
                "name": "Healthy Fat Sources",
                "description": "Guide to incorporating beneficial fats in your diet.",
                "image": "https://images.unsplash.com/photo-1519051251346-a305969fcc0b?q=80&w=1000",
                "category": "Nutrition",
                "youtubeVideo": "https://www.youtube.com/watch?v=pZ_u5c1VJ98",
                "fatTypes": "Monounsaturated, omega-3 polyunsaturated, MCTs, proper omega-6:3 ratio, fat-soluble vitamins."
              },
              {
                "name": "Complex Carbohydrates",
                "description": "Guide to high-quality carbohydrate sources for sustained energy.",
                "image": "https://images.unsplash.com/photo-1556191039-3c714e132927?q=80&w=1000",
                "category": "Nutrition",
                "youtubeVideo": "https://www.youtube.com/watch?v=OjKw9MG7rtU",
                "sources": "Whole grains, starchy vegetables, legumes, fiber-rich foods, low glycemic options."
              }
            ]
          },
          {
            "name": "Mindful Eating Practices",
            "description": "Techniques to develop a healthier relationship with food.",
            "image": "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=1000",
            "products": [
              {
                "name": "Hunger & Fullness Awareness",
                "description": "Tools to recognize and respond appropriately to body signals.",
                "image": "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?q=80&w=1000",
                "category": "Nutrition",
                "youtubeVideo": "https://www.youtube.com/watch?v=vAMYIx1_VEw",
                "techniques": "Hunger scale, mindful pausing, fullness check-ins, eating without distractions."
              },
              {
                "name": "Portion Control Strategies",
                "description": "Practical approaches to managing portion sizes without measuring everything.",
                "image": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1000",
                "category": "Nutrition",
                "youtubeVideo": "https://www.youtube.com/watch?v=mgvliYSYFkU",
                "methods": "Hand portion guide, plate method, visual benchmarks, proper plating strategies."
              },
              {
                "name": "Food & Mood Connection",
                "description": "Understanding the relationship between food choices and mental wellbeing.",
                "image": "https://images.unsplash.com/photo-1523929506003-b3d98f61949c?q=80&w=1000",
                "category": "Nutrition",
                "youtubeVideo": "https://www.youtube.com/watch?v=CSHO9VdVRfg",
                "insights": "Gut-brain connection, blood sugar stability, anti-inflammatory eating, mood-boosting nutrients."
              },
              {
                "name": "Intuitive Eating Principles",
                "description": "Framework for developing a healthier relationship with food and body.",
                "image": "https://images.unsplash.com/photo-1478144592103-25e218a04891?q=80&w=1000",
                "category": "Nutrition",
                "youtubeVideo": "https://www.youtube.com/watch?v=WTq1iQCN0Ww",
                "principles": "Rejecting diet mentality, honoring hunger, making peace with food, challenging food rules."
              }
            ]
          },
          {
            "name": "Specialty Diets",
            "description": "Guidance for those following specialized dietary approaches.",
            "image": "https://images.unsplash.com/photo-1516901775525-fca05873be32?q=80&w=1000",
            "products": [
              {
                "name": "Plant-Based Nutrition Guide",
                "description": "Comprehensive guidance for balanced vegan and vegetarian eating.",
                "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000",
                "category": "Nutrition",
                "youtubeVideo": "https://www.youtube.com/watch?v=K36mIVJwK1s",
                "keyNutrients": "Vitamin B12, omega-3s, iron, zinc, calcium, protein combining strategies."
              },
              {
                "name": "Gluten-Free Essentials",
                "description": "Guidance for nutritious eating on a gluten-free diet.",
                "image": "https://images.unsplash.com/photo-1548183863-1819044576a1?q=80&w=1000",
                "category": "Nutrition",
                "youtubeVideo": "https://www.youtube.com/watch?v=PA5FmUp2_pQ",
                "alternatives": "Whole food GF grains, cross-contamination awareness, nutritional adequacy concerns."
              },
              {
                "name": "Anti-Inflammatory Food Guide",
                "description": "Foods and eating patterns to reduce inflammation in the body.",
                "image": "https://images.unsplash.com/photo-1510431198580-7727c9fa1e3a?q=80&w=1000",
                "category": "Nutrition",
                "youtubeVideo": "https://www.youtube.com/watch?v=ADlRNBPhv-s",
                "focus": "Omega-3 fats, antioxidant-rich foods, polyphenols, limiting inflammatory triggers."
              },
              {
                "name": "Low-FODMAP Approach",
                "description": "Guidance for those following this specialized gut health protocol.",
                "image": "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?q=80&w=1000",
                "category": "Nutrition",
                "youtubeVideo": "https://www.youtube.com/watch?v=Z_1Hzl9o5ic",
                "implementation": "Elimination phase, reintroduction protocol, food lists, balanced nutrition maintenance."
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

  console.log('Starting to populate meal prep, diet planning, and healthy food collections...');

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
          enhancedDescription += ` Nutrition: ${prod.nutritionInfo}`;
        }
        if (prod.macroRatio) {
          enhancedDescription += ` Recommended macro ratio: ${prod.macroRatio}.`;
        }
        if (prod.strategy) {
          enhancedDescription += ` Strategy: ${prod.strategy}`;
        }
        if (prod.keyComponents) {
          enhancedDescription += ` Key components: ${prod.keyComponents}`;
        }
        if (prod.protocols) {
          enhancedDescription += ` Protocols include: ${prod.protocols}`;
        }
        if (prod.topChoices) {
          enhancedDescription += ` Top choices: ${prod.topChoices}`;
        }
        if (prod.techniques) {
          enhancedDescription += ` Techniques: ${prod.techniques}`;
        }
        if (prod.principles) {
          enhancedDescription += ` Principles: ${prod.principles}`;
        }
        if (prod.keyNutrients) {
          enhancedDescription += ` Key nutrients to focus on: ${prod.keyNutrients}`;
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

  console.log('Meal prep, diet planning, and healthy food collections populated successfully!');
  process.exit();
};

run().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});