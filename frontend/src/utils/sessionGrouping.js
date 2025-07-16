import { format, isSameDay, startOfWeek } from 'date-fns';

/**
 * Groups individual workout entries into sessions based on time proximity
 * @param {Array} workouts - Array of workout entries
 * @param {number} timeWindow - Time window in minutes to group exercises (default: 60 minutes)
 * @returns {Array} Array of grouped sessions
 */
export const groupWorkoutsIntoSessions = (workouts, timeWindow = 60) => {
  if (!workouts || workouts.length === 0) return [];

  // Sort workouts by date
  const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const sessions = [];
  let currentSession = null;

  sortedWorkouts.forEach((workout, index) => {
    const workoutTime = new Date(workout.date);
    
    // If this is the first workout or it's been too long since the last exercise in current session
    if (!currentSession || 
        (currentSession.endTime && Math.abs(workoutTime - new Date(currentSession.endTime)) > timeWindow * 60 * 1000)) {
      
      // Create new session
      currentSession = {
        id: `session-${Date.now()}-${index}`,
        startTime: workoutTime,
        endTime: workoutTime,
        exercises: [workout],
        totalSets: workout.sets?.length || 0,
        totalReps: workout.sets?.reduce((sum, set) => sum + (set.reps || 0), 0) || 0,
        totalVolume: workout.sets?.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0) || 0,
        maxWeight: Math.max(...(workout.sets?.map(set => set.weight || 0) || [0])),
        avgRepsPerSet: 0,
        muscleGroups: new Set([
          ...(workout.product?.muscleGroups || []),
          ...(workout.product?.primaryMuscleGroup ? [workout.product.primaryMuscleGroup] : [])
        ]),
        exerciseNames: new Set([workout.product?.name]),
        personalRecords: 0,
        name: ''
      };
      
      sessions.push(currentSession);
    } else {
      // Add to current session
      currentSession.exercises.push(workout);
      currentSession.endTime = workoutTime;
      currentSession.totalSets += workout.sets?.length || 0;
      currentSession.totalReps += workout.sets?.reduce((sum, set) => sum + (set.reps || 0), 0) || 0;
      currentSession.totalVolume += workout.sets?.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0) || 0;
      
      const workoutMaxWeight = Math.max(...(workout.sets?.map(set => set.weight || 0) || [0]));
      if (workoutMaxWeight > currentSession.maxWeight) {
        currentSession.maxWeight = workoutMaxWeight;
      }
      
      // Add muscle groups
      if (workout.product?.muscleGroups) {
        workout.product.muscleGroups.forEach(group => currentSession.muscleGroups.add(group));
      }
      
      // Add primary muscle group
      if (workout.product?.primaryMuscleGroup) {
        currentSession.muscleGroups.add(workout.product.primaryMuscleGroup);
      }
      
      currentSession.exerciseNames.add(workout.product?.name);
    }
  });

  // Finalize session data
  sessions.forEach(session => {
    session.muscleGroups = Array.from(session.muscleGroups);
    session.exerciseNames = Array.from(session.exerciseNames);
    session.name = generateSessionName(session);
    session.avgRepsPerSet = session.totalSets > 0 ? Math.round(session.totalReps / session.totalSets) : 0;
    session.avgWeight = session.totalReps > 0 ? Math.round(session.totalVolume / session.totalReps) : 0;
    

    
    // Count potential PRs (sessions with heavy weights)
    session.personalRecords = session.exercises.filter(ex => 
      ex.sets?.some(set => set.weight && set.weight >= session.maxWeight * 0.9)
    ).length;
  });

  return sessions;
};

/**
 * Generates a descriptive name for a workout session
 * @param {Object} session - Session object
 * @returns {string} Generated session name
 */
