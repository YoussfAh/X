import mongoose from 'mongoose';
import WorkoutEntry from '../models/workoutEntryModel.js';
import WorkoutSession from '../models/workoutSessionModel.js';
import DietEntry from '../models/dietEntryModel.js';
import SleepEntry from '../models/sleepModel.js';
import Weight from '../models/weightModel.js';
import User from '../models/userModel.js';

/**
 * Utility functions for aggregating user data for AI analysis
 */

export const aggregateWorkoutData = async (userId, dateFilter = {}) => {
  console.log(`=== WORKOUT DATA AGGREGATION DEBUG ===`);
  console.log(`Input userId: ${userId} (type: ${typeof userId})`);
  console.log(`Input dateFilter:`, JSON.stringify(dateFilter, null, 2));
  
  // Build the final filter
  const workoutFilter = { user: userId };
  
  // Apply date filter if provided
  if (dateFilter.date && Object.keys(dateFilter.date).length > 0) {
    workoutFilter.date = dateFilter.date;
    console.log(`Date filtering ENABLED: ${JSON.stringify(dateFilter.date)}`);
  } else {
    console.log(`Date filtering DISABLED - no date filter provided`);
  }
  
  console.log(`Final workout filter:`, JSON.stringify(workoutFilter, null, 2));
  
  // First, count total workouts for this user (no date filter)
  const totalUserWorkouts = await WorkoutEntry.countDocuments({ user: userId });
  console.log(`Total workouts for user ${userId}: ${totalUserWorkouts}`);
  
  // Then count with the date filter applied
  const filteredCount = await WorkoutEntry.countDocuments(workoutFilter);
  console.log(`Workouts after date filtering: ${filteredCount}`);
  
  const workouts = await WorkoutEntry.find(workoutFilter)
    .populate('product', 'name muscleGroups primaryMuscleGroup')
    .populate('collectionId', 'name')
    .sort({ date: -1 })
    .limit(2000); // Increase limit

  console.log(`Actually retrieved ${workouts.length} workouts for user ${userId}`);
  
  // Log some sample workout dates for debugging
  if (workouts.length > 0) {
    console.log(`Sample workout dates:`, workouts.slice(0, 3).map(w => ({
      id: w._id,
      date: w.date,
      exercise: w.product?.name
    })));
  }
  
  return workouts.map(workout => ({
    id: workout._id,
    date: workout.date,
    exercise: workout.product?.name || 'Unknown',
    muscleGroups: workout.product?.muscleGroups || [],
    primaryMuscleGroup: workout.product?.primaryMuscleGroup,
    collection: workout.collectionId?.name,
    sets: workout.sets.map(set => ({
      weight: set.weight,
      reps: set.reps,
      volume: (set.weight || 0) * (set.reps || 0)
    })),
    totalSets: workout.sets.length,
    totalReps: workout.sets.reduce((sum, set) => sum + (set.reps || 0), 0),
    totalVolume: workout.sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0),
    maxWeight: Math.max(...workout.sets.map(set => set.weight || 0)),
    feeling: workout.feeling,
    comments: workout.comments
  }));
};

export const aggregateSessionData = async (userId, dateFilter = {}) => {
  console.log(`=== SESSION DATA AGGREGATION DEBUG ===`);
  console.log(`Input userId: ${userId}, dateFilter:`, JSON.stringify(dateFilter, null, 2));
  
  const sessionFilter = { user: userId };
  
  // Sessions use 'startTime' field instead of 'date', so we need to map the date filter
  if (dateFilter.date && Object.keys(dateFilter.date).length > 0) {
    sessionFilter.startTime = {};
    if (dateFilter.date.$gte) {
      sessionFilter.startTime.$gte = dateFilter.date.$gte;
    }
    if (dateFilter.date.$lte) {
      sessionFilter.startTime.$lte = dateFilter.date.$lte;
    }
    console.log(`Session date filtering ENABLED for startTime field`);
  } else {
    console.log(`Session date filtering DISABLED`);
  }
  
  console.log('Session filter:', JSON.stringify(sessionFilter, null, 2));
  
  // Count sessions before and after filtering
  const totalSessions = await WorkoutSession.countDocuments({ user: userId });
  const filteredSessions = await WorkoutSession.countDocuments(sessionFilter);
  console.log(`Total sessions: ${totalSessions}, After filtering: ${filteredSessions}`);
  
  const sessions = await WorkoutSession.find(sessionFilter)
    .populate({
      path: 'exercises',
      populate: {
        path: 'product',
        select: 'name muscleGroups'
      }
    })
    .sort({ startTime: -1 })
    .limit(100);

  console.log(`Found ${sessions.length} sessions for user ${userId} with date filter`);
  
  return sessions.map(session => ({
    id: session._id,
    name: session.name,
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.duration,
    status: session.status,
    exercises: session.exercises?.map(ex => ({
      name: ex.product?.name,
      muscleGroups: ex.product?.muscleGroups
    })) || [],
    targetMuscleGroups: session.targetMuscleGroups,
    difficulty: session.difficulty,
    location: session.location,
    notes: session.notes
  }));
};

export const aggregateDietData = async (userId, dateFilter = {}) => {
  console.log(`=== DIET DATA AGGREGATION DEBUG ===`);
  console.log(`Input userId: ${userId}, dateFilter:`, JSON.stringify(dateFilter, null, 2));
  
  const userObjectId = typeof userId === 'string' ? userId : userId.toString();
  const dietFilter = { user: userObjectId };
  
  // Apply date filter if provided
  if (dateFilter.date && Object.keys(dateFilter.date).length > 0) {
    dietFilter.date = dateFilter.date;
    console.log(`Diet date filtering ENABLED`);
  } else {
    console.log(`Diet date filtering DISABLED`);
  }
  
  console.log('Diet filter:', JSON.stringify(dietFilter, null, 2));
  
  // Check total diet entries for this user
  const totalDietEntries = await DietEntry.countDocuments({ user: userObjectId });
  const filteredDietEntries = await DietEntry.countDocuments(dietFilter);
  console.log(`Total diet entries: ${totalDietEntries}, After filtering: ${filteredDietEntries}`);
  
  const dietEntries = await DietEntry.find(dietFilter)
    .populate('product', 'name')
    .sort({ date: -1 })
    .limit(2000);

  console.log(`Found ${dietEntries.length} diet entries for user ${userObjectId} after filtering`);
  return dietEntries.map(entry => ({
    id: entry._id,
    date: entry.date,
    mealType: entry.mealType,
    product: entry.product?.name,
    isCustomMeal: entry.isCustomMeal,
    customMealName: entry.customMealName,
    nutrition: {
      calories: entry.nutrition?.calories || 0,
      protein: entry.nutrition?.protein || 0,
      carbs: entry.nutrition?.carbs || 0,
      fat: entry.nutrition?.fat || 0,
      fiber: entry.nutrition?.fiber || 0
    },
    feeling: entry.feeling,
    energyLevel: entry.energyLevel,
    comments: entry.comments
  }));
};

export const aggregateSleepData = async (userId, dateFilter = {}) => {
  const sleepFilter = { user: userId, ...dateFilter };
  console.log('Sleep filter:', sleepFilter);
  
  const sleepEntries = await SleepEntry.find(sleepFilter)
    .sort({ date: -1 })
    .limit(200);

  console.log(`Found ${sleepEntries.length} sleep entries for user ${userId} with date filter`);
  return sleepEntries.map(entry => ({
    id: entry._id,
    date: entry.date,
    sleepTime: entry.sleepTime,
    wakeUpTime: entry.wakeUpTime,
    duration: entry.duration,
    quality: entry.quality,
    notes: entry.notes
  }));
};

export const aggregateWeightData = async (userId, dateFilter = {}) => {
  const weightFilter = { user: userId, ...dateFilter };
  console.log('Weight filter:', weightFilter);
  
  const weightEntries = await Weight.find(weightFilter)
    .sort({ date: -1 })
    .limit(200);

  console.log(`Found ${weightEntries.length} weight entries for user ${userId} with date filter`);
  return weightEntries.map(entry => ({
    id: entry._id,
    date: entry.date,
    weight: entry.weight,
    unit: entry.unit,
    notes: entry.notes
  }));
};

export const aggregateQuizData = async (userId, dateFilter = {}) => {
  const user = await User.findById(userId)
    .populate({
      path: 'quizResults.quizId',
      select: 'name questions'
    })
    .populate({
      path: 'pendingQuizzes.quizId', 
      select: 'name questions'
    });

  if (!user) {
    return [];
  }

  const results = [];
  
  // Add completed quiz results with date filtering
  if (user.quizResults) {
    user.quizResults.forEach(result => {
      // Apply date filter if provided
      if (dateFilter.date && result.completedAt) {
        const completedDate = new Date(result.completedAt);
        if (dateFilter.date.$gte && completedDate < dateFilter.date.$gte) {
          return; // Skip this result
        }
        if (dateFilter.date.$lte && completedDate > dateFilter.date.$lte) {
          return; // Skip this result
        }
      }
      
      results.push({
        id: result.quizId?._id || result.quizId,
        name: result.quizName || result.quizId?.name || 'Unknown Quiz',
        status: 'completed',
        completedAt: result.completedAt,
        score: result.score,
        totalQuestions: result.totalQuestions,
        responses: result.answers?.map(answer => ({
          questionText: answer.questionText,
          selectedAnswers: answer.selectedAnswers,
          textResponse: answer.textResponse,
          isCorrect: answer.isCorrect
        })) || []
      });
    });
  }

  // Add pending quizzes with date filtering
  if (user.pendingQuizzes) {
    user.pendingQuizzes.forEach(pending => {
      // Apply date filter if provided
      if (dateFilter.date && pending.assignedAt) {
        const assignedDate = new Date(pending.assignedAt);
        if (dateFilter.date.$gte && assignedDate < dateFilter.date.$gte) {
          return; // Skip this result
        }
        if (dateFilter.date.$lte && assignedDate > dateFilter.date.$lte) {
          return; // Skip this result
        }
      }
      
      results.push({
        id: pending.quizId?._id || pending.quizId,
        name: pending.quizId?.name || 'Unknown Quiz',
        status: 'pending',
        assignedAt: pending.assignedAt,
        availableAt: pending.availableAt,
        responses: []
      });
    });
  }

  return results;
};

export const calculateUserSummary = (userData) => {
  const workouts = userData.workouts || [];
  const diet = userData.diet || [];
  const sleep = userData.sleep || [];
  const weight = userData.weight || [];
  const quizzes = userData.quizzes || [];

  // Calculate advanced workout metrics
  const workoutMetrics = calculateAdvancedWorkoutMetrics(workouts);
  const progressMetrics = calculateProgressMetrics(workouts);
  const consistencyMetrics = calculateConsistencyMetrics(workouts);

  return {
    // Basic counts
    totalWorkouts: workouts.length,
    totalSets: workouts.reduce((sum, w) => sum + w.totalSets, 0),
    totalVolume: workouts.reduce((sum, w) => sum + w.totalVolume, 0),
    totalDietEntries: diet.length,
    totalSleepRecords: sleep.length,
    totalWeightRecords: weight.length,
    completedQuizzes: quizzes.filter(q => q.status === 'completed').length,
    
    // Frequency and consistency
    avgWorkoutsPerWeek: calculateWorkoutFrequency(workouts),
    workoutConsistency: consistencyMetrics.consistency,
    longestStreak: consistencyMetrics.longestStreak,
    currentStreak: consistencyMetrics.currentStreak,
    
    // Performance metrics
    avgVolumePerWorkout: workoutMetrics.avgVolumePerWorkout,
    avgSetsPerWorkout: workoutMetrics.avgSetsPerWorkout,
    avgRepsPerSet: workoutMetrics.avgRepsPerSet,
    strongestLift: workoutMetrics.strongestLift,
    mostFrequentExercise: workoutMetrics.mostFrequentExercise,
    
    // Progress indicators
    volumeProgression: progressMetrics.volumeProgression,
    strengthProgression: progressMetrics.strengthProgression,
    exerciseVariety: progressMetrics.exerciseVariety,
    muscleGroupBalance: progressMetrics.muscleGroupBalance,
    
    // Nutrition summary
    avgCaloriesPerDay: calculateAvgCalories(diet),
    nutritionConsistency: diet.length > 0 ? calculateNutritionConsistency(diet) : null,
    
    // Sleep and recovery
    avgSleepDuration: calculateAvgSleepDuration(sleep),
    sleepQualityTrend: sleep.length > 0 ? calculateSleepQualityTrend(sleep) : null,
    
    // Weight trends
    weightTrend: calculateWeightTrend(weight),
    weightChange: weight.length >= 2 ? calculateWeightChange(weight) : null,
    
    // Data quality assessment
    dataQuality: assessDataQuality(userData),
    timespan: calculateDataTimespan(userData)
  };
};

// Helper calculation functions
export const calculateWorkoutFrequency = (workouts) => {
  if (workouts.length === 0) return 0;
  
  const dates = workouts.map(w => new Date(w.date));
  const earliestDate = new Date(Math.min(...dates));
  const latestDate = new Date(Math.max(...dates));
  const weeksDiff = Math.max((latestDate - earliestDate) / (7 * 24 * 60 * 60 * 1000), 1);
  
  return Math.round((workouts.length / weeksDiff) * 10) / 10;
};

export const calculateAvgCalories = (dietEntries) => {
  if (dietEntries.length === 0) return 0;
  
  const totalCalories = dietEntries.reduce((sum, entry) => sum + (entry.nutrition.calories || 0), 0);
  return Math.round(totalCalories / dietEntries.length);
};

export const calculateAvgSleepDuration = (sleepEntries) => {
  if (sleepEntries.length === 0) return 0;
  
  const totalDuration = sleepEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
  return Math.round((totalDuration / sleepEntries.length) * 10) / 10;
};

export const calculateWeightTrend = (weightEntries) => {
  if (weightEntries.length < 2) return 'insufficient_data';
  
  const sorted = weightEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0].weight;
  const last = sorted[sorted.length - 1].weight;
  const change = last - first;
  
  if (Math.abs(change) < 0.5) return 'stable';
  return change > 0 ? 'increasing' : 'decreasing';
};

// Advanced workout metrics calculations
export const calculateAdvancedWorkoutMetrics = (workouts) => {
  if (workouts.length === 0) return {
    avgVolumePerWorkout: 0,
    avgSetsPerWorkout: 0,
    avgRepsPerSet: 0,
    strongestLift: null,
    mostFrequentExercise: null
  };

  const totalVolume = workouts.reduce((sum, w) => sum + w.totalVolume, 0);
  const totalSets = workouts.reduce((sum, w) => sum + w.totalSets, 0);
  const totalReps = workouts.reduce((sum, w) => sum + w.totalReps, 0);

  // Find strongest lift
  let strongestLift = { exercise: null, weight: 0 };
  workouts.forEach(workout => {
    if (workout.maxWeight > strongestLift.weight) {
      strongestLift = { exercise: workout.exercise, weight: workout.maxWeight };
    }
  });

  // Find most frequent exercise
  const exerciseCounts = {};
  workouts.forEach(workout => {
    exerciseCounts[workout.exercise] = (exerciseCounts[workout.exercise] || 0) + 1;
  });
  const mostFrequentExercise = Object.keys(exerciseCounts).reduce((a, b) => 
    exerciseCounts[a] > exerciseCounts[b] ? a : b, null);

  return {
    avgVolumePerWorkout: Math.round(totalVolume / workouts.length),
    avgSetsPerWorkout: Math.round((totalSets / workouts.length) * 10) / 10,
    avgRepsPerSet: totalSets > 0 ? Math.round((totalReps / totalSets) * 10) / 10 : 0,
    strongestLift,
    mostFrequentExercise
  };
};

export const calculateProgressMetrics = (workouts) => {
  if (workouts.length < 2) return {
    volumeProgression: 'insufficient_data',
    strengthProgression: 'insufficient_data',
    exerciseVariety: 0,
    muscleGroupBalance: {}
  };

  // Sort workouts by date
  const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate volume progression (first vs last month)
  const firstMonth = sortedWorkouts.slice(0, Math.min(5, Math.floor(sortedWorkouts.length / 2)));
  const lastMonth = sortedWorkouts.slice(-Math.min(5, Math.floor(sortedWorkouts.length / 2)));
  
  const firstMonthAvgVolume = firstMonth.reduce((sum, w) => sum + w.totalVolume, 0) / firstMonth.length;
  const lastMonthAvgVolume = lastMonth.reduce((sum, w) => sum + w.totalVolume, 0) / lastMonth.length;
  
  const volumeChange = ((lastMonthAvgVolume - firstMonthAvgVolume) / firstMonthAvgVolume) * 100;
  
  // Calculate strength progression
  const exerciseMaxes = {};
  sortedWorkouts.forEach(workout => {
    if (!exerciseMaxes[workout.exercise]) {
      exerciseMaxes[workout.exercise] = [];
    }
    exerciseMaxes[workout.exercise].push({ date: workout.date, weight: workout.maxWeight });
  });
  
  let strengthImprovement = 0;
  let exercisesWithProgress = 0;
  
  Object.entries(exerciseMaxes).forEach(([exercise, records]) => {
    if (records.length >= 2) {
      const firstMax = records[0].weight;
      const lastMax = records[records.length - 1].weight;
      if (firstMax > 0) {
        strengthImprovement += ((lastMax - firstMax) / firstMax) * 100;
        exercisesWithProgress++;
      }
    }
  });
  
  const avgStrengthProgression = exercisesWithProgress > 0 ? strengthImprovement / exercisesWithProgress : 0;
  
  // Exercise variety
  const uniqueExercises = new Set(workouts.map(w => w.exercise)).size;
  
  // Muscle group balance
  const muscleGroupCounts = {};
  workouts.forEach(workout => {
    if (workout.primaryMuscleGroup) {
      muscleGroupCounts[workout.primaryMuscleGroup] = (muscleGroupCounts[workout.primaryMuscleGroup] || 0) + 1;
    }
  });

  return {
    volumeProgression: volumeChange > 5 ? 'improving' : volumeChange < -5 ? 'declining' : 'stable',
    strengthProgression: avgStrengthProgression > 5 ? 'improving' : avgStrengthProgression < -5 ? 'declining' : 'stable',
    exerciseVariety: uniqueExercises,
    muscleGroupBalance: muscleGroupCounts
  };
};

export const calculateConsistencyMetrics = (workouts) => {
  if (workouts.length === 0) return {
    consistency: 0,
    longestStreak: 0,
    currentStreak: 0
  };

  // Sort workouts by date
  const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));
  const workoutDates = sortedWorkouts.map(w => new Date(w.date).toDateString());
  const uniqueDates = [...new Set(workoutDates)];
  
  // Calculate consistency over time
  if (uniqueDates.length < 2) return {
    consistency: workouts.length > 0 ? 50 : 0,
    longestStreak: workouts.length > 0 ? 1 : 0,
    currentStreak: workouts.length > 0 ? 1 : 0
  };

  const firstDate = new Date(uniqueDates[0]);
  const lastDate = new Date(uniqueDates[uniqueDates.length - 1]);
  const totalDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
  const consistency = Math.round((uniqueDates.length / totalDays) * 100);

  // Calculate streaks
  let longestStreak = 1;
  let currentStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currentDate = new Date(uniqueDates[i]);
    const daysDiff = Math.ceil((currentDate - prevDate) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 2) { // Allow 1 day gap
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Current streak calculation
  const today = new Date().toDateString();
  const lastWorkoutDate = new Date(uniqueDates[uniqueDates.length - 1]);
  const daysSinceLastWorkout = Math.ceil((new Date() - lastWorkoutDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastWorkout <= 3) {
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  return {
    consistency: Math.min(consistency, 100),
    longestStreak,
    currentStreak
  };
};

export const calculateNutritionConsistency = (dietEntries) => {
  if (dietEntries.length === 0) return 0;
  
  const dailyCalories = {};
  dietEntries.forEach(entry => {
    const date = new Date(entry.date).toDateString();
    dailyCalories[date] = (dailyCalories[date] || 0) + (entry.nutrition.calories || 0);
  });
  
  const calorieValues = Object.values(dailyCalories);
  const avgCalories = calorieValues.reduce((sum, cal) => sum + cal, 0) / calorieValues.length;
  
  // Calculate coefficient of variation (lower is more consistent)
  const variance = calorieValues.reduce((sum, cal) => sum + Math.pow(cal - avgCalories, 2), 0) / calorieValues.length;
  const stdDev = Math.sqrt(variance);
  const cv = avgCalories > 0 ? (stdDev / avgCalories) * 100 : 100;
  
  return Math.max(0, Math.min(100, 100 - cv)); // Convert to consistency score
};

export const calculateSleepQualityTrend = (sleepEntries) => {
  if (sleepEntries.length < 3) return 'insufficient_data';
  
  const recentEntries = sleepEntries.slice(-7); // Last 7 entries
  const avgQuality = recentEntries.reduce((sum, entry) => sum + (entry.quality || 3), 0) / recentEntries.length;
  
  if (avgQuality >= 4) return 'excellent';
  if (avgQuality >= 3.5) return 'good';
  if (avgQuality >= 2.5) return 'fair';
  return 'poor';
};

export const calculateWeightChange = (weightEntries) => {
  if (weightEntries.length < 2) return null;
  
  const sorted = [...weightEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstWeight = sorted[0].weight;
  const lastWeight = sorted[sorted.length - 1].weight;
  const change = lastWeight - firstWeight;
  
  return {
    absolute: Math.round(change * 10) / 10,
    percentage: firstWeight > 0 ? Math.round((change / firstWeight) * 1000) / 10 : 0,
    direction: change > 0.5 ? 'gain' : change < -0.5 ? 'loss' : 'stable'
  };
};

export const assessDataQuality = (userData) => {
  const scores = {
    workouts: Math.min(100, (userData.workouts?.length || 0) * 5),
    diet: Math.min(100, (userData.diet?.length || 0) * 2),
    sleep: Math.min(100, (userData.sleep?.length || 0) * 3),
    weight: Math.min(100, (userData.weight?.length || 0) * 10),
    quizzes: Math.min(100, (userData.quizzes?.length || 0) * 20)
  };
  
  const overallScore = (scores.workouts + scores.diet + scores.sleep + scores.weight + scores.quizzes) / 5;
  
  return {
    overall: Math.round(overallScore),
    breakdown: scores,
    recommendation: overallScore >= 70 ? 'excellent' : overallScore >= 40 ? 'good' : 'needs_improvement'
  };
};

export const calculateDataTimespan = (userData) => {
  const allDates = [];
  
  if (userData.workouts) allDates.push(...userData.workouts.map(w => new Date(w.date)));
  if (userData.diet) allDates.push(...userData.diet.map(d => new Date(d.date)));
  if (userData.sleep) allDates.push(...userData.sleep.map(s => new Date(s.date)));
  if (userData.weight) allDates.push(...userData.weight.map(w => new Date(w.date)));
  
  if (allDates.length === 0) return null;
  
  const earliest = new Date(Math.min(...allDates));
  const latest = new Date(Math.max(...allDates));
  const daysDiff = Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24));
  
  return {
    earliest,
    latest,
    days: daysDiff,
    weeks: Math.round(daysDiff / 7),
    months: Math.round(daysDiff / 30)
  };
};

export const createAIPromptContext = (userData, maxItems = 50) => {
  const { workouts, diet, sleep, weight, quizzes } = userData;
  const totalItems =
    (workouts?.length || 0) +
    (diet?.length || 0) +
    (sleep?.length || 0) +
    (weight?.length || 0) +
    (quizzes?.length || 0);

  if (totalItems <= maxItems) {
    console.log(`Total data items (${totalItems}) is within limit (${maxItems}). Using full data.`);
    return JSON.stringify(userData, null, 2);
  }

  console.log(`Total data items (${totalItems}) exceeds limit (${maxItems}). Generating summarized data.`);

  const summary = {
    user: userData.user,
    summary: userData.summary, // The existing summary is a great start
    workoutSummary: {},
    dietSummary: {},
    sleepSummary: {},
    weightSummary: {},
    quizSummary: {}
  };

  if (workouts?.length > 0) {
    const topExercises = workouts
      .reduce((acc, workout) => {
        const exercise = workout.exercise || 'Unknown';
        acc[exercise] = (acc[exercise] || 0) + 1;
        return acc;
      }, {});
    
    const sortedExercises = Object.entries(topExercises).sort(([, a], [, b]) => b - a);

    summary.workoutSummary = {
      totalWorkouts: workouts.length,
      top5Exercises: sortedExercises.slice(0, 5).map(([name, count]) => ({ name, count })),
      ...userData.summary.advancedMetrics,
      ...userData.summary.progressMetrics,
      ...userData.summary.consistencyMetrics,
    };
  }

  if (diet?.length > 0) {
    summary.dietSummary = {
      totalEntries: diet.length,
      avgCalories: userData.summary.avgCalories,
      avgProtein: userData.summary.avgProtein,
      avgCarbs: userData.summary.avgCarbs,
      avgFat: userData.summary.avgFat,
      consistency: userData.summary.nutritionConsistency,
    };
  }

  if (sleep?.length > 0) {
    summary.sleepSummary = {
      totalEntries: sleep.length,
      avgDuration: userData.summary.avgSleepDuration,
      avgQuality: userData.summary.avgSleepQuality,
      qualityTrend: userData.summary.sleepQualityTrend,
    };
  }

  if (weight?.length > 0) {
    summary.weightSummary = {
      totalEntries: weight.length,
      ...userData.summary.weightChange,
    };
  }
  
  if (quizzes?.length > 0) {
    summary.quizSummary = {
        totalQuizzes: quizzes.length,
        latestQuiz: quizzes[0] ? { name: quizzes[0].quiz.title, score: quizzes[0].score } : null
    }
  }

  return `// IMPORTANT: The following is a summary of a large dataset, not the full data.
// The user has a lot of data, so we've summarized it to make it easier to analyze.
// Focus on the trends and summaries provided.

${JSON.stringify(summary, null, 2)}`;
};
