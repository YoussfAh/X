const KEY_MAP = {
  muscleGroups: 'mg',
  primaryMuscleGroup: 'pmg',
  totalSets: 'ts',
  totalReps: 'tr',
  totalVolume: 'tv',
  maxWeight: 'mw',
  comments: 'c',
  feeling: 'f',
  collection: 'col',
  exercise: 'ex',
  isCustomMeal: 'cm',
  customMealName: 'cmn',
  mealType: 'mt',
  energyLevel: 'el',
  sleepTime: 'st',
  wakeUpTime: 'wt',
  duration: 'd',
  weight: 'w',
  nutrition: 'n',
  responses: 'r',
  completedAt: 'ca',
  assignedAt: 'aa',
  // Aggregation keys
  workoutSummary: 'ws',
  dietSummary: 'ds',
  sleepSummary: 'ss',
  weightSummary: 'ws_',
  quizSummary: 'qs',
  totalWorkouts: 'tw',
  totalDietEntries: 'tde',
  totalSleepEntries: 'tse',
  totalWeightEntries: 'twe',
  totalQuizzes: 'tq',
  avgCalories: 'ac',
  avgProtein: 'ap',
  avgCarbs: 'acb',
  avgFat: 'af',
  avgFiber: 'afb',
  avgSleepDuration: 'asd',
  startWeight: 'sw',
  endWeight: 'ew',
  weightChange: 'wc',
};

const isZeroNutrition = (value) => {
  if (!value || typeof value !== 'object') return false;
  const { calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0 } = value;
  return calories === 0 && protein === 0 && carbs === 0 && fat === 0 && fiber === 0;
};

const optimizer = (data) => {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data
      .map(item => optimizer(item))
      .filter(item => item !== null && !(Array.isArray(item) && item.length === 0));
  }

  const newObj = {};
  for (const oldKey in data) {
    if (!Object.prototype.hasOwnProperty.call(data, oldKey)) continue;

    let value = data[oldKey];

    if (
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (oldKey === 'nutrition' && isZeroNutrition(value))
    ) {
      continue;
    }

    if (value !== null && typeof value === 'object') {
      value = optimizer(value);
    }

    if (
      value === null ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
    ) {
      continue;
    }

    const newKey = KEY_MAP[oldKey] || oldKey;
    newObj[newKey] = value;
  }

  return newObj;
};

const optimizerLevel1 = (data) => {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data
      .map(item => optimizerLevel1(item))
      .filter(item => item !== null && !(Array.isArray(item) && item.length === 0));
  }

  const newObj = {};
  for (const oldKey in data) {
    if (!Object.prototype.hasOwnProperty.call(data, oldKey)) continue;

    let value = data[oldKey];

    if (
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (oldKey === 'nutrition' && isZeroNutrition(value)) ||
      (oldKey === 'comments' && value === '')
    ) {
      continue;
    }

    if (value !== null && typeof value === 'object') {
      value = optimizerLevel1(value);
    }

    if (
      value === null ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
    ) {
      continue;
    }

    const newKey = KEY_MAP[oldKey] || oldKey;
    newObj[newKey] = value;
  }

  return newObj;
};

const optimizerLevel2 = (data) => {
  let optimized = optimizerLevel1(data);

  const aggressiveOptimizer = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(aggressiveOptimizer);
    }

    const newObj = {};
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

      // Remove fields that are less critical for high-level analysis
      if (['f', 'c', 'pmg', 'mg', 'ts', 'tr'].includes(key)) {
        continue;
      }

      newObj[key] = aggressiveOptimizer(obj[key]);
    }
    return newObj;
  };

  return aggressiveOptimizer(optimized);
};

const optimizerLevel3 = (data) => {
  let optimized = optimizerLevel1(data); // Start with base optimization
  const summary = {};

  // Workout Summary
  if (optimized.workouts && optimized.workouts.length > 0) {
    summary.workoutSummary = {
      totalWorkouts: optimized.workouts.length,
      totalVolume: optimized.workouts.reduce((sum, w) => sum + (w.tv || 0), 0),
      maxWeight: Math.max(...optimized.workouts.map(w => w.mw || 0)),
    };
    delete optimized.workouts;
  }

  // Diet Summary
  if (optimized.diet && optimized.diet.length > 0) {
    const totals = optimized.diet.reduce((acc, meal) => {
      if (meal.n) {
        acc.calories += meal.n.calories || 0;
        acc.protein += meal.n.protein || 0;
        acc.carbs += meal.n.carbs || 0;
        acc.fat += meal.n.fat || 0;
        acc.fiber += meal.n.fiber || 0;
      }
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    const count = optimized.diet.length;
    summary.dietSummary = {
      totalDietEntries: count,
      avgCalories: totals.calories / count,
      avgProtein: totals.protein / count,
      avgCarbs: totals.carbs / count,
      avgFat: totals.fat / count,
      avgFiber: totals.fiber / count,
    };
    delete optimized.diet;
  }

  // Sleep Summary
  if (optimized.sleep && optimized.sleep.length > 0) {
    const totalDuration = optimized.sleep.reduce((sum, s) => sum + (s.d || 0), 0);
    summary.sleepSummary = {
      totalSleepEntries: optimized.sleep.length,
      avgSleepDuration: totalDuration / optimized.sleep.length,
    };
    delete optimized.sleep;
  }

  // Weight Summary
  if (optimized.weight && optimized.weight.length > 0) {
    const startWeight = optimized.weight[optimized.weight.length - 1].w;
    const endWeight = optimized.weight[0].w;
    summary.weightSummary = {
      totalWeightEntries: optimized.weight.length,
      startWeight,
      endWeight,
      weightChange: endWeight - startWeight,
    };
    delete optimized.weight;
  }

  // Quiz Summary
  if (optimized.quizzes && optimized.quizzes.length > 0) {
    summary.quizSummary = {
      totalQuizzes: optimized.quizzes.length,
    };
    delete optimized.quizzes;
  }

  return { ...optimized, ...summary };
};

const optimizerLevel4 = (data) => {
  let optimized = optimizerLevel1(data);

  const hyperAggressiveOptimizer = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(hyperAggressiveOptimizer).filter(i => i !== null && Object.keys(i).length > 0);
    }

    const newObj = {};
    // Keep only workouts, diet, and sleep at the top level
    if (obj.workouts) newObj.workouts = obj.workouts;
    if (obj.diet) newObj.diet = obj.diet;
    if (obj.sleep) newObj.sleep = obj.sleep;

    // Further strip down workouts to bare essentials
    if (newObj.workouts) {
      newObj.workouts = newObj.workouts.map(workout => ({
        ex: workout.ex,
        tv: workout.tv,
        mw: workout.mw,
        ca: workout.ca,
      }));
    }

    return newObj;
  };

  return hyperAggressiveOptimizer(optimized);
};

const optimizerLevel5 = (data) => {
  let optimized = optimizerLevel1(data);
  const dailySummaries = {};

  const getDate = (timestamp) => {
    if (typeof timestamp === 'string' && timestamp.includes('T')) {
      return timestamp.split('T')[0];
    }
    return null;
  };

  // Process workouts
  (optimized.workouts || []).forEach(w => {
    const day = getDate(w.ca);
    if (!day) return; // Skip if no valid date
    if (!dailySummaries[day]) dailySummaries[day] = {};
    if (!dailySummaries[day].ws) dailySummaries[day].ws = { tv: 0, count: 0 };
    dailySummaries[day].ws.tv += w.tv || 0;
    dailySummaries[day].ws.count += 1;
  });

  // Process diet
  (optimized.diet || []).forEach(d => {
    const day = getDate(d.ca);
    if (!day) return; // Skip if no valid date
    if (!dailySummaries[day]) dailySummaries[day] = {};
    if (!dailySummaries[day].ds) dailySummaries[day].ds = { cals: 0, p: 0, cb: 0, f: 0, count: 0 };
    if (d.n) {
      dailySummaries[day].ds.cals += d.n.calories || 0;
      dailySummaries[day].ds.p += d.n.protein || 0;
      dailySummaries[day].ds.cb += d.n.carbs || 0;
      dailySummaries[day].ds.f += d.n.fat || 0;
    }
    dailySummaries[day].ds.count += 1;
  });

  // Process sleep
  (optimized.sleep || []).forEach(s => {
    const day = getDate(s.ca);
    if (!day) return; // Skip if no valid date
    if (!dailySummaries[day]) dailySummaries[day] = {};
    if (!dailySummaries[day].ss) dailySummaries[day].ss = { dur: 0, count: 0 };
    dailySummaries[day].ss.dur += s.d || 0;
    dailySummaries[day].ss.count += 1;
  });

  // Process weight
  (optimized.weight || []).forEach(w => {
    const day = getDate(w.ca);
    if (!day) return; // Skip if no valid date
    if (!dailySummaries[day]) dailySummaries[day] = {};
    if (!dailySummaries[day].w) dailySummaries[day].w = w.w;
  });

  return { dailySummaries };
};

export const optimizeDataForSmallAI = (data, level = 1) => {
  const originalJson = JSON.stringify(data);
  const originalSize = new Blob([originalJson]).size;

    const clonedData = JSON.parse(originalJson);
  let optimizedData;

  switch (level) {
    case 1:
      optimizedData = optimizerLevel1(clonedData);
      break;
    case 2:
      optimizedData = optimizerLevel2(clonedData);
      break;
    case 3:
      optimizedData = optimizerLevel3(clonedData);
      break;
    case 4:
      optimizedData = optimizerLevel4(clonedData);
      break;
    case 5:
      optimizedData = optimizerLevel5(clonedData);
      break;
    default:
      optimizedData = optimizerLevel1(clonedData);
  }

  const finalJson = JSON.stringify(optimizedData, (key, value) => (value === undefined ? null : value), 0);
  const newSize = new Blob([finalJson]).size;

  const reduction = originalSize > 0 ? ((1 - newSize / originalSize) * 100).toFixed(2) : 0;

  optimizedData._opt = {
    orig_size: originalSize,
    new_size: newSize,
    reduction: `${reduction}%`,
    processed: new Date().toISOString(),
  };

  return optimizedData;
};