const generateSessionName = (session) => {
  const muscleGroups = session.muscleGroups;
  const exerciseCount = session.exercises.length;
  const startTime = new Date(session.startTime);
  const timeOfDay = startTime.getHours();
  
  // Time-based prefixes
  let timePrefix = '';
  if (timeOfDay < 12) timePrefix = 'Morning';
  else if (timeOfDay < 17) timePrefix = 'Afternoon';
  else timePrefix = 'Evening';
  
  // Smart workout categorization based on muscle groups
  let workoutType = '';
  
  if (muscleGroups.includes('chest') && muscleGroups.includes('shoulders') && muscleGroups.includes('triceps')) {
    workoutType = 'Push Workout';
  } else if (muscleGroups.includes('back') && muscleGroups.includes('biceps')) {
    workoutType = 'Pull Workout';
  } else if (muscleGroups.includes('legs') || muscleGroups.includes('quadriceps') || muscleGroups.includes('hamstrings') || muscleGroups.includes('glutes')) {
    workoutType = 'Leg Workout';
  } else if (muscleGroups.includes('chest') && !muscleGroups.includes('back')) {
    workoutType = 'Chest Focus';
  } else if (muscleGroups.includes('back') && !muscleGroups.includes('chest')) {
    workoutType = 'Back Focus';
  } else if (muscleGroups.includes('shoulders') && muscleGroups.length <= 2) {
    workoutType = 'Shoulder Focus';
  } else if ((muscleGroups.includes('biceps') || muscleGroups.includes('triceps')) && muscleGroups.length <= 2) {
    workoutType = 'Arm Focus';
  } else if (muscleGroups.includes('core') || muscleGroups.includes('abs')) {
    workoutType = 'Core Training';
  } else if (muscleGroups.length >= 4) {
    workoutType = 'Full Body';
  } else if (muscleGroups.length >= 2) {
    workoutType = 'Upper Body';
  } else if (muscleGroups.length === 1) {
    const muscle = muscleGroups[0];
    workoutType = `${muscle.charAt(0).toUpperCase() + muscle.slice(1)} Focus`;
  } else {
    workoutType = 'Mixed Training';
  }
  
  // Add intensity indicator based on exercise count and volume
  let intensityIndicator = '';
  if (exerciseCount >= 6) intensityIndicator = ' - Heavy';
  else if (exerciseCount >= 4) intensityIndicator = ' - Moderate';
  else if (exerciseCount >= 2) intensityIndicator = ' - Light';
  
  return `${timePrefix} ${workoutType}${intensityIndicator}`;
};

/**
 * Groups sessions by date for daily view
 * @param {Array} sessions - Array of session objects
 * @returns {Object} Object with dates as keys and sessions as values
 */
export const groupSessionsByDate = (sessions) => {
  const groupedByDate = {};
  
  sessions.forEach(session => {
    const dateKey = format(new Date(session.startTime), 'yyyy-MM-dd');
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = {
        date: dateKey,
        displayDate: format(new Date(session.startTime), 'MMM dd, yyyy'),
        dayName: format(new Date(session.startTime), 'EEEE'),
        sessions: [],
        totalVolume: 0,
        totalSets: 0,
        totalReps: 0,
        totalExercises: 0,
        maxWeight: 0,
        uniqueExercises: new Set(),
        muscleGroups: new Set()
      };
    }
    
    groupedByDate[dateKey].sessions.push(session);
    groupedByDate[dateKey].totalVolume += session.totalVolume;
    groupedByDate[dateKey].totalSets += session.totalSets;
    groupedByDate[dateKey].totalReps += session.totalReps;
    groupedByDate[dateKey].totalExercises += session.exercises.length;
    
    if (session.maxWeight > groupedByDate[dateKey].maxWeight) {
      groupedByDate[dateKey].maxWeight = session.maxWeight;
    }
    
    session.exerciseNames.forEach(name => groupedByDate[dateKey].uniqueExercises.add(name));
    session.muscleGroups.forEach(group => groupedByDate[dateKey].muscleGroups.add(group));
  });
  
  // Convert sets to counts
  Object.values(groupedByDate).forEach(day => {
    day.uniqueExercises = day.uniqueExercises.size;
    day.muscleGroups = Array.from(day.muscleGroups);
    day.avgWeight = day.totalReps > 0 ? Math.round(day.totalVolume / day.totalReps) : 0;
    

  });
  
  return groupedByDate;
};

/**
 * Calculate comprehensive session statistics
 * @param {Array} sessions - Array of session objects
 * @returns {Object} Statistics object with volume, strength, and progression data
 */
export const calculateSessionStats = (sessions) => {
  if (!sessions.length) return {
    totalSessions: 0,
    totalVolume: 0,
    totalSets: 0,
    totalReps: 0,
    maxWeight: 0,
    avgWeight: 0,
    uniqueExercises: 0,
    muscleGroupFrequency: {},
    weeklyProgress: [],
    recentPRs: 0
  };
  
  const allExercises = new Set();
  const muscleGroupFreq = {};
  
  sessions.forEach(session => {
    session.exerciseNames.forEach(name => allExercises.add(name));
    session.muscleGroups.forEach(group => {
      muscleGroupFreq[group] = (muscleGroupFreq[group] || 0) + 1;
    });
  });
  
  const stats = {
    totalSessions: sessions.length,
    totalVolume: sessions.reduce((sum, s) => sum + s.totalVolume, 0),
    totalSets: sessions.reduce((sum, s) => sum + s.totalSets, 0),
    totalReps: sessions.reduce((sum, s) => sum + s.totalReps, 0),
    maxWeight: Math.max(...sessions.map(s => s.maxWeight)),
    avgWeight: 0,
    avgVolumePerSession: 0,
    avgSetsPerSession: 0,
    uniqueExercises: allExercises.size,
    muscleGroupFrequency: muscleGroupFreq,
    weeklyProgress: calculateWeeklyProgress(sessions),
    recentPRs: sessions.filter(s => s.personalRecords > 0).length
  };
  
  // Calculate averages
  stats.avgWeight = stats.totalReps > 0 ? Math.round(stats.totalVolume / stats.totalReps) : 0;
  stats.avgVolumePerSession = Math.round(stats.totalVolume / sessions.length);
  stats.avgSetsPerSession = Math.round(stats.totalSets / sessions.length);
  
  return stats;
};

/**
 * Calculate weekly progression data
 * @param {Array} sessions - Array of session objects
 * @returns {Array} Weekly progression data
 */
export const calculateWeeklyProgress = (sessions) => {
  const weeklyData = {};
  
  sessions.forEach(session => {
    const weekStart = startOfWeek(new Date(session.startTime));
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        week: weekKey,
        weekDisplay: format(weekStart, 'MMM dd'),
        totalVolume: 0,
        totalSets: 0,
        totalReps: 0,
        sessionsCount: 0,
        maxWeight: 0,
        avgWeight: 0
      };
    }
    
    weeklyData[weekKey].totalVolume += session.totalVolume;
    weeklyData[weekKey].totalSets += session.totalSets;
    weeklyData[weekKey].totalReps += session.totalReps;
    weeklyData[weekKey].sessionsCount += 1;
    
    if (session.maxWeight > weeklyData[weekKey].maxWeight) {
      weeklyData[weekKey].maxWeight = session.maxWeight;
    }
  });
  
  // Calculate weekly averages
  Object.values(weeklyData).forEach(week => {
    week.avgWeight = week.totalReps > 0 ? Math.round(week.totalVolume / week.totalReps) : 0;
  });
  
  return Object.values(weeklyData)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8); // Last 8 weeks
};

/**
 * Get muscle group distribution
 * @param {Array} sessions - Array of session objects
 * @returns {Array} Muscle group distribution with percentages
 */
export const getMuscleGroupDistribution = (sessions) => {
  const distribution = {};
  let totalCount = 0;
  
  sessions.forEach(session => {
    session.muscleGroups.forEach(group => {
      distribution[group] = (distribution[group] || 0) + 1;
      totalCount++;
    });
  });
  
  return Object.entries(distribution)
    .map(([group, count]) => ({
      muscle: group,
      count,
      percentage: Math.round((count / totalCount) * 100)
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Get top exercises by volume
 * @param {Array} sessions - Array of session objects
 * @returns {Array} Top exercises with volume data
 */
export const getTopExercisesByVolume = (sessions) => {
  const exerciseVolume = {};
  
  sessions.forEach(session => {
    session.exercises.forEach(exercise => {
      const name = exercise.product?.name;
      if (name) {
        const volume = exercise.sets?.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0) || 0;
        exerciseVolume[name] = (exerciseVolume[name] || 0) + volume;
      }
    });
  });
  
  return Object.entries(exerciseVolume)
    .map(([name, volume]) => ({ name, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);
}; 