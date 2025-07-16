# PRO Fitness App - Database Population Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Overview of Database Structure](#overview-of-database-structure)
4. [Database Population Scripts](#database-population-scripts)
5. [Step-by-Step Guide to Populate the Database](#step-by-step-guide-to-populate-the-database)
6. [Unified Database Population Approach](#unified-database-population-approach)
7. [Customization Examples](#customization-examples)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Usage](#advanced-usage)
10. [FAQ](#faq)

## Introduction

This document provides a comprehensive guide to populating the PRO Fitness App database with workout collections and exercises. The application uses MongoDB as its database and includes several scripts to help you add content to your fitness platform.

Whether you're setting up the application for the first time or refreshing the database with new workout content, this guide will walk you through the entire process with examples that anyone can follow.

## Prerequisites

Before you begin populating the database, ensure you have:

1. Node.js installed (v14.x or higher recommended)
2. MongoDB connection set up (check your `.env` file for the connection string)
3. Basic knowledge of JSON structures
4. Access to the backend folder of the PRO Fitness App

Your `.env` file should contain the following variables:
```
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
```

## Overview of Database Structure

The PRO Fitness App database consists of several key collections:

1. **Users**: App users including regular users and admins
2. **Products**: Individual exercise products with details like name, image, video links
3. **Collections**: Workout collections that organize exercises (e.g., "Power Training", "Endurance Circuit")
   - Contains subcollections for daily workouts (e.g., "Day 1", "Day 2")
4. **Orders**: User purchases (not relevant for this guide)
5. **Workout Entries**: User workout tracking data (not relevant for this guide)

The relationship between these collections is hierarchical:
- A Collection can contain subcollections (parent-child relationship)
- Collections can contain Products (many-to-many relationship via a products array)
- Users can create/own Collections

## Database Population Scripts

The application includes several scripts for populating the database:

1. `createWorkoutCollection.js`: Creates the main workout collections and their day subcollections
2. `populateExercisesWithMedia.js`: Creates exercise products and adds them to the appropriate day subcollections
3. `seeder.js`: A general-purpose script that can populate multiple collections (users, products, collections)
4. `importCollections.js`: Imports collections from a template file
5. `createExerciseProducts.js`: Creates basic exercise products
6. `populateCollections.js`: Populates collections with existing products
7. `populateWorkouts.js`: Populates workout entries for users
8. `addCustomWorkout.js`: Adds a custom workout collection

For this guide, we'll focus primarily on the first two scripts as they are the most commonly used for setting up workout content.

## Step-by-Step Guide to Populate the Database

### Step 1: Set up your environment

1. Navigate to your backend directory:
   ```bash
   cd d:\THE Practice CODE\Section Two\m-king\pro-g\PRO\backend
   ```

2. Install dependencies if you haven't already:
   ```bash
   npm install
   ```

3. Ensure your MongoDB connection is working by testing the connection:
   ```bash
   node config/db.js
   ```
   If configured correctly, you should see a "MongoDB Connected" message.

### Step 2: Understand the Collection Structure Files

The `createWorkoutCollection.js` file defines the main workout collections and their subcollections (days). Here's what you need to modify to customize your workout collections:

```javascript
const workoutCollections = [
  {
    name: 'Collection Name',           // Name of your workout program
    description: 'Collection Description', // Brief description
    image: 'https://example.com/image.jpg', // Image URL
    days: 7,                           // Number of workout days
    dayDescriptions: [                 // Descriptions for each day
      'Day 1 Focus',
      'Day 2 Focus',
      // Add a description for each day
    ]
  },
  // Add more collections as needed
];
```

### Step 3: Understand the Exercise Population Files

The `populateExercisesWithMedia.js` file defines the exercises that will populate your collections. Here's how it's structured:

```javascript
const exercisesByType = {
  'Collection Name': [  // Must match the name in workoutCollections
    {
      name: 'Exercise Name',
      description: 'Exercise description',
      image: 'https://example.com/exercise-image.jpg',
      category: 'Exercise Category', // E.g., 'Chest', 'Back', 'Legs', etc.
      youtubeVideo: 'https://www.youtube.com/watch?v=video-id',
      day: 1  // Which day this exercise belongs to (1-7)
    },
    // More exercises for different days...
  ]
};
```

### Step 4: Modify the Collection Files

1. Open `createWorkoutCollection.js` in your text editor
2. Find the `workoutCollections` array
3. Modify the existing collections or add new ones based on your preferences
4. Save the file

### Step 5: Modify the Exercise Files

1. Open `populateExercisesWithMedia.js` in your text editor
2. Find the `exercisesByType` object
3. For each collection in your `workoutCollections`, add corresponding exercises
   - Make sure to group exercises by day
   - Include all required properties (name, description, image, category, youtubeVideo, day)
4. Save the file

### Step 6: Run the Collection Creation Script

```bash
node createWorkoutCollection.js
```

This will create the main collections and subcollections in your database. You should see output confirming the creation of each collection.

### Step 7: Run the Exercise Population Script

```bash
node populateExercisesWithMedia.js
```

This will create exercise products and add them to the appropriate day subcollections. You should see output confirming the creation of each exercise and its assignment to a day collection.

## Unified Database Population Approach

For a more streamlined approach, the application now supports a unified method for populating the database using a single JSON configuration file and one script. This approach is easier to maintain and customize.

### Understanding the JSON Configuration File

The configuration file (`workoutProgramTemplate.json`) defines the complete hierarchy of collections, subcollections, and exercises in one place. The file has the following structure:

```json
{
  "mainCollections": [
    {
      "name": "Collection Name",
      "description": "Collection Description",
      "image": "https://example.com/image.jpg",
      "isPublic": true,
      "requiresCode": false,
      "days": [
        {
          "name": "Day 1: Focus Area",
          "description": "Day 1 description",
          "image": "https://example.com/day1-image.jpg",
          "exercises": [
            {
              "name": "Exercise Name",
              "description": "Exercise description",
              "image": "https://example.com/exercise-image.jpg",
              "category": "Exercise Category",
              "youtubeVideo": "https://www.youtube.com/watch?v=video-id",
              "muscleGroup": "Target Muscles",
              "equipment": "Required Equipment",
              "difficulty": "Beginner/Intermediate/Advanced",
              "instructions": "Step-by-step instructions",
              "tips": "Form tips and advice",
              "sets": "3",
              "reps": "8-12"
            },
            // More exercises...
          ]
        },
        // More days...
      ]
    },
    // More main collections...
  ]
}
```

### Using the Unified Population Script

The new script (`populateWorkoutDatabase.js`) handles the entire process of creating collections, subcollections, and exercises based on the configuration file.

#### Step 1: Make sure your configuration is ready

You can use the provided template in `workoutProgramTemplate.json` or create your own configuration file following the same structure.

#### Step 2: Run the unified population script

```bash
cd d:\THE Practice CODE\Section Two\m-king\pro-g\PRO\backend
node populateWorkoutDatabase.js
```

#### Script Options

The script accepts the following command-line options:

- `--config=PATH`: Path to a custom configuration file (default: `./data/workoutProgramTemplate.json`)
- `--clear`: Clear existing collections and products before populating
- `--quiet`: Suppress detailed output
- `--help` or `-h`: Display help message

Example with options:
```bash
node populateWorkoutDatabase.js --config=./myconfig.json --clear
```

#### What the Script Does

1. Connects to MongoDB using the configured connection string
2. Loads and validates the configuration file
3. Finds the admin user account
4. Optionally clears existing collections and products
5. Creates each main collection defined in the config
6. Creates day subcollections for each main collection
7. Creates exercise products and adds them to the appropriate day subcollection
8. Provides a summary of created items upon completion

### Creating Custom Workout Programs

To create your own workout program:

1. Copy the `workoutProgramTemplate.json` file to use as a starting point
2. Modify the collection names, descriptions, and images
3. Define the days (subcollections) for each main collection
4. Add exercises for each day with all required properties
5. Run the script with your custom configuration file:
   ```bash
   node populateWorkoutDatabase.js --config=./myWorkoutProgram.json --clear
   ```

### Example Custom Configuration

Here's a simple example of a custom configuration file:

```json
{
  "mainCollections": [
    {
      "name": "Home Workouts",
      "description": "Effective workouts you can do at home with minimal equipment",
      "image": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5",
      "days": [
        {
          "name": "Day 1: Full Body Basics",
          "description": "Foundation exercises targeting all major muscle groups",
          "image": "https://images.unsplash.com/photo-1542766788-a2f65575b8a6",
          "exercises": [
            {
              "name": "Push-Up",
              "description": "A bodyweight exercise that targets the chest, shoulders, and triceps",
              "image": "https://www.inspireusafoundation.org/wp-content/uploads/2022/04/push-up-muscles-worked.jpg",
              "category": "Chest",
              "youtubeVideo": "https://www.youtube.com/watch?v=IODxDxX7oi4",
              "muscleGroup": "Chest, Shoulders, Triceps",
              "equipment": "None",
              "difficulty": "Beginner",
              "instructions": "1. Start in plank position with hands shoulder-width apart\n2. Lower body until chest nearly touches floor\n3. Push back up to starting position",
              "tips": "Keep your body in a straight line from head to heels",
              "sets": "3",
              "reps": "10-15"
            }
            // More exercises...
          ]
        }
        // More days...
      ]
    }
  ]
}
```

## Customization Examples

### Example 1: Creating a Simple 3-Day Beginner Workout

**In `createWorkoutCollection.js`:**
```javascript
const workoutCollections = [
  {
    name: 'Beginner Basics',
    description: 'A simple 3-day routine for fitness beginners',
    image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c',
    days: 3,
    dayDescriptions: [
      'Full Body Introduction',
      'Cardio Foundations',
      'Flexibility & Recovery'
    ]
  }
];
```

**In `populateExercisesWithMedia.js`:**
```javascript
const exercisesByType = {
  'Beginner Basics': [
    // Day 1: Full Body Introduction
    {
      name: 'Bodyweight Squat',
      description: 'A basic squat movement using only your body weight',
      image: 'https://www.inspireusafoundation.org/wp-content/uploads/2022/05/bodyweight-squat.jpg',
      category: 'Legs',
      youtubeVideo: 'https://www.youtube.com/watch?v=YaXPRqUwItQ',
      day: 1
    },
    {
      name: 'Wall Push-Up',
      description: 'An entry-level push-up variation using a wall for support',
      image: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d',
      category: 'Chest',
      youtubeVideo: 'https://www.youtube.com/watch?v=EgU3CbtQTlw',
      day: 1
    },
    {
      name: 'Standing Row with Band',
      description: 'A simple rowing motion using resistance bands',
      image: 'https://www.inspireusafoundation.org/wp-content/uploads/2022/04/resistance-band-row.jpg',
      category: 'Back',
      youtubeVideo: 'https://www.youtube.com/watch?v=xrCE3UCKH8M',
      day: 1
    },
    
    // Day 2: Cardio Foundations
    {
      name: 'Walking Intervals',
      description: 'Alternating between casual walking and brisk walking',
      image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8',
      category: 'Cardio',
      youtubeVideo: 'https://www.youtube.com/watch?v=njeZ29umqVE',
      day: 2
    },
    {
      name: 'Step Ups',
      description: 'Simple step ups onto a platform or step',
      image: 'https://www.inspireusafoundation.org/wp-content/uploads/2022/09/step-up.jpg',
      category: 'Cardio',
      youtubeVideo: 'https://www.youtube.com/watch?v=gCh4bm-lE2c',
      day: 2
    },
    {
      name: 'Arm Circles',
      description: 'Circular movements of the arms to build shoulder endurance',
      image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5',
      category: 'Cardio',
      youtubeVideo: 'https://www.youtube.com/watch?v=140RTNMciH8',
      day: 2
    },
    
    // Day 3: Flexibility & Recovery
    {
      name: 'Standing Hamstring Stretch',
      description: 'Basic stretch for the back of the legs',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
      category: 'Flexibility',
      youtubeVideo: 'https://www.youtube.com/watch?v=FDwpEdxZ4H4',
      day: 3
    },
    {
      name: 'Cat-Cow Stretch',
      description: 'Spinal mobility exercise alternating between arching and rounding the back',
      image: 'https://www.inspireusafoundation.org/wp-content/uploads/2022/10/cat-cow-stretch.jpg',
      category: 'Flexibility',
      youtubeVideo: 'https://www.youtube.com/watch?v=kqnua4rHVVA',
      day: 3
    },
    {
      name: 'Deep Breathing Exercise',
      description: 'Controlled breathing for relaxation and recovery',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
      category: 'Recovery',
      youtubeVideo: 'https://www.youtube.com/watch?v=acUZdGd_3Gk',
      day: 3
    }
  ]
};
```

### Example 2: Creating a 5-Day Advanced Strength Program

**In `createWorkoutCollection.js`:**
```javascript
const workoutCollections = [
  {
    name: 'Advanced Strength',
    description: 'A challenging 5-day split for experienced lifters',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd',
    days: 5,
    dayDescriptions: [
      'Chest & Triceps',
      'Back & Biceps',
      'Rest & Recovery',
      'Shoulders & Abs',
      'Legs'
    ]
  }
];
```

**In `populateExercisesWithMedia.js`:**
```javascript
const exercisesByType = {
  'Advanced Strength': [
    // Day 1: Chest & Triceps
    {
      name: 'Barbell Bench Press',
      description: 'The classic chest-building compound exercise',
      image: 'https://www.inspireusafoundation.org/wp-content/uploads/2022/11/barbell-bench-press-form.jpg',
      category: 'Chest',
      youtubeVideo: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
      day: 1
    },
    // Add more exercises for each day...
  ]
};
```

## Troubleshooting

### Common Issues and Solutions

1. **Error: MongoDB Connection Failed**
   - Check your `.env` file for the correct MongoDB URI
   - Ensure your MongoDB server is running
   - Check network connectivity if using a cloud MongoDB instance

2. **Error: Cannot find module**
   - Run `npm install` to install all dependencies
   - Check that the file path is correct in your commands

3. **Error: Collection already exists**
   - The scripts include checks to avoid duplicates, but if you encounter this:
     - Delete existing collections first by modifying the script to include:
       ```javascript
       await Collection.deleteMany({ name: { $in: ['Collection Name 1', 'Collection Name 2'] } });
       ```
     - Or add a check to skip existing collections (already implemented in newer versions)

4. **Images not showing up in the app**
   - Ensure image URLs are publicly accessible
   - Check for typos in URLs
   - Use https:// URLs rather than http:// for security

5. **Exercises showing in wrong days**
   - Double-check the `day` property for each exercise (should match the day number)
   - Ensure day subcollections were created properly

## Advanced Usage

### Combining Multiple Scripts

You can create a master script that runs multiple population scripts in sequence:

```javascript
// masterPopulate.js
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runPopulationScripts() {
  try {
    console.log('Creating workout collections...');
    await execPromise('node createWorkoutCollection.js');
    
    console.log('Populating exercises with media...');
    await execPromise('node populateExercisesWithMedia.js');
    
    console.log('Database population complete!');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

runPopulationScripts();
```

### Creating Custom Scripts

You can create custom population scripts for specific needs:

1. **Targeted Collection Update**: Update a specific collection without affecting others
2. **Data Cleanup**: Remove unused or duplicate exercises
3. **Bulk Image Update**: Update all image URLs to a new format or source

## FAQ

### Q: How many exercises should I add per day?
**A:** For the best user experience, we recommend 3-5 exercises per day. This provides enough variety without overwhelming users.

### Q: What image dimensions work best?
**A:** Images with a 16:9 or 3:2 aspect ratio work best with the app interface. Recommended size is 1200x800 pixels.

### Q: Can I use local images instead of URLs?
**A:** For development, you can place images in `/frontend/public/images/` and reference them as `/images/filename.jpg`. For production, we recommend using a cloud image hosting service.

### Q: How do I create an admin user?
**A:** Use the `seeder.js` script or manually create one in MongoDB with the property `isAdmin: true`.

### Q: Can I import collections from a JSON file?
**A:** Yes, you can modify the scripts to read collection data from a JSON file:

```javascript
const fs = require('fs');
const collectionData = JSON.parse(fs.readFileSync('your-collections.json', 'utf8'));
```

### Q: How do I update existing collections?
**A:** To update existing collections, you can either:
1. Delete them first and recreate them
2. Create a custom script that uses `findOneAndUpdate` to modify existing collections

---

This documentation provides a comprehensive guide to populating your PRO Fitness App database. If you have any questions not covered here, please refer to the MongoDB documentation or contact the development team.

Happy fitness programming!