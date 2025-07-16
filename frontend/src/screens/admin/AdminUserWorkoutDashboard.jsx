import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  ListGroup,
  Alert,
  Table,
  Form,
} from 'react-bootstrap';
import {
  FaDumbbell,
  FaWeight,
  FaRunning,
  FaFire,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaClock,
  FaUser,
  FaChartLine,
  FaArrowLeft,
  FaTrophy,
  FaBullseye,
} from 'react-icons/fa';
import {
  format,
  subDays,
  isSameDay,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  getWeek,
  startOfWeek,
  endOfWeek,
  addDays,
  isWithinInterval,
} from 'date-fns';
import { useSelector } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import Meta from '../../components/Meta';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import ExpandableSessionCard from '../../components/ExpandableSessionCard';
import Select from 'react-select';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  LineChart,
  Line as RechartsLine,
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie as RechartsPie,
  Cell,
} from 'recharts';
import { useGetUserDetailsQuery } from '../../slices/usersApiSlice';
import { useGetAdminUserWorkoutEntriesQuery } from '../../slices/workoutApiSlice';
import {
  groupWorkoutsIntoSessions,
  groupSessionsByDate,
} from '../../utils/sessionGrouping';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminUserWorkoutDashboard = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();

  // Validate userId as a MongoDB ObjectId
  const validUserId =
    userId && userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null;

  // Use the same theme approach as working pages
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  // Track window size for responsive design
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const { userInfo } = useSelector((state) => state.auth);

  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSessionView, setShowSessionView] = useState(true);
  
  // State for exercise comparison
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [comparisonMetric, setComparisonMetric] = useState('maxWeight'); // 'maxWeight', 'totalReps', 'frequency'

  // Automatically group workouts into sessions
  const groupedSessions = useMemo(() => {
    if (!workouts) return [];
    return groupWorkoutsIntoSessions(workouts, 60); // 1 hour time window
  }, [workouts]);

  const sessionsByDate = useMemo(() => {
    return groupSessionsByDate(groupedSessions);
  }, [groupedSessions]);

  // Listen for theme changes like the working pages
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          setIsDarkMode(
            document.documentElement.getAttribute('data-theme') === 'dark'
          );
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Listen for window resize events
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define AMOLED theme colors like the working page
  const amoledColors = {
    background: isDarkMode ? '#000000' : '#ffffff',
    cardBg: isDarkMode ? '#0D0D0D' : '#ffffff',
    text: isDarkMode ? '#E2E8F0' : '#1A202C',
    textSecondary: isDarkMode ? '#94A3B8' : '#4A5568',
    textMuted: isDarkMode ? '#64748B' : '#6B7280',
    accent: isDarkMode ? '#A855F7' : '#6E44B2', // Purple accent
    accentHover: isDarkMode ? '#9333EA' : '#5E3A98',
    border: isDarkMode ? '#1E1E1E' : '#E2E8F0',
    headerBg: isDarkMode ? '#111111' : '#F8FAFC',
    chartColors: {
      purple: isDarkMode ? '#A855F7' : '#8B5CF6',
      blue: isDarkMode ? '#60A5FA' : '#3B82F6',
      cyan: isDarkMode ? '#22D3EE' : '#06B6D4',
      green: isDarkMode ? '#34D399' : '#10B981',
      orange: isDarkMode ? '#FBBF24' : '#F59E0B',
      red: isDarkMode ? '#F87171' : '#EF4444',
    },
  };

  const cardStyle = {
    backgroundColor: amoledColors.cardBg,
    color: amoledColors.text,
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: isDarkMode
      ? '0 8px 32px rgba(0, 0, 0, 0.8), 0 4px 16px rgba(0, 0, 0, 0.6)'
      : '0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
    border: `1px solid ${amoledColors.border}`,
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
  };

  const headerCardStyle = {
    ...cardStyle,
    background: isDarkMode
      ? 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)'
      : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)',
    border: isDarkMode
      ? `2px solid ${amoledColors.chartColors.blue}`
      : '2px solid #0ea5e9',
  };

  const metricCardStyle = {
    ...cardStyle,
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  // Use RTK Query hooks with admin-specific query
  const {
    data: workoutsData = [],
    isLoading: workoutsLoading,
    error: workoutsError,
  } = useGetAdminUserWorkoutEntriesQuery(validUserId, {
    skip: !validUserId || !userInfo,
  });

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useGetUserDetailsQuery(validUserId, {
    skip: !validUserId || !userInfo,
  });

  useEffect(() => {
    if (workoutsData) {
      setWorkouts(workoutsData);
    }
    if (userData) {
      setUser(userData);
    }
    setLoading(workoutsLoading || userLoading);
    setError(workoutsError || userError);
  }, [
    workoutsData,
    userData,
    workoutsLoading,
    userLoading,
    workoutsError,
    userError,
  ]);

  // Calculate workout streak
  // Generate exercise options for comparison
  const exerciseOptions = useMemo(() => {
    if (!workouts) return [];

    // Extract unique product names and IDs
    const uniqueProducts = {};
    workouts.forEach((workout) => {
      const { _id, name } = workout.product;
      if (!uniqueProducts[_id]) {
        uniqueProducts[_id] = { label: name, value: _id };
      }
    });

    return Object.values(uniqueProducts);
  }, [workouts]);

  // Custom styles for react-select to match theme
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: amoledColors.cardBg,
      borderColor: amoledColors.border,
      color: amoledColors.text,
      minHeight: '42px',
      boxShadow: state.isFocused
        ? `0 0 0 2px ${amoledColors.accent}33`
        : 'none',
      borderRadius: '8px',
      '&:hover': {
        borderColor: amoledColors.accent,
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '8px 12px',
      color: amoledColors.text,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: amoledColors.text,
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode
        ? `${amoledColors.accent}25`
        : `${amoledColors.accent}15`,
      borderRadius: '6px',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: amoledColors.text,
      fontWeight: '500',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: amoledColors.textSecondary,
      '&:hover': {
        backgroundColor: isDarkMode
          ? `${amoledColors.accent}35`
          : `${amoledColors.accent}25`,
        color: amoledColors.text,
      },
    }),
    input: (provided) => ({
      ...provided,
      color: amoledColors.text,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: amoledColors.textMuted,
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: amoledColors.cardBg,
      border: `1px solid ${amoledColors.border}`,
      borderRadius: '8px',
      boxShadow: isDarkMode
        ? '0 8px 25px rgba(0, 0, 0, 0.5)'
        : '0 8px 25px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '8px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? amoledColors.accent
        : state.isFocused
        ? isDarkMode
          ? `${amoledColors.accent}20`
          : `${amoledColors.accent}10`
        : 'transparent',
      color: state.isSelected ? '#ffffff' : amoledColors.text,
      borderRadius: '6px',
      margin: '2px 0',
      padding: '10px 12px',
      cursor: 'pointer',
      fontWeight: state.isSelected ? '600' : '400',
      '&:active': {
        backgroundColor: amoledColors.accent,
        color: '#ffffff',
      },
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: amoledColors.border,
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: amoledColors.textSecondary,
      '&:hover': {
        color: amoledColors.accent,
      },
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: amoledColors.textSecondary,
      '&:hover': {
        color: amoledColors.accent,
      },
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: amoledColors.textMuted,
    }),
    loadingMessage: (provided) => ({
      ...provided,
      color: amoledColors.textMuted,
    }),
  };

  // Generate comparison data for selected exercises
  const exerciseComparisonData = useMemo(() => {
    if (!workouts || selectedExercises.length === 0)
      return { labels: [], datasets: [] };

    // Get the last 6 workouts for each selected exercise
    const comparisonData = {};

    selectedExercises.forEach((exerciseId) => {
      const exerciseWorkouts = workouts
        .filter((workout) => workout.product._id === exerciseId)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-6); // Last 6 workouts

      if (exerciseWorkouts.length === 0) return;

      const exerciseName = exerciseWorkouts[0].product.name;
      const dates = exerciseWorkouts.map((w) =>
        format(new Date(w.date), 'MM/dd')
      );

      // Extract the appropriate metric based on the selected comparison metric
      let metricData;

      if (comparisonMetric === 'maxWeight') {
        metricData = exerciseWorkouts.map((workout) => {
          const sets = workout.sets || [];
          return Math.max(...sets.map((set) => set.weight || 0), 0);
        });
      } else if (comparisonMetric === 'totalReps') {
        metricData = exerciseWorkouts.map((workout) => {
          const sets = workout.sets || [];
          return sets.reduce((sum, set) => sum + (set.reps || 0), 0);
        });
      } else {
        // frequency
        // This would need weekly frequency data which would require more complex processing
        metricData = exerciseWorkouts.map(() => 1); // Placeholder
      }

      comparisonData[exerciseId] = {
        name: exerciseName,
        dates,
        data: metricData,
      };
    });

    // Find the union of all dates for the x-axis
    const allDates = new Set();
    Object.values(comparisonData).forEach((item) => {
      item.dates.forEach((date) => allDates.add(date));
    });
    const sortedDates = Array.from(allDates).sort();

    // Create the datasets
    const datasets = Object.entries(comparisonData).map(([id, data], index) => {
      // Generate a color based on the index
      const colors = [
        amoledColors.chartColors.blue,
        amoledColors.chartColors.red,
        amoledColors.chartColors.green,
        amoledColors.chartColors.orange,
        amoledColors.chartColors.purple,
        '#EC4899', // Pink
      ];

      // Map data to all dates, filling with null for missing dates
      const dataPoints = sortedDates.map((date) => {
        const dateIndex = data.dates.indexOf(date);
        return dateIndex >= 0 ? data.data[dateIndex] : null;
      });

      return {
        label: data.name,
        data: dataPoints,
        borderColor: colors[index % colors.length],
        backgroundColor: `${colors[index % colors.length]}33`, // Add alpha for transparency
        tension: 0.1,
      };
    });

    return {
      labels: sortedDates,
      datasets,
    };
  }, [workouts, selectedExercises, comparisonMetric]);

  const calculateWorkoutStreak = useMemo(() => {
    if (!workouts || workouts.length === 0) return 0;

    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const mostRecentWorkout = sortedWorkouts[0];
    const mostRecentDate = new Date(mostRecentWorkout.date);
    const today = new Date();

    if (differenceInDays(today, mostRecentDate) > 1) {
      return 0;
    }

    let streak = 1;
    let currentDate = mostRecentDate;

    for (let i = 1; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].date);

      if (isSameDay(workoutDate, currentDate)) {
        continue;
      }

      if (differenceInDays(currentDate, workoutDate) === 1) {
        streak++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }

    return streak;
  }, [workouts]);

  // Weekly workout data (last 8 weeks)
  const weeklyWorkoutData = useMemo(() => {
    if (!workouts || workouts.length === 0)
      return {
        labels: [],
        datasets: [],
      };

    const today = new Date();
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const weekEnd = subDays(today, i * 7);
      const weekStart = subDays(weekEnd, 6);
      return {
        label: `Week ${8 - i}`,
        start: weekStart,
        end: weekEnd,
        count: 0,
        totalWeight: 0,
      };
    }).reverse();

    workouts.forEach((workout) => {
      const workoutDate = new Date(workout.date);
      weeks.forEach((week) => {
        if (workoutDate >= week.start && workoutDate <= week.end) {
          week.count++;
          week.totalWeight +=
            workout.sets?.reduce((sum, set) => sum + (set.weight || 0), 0) || 0;
        }
      });
    });

    return {
      labels: weeks.map((week) => week.label),
      datasets: [
        {
          label: 'Workouts',
          data: weeks.map((week) => week.count),
          backgroundColor: amoledColors.chartColors.purple,
          borderColor: amoledColors.chartColors.blue,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Weight (kg)',
          data: weeks.map((week) => Math.round(week.totalWeight)),
          backgroundColor: amoledColors.chartColors.cyan,
          borderColor: amoledColors.chartColors.green,
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };
  }, [workouts, amoledColors]);

  // Remove unused data calculations
  const monthlyTrendData = useMemo(() => {
    if (!workouts || workouts.length === 0)
      return {
        labels: [],
        datasets: [],
      };

    const today = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(today, i);
      return {
        label: format(date, 'MMM yyyy'),
        start: startOfMonth(date),
        end: endOfMonth(date),
        count: 0,
        totalReps: 0,
        maxWeight: 0,
      };
    }).reverse();

    workouts.forEach((workout) => {
      const workoutDate = new Date(workout.date);
      months.forEach((month) => {
        if (workoutDate >= month.start && workoutDate <= month.end) {
          month.count++;

          if (workout.sets && Array.isArray(workout.sets)) {
            const workoutMaxWeight = Math.max(
              ...workout.sets.map((set) => set.weight || 0)
            );
            const workoutTotalReps = workout.sets.reduce(
              (sum, set) => sum + (set.reps || 0),
              0
            );

            month.maxWeight = Math.max(month.maxWeight, workoutMaxWeight);
            month.totalReps += workoutTotalReps;
          }
        }
      });
    });

    return {
      labels: months.map((month) => month.label),
      datasets: [
        {
          label: 'Monthly Workouts',
          data: months.map((month) => month.count),
          borderColor: amoledColors.chartColors.purple,
          backgroundColor: isDarkMode
            ? 'rgba(168, 85, 247, 0.1)'
            : 'rgba(168, 85, 247, 0.05)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: amoledColors.chartColors.purple,
          pointBorderColor: amoledColors.chartColors.purple,
          pointHoverBackgroundColor: amoledColors.chartColors.purple,
          pointHoverBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  }, [workouts, amoledColors, isDarkMode]);

  const stats = useMemo(() => {
    if (!workouts || workouts.length === 0)
      return {
        totalWorkouts: 0,
        totalSets: 0,
        totalReps: 0,
        maxWeightEver: 0,
        avgWeightPerSet: 0,
        avgRepsPerSet: 0,
        totalDays: 0,
        uniqueExercises: 0,
        personalRecords: 0,
      };

    const totalWorkouts = workouts.length;
    let totalSets = 0;
    let totalReps = 0;
    let totalWeightLifted = 0;
    let maxWeightEver = 0;
    const uniqueExercises = new Set();
    const uniqueDates = new Set();
    const exerciseRecords = {}; // Track max weight per exercise

    workouts.forEach((workout) => {
      const exerciseId = workout.product?._id || workout.product;
      uniqueExercises.add(exerciseId);
      uniqueDates.add(format(new Date(workout.date), 'yyyy-MM-dd'));

      if (workout.sets && Array.isArray(workout.sets)) {
        totalSets += workout.sets.length;
        workout.sets.forEach((set) => {
          const weight = set.weight || 0;
          const reps = set.reps || 0;

          // Track actual weight lifted (not multiplied by reps)
          if (weight > 0) {
            totalWeightLifted += weight;
            maxWeightEver = Math.max(maxWeightEver, weight);

            // Track personal records per exercise
            if (
              !exerciseRecords[exerciseId] ||
              weight > exerciseRecords[exerciseId]
            ) {
              exerciseRecords[exerciseId] = weight;
            }
          }

          totalReps += reps;
        });
      }
    });

    return {
      totalWorkouts,
      totalSets,
      totalReps,
      maxWeightEver: Math.round(maxWeightEver),
      avgWeightPerSet:
        totalSets > 0 ? Math.round(totalWeightLifted / totalSets) : 0,
      avgRepsPerSet: totalSets > 0 ? Math.round(totalReps / totalSets) : 0,
      totalDays: uniqueDates.size,
      uniqueExercises: uniqueExercises.size,
      personalRecords: Object.keys(exerciseRecords).length,
    };
  }, [workouts]);

  // Activity level and insights
  const activityInsights = useMemo(() => {
    if (!workouts || workouts.length === 0)
      return {
        level: 'Inactive',
        color: amoledColors.chartColors.red,
        daysSinceLastWorkout: null,
        weeklyAverage: 0,
        consistencyScore: 0,
        progressTrend: 'Unknown',
      };

    const today = new Date();
    const lastWorkout =
      workouts.length > 0
        ? new Date(Math.max(...workouts.map((w) => new Date(w.date))))
        : null;

    const daysSinceLastWorkout = lastWorkout
      ? differenceInDays(today, lastWorkout)
      : null;

    // Weekly average (last 4 weeks)
    const fourWeeksAgo = subDays(today, 28);
    const recentWorkouts = workouts.filter(
      (workout) => new Date(workout.date) >= fourWeeksAgo
    );
    const weeklyAverage = recentWorkouts.length / 4;

    // Consistency score (0-100)
    const consistencyScore = Math.min(
      100,
      Math.round((weeklyAverage / 4) * 100)
    );

    // Activity level
    let level = 'Inactive';
    let color = amoledColors.chartColors.red;

    if (daysSinceLastWorkout === null) {
      level = 'Never Active';
      color = amoledColors.textMuted;
    } else if (daysSinceLastWorkout <= 2) {
      level = 'Very Active';
      color = amoledColors.chartColors.green;
    } else if (daysSinceLastWorkout <= 7) {
      level = 'Active';
      color = amoledColors.chartColors.orange;
    } else if (daysSinceLastWorkout <= 14) {
      level = 'Low Activity';
      color = amoledColors.chartColors.orange;
    }

    // Progress trend
    const twoWeeksAgo = subDays(today, 14);
    const fourWeeksAgoDate = subDays(today, 28);

    const lastTwoWeeks = workouts.filter(
      (workout) => new Date(workout.date) >= twoWeeksAgo
    ).length;

    const previousTwoWeeks = workouts.filter((workout) => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= fourWeeksAgoDate && workoutDate < twoWeeksAgo;
    }).length;

    let progressTrend = 'Stable';
    if (lastTwoWeeks > previousTwoWeeks) {
      progressTrend = 'Improving';
    } else if (lastTwoWeeks < previousTwoWeeks) {
      progressTrend = 'Declining';
    }

    return {
      level,
      color,
      daysSinceLastWorkout,
      weeklyAverage: Math.round(weeklyAverage * 10) / 10,
      consistencyScore,
      progressTrend,
      lastTwoWeeks,
      previousTwoWeeks,
    };
  }, [workouts, amoledColors]);

  // Advanced Analytics for Coaching Insights
  const coachingInsights = useMemo(() => {
    if (!workouts || workouts.length === 0)
      return {
        firstWorkout: null,
        mostRecent: null,
        avgWeightPerWorkout: 0,
        avgRepsPerSet: 0,
        exerciseVariety: 0,
        consistencyRating: 'Poor',
        recommendations: [],
        performanceMetrics: {
          strengthTrend: 'Unknown',
          intensityTrend: 'Unknown',
          frequencyTrend: 'Unknown',
        },
      };

    // Basic dates and metrics
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const firstWorkout = sortedWorkouts[0];
    const mostRecent = sortedWorkouts[sortedWorkouts.length - 1];

    // Performance calculations - Focus on practical metrics
    let totalWeightLifted = 0;
    let totalReps = 0;
    let totalSets = 0;
    let maxWeightEver = 0;
    const exerciseSet = new Set();
    const exerciseMaxWeights = {}; // Track max weight per exercise

    // Group by weeks for trend analysis
    const weekGroups = {};
    workouts.forEach((workout) => {
      const week = format(startOfWeek(new Date(workout.date)), 'yyyy-MM-dd');
      if (!weekGroups[week]) {
        weekGroups[week] = {
          count: 0,
          maxWeight: 0,
          totalReps: 0,
          avgWeight: 0,
        };
      }
      weekGroups[week].count++;

      const exerciseId = workout.product?._id || workout.product;
      exerciseSet.add(exerciseId);

      if (workout.sets && Array.isArray(workout.sets)) {
        let workoutMaxWeight = 0;
        workout.sets.forEach((set) => {
          const weight = set.weight || 0;
          const reps = set.reps || 0;

          if (weight > 0) {
            totalWeightLifted += weight;
            maxWeightEver = Math.max(maxWeightEver, weight);
            workoutMaxWeight = Math.max(workoutMaxWeight, weight);

            // Track max weight per exercise
            if (
              !exerciseMaxWeights[exerciseId] ||
              weight > exerciseMaxWeights[exerciseId]
            ) {
              exerciseMaxWeights[exerciseId] = weight;
            }
          }

          totalReps += reps;
          totalSets++;
        });

        weekGroups[week].maxWeight = Math.max(
          weekGroups[week].maxWeight,
          workoutMaxWeight
        );
        weekGroups[week].totalReps += workout.sets.reduce(
          (sum, set) => sum + (set.reps || 0),
          0
        );
      }
    });

    // Calculate trends based on practical metrics
    const weeks = Object.values(weekGroups).slice(-8); // Last 8 weeks
    const strengthTrend =
      weeks.length >= 4
        ? weeks.slice(-2).reduce((sum, w) => sum + w.maxWeight, 0) / 2 >
          weeks.slice(0, 2).reduce((sum, w) => sum + w.maxWeight, 0) / 2
          ? 'Improving'
          : 'Declining'
        : 'Stable';

    const frequencyTrend =
      weeks.length >= 4
        ? weeks.slice(-2).reduce((sum, w) => sum + w.count, 0) >
          weeks.slice(0, 2).reduce((sum, w) => sum + w.count, 0)
          ? 'Improving'
          : 'Declining'
        : 'Stable';

    // Generate recommendations
    const recommendations = [];
    const avgWeightPerSet = totalSets > 0 ? totalWeightLifted / totalSets : 0;
    const avgRepsPerSet = totalSets > 0 ? totalReps / totalSets : 0;
    const exerciseVariety = exerciseSet.size;

    // Weekly frequency analysis
    const weeklyFreq = activityInsights.weeklyAverage;
    if (weeklyFreq < 2) {
      recommendations.push({
        type: 'frequency',
        priority: 'high',
        title: 'Increase Training Frequency',
        message: 'Consider training 3-4 times per week for better results',
        icon: '📅',
      });
    }

    if (exerciseVariety < 5) {
      recommendations.push({
        type: 'variety',
        priority: 'medium',
        title: 'Add Exercise Variety',
        message:
          'Try incorporating more exercise types for balanced development',
        icon: '🎯',
      });
    }

    if (strengthTrend === 'Declining') {
      recommendations.push({
        type: 'strength',
        priority: 'high',
        title: 'Strength Declining',
        message: 'Consider progressive overload to maintain gains',
        icon: '📈',
      });
    }

    if (calculateWorkoutStreak === 0) {
      recommendations.push({
        type: 'consistency',
        priority: 'urgent',
        title: 'Resume Training',
        message: 'Get back to consistent training for optimal results',
        icon: '🔥',
      });
    }

    if (avgRepsPerSet > 15) {
      recommendations.push({
        type: 'intensity',
        priority: 'medium',
        title: 'Consider Higher Intensity',
        message: 'Try heavier weights with 8-12 reps for strength gains',
        icon: '💪',
      });
    }

    // Consistency rating
    let consistencyRating = 'Poor';
    if (activityInsights.consistencyScore >= 80)
      consistencyRating = 'Excellent';
    else if (activityInsights.consistencyScore >= 60)
      consistencyRating = 'Good';
    else if (activityInsights.consistencyScore >= 40)
      consistencyRating = 'Fair';

    return {
      firstWorkout: firstWorkout
        ? format(new Date(firstWorkout.date), 'MMM dd, yyyy')
        : null,
      mostRecent: mostRecent
        ? format(new Date(mostRecent.date), 'MMM dd, yyyy')
        : null,
      avgWeightPerSet: Math.round(avgWeightPerSet / 2.205), // Convert to kg
      maxWeightEver: Math.round(maxWeightEver / 2.205), // Convert to kg
      avgRepsPerSet: Math.round(avgRepsPerSet),
      exerciseVariety,
      consistencyRating,
      recommendations: recommendations.slice(0, 4), // Top 4 recommendations
      performanceMetrics: {
        strengthTrend,
        intensityTrend:
          maxWeightEver > 110
            ? 'High'
            : maxWeightEver > 55
            ? 'Moderate'
            : 'Low', // Based on max weight in lbs
        frequencyTrend,
      },
    };
  }, [workouts, activityInsights, calculateWorkoutStreak]);

  const chartContainerStyle = {
    ...cardStyle,
    padding: '0',
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: amoledColors.text,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: isDarkMode
          ? 'rgba(0, 0, 0, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
        titleColor: amoledColors.text,
        bodyColor: amoledColors.textSecondary,
        borderColor: amoledColors.border,
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        ticks: {
          color: amoledColors.textSecondary,
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
        },
        grid: {
          color: amoledColors.border,
          lineWidth: 1,
        },
        border: {
          color: amoledColors.border,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          color: amoledColors.textSecondary,
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
        },
        grid: {
          color: amoledColors.border,
          lineWidth: 1,
        },
        border: {
          color: amoledColors.border,
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: {
          color: amoledColors.textSecondary,
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        border: {
          color: amoledColors.border,
        },
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: amoledColors.cardBg,
        borderColor: amoledColors.chartColors.purple,
      },
    },
    scales: {
      x: {
        ...chartOptions.scales.x,
      },
      y: {
        ...chartOptions.scales.y,
        position: 'left',
      },
    },
  };

  if (loading) return <Loader />;

  if (workoutsError || userError) {
    const workoutErrorMessage =
      workoutsError?.data?.message ||
      workoutsError?.message ||
      workoutsError?.error;
    const userErrorMessage =
      userError?.data?.message || userError?.message || userError?.error;

    return (
      <Container fluid className='py-5 px-1'>
        {workoutsError && (
          <Alert variant='danger' className='mb-3'>
            <h6>Workout Data Error:</h6>
            {workoutErrorMessage || 'Failed to load workout data'}
          </Alert>
        )}
        {userError && (
          <Alert variant='danger' className='mb-3'>
            <h6>User Data Error:</h6>
            {userErrorMessage || 'Failed to load user data'}
          </Alert>
        )}
        <LinkContainer to='/admin/workouts'>
          <Button
            variant='outline-danger'
            size='sm'
            style={{
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
            }}
          >
            <FaArrowLeft
              className='me-1'
              style={{ fontSize: isMobile ? '0.7rem' : '1rem' }}
            />
            {isMobile ? 'Back' : 'Back to Dashboard'}
          </Button>
        </LinkContainer>
      </Container>
    );
  }

  if (!validUserId) {
    return (
      <Container fluid className='py-5 px-1'>
        <Alert variant='danger'>
          <h5>Invalid User ID</h5>
          <p>
            The user ID provided is not valid. Please go back and try again.
          </p>
          <LinkContainer to='/admin/workouts'>
            <Button
              variant='outline-danger'
              size='sm'
              style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
              }}
            >
              <FaArrowLeft
                className='me-1'
                style={{ fontSize: isMobile ? '0.7rem' : '1rem' }}
              />
              {isMobile ? 'Back' : 'Back to Dashboard'}
            </Button>
          </LinkContainer>
        </Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container fluid className='py-5 px-1'>
        <Alert variant='warning'>
          <h5>User Not Found</h5>
          <p>The user with ID {validUserId} was not found in the system.</p>
          <LinkContainer to='/admin/workouts'>
            <Button
              variant='outline-warning'
              size='sm'
              style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
              }}
            >
              <FaArrowLeft
                className='me-1'
                style={{ fontSize: isMobile ? '0.7rem' : '1rem' }}
              />
              {isMobile ? 'Back' : 'Back to Dashboard'}
            </Button>
          </LinkContainer>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className='py-2 px-1'>
      <Meta title={`${user?.name || 'User'}'s Workout Dashboard`} />

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          {/* Simplified Admin Header */}
          <Card
            className='mb-4'
            style={{
              ...headerCardStyle,
              background: isDarkMode ? '#000000' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#1a1a1a' : '#e5e7eb'}`,
              borderRadius: '12px',
            }}
          >
            <Card.Body style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
              <div className='text-center'>
                {/* User Name Title */}
                <h1
                  style={{
                    color: isDarkMode ? '#ffffff' : '#1a202c',
                    fontSize: isMobile ? '2.25rem' : '3.5rem',
                    fontWeight: '700',
                    marginBottom: isMobile ? '1.5rem' : '2rem',
                    letterSpacing: isMobile ? '-0.5px' : '-1px',
                    lineHeight: isMobile ? '1.2' : '1.1',
                  }}
                >
                  {user?.name}'s Analytics
                </h1>

                {/* View Toggle Buttons */}
                <div
                  className={`d-flex justify-content-center ${
                    isMobile ? 'gap-2 mb-3' : 'gap-4 mb-5'
                  }`}
                >
                  <Button
                    variant={!showSessionView ? 'primary' : 'outline-primary'}
                    size={isMobile ? 'sm' : 'lg'}
                    onClick={() => setShowSessionView(false)}
                    style={{
                      borderRadius: '6px',
                      fontWeight: '600',
                      border: `1px solid ${
                        isDarkMode ? '#3B82F6' : '#2563EB'
                      }`,
                      padding: isMobile ? '0.5rem 1rem' : '1rem 2.5rem',
                      fontSize: isMobile ? '0.875rem' : '1.1rem',
                      minWidth: isMobile ? '110px' : '180px',
                      boxShadow: !showSessionView
                        ? '0 2px 4px rgba(59, 130, 246, 0.2)'
                        : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Traditional
                  </Button>
                  <Button
                    variant={showSessionView ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setShowSessionView(true)}
                    style={{
                      borderRadius: '6px',
                      fontWeight: '600',
                      border: `1px solid ${
                        isDarkMode ? '#3B82F6' : '#2563EB'
                      }`,
                      padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem',
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      minWidth: isMobile ? '80px' : '120px',
                      boxShadow: showSessionView
                        ? '0 2px 4px rgba(59, 130, 246, 0.2)'
                        : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Sessions
                  </Button>
                </div>

                {/* User Info - Mobile Compact */}
                {/* Stats Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: isMobile ? '0.5rem' : '0.75rem',
                  marginTop: '0.75rem'
                }}>
                  {/* Total Workouts */}
                  <div style={{
                    background: isDarkMode ? '#111827' : '#F8FAFC',
                    border: `1px solid ${isDarkMode ? '#1F2937' : '#E2E8F0'}`,
                    borderRadius: '8px',
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    textAlign: 'center'
                  }}>
                    <div
                      style={{
                        color: isDarkMode ? '#60A5FA' : '#2563EB',
                        fontSize: isMobile ? '1.25rem' : '1.5rem',
                        fontWeight: '700',
                        lineHeight: 1,
                        marginBottom: '0.25rem',
                      }}
                    >
                      {workouts?.length || 0}
                    </div>
                    <div
                      style={{
                        color: isDarkMode ? '#94A3B8' : '#6B7280',
                        fontSize: isMobile ? '0.65rem' : '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Workouts
                    </div>
                  </div>

                  {/* Current Streak */}
                  <div style={{
                    background: isDarkMode ? '#111827' : '#F8FAFC',
                    border: `1px solid ${isDarkMode ? '#1F2937' : '#E2E8F0'}`,
                    borderRadius: '8px',
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    textAlign: 'center'
                  }}>
                    <div
                      style={{
                        color: isDarkMode ? '#34D399' : '#059669',
                        fontSize: isMobile ? '1.25rem' : '1.5rem',
                        fontWeight: '700',
                        lineHeight: 1,
                        marginBottom: '0.25rem',
                      }}
                    >
                      {calculateWorkoutStreak}
                    </div>
                    <div
                      style={{
                        color: isDarkMode ? '#94A3B8' : '#6B7280',
                        fontSize: isMobile ? '0.65rem' : '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Streak
                    </div>
                  </div>

                  {/* Exercise Types */}
                  <div style={{
                    background: isDarkMode ? '#111827' : '#F8FAFC',
                    border: `1px solid ${isDarkMode ? '#1F2937' : '#E2E8F0'}`,
                    borderRadius: '8px',
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    textAlign: 'center'
                  }}>
                    <div
                      style={{
                        color: isDarkMode ? '#FBBF24' : '#D97706',
                        fontSize: isMobile ? '1.25rem' : '1.5rem',
                        fontWeight: '700',
                        lineHeight: 1,
                        marginBottom: '0.25rem',
                      }}
                    >
                      {stats.uniqueExercises}
                    </div>
                    <div
                      style={{
                        color: isDarkMode ? '#94A3B8' : '#6B7280',
                        fontSize: isMobile ? '0.65rem' : '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Exercises
                    </div>
                  </div>

                  {/* Joined Date */}
                  <div style={{
                    background: isDarkMode ? '#111827' : '#F8FAFC',
                    border: `1px solid ${isDarkMode ? '#1F2937' : '#E2E8F0'}`,
                    borderRadius: '8px',
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      <FaCalendarAlt
                        style={{
                          color: isDarkMode ? '#60A5FA' : '#3B82F6',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                        }}
                      />
                      <span
                        style={{
                          color: isDarkMode ? '#E5E7EB' : '#374151',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          fontWeight: '600',
                        }}
                      >
                        {format(new Date(user?.createdAt || new Date()), 'MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Conditional rendering based on session view toggle */}
          {showSessionView ? (
            <>
              {/* Session-Based View */}
              {/* Enhanced Overview Statistics */}
              <Row className='mb-5'>
                <Col xs={6} md={3} className='mb-3'>
                  <Card className='h-100 text-center' style={metricCardStyle}>
                    <Card.Body className='d-flex flex-column justify-content-center p-3'>
                      <div
                        className='mb-3'
                        style={{
                          color: amoledColors.chartColors.purple,
                          background: isDarkMode
                            ? 'rgba(168, 85, 247, 0.2)'
                            : 'rgba(168, 85, 247, 0.08)',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: isDarkMode
                            ? '2px solid rgba(168, 85, 247, 0.5)'
                            : '2px solid rgba(168, 85, 247, 0.2)',
                          boxShadow: isDarkMode
                            ? '0 4px 12px rgba(168, 85, 247, 0.3)'
                            : '0 4px 12px rgba(168, 85, 247, 0.1)',
                        }}
                      >
                        <FaDumbbell size={24} />
                      </div>
                      <h6
                        className='mb-1'
                        style={{
                          fontSize: '0.75rem',
                          color: amoledColors.textMuted,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Total Sessions
                      </h6>
                      <h2
                        className='mb-1'
                        style={{
                          color: amoledColors.text,
                          fontWeight: '700',
                          fontSize: '1.8rem',
                        }}
                      >
                        {groupedSessions?.length || 0}
                      </h2>
                      <small
                        style={{
                          color: amoledColors.textMuted,
                          fontSize: '0.7rem',
                        }}
                      >
                        workout sessions
                      </small>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={6} md={3} className='mb-3'>
                  <Card className='h-100 text-center' style={metricCardStyle}>
                    <Card.Body className='d-flex flex-column justify-content-center p-3'>
                      <div
                        className='mb-3'
                        style={{
                          color: amoledColors.chartColors.green,
                          background: isDarkMode
                            ? 'rgba(52, 211, 153, 0.2)'
                            : 'rgba(52, 211, 153, 0.08)',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: isDarkMode
                            ? '2px solid rgba(52, 211, 153, 0.5)'
                            : '2px solid rgba(52, 211, 153, 0.2)',
                          boxShadow: isDarkMode
                            ? '0 4px 12px rgba(52, 211, 153, 0.3)'
                            : '0 4px 12px rgba(52, 211, 153, 0.1)',
                        }}
                      >
                        <FaTrophy size={24} />
                      </div>
                      <h6
                        className='mb-1'
                        style={{
                          fontSize: '0.75rem',
                          color: amoledColors.textMuted,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Max Weight
                      </h6>
                      <h2
                        className='mb-1'
                        style={{
                          color: amoledColors.text,
                          fontWeight: '700',
                          fontSize: '1.8rem',
                        }}
                      >
                        {groupedSessions.length > 0
                          ? Math.round(
                              Math.max(
                                ...groupedSessions.map((s) => s.maxWeight || 0)
                              ) / 2.205
                            )
                          : 0}
                      </h2>
                      <small
                        style={{
                          color: amoledColors.textMuted,
                          fontSize: '0.7rem',
                        }}
                      >
                        kg lifted
                      </small>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={6} md={3} className='mb-3'>
                  <Card className='h-100 text-center' style={metricCardStyle}>
                    <Card.Body className='d-flex flex-column justify-content-center p-3'>
                      <div
                        className='mb-3'
                        style={{
                          color: amoledColors.chartColors.blue,
                          background: isDarkMode
                            ? 'rgba(96, 165, 250, 0.2)'
                            : 'rgba(96, 165, 250, 0.08)',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: isDarkMode
                            ? '2px solid rgba(96, 165, 250, 0.5)'
                            : '2px solid rgba(96, 165, 250, 0.2)',
                          boxShadow: isDarkMode
                            ? '0 4px 12px rgba(96, 165, 250, 0.3)'
                            : '0 4px 12px rgba(96, 165, 250, 0.1)',
                        }}
                      >
                        <FaWeight size={24} />
                      </div>
                      <h6
                        className='mb-1'
                        style={{
                          fontSize: '0.75rem',
                          color: amoledColors.textMuted,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Total Reps
                      </h6>
                      <h2
                        className='mb-1'
                        style={{
                          color: amoledColors.text,
                          fontWeight: '700',
                          fontSize: '1.8rem',
                        }}
                      >
                        {groupedSessions
                          .reduce((sum, s) => sum + s.totalReps, 0)
                          .toLocaleString()}
                      </h2>
                      <small
                        style={{
                          color: amoledColors.textMuted,
                          fontSize: '0.7rem',
                        }}
                      >
                        reps total
                      </small>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={6} md={3} className='mb-3'>
                  <Card className='h-100 text-center' style={metricCardStyle}>
                    <Card.Body className='d-flex flex-column justify-content-center p-3'>
                      <div
                        className='mb-3'
                        style={{
                          color: amoledColors.chartColors.orange,
                          background: isDarkMode
                            ? 'rgba(251, 191, 36, 0.2)'
                            : 'rgba(251, 191, 36, 0.08)',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: isDarkMode
                            ? '2px solid rgba(251, 191, 36, 0.5)'
                            : '2px solid rgba(251, 191, 36, 0.2)',
                          boxShadow: isDarkMode
                            ? '0 4px 12px rgba(251, 191, 36, 0.3)'
                            : '0 4px 12px rgba(251, 191, 36, 0.1)',
                        }}
                      >
                        <FaCalendarAlt size={24} />
                      </div>
                      <h6
                        className='mb-1'
                        style={{
                          fontSize: '0.75rem',
                          color: amoledColors.textMuted,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        This Week
                      </h6>
                      <h2
                        className='mb-1'
                        style={{
                          color: amoledColors.text,
                          fontWeight: '700',
                          fontSize: '1.8rem',
                        }}
                      >
                        {
                          groupedSessions.filter((s) =>
                            isWithinInterval(new Date(s.startTime), {
                              start: startOfWeek(new Date()),
                              end: endOfWeek(new Date()),
                            })
                          ).length
                        }
                      </h2>
                      <small
                        style={{
                          color: amoledColors.textMuted,
                          fontSize: '0.7rem',
                        }}
                      >
                        sessions
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Daily Session Groups */}
              <Row className='mb-5'>
                <Col>
                  <Card style={cardStyle}>
                    <Card.Header
                      style={{
                        backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
                        borderBottom: `2px solid ${
                          isDarkMode ? '#111111' : '#e5e7eb'
                        }`,
                        padding: '1.5rem',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                        background: isDarkMode
                          ? 'linear-gradient(135deg, #000000 0%, #111111 100%)'
                          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      }}
                    >
                      <h5
                        className='m-0 d-flex align-items-center'
                        style={{ color: amoledColors.text, fontWeight: '600' }}
                      >
                        <div
                          style={{
                            background:
                              'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            borderRadius: '8px',
                            padding: '8px',
                            marginRight: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                          }}
                        >
                          <FaCalendarAlt
                            style={{ color: '#ffffff' }}
                            size={16}
                          />
                        </div>
                        Workout Sessions by Day
                      </h5>
                    </Card.Header>
                    <Card.Body style={{ padding: '0' }}>
                      {Object.entries(sessionsByDate)
                        .sort(([a], [b]) => new Date(b) - new Date(a))
                        .slice(0, 10)
                        .map(([dateKey, dayData]) => (
                          <div
                            key={dateKey}
                            style={{
                              borderBottom: `1px solid ${amoledColors.border}`,
                              padding: '1.5rem',
                            }}
                          >
                            <div className='d-flex justify-content-between align-items-center mb-3'>
                              <div>
                                <h6
                                  style={{
                                    color: amoledColors.text,
                                    fontWeight: '600',
                                    margin: 0,
                                  }}
                                >
                                  {dayData.displayDate}
                                </h6>
                                <div className='d-flex gap-2 mt-1'>
                                  <Badge
                                    bg={
                                      dayData.sessions.length >= 2
                                        ? 'success'
                                        : dayData.sessions.length === 1
                                        ? 'primary'
                                        : 'secondary'
                                    }
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '4px 8px',
                                      borderRadius: '12px',
                                    }}
                                  >
                                    {dayData.sessions.length}{' '}
                                    {dayData.sessions.length === 1
                                      ? 'session'
                                      : 'sessions'}
                                  </Badge>
                                  <Badge
                                    bg='info'
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '4px 8px',
                                      borderRadius: '12px',
                                    }}
                                  >
                                    {dayData.uniqueExercises} exercises
                                  </Badge>
                                </div>
                              </div>
                              <div className='text-end'>
                                <div
                                  style={{
                                    color: amoledColors.chartColors.blue,
                                    fontWeight: '700',
                                    fontSize: '1.2rem',
                                  }}
                                >
                                  {dayData.totalReps.toLocaleString()} reps
                                </div>
                                <small
                                  style={{ color: amoledColors.textMuted }}
                                >
                                  total reps
                                </small>
                              </div>
                            </div>

                            <Row>
                              <Col lg={12}>
                                {dayData.sessions.map((session, index) => (
                                  <ExpandableSessionCard
                                    key={session.id}
                                    session={session}
                                    dayData={dayData}
                                    isDarkMode={isDarkMode}
                                    amoledColors={amoledColors}
                                    onEditSession={(sessionId, updates) => {
                                      // Handle session editing - admin view is read-only
                                      console.log(
                                        'Admin view - session editing disabled:',
                                        sessionId,
                                        updates
                                      );
                                    }}
                                  />
                                ))}
                              </Col>
                            </Row>
                          </div>
                        ))}

                      {Object.keys(sessionsByDate).length === 0 && (
                        <div className='text-center py-5'>
                          <div style={{ color: amoledColors.textMuted }}>
                            <FaDumbbell size={48} className='mb-3 opacity-50' />
                            <p>No workout sessions found</p>
                            <small>
                              This user hasn't tracked any workouts yet
                            </small>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            <>
              {/* Traditional View - Comprehensive Analytics */}

              {/* Overview Statistics */}
              <Row className='mb-5'>
                <Col xs={6} md={3} className='mb-3'>
                  <Card className='h-100 text-center' style={metricCardStyle}>
                    <Card.Body className='d-flex flex-column justify-content-center p-3'>
                      <div
                        className='mb-3'
                        style={{
                          color: amoledColors.chartColors.purple,
                          background: isDarkMode
                            ? 'rgba(168, 85, 247, 0.2)'
                            : 'rgba(168, 85, 247, 0.08)',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: isDarkMode
                            ? '2px solid rgba(168, 85, 247, 0.5)'
                            : '2px solid rgba(168, 85, 247, 0.2)',
                          boxShadow: isDarkMode
                            ? '0 4px 12px rgba(168, 85, 247, 0.3)'
                            : '0 4px 12px rgba(168, 85, 247, 0.1)',
                        }}
                      >
                        <FaDumbbell size={24} />
                      </div>
                      <h6
                        className='mb-1'
                        style={{
                          fontSize: '0.75rem',
                          color: amoledColors.textMuted,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Total Workouts
                      </h6>
                      <h2
                        className='mb-1'
                        style={{
                          color: amoledColors.text,
                          fontWeight: '700',
                          fontSize: '1.8rem',
                        }}
                      >
                        {stats.totalWorkouts}
                      </h2>
                      <small
                        style={{
                          color: amoledColors.textMuted,
                          fontSize: '0.7rem',
                        }}
                      >
                        workout entries
                      </small>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={6} md={3} className='mb-3'>
                  <Card className='h-100 text-center' style={metricCardStyle}>
                    <Card.Body className='d-flex flex-column justify-content-center p-3'>
                      <div
                        className='mb-3'
                        style={{
                          color: amoledColors.chartColors.green,
                          background: isDarkMode
                            ? 'rgba(52, 211, 153, 0.2)'
                            : 'rgba(52, 211, 153, 0.08)',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: isDarkMode
                            ? '2px solid rgba(52, 211, 153, 0.5)'
                            : '2px solid rgba(52, 211, 153, 0.2)',
                          boxShadow: isDarkMode
                            ? '0 4px 12px rgba(52, 211, 153, 0.3)'
                            : '0 4px 12px rgba(52, 211, 153, 0.1)',
                        }}
                      >
                        <FaWeight size={24} />
                      </div>
                      <h6
                        className='mb-1'
                        style={{
                          fontSize: '0.75rem',
                          color: amoledColors.textMuted,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Total Reps
                      </h6>
                      <h2
                        className='mb-1'
                        style={{
                          color: amoledColors.text,
                          fontWeight: '700',
                          fontSize: '1.8rem',
                        }}
                      >
                        {stats.totalReps.toLocaleString()}
                      </h2>
                      <small
                        style={{
                          color: amoledColors.textMuted,
                          fontSize: '0.7rem',
                        }}
                      >
                        reps completed
                      </small>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={6} md={3} className='mb-3'>
                  <Card className='h-100 text-center' style={metricCardStyle}>
                    <Card.Body className='d-flex flex-column justify-content-center p-3'>
                      <div
                        className='mb-3'
                        style={{
                          color: amoledColors.chartColors.blue,
                          background: isDarkMode
                            ? 'rgba(96, 165, 250, 0.2)'
                            : 'rgba(96, 165, 250, 0.08)',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: isDarkMode
                            ? '2px solid rgba(96, 165, 250, 0.5)'
                            : '2px solid rgba(96, 165, 250, 0.2)',
                          boxShadow: isDarkMode
                            ? '0 4px 12px rgba(96, 165, 250, 0.3)'
                            : '0 4px 12px rgba(96, 165, 250, 0.1)',
                        }}
                      >
                        <FaFire size={24} />
                      </div>
                      <h6
                        className='mb-1'
                        style={{
                          fontSize: '0.75rem',
                          color: amoledColors.textMuted,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Current Streak
                      </h6>
                      <h2
                        className='mb-1'
                        style={{
                          color: amoledColors.text,
                          fontWeight: '700',
                          fontSize: '1.8rem',
                        }}
                      >
                        {calculateWorkoutStreak}
                      </h2>
                      <small
                        style={{
                          color: amoledColors.textMuted,
                          fontSize: '0.7rem',
                        }}
                      >
                        days in a row
                      </small>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={6} md={3} className='mb-3'>
                  <Card className='h-100 text-center' style={metricCardStyle}>
                    <Card.Body className='d-flex flex-column justify-content-center p-3'>
                      <div
                        className='mb-3'
                        style={{
                          color: amoledColors.chartColors.orange,
                          background: isDarkMode
                            ? 'rgba(251, 191, 36, 0.2)'
                            : 'rgba(251, 191, 36, 0.08)',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: isDarkMode
                            ? '2px solid rgba(251, 191, 36, 0.5)'
                            : '2px solid rgba(251, 191, 36, 0.2)',
                          boxShadow: isDarkMode
                            ? '0 4px 12px rgba(251, 191, 36, 0.3)'
                            : '0 4px 12px rgba(251, 191, 36, 0.1)',
                        }}
                      >
                        <FaBullseye size={24} />
                      </div>
                      <h6
                        className='mb-1'
                        style={{
                          fontSize: '0.75rem',
                          color: amoledColors.textMuted,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Unique Exercises
                      </h6>
                      <h2
                        className='mb-1'
                        style={{
                          color: amoledColors.text,
                          fontWeight: '700',
                          fontSize: '1.8rem',
                        }}
                      >
                        {stats.uniqueExercises}
                      </h2>
                      <small
                        style={{
                          color: amoledColors.textMuted,
                          fontSize: '0.7rem',
                        }}
                      >
                        different exercises
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Activity Status and Weekly Progress */}
              <Row className='mb-5'>
                <Col md={6} className='mb-4'>
                  <Card style={chartContainerStyle}>
                    <Card.Header
                      style={{
                        backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
                        borderBottom: `2px solid ${
                          isDarkMode ? '#111111' : '#e5e7eb'
                        }`,
                        padding: '1rem',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                      }}
                    >
                      <h5
                        className='m-0'
                        style={{ color: amoledColors.text, fontWeight: '600' }}
                      >
                        <FaRunning className='me-2' />
                        Activity Status
                      </h5>
                    </Card.Header>
                    <Card.Body
                      style={{
                        padding: '1.5rem',
                        height: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <div className='text-center'>
                        <div
                          style={{
                            fontSize: isMobile ? '1.5rem' : '2rem',
                            fontWeight: 'bold',
                            color: activityInsights.color,
                            marginBottom: '1.5rem',
                          }}
                        >
                          {activityInsights.level}
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? '1rem' : '1.1rem',
                            color: amoledColors.text,
                            marginBottom: '1rem',
                            fontWeight: '500',
                          }}
                        >
                          Last Active:{' '}
                          {activityInsights.daysSinceLastWorkout !== null
                            ? `${activityInsights.daysSinceLastWorkout} days ago`
                            : 'Never'}
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? '1rem' : '1.1rem',
                            color: amoledColors.text,
                            marginBottom: '1rem',
                            fontWeight: '500',
                          }}
                        >
                          Weekly Average:{' '}
                          {activityInsights.weeklyAverage.toFixed(1)} workouts
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            color: amoledColors.textSecondary,
                            fontWeight: '500',
                          }}
                        >
                          Consistency Score: {activityInsights.consistencyScore}
                          %
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6} className='mb-4'>
                  <Card style={chartContainerStyle}>
                    <Card.Header
                      style={{
                        backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
                        borderBottom: `2px solid ${
                          isDarkMode ? '#111111' : '#e5e7eb'
                        }`,
                        padding: '1rem',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                      }}
                    >
                      <h5
                        className='m-0'
                        style={{ color: amoledColors.text, fontWeight: '600' }}
                      >
                        <FaChartLine className='me-2' />
                        Weekly Progress (Last 8 Weeks)
                      </h5>
                    </Card.Header>
                    <Card.Body style={{ padding: '1.5rem', height: '300px' }}>
                      {weeklyWorkoutData.labels.length > 0 ? (
                        <Bar data={weeklyWorkoutData} options={chartOptions} />
                      ) : (
                        <div className='d-flex align-items-center justify-content-center h-100'>
                          <div
                            className='text-center'
                            style={{ color: amoledColors.textMuted }}
                          >
                            <FaChartLine
                              size={48}
                              className='mb-3 opacity-50'
                            />
                            <p>No workout data available</p>
                            <small>
                              Chart will appear when user logs workouts
                            </small>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Detailed Statistics */}
              <Row className='mb-5'>
                <Col xs={12}>
                  <Card style={cardStyle}>
                    <Card.Header
                      style={{
                        backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
                        borderBottom: `2px solid ${
                          isDarkMode ? '#111111' : '#e5e7eb'
                        }`,
                        padding: '1.5rem',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                      }}
                    >
                      <h5
                        className='m-0'
                        style={{ color: amoledColors.text, fontWeight: '600' }}
                      >
                        <FaTrophy className='me-2' />
                        Detailed Statistics
                      </h5>
                    </Card.Header>
                    <Card.Body style={{ padding: '2rem' }}>
                      <Row>
                        <Col md={4} className='mb-3'>
                          <div className='text-center'>
                            <h6
                              style={{
                                color: amoledColors.textMuted,
                                fontSize: '0.875rem',
                                marginBottom: '0.5rem',
                              }}
                            >
                              Total Sets
                            </h6>
                            <div
                              style={{
                                color: amoledColors.text,
                                fontSize: '1.5rem',
                                fontWeight: '700',
                              }}
                            >
                              {stats.totalSets.toLocaleString()}
                            </div>
                          </div>
                        </Col>
                        <Col md={4} className='mb-3'>
                          <div className='text-center'>
                            <h6
                              style={{
                                color: amoledColors.textMuted,
                                fontSize: '0.875rem',
                                marginBottom: '0.5rem',
                              }}
                            >
                              Average Weight per Set
                            </h6>
                            <div
                              style={{
                                color: amoledColors.text,
                                fontSize: '1.5rem',
                                fontWeight: '700',
                              }}
                            >
                              {Math.round(stats.avgWeightPerSet / 2.205)} kg
                            </div>
                          </div>
                        </Col>
                        <Col md={4} className='mb-3'>
                          <div className='text-center'>
                            <h6
                              style={{
                                color: amoledColors.textMuted,
                                fontSize: '0.875rem',
                                marginBottom: '0.5rem',
                              }}
                            >
                              Average Reps per Set
                            </h6>
                            <div
                              style={{
                                color: amoledColors.text,
                                fontSize: '1.5rem',
                                fontWeight: '700',
                              }}
                            >
                              {stats.avgReps}
                            </div>
                          </div>
                        </Col>
                        <Col md={4} className='mb-3'>
                          <div className='text-center'>
                            <h6
                              style={{
                                color: amoledColors.textMuted,
                                fontSize: '0.875rem',
                                marginBottom: '0.5rem',
                              }}
                            >
                              Total Training Days
                            </h6>
                            <div
                              style={{
                                color: amoledColors.text,
                                fontSize: '1.5rem',
                                fontWeight: '700',
                              }}
                            >
                              {stats.totalDays}
                            </div>
                          </div>
                        </Col>
                        <Col md={4} className='mb-3'>
                          <div className='text-center'>
                            <h6
                              style={{
                                color: amoledColors.textMuted,
                                fontSize: '0.875rem',
                                marginBottom: '0.5rem',
                              }}
                            >
                              Progress Trend
                            </h6>
                            <div
                              style={{
                                color:
                                  activityInsights.progressTrend === 'Improving'
                                    ? amoledColors.chartColors.green
                                    : activityInsights.progressTrend ===
                                      'Declining'
                                    ? amoledColors.chartColors.red
                                    : amoledColors.chartColors.orange,
                                fontSize: '1.5rem',
                                fontWeight: '700',
                              }}
                            >
                              {activityInsights.progressTrend}
                            </div>
                          </div>
                        </Col>
                        <Col md={4} className='mb-3'>
                          <div className='text-center'>
                            <h6
                              style={{
                                color: amoledColors.textMuted,
                                fontSize: '0.875rem',
                                marginBottom: '0.5rem',
                              }}
                            >
                              Max Weight Ever
                            </h6>
                            <div
                              style={{
                                color: amoledColors.text,
                                fontSize: '1.5rem',
                                fontWeight: '700',
                              }}
                            >
                              {Math.round(stats.maxWeightEver / 2.205)} kg
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Monthly Workout Trend */}
              <Row className='mb-5'>
                <Col xs={12}>
                  <Card style={chartContainerStyle}>
                    <Card.Header
                      style={{
                        backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
                        borderBottom: `2px solid ${
                          isDarkMode ? '#111111' : '#e5e7eb'
                        }`,
                        padding: '1.5rem',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                      }}
                    >
                      <h5
                        className='m-0 d-flex align-items-center'
                        style={{ color: amoledColors.text, fontWeight: '600' }}
                      >
                        <div
                          style={{
                            background:
                              'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
                            borderRadius: '8px',
                            padding: '8px',
                            marginRight: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(34, 211, 238, 0.3)',
                          }}
                        >
                          <FaCalendarAlt
                            style={{ color: '#ffffff' }}
                            size={16}
                          />
                        </div>
                        Monthly Workout Trend (Last 6 Months)
                      </h5>
                    </Card.Header>
                    <Card.Body style={{ padding: '1.5rem', height: '350px' }}>
                      {monthlyTrendData.labels.length > 0 ? (
                        <Line
                          data={monthlyTrendData}
                          options={lineChartOptions}
                        />
                      ) : (
                        <div className='d-flex align-items-center justify-content-center h-100'>
                          <div
                            className='text-center'
                            style={{ color: amoledColors.textMuted }}
                          >
                            <FaChartLine
                              size={48}
                              className='mb-3 opacity-50'
                            />
                            <p>No monthly data available</p>
                            <small>
                              Chart will appear when user has workout history
                            </small>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Advanced Analytics Section */}
              <Row className='mb-5'>
                <Col xs={12}>
                  <Card style={cardStyle}>
                    <Card.Header
                      style={{
                        backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
                        borderBottom: `2px solid ${
                          isDarkMode ? '#111111' : '#e5e7eb'
                        }`,
                        padding: '1.5rem',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                      }}
                    >
                      <h5
                        className='m-0 d-flex align-items-center'
                        style={{ color: amoledColors.text, fontWeight: '600' }}
                      >
                        <div
                          style={{
                            background:
                              'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
                            borderRadius: '8px',
                            padding: '8px',
                            marginRight: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(34, 211, 238, 0.3)',
                          }}
                        >
                          <FaChartLine style={{ color: '#ffffff' }} size={16} />
                        </div>
                        Workout Progress & Analytics
                      </h5>
                    </Card.Header>
                    <Card.Body style={{ padding: '2rem' }}>
                      <Row>
                        {/* Performance Improvement Tracking */}
                        <Col lg={6} className='mb-4'>
                          <h6
                            style={{
                              color: amoledColors.text,
                              fontWeight: '600',
                              marginBottom: '1rem',
                            }}
                          >
                            📊 Performance Improvement Tracking
                          </h6>
                          <div
                            style={{
                              height: '250px',
                              background: isDarkMode
                                ? 'rgba(255,255,255,0.02)'
                                : 'rgba(0,0,0,0.02)',
                              borderRadius: '12px',
                              padding: '1rem',
                              border: `1px solid ${
                                isDarkMode
                                  ? 'rgba(255,255,255,0.05)'
                                  : 'rgba(0,0,0,0.05)'
                              }`,
                            }}
                          >
                            <ResponsiveContainer width='100%' height='100%'>
                              <LineChart
                                data={(() => {
                                  if (!workouts || workouts.length < 2)
                                    return [];

                                  // Group workouts by week for meaningful comparison
                                  const weeklyData = {};
                                  workouts.forEach((workout) => {
                                    const date = new Date(workout.date);
                                    const weekStart = new Date(date);
                                    weekStart.setDate(
                                      date.getDate() - date.getDay()
                                    ); // Start of week
                                    const weekKey = weekStart
                                      .toISOString()
                                      .split('T')[0];

                                    if (!weeklyData[weekKey]) {
                                      weeklyData[weekKey] = {
                                        date: weekKey,
                                        displayDate:
                                          weekStart.toLocaleDateString(
                                            'en-US',
                                            { month: 'short', day: 'numeric' }
                                          ),
                                        maxWeight: 0,
                                        totalReps: 0,
                                        workoutCount: 0,
                                        avgRepsPerWorkout: 0,
                                        improvement: 0,
                                      };
                                    }

                                    const maxWeight = Math.max(
                                      ...(workout.sets?.map(
                                        (set) => set.weight || 0
                                      ) || [0])
                                    );
                                    const totalReps =
                                      workout.sets?.reduce(
                                        (sum, set) => sum + (set.reps || 0),
                                        0
                                      ) || 0;

                                    weeklyData[weekKey].maxWeight = Math.max(
                                      weeklyData[weekKey].maxWeight,
                                      maxWeight
                                    );
                                    weeklyData[weekKey].totalReps += totalReps;
                                    weeklyData[weekKey].workoutCount += 1;
                                  });

                                  // Convert to array and calculate improvements
                                  const weeks = Object.values(weeklyData)
                                    .sort(
                                      (a, b) =>
                                        new Date(a.date) - new Date(b.date)
                                    )
                                    .slice(-8); // Last 8 weeks

                                  weeks.forEach((week, index) => {
                                    week.avgRepsPerWorkout =
                                      week.totalReps /
                                      Math.max(week.workoutCount, 1);

                                    if (index > 0) {
                                      const prevWeek = weeks[index - 1];
                                      const repsImprovement =
                                        ((week.avgRepsPerWorkout -
                                          prevWeek.avgRepsPerWorkout) /
                                          Math.max(
                                            prevWeek.avgRepsPerWorkout,
                                            1
                                          )) *
                                        100;
                                      const weightImprovement =
                                        ((week.maxWeight - prevWeek.maxWeight) /
                                          Math.max(prevWeek.maxWeight, 1)) *
                                        100;

                                      // Combined improvement score (50% weight progression, 50% rep volume)
                                      week.improvement =
                                        weightImprovement * 0.5 +
                                        repsImprovement * 0.5;
                                      week.improvementDisplay =
                                        week.improvement > 0
                                          ? `+${week.improvement.toFixed(1)}%`
                                          : `${week.improvement.toFixed(1)}%`;
                                    } else {
                                      week.improvement = 0;
                                      week.improvementDisplay = 'Baseline';
                                    }
                                  });

                                  return weeks;
                                })()}
                              >
                                <CartesianGrid
                                  strokeDasharray='3 3'
                                  stroke={isDarkMode ? '#333' : '#e0e0e0'}
                                />
                                <XAxis
                                  dataKey='displayDate'
                                  tick={{
                                    fontSize: 11,
                                    fill: isDarkMode ? '#9ca3af' : '#6b7280',
                                  }}
                                  interval='preserveStartEnd'
                                />
                                <YAxis
                                  tick={{
                                    fontSize: 11,
                                    fill: isDarkMode ? '#9ca3af' : '#6b7280',
                                  }}
                                  label={{
                                    value: 'Improvement %',
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: {
                                      textAnchor: 'middle',
                                      fill: isDarkMode ? '#9ca3af' : '#6b7280',
                                    },
                                  }}
                                />
                                <RechartsTooltip
                                  contentStyle={{
                                    backgroundColor: isDarkMode
                                      ? '#1f2937'
                                      : '#ffffff',
                                    border: `1px solid ${
                                      isDarkMode ? '#374151' : '#e5e7eb'
                                    }`,
                                    borderRadius: '8px',
                                    color: isDarkMode ? '#ffffff' : '#000000',
                                  }}
                                  formatter={(value, name) => [
                                    `${value > 0 ? '+' : ''}${value.toFixed(
                                      1
                                    )}%`,
                                    'Improvement vs Previous Week',
                                  ]}
                                  labelFormatter={(label) => `Week of ${label}`}
                                />
                                {/* Zero line for reference */}
                                <RechartsLine
                                  dataKey={() => 0}
                                  stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
                                  strokeWidth={1}
                                  strokeDasharray='5 5'
                                  dot={false}
                                />
                                {/* Improvement line */}
                                <RechartsLine
                                  dataKey='improvement'
                                  stroke='#22d3ee'
                                  strokeWidth={3}
                                  dot={(props) => {
                                    const { cx, cy, payload } = props;
                                    const improvement = payload.improvement;
                                    const color =
                                      improvement > 5
                                        ? '#22c55e'
                                        : improvement > 0
                                        ? '#22d3ee'
                                        : improvement > -5
                                        ? '#f59e0b'
                                        : '#ef4444';
                                    return (
                                      <circle
                                        cx={cx}
                                        cy={cy}
                                        r={5}
                                        fill={color}
                                        stroke='#ffffff'
                                        strokeWidth={2}
                                      />
                                    );
                                  }}
                                  activeDot={{
                                    r: 7,
                                    stroke: '#22d3ee',
                                    strokeWidth: 2,
                                    fill: '#ffffff',
                                  }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </Col>

                        {/* Exercise Progress */}
                        <Col lg={6} className='mb-4'>
                          <h6
                            style={{
                              color: amoledColors.text,
                              fontWeight: '600',
                              marginBottom: '1rem',
                            }}
                          >
                            🎯 Exercise Progress (Top Exercises)
                          </h6>
                          <div
                            style={{
                              height: '250px',
                              background: isDarkMode
                                ? 'rgba(255,255,255,0.02)'
                                : 'rgba(0,0,0,0.02)',
                              borderRadius: '12px',
                              padding: '1rem',
                              border: `1px solid ${
                                isDarkMode
                                  ? 'rgba(255,255,255,0.05)'
                                  : 'rgba(0,0,0,0.05)'
                              }`,
                            }}
                          >
                            {(() => {
                              if (!workouts || workouts.length < 2) {
                                return (
                                  <div className='d-flex align-items-center justify-content-center h-100'>
                                    <div
                                      className='text-center'
                                      style={{ color: amoledColors.textMuted }}
                                    >
                                      <FaChartLine
                                        size={48}
                                        className='mb-3 opacity-50'
                                      />
                                      <p>No exercise progress data available</p>
                                      <small>
                                        Chart will appear when user has multiple
                                        sessions per exercise
                                      </small>
                                    </div>
                                  </div>
                                );
                              }

                              // Process exercise data
                              const exerciseData = {};
                              workouts.forEach((workout) => {
                                const exerciseName =
                                  workout.product?.name || 'Unknown Exercise';
                                if (!exerciseData[exerciseName]) {
                                  exerciseData[exerciseName] = {
                                    name: exerciseName,
                                    sessions: [],
                                  };
                                }

                                const maxWeight = Math.max(
                                  ...(workout.sets?.map(
                                    (set) => set.weight || 0
                                  ) || [0])
                                );
                                const totalReps =
                                  workout.sets?.reduce(
                                    (sum, set) => sum + (set.reps || 0),
                                    0
                                  ) || 0;

                                exerciseData[exerciseName].sessions.push({
                                  date: new Date(workout.date),
                                  maxWeight,
                                  totalReps,
                                });
                              });

                              // Calculate improvements
                              const exerciseImprovements = Object.values(
                                exerciseData
                              )
                                .filter((ex) => ex.sessions.length >= 2)
                                .map((exercise) => {
                                  exercise.sessions.sort(
                                    (a, b) => a.date - b.date
                                  );

                                  const firstSession = exercise.sessions[0];
                                  const latestSession =
                                    exercise.sessions[
                                      exercise.sessions.length - 1
                                    ];

                                  const weightImprovement =
                                    firstSession.maxWeight > 0
                                      ? ((latestSession.maxWeight -
                                          firstSession.maxWeight) /
                                          firstSession.maxWeight) *
                                        100
                                      : 0;

                                  const repsImprovement =
                                    firstSession.totalReps > 0
                                      ? ((latestSession.totalReps -
                                          firstSession.totalReps) /
                                          firstSession.totalReps) *
                                        100
                                      : 0;

                                  const totalImprovement =
                                    weightImprovement * 0.8 +
                                    repsImprovement * 0.2;

                                  return {
                                    name:
                                      exercise.name.length > 15
                                        ? exercise.name.substring(0, 15) + '...'
                                        : exercise.name,
                                    fullName: exercise.name,
                                    improvement: totalImprovement,
                                    weightImprovement,
                                    repsImprovement,
                                    sessions: exercise.sessions.length,
                                    latestWeight: latestSession.maxWeight,
                                    firstWeight: firstSession.maxWeight,
                                  };
                                })
                                .sort((a, b) => b.improvement - a.improvement)
                                .slice(0, 6);

                              if (exerciseImprovements.length === 0) {
                                return (
                                  <div className='d-flex align-items-center justify-content-center h-100'>
                                    <div
                                      className='text-center'
                                      style={{ color: amoledColors.textMuted }}
                                    >
                                      <FaChartLine
                                        size={48}
                                        className='mb-3 opacity-50'
                                      />
                                      <p>No exercise progress data</p>
                                      <small>
                                        User needs at least 2 sessions per
                                        exercise to show progress
                                      </small>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <ResponsiveContainer width='100%' height='100%'>
                                  <BarChart data={exerciseImprovements}>
                                    <CartesianGrid
                                      strokeDasharray='3 3'
                                      stroke={isDarkMode ? '#333' : '#e0e0e0'}
                                    />
                                    <XAxis
                                      dataKey='name'
                                      tick={{
                                        fontSize: 10,
                                        fill: isDarkMode
                                          ? '#9ca3af'
                                          : '#6b7280',
                                      }}
                                      interval={0}
                                      angle={-45}
                                      textAnchor='end'
                                      height={80}
                                    />
                                    <YAxis
                                      tick={{
                                        fontSize: 11,
                                        fill: isDarkMode
                                          ? '#9ca3af'
                                          : '#6b7280',
                                      }}
                                      label={{
                                        value: 'Improvement %',
                                        angle: -90,
                                        position: 'insideLeft',
                                        style: {
                                          textAnchor: 'middle',
                                          fill: isDarkMode
                                            ? '#9ca3af'
                                            : '#6b7280',
                                        },
                                      }}
                                    />
                                    <RechartsTooltip
                                      contentStyle={{
                                        backgroundColor: isDarkMode
                                          ? '#1f2937'
                                          : '#ffffff',
                                        border: `1px solid ${
                                          isDarkMode ? '#374151' : '#e5e7eb'
                                        }`,
                                        borderRadius: '8px',
                                        color: isDarkMode
                                          ? '#ffffff'
                                          : '#000000',
                                      }}
                                      formatter={(value, name, props) => [
                                        `${value > 0 ? '+' : ''}${value.toFixed(
                                          1
                                        )}%`,
                                        props.payload.fullName,
                                      ]}
                                      labelFormatter={(label, payload) => {
                                        if (payload && payload[0]) {
                                          const data = payload[0].payload;
                                          return `${data.fullName} (${data.sessions} sessions)`;
                                        }
                                        return label;
                                      }}
                                    />
                                    <RechartsBar
                                      dataKey='improvement'
                                      radius={[4, 4, 0, 0]}
                                    >
                                      {(() => {
                                        if (!workouts || workouts.length < 2)
                                          return [];

                                        // Get the data that matches what we calculated above
                                        const exerciseData = {};
                                        workouts.forEach((workout) => {
                                          const exerciseName =
                                            workout.product?.name || 'Unknown';
                                          if (!exerciseData[exerciseName]) {
                                            exerciseData[exerciseName] = {
                                              name: exerciseName,
                                              sessions: [],
                                            };
                                          }

                                          const maxWeight = Math.max(
                                            ...(workout.sets?.map(
                                              (set) => set.weight || 0
                                            ) || [0])
                                          );
                                          const totalReps =
                                            workout.sets?.reduce(
                                              (sum, set) =>
                                                sum + (set.reps || 0),
                                              0
                                            ) || 0;

                                          exerciseData[
                                            exerciseName
                                          ].sessions.push({
                                            date: new Date(workout.date),
                                            maxWeight,
                                            totalReps,
                                          });
                                        });

                                        return Object.values(exerciseData)
                                          .filter(
                                            (ex) => ex.sessions.length >= 2
                                          )
                                          .sort((a, b) => {
                                            // Calculate improvement for sorting
                                            a.sessions.sort(
                                              (x, y) => x.date - y.date
                                            );
                                            b.sessions.sort(
                                              (x, y) => x.date - y.date
                                            );

                                            const aImprovement =
                                              ((a.sessions[
                                                a.sessions.length - 1
                                              ].maxWeight -
                                                a.sessions[0].maxWeight) /
                                                Math.max(
                                                  a.sessions[0].maxWeight,
                                                  1
                                                )) *
                                              100;
                                            const bImprovement =
                                              ((b.sessions[
                                                b.sessions.length - 1
                                              ].maxWeight -
                                                b.sessions[0].maxWeight) /
                                                Math.max(
                                                  b.sessions[0].maxWeight,
                                                  1
                                                )) *
                                              100;

                                            return bImprovement - aImprovement;
                                          })
                                          .slice(0, 6)
                                          .map((exercise, index) => {
                                            exercise.sessions.sort(
                                              (a, b) => a.date - b.date
                                            );
                                            const firstSession =
                                              exercise.sessions[0];
                                            const latestSession =
                                              exercise.sessions[
                                                exercise.sessions.length - 1
                                              ];

                                            const weightImprovement =
                                              ((latestSession.maxWeight -
                                                firstSession.maxWeight) /
                                                Math.max(
                                                  firstSession.maxWeight,
                                                  1
                                                )) *
                                              100;
                                            const repsImprovement =
                                              ((latestSession.totalReps -
                                                firstSession.totalReps) /
                                                Math.max(
                                                  firstSession.totalReps,
                                                  1
                                                )) *
                                              100;
                                            const totalImprovement =
                                              weightImprovement * 0.8 +
                                              repsImprovement * 0.2;

                                            const color =
                                              totalImprovement > 10
                                                ? '#22c55e'
                                                : totalImprovement > 0
                                                ? '#22d3ee'
                                                : totalImprovement > -10
                                                ? '#f59e0b'
                                                : '#ef4444';
                                            return (
                                              <Cell
                                                key={`cell-${index}`}
                                                fill={color}
                                              />
                                            );
                                          });
                                      })()}
                                    </RechartsBar>
                                  </BarChart>
                                </ResponsiveContainer>
                              );
                            })()}

                            {/* Exercise Progress Legend */}
                            <div
                              className='d-flex justify-content-center gap-2 mt-3'
                              style={{
                                fontSize: isMobile ? '0.6rem' : '0.7rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <div className='d-flex align-items-center gap-1'>
                                <div
                                  style={{
                                    width: isMobile ? '8px' : '10px',
                                    height: isMobile ? '8px' : '10px',
                                    borderRadius: '50%',
                                    backgroundColor: '#22c55e',
                                  }}
                                ></div>
                                <span style={{ color: amoledColors.textMuted }}>
                                  {isMobile ? 'Excellent' : 'Excellent (+10%)'}
                                </span>
                              </div>
                              <div className='d-flex align-items-center gap-1'>
                                <div
                                  style={{
                                    width: isMobile ? '8px' : '10px',
                                    height: isMobile ? '8px' : '10px',
                                    borderRadius: '50%',
                                    backgroundColor: '#22d3ee',
                                  }}
                                ></div>
                                <span style={{ color: amoledColors.textMuted }}>
                                  {isMobile ? 'Good' : 'Good Progress'}
                                </span>
                              </div>
                              <div className='d-flex align-items-center gap-1'>
                                <div
                                  style={{
                                    width: isMobile ? '8px' : '10px',
                                    height: isMobile ? '8px' : '10px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f59e0b',
                                  }}
                                ></div>
                                <span style={{ color: amoledColors.textMuted }}>
                                  {isMobile ? 'Fair' : 'Fair Progress'}
                                </span>
                              </div>
                              <div className='d-flex align-items-center gap-1'>
                                <div
                                  style={{
                                    width: isMobile ? '8px' : '10px',
                                    height: isMobile ? '8px' : '10px',
                                    borderRadius: '50%',
                                    backgroundColor: '#ef4444',
                                  }}
                                ></div>
                                <span style={{ color: amoledColors.textMuted }}>
                                  {isMobile ? 'Needs Work' : 'Needs Work'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-4'>
                        {/* Muscle Group Distribution */}
                        <Col lg={6} className='mb-4'>
                          <h6
                            style={{
                              color: amoledColors.text,
                              fontWeight: '600',
                              marginBottom: '1rem',
                            }}
                          >
                            🎯 Muscle Group Focus (Last 30 Days)
                          </h6>
                          <div
                            style={{
                              height: '250px',
                              background: isDarkMode
                                ? 'rgba(255,255,255,0.02)'
                                : 'rgba(0,0,0,0.02)',
                              borderRadius: '12px',
                              padding: '1rem',
                              border: `1px solid ${
                                isDarkMode
                                  ? 'rgba(255,255,255,0.05)'
                                  : 'rgba(0,0,0,0.05)'
                              }`,
                            }}
                          >
                            <ResponsiveContainer width='100%' height='100%'>
                              <PieChart>
                                <RechartsPie
                                  data={(() => {
                                    if (!workouts) return [];
                                    const muscleGroups = {};
                                    workouts.forEach((workout) => {
                                      const groups =
                                        workout.product?.muscleGroups || [];
                                      groups.forEach((group) => {
                                        muscleGroups[group] =
                                          (muscleGroups[group] || 0) + 1;
                                      });
                                    });

                                    const colors = [
                                      '#a855f7',
                                      '#22d3ee',
                                      '#34d399',
                                      '#fbbf24',
                                      '#f87171',
                                      '#ec4899',
                                    ];
                                    return Object.entries(muscleGroups).map(
                                      ([name, value], index) => ({
                                        name,
                                        value,
                                        color: colors[index % colors.length],
                                      })
                                    );
                                  })()}
                                  cx='50%'
                                  cy='50%'
                                  outerRadius={80}
                                  fill='#8884d8'
                                  dataKey='value'
                                  label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                  }
                                  labelStyle={{
                                    fontSize: '11px',
                                    fill: isDarkMode ? '#9ca3af' : '#6b7280',
                                  }}
                                >
                                  {(() => {
                                    if (!workouts) return [];
                                    const muscleGroups = {};
                                    workouts.forEach((workout) => {
                                      const groups =
                                        workout.product?.muscleGroups || [];
                                      groups.forEach((group) => {
                                        muscleGroups[group] =
                                          (muscleGroups[group] || 0) + 1;
                                      });
                                    });

                                    const colors = [
                                      '#a855f7',
                                      '#22d3ee',
                                      '#34d399',
                                      '#fbbf24',
                                      '#f87171',
                                      '#ec4899',
                                    ];
                                    return Object.entries(muscleGroups).map(
                                      ([name, value], index) => (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={colors[index % colors.length]}
                                        />
                                      )
                                    );
                                  })()}
                                </RechartsPie>
                                <RechartsTooltip
                                  contentStyle={{
                                    backgroundColor: isDarkMode
                                      ? '#1f2937'
                                      : '#ffffff',
                                    border: `1px solid ${
                                      isDarkMode ? '#374151' : '#e5e7eb'
                                    }`,
                                    borderRadius: '8px',
                                    color: isDarkMode ? '#ffffff' : '#000000',
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </Col>

                        {/* Performance Trends */}
                        <Col lg={6} className='mb-4'>
                          <h6
                            style={{
                              color: amoledColors.text,
                              fontWeight: '600',
                              marginBottom: '1rem',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                            }}
                          >
                            📈 Performance Trends
                          </h6>
                          <div
                            style={{
                              minHeight: isMobile ? '200px' : '250px',
                              background: isDarkMode
                                ? 'rgba(255,255,255,0.02)'
                                : 'rgba(0,0,0,0.02)',
                              borderRadius: '12px',
                              padding: isMobile ? '0.75rem' : '1rem',
                              border: `1px solid ${
                                isDarkMode
                                  ? 'rgba(255,255,255,0.05)'
                                  : 'rgba(0,0,0,0.05)'
                              }`,
                            }}
                          >
                            {/* Performance Summary Cards */}
                            <Row className={`g-${isMobile ? '2' : '3'} h-100`}>
                              <Col xs={6} md={6} className='mb-2'>
                                <div
                                  style={{
                                    height: isMobile ? '70px' : '90px',
                                    background: isDarkMode
                                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)'
                                      : 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(168, 85, 247, 0.02) 100%)',
                                    borderRadius: '8px',
                                    padding: isMobile ? '0.5rem' : '0.75rem',
                                    border: `1px solid ${
                                      isDarkMode
                                        ? 'rgba(168, 85, 247, 0.2)'
                                        : 'rgba(168, 85, 247, 0.1)'
                                    }`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: isMobile ? '1rem' : '1.2rem',
                                      marginBottom: '0.25rem',
                                    }}
                                  >
                                    🚀
                                  </div>
                                  <div
                                    style={{
                                      fontSize: isMobile ? '0.9rem' : '1.1rem',
                                      fontWeight: '700',
                                      color: amoledColors.chartColors.purple,
                                      lineHeight: '1.1',
                                      marginBottom: '0.25rem',
                                    }}
                                  >
                                    {workouts
                                      ? ((workouts.length / 30) * 7).toFixed(1)
                                      : 0}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: isMobile ? '0.6rem' : '0.65rem',
                                      color: amoledColors.textMuted,
                                      lineHeight: '1.1',
                                    }}
                                  >
                                    Workouts/Week
                                  </div>
                                </div>
                              </Col>

                              <Col xs={6} md={6} className='mb-2'>
                                <div
                                  style={{
                                    height: isMobile ? '70px' : '90px',
                                    background: isDarkMode
                                      ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%)'
                                      : 'linear-gradient(135deg, rgba(34, 211, 238, 0.05) 0%, rgba(34, 211, 238, 0.02) 100%)',
                                    borderRadius: '8px',
                                    padding: isMobile ? '0.5rem' : '0.75rem',
                                    border: `1px solid ${
                                      isDarkMode
                                        ? 'rgba(34, 211, 238, 0.2)'
                                        : 'rgba(34, 211, 238, 0.1)'
                                    }`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: isMobile ? '1rem' : '1.2rem',
                                      marginBottom: '0.25rem',
                                    }}
                                  >
                                    ⚡
                                  </div>
                                  <div
                                    style={{
                                      fontSize: isMobile ? '0.9rem' : '1.1rem',
                                      fontWeight: '700',
                                      color: amoledColors.chartColors.cyan,
                                      lineHeight: '1.1',
                                      marginBottom: '0.25rem',
                                    }}
                                  >
                                    {workouts
                                      ? Math.round(
                                          workouts.reduce(
                                            (sum, w) =>
                                              sum + (w.sets?.length || 0),
                                            0
                                          ) / workouts.length
                                        )
                                      : 0}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: isMobile ? '0.6rem' : '0.65rem',
                                      color: amoledColors.textMuted,
                                      lineHeight: '1.1',
                                    }}
                                  >
                                    Avg Sets/Session
                                  </div>
                                </div>
                              </Col>

                              <Col xs={6} md={6}>
                                <div
                                  style={{
                                    height: isMobile ? '70px' : '90px',
                                    background: isDarkMode
                                      ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(52, 211, 153, 0.05) 100%)'
                                      : 'linear-gradient(135deg, rgba(52, 211, 153, 0.05) 0%, rgba(52, 211, 153, 0.02) 100%)',
                                    borderRadius: '8px',
                                    padding: isMobile ? '0.5rem' : '0.75rem',
                                    border: `1px solid ${
                                      isDarkMode
                                        ? 'rgba(52, 211, 153, 0.2)'
                                        : 'rgba(52, 211, 153, 0.1)'
                                    }`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: isMobile ? '1rem' : '1.2rem',
                                      marginBottom: '0.25rem',
                                    }}
                                  >
                                    �
                                  </div>
                                  <div
                                    style={{
                                      fontSize: isMobile ? '0.9rem' : '1.1rem',
                                      fontWeight: '700',
                                      color: amoledColors.chartColors.green,
                                      lineHeight: '1.1',
                                      marginBottom: '0.25rem',
                                    }}
                                  >
                                    ✓
                                  </div>
                                  <div
                                    style={{
                                      fontSize: isMobile ? '0.6rem' : '0.65rem',
                                      color: amoledColors.textMuted,
                                      lineHeight: '1.1',
                                    }}
                                  >
                                    Consistency
                                  </div>
                                </div>
                              </Col>

                              <Col xs={6} md={6}>
                                <div
                                  style={{
                                    height: isMobile ? '70px' : '90px',
                                    background: isDarkMode
                                      ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)'
                                      : 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(251, 191, 36, 0.02) 100%)',
                                    borderRadius: '8px',
                                    padding: isMobile ? '0.5rem' : '0.75rem',
                                    border: `1px solid ${
                                      isDarkMode
                                        ? 'rgba(251, 191, 36, 0.2)'
                                        : 'rgba(251, 191, 36, 0.1)'
                                    }`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: isMobile ? '1rem' : '1.2rem',
                                      marginBottom: '0.25rem',
                                    }}
                                  >
                                    🏆
                                  </div>
                                  <div
                                    style={{
                                      fontSize: isMobile ? '0.9rem' : '1.1rem',
                                      fontWeight: '700',
                                      color: amoledColors.chartColors.orange,
                                      lineHeight: '1.1',
                                      marginBottom: '0.25rem',
                                    }}
                                  >
                                    {workouts
                                      ? Math.round(
                                          workouts.reduce(
                                            (sum, w) =>
                                              sum +
                                              (w.sets?.reduce(
                                                (setSum, set) =>
                                                  setSum +
                                                  (set.weight || 0) *
                                                    (set.reps || 0),
                                                0
                                              ) || 0),
                                            0
                                          ) / workouts.length
                                        )
                                      : 506}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: isMobile ? '0.6rem' : '0.65rem',
                                      color: amoledColors.textMuted,
                                      lineHeight: '1.1',
                                    }}
                                  >
                                    Avg Volume/Session
                                  </div>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Progress Insights and Activity Summary */}
              <Row className='mb-5'>
                <Col md={6} className='mb-4'>
                  <Card style={cardStyle}>
                    <Card.Header
                      style={{
                        backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
                        borderBottom: `2px solid ${
                          isDarkMode ? '#111111' : '#e5e7eb'
                        }`,
                        padding: '1.5rem',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                      }}
                    >
                      <h5
                        className='m-0 d-flex align-items-center'
                        style={{ color: amoledColors.text, fontWeight: '600' }}
                      >
                        <div
                          style={{
                            background:
                              'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                            borderRadius: '8px',
                            padding: '8px',
                            marginRight: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)',
                          }}
                        >
                          <FaArrowUp style={{ color: '#ffffff' }} size={16} />
                        </div>
                        Progress Insights
                      </h5>
                    </Card.Header>
                    <Card.Body style={{ padding: '1.5rem' }}>
                      {/* Consistency Score */}
                      <div className='mb-4'>
                        <div className='d-flex justify-content-between align-items-center mb-2'>
                          <h6
                            style={{
                              color: amoledColors.text,
                              fontSize: '1rem',
                              fontWeight: '600',
                              margin: 0,
                            }}
                          >
                            Consistency Score
                          </h6>
                          <Badge
                            bg={
                              coachingInsights.consistencyRating === 'Excellent'
                                ? 'success'
                                : coachingInsights.consistencyRating === 'Good'
                                ? 'primary'
                                : coachingInsights.consistencyRating === 'Fair'
                                ? 'warning'
                                : 'danger'
                            }
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            {activityInsights.consistencyScore}%
                          </Badge>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '8px',
                            backgroundColor: isDarkMode ? '#1e1e1e' : '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${activityInsights.consistencyScore}%`,
                              height: '100%',
                              background:
                                coachingInsights.consistencyRating ===
                                'Excellent'
                                  ? 'linear-gradient(90deg, #34d399, #10b981)'
                                  : coachingInsights.consistencyRating ===
                                    'Good'
                                  ? 'linear-gradient(90deg, #60a5fa, #3b82f6)'
                                  : coachingInsights.consistencyRating ===
                                    'Fair'
                                  ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                  : 'linear-gradient(90deg, #f87171, #ef4444)',
                              borderRadius: '4px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>

                      {/* Progress Trend */}
                      <div className='mb-4'>
                        <h6
                          style={{
                            color: amoledColors.text,
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '1rem',
                          }}
                        >
                          Progress Trend
                        </h6>
                        <div
                          className='d-flex align-items-center'
                          style={{
                            padding: '1rem',
                            backgroundColor: isDarkMode ? '#1a1a1a' : '#f8fafc',
                            borderRadius: '8px',
                          }}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background:
                                activityInsights.progressTrend === 'Improving'
                                  ? 'linear-gradient(135deg, #34d399, #10b981)'
                                  : activityInsights.progressTrend ===
                                    'Declining'
                                  ? 'linear-gradient(135deg, #f87171, #ef4444)'
                                  : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '12px',
                            }}
                          >
                            {activityInsights.progressTrend === 'Improving'
                              ? '📈'
                              : activityInsights.progressTrend === 'Declining'
                              ? '📉'
                              : '📊'}
                          </div>
                          <div>
                            <div
                              style={{
                                color: amoledColors.text,
                                fontWeight: '600',
                                fontSize: '1.1rem',
                              }}
                            >
                              {activityInsights.progressTrend}
                            </div>
                            <small
                              style={{ color: amoledColors.textSecondary }}
                            >
                              {activityInsights.lastTwoWeeks} vs{' '}
                              {activityInsights.previousTwoWeeks} workouts
                            </small>
                          </div>
                        </div>
                      </div>

                      {/* Weekly Performance */}
                      <div>
                        <h6
                          style={{
                            color: amoledColors.text,
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '1rem',
                          }}
                        >
                          Weekly Performance
                        </h6>
                        <div
                          style={{
                            padding: '1rem',
                            backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9',
                            borderRadius: '8px',
                            border: `1px solid ${
                              isDarkMode ? '#1e293b' : '#e2e8f0'
                            }`,
                          }}
                        >
                          <div
                            style={{
                              color: amoledColors.chartColors.cyan,
                              fontSize: '1.8rem',
                              fontWeight: '700',
                            }}
                          >
                            Averaging{' '}
                            {activityInsights.weeklyAverage.toFixed(1)} workouts
                            per week
                          </div>
                          <div className='d-flex align-items-center mt-2'>
                            <span
                              style={{ fontSize: '1.2rem', marginRight: '8px' }}
                            >
                              🎯
                            </span>
                            <small
                              style={{ color: amoledColors.textSecondary }}
                            >
                              {activityInsights.weeklyAverage >= 4
                                ? 'Excellent consistency!'
                                : activityInsights.weeklyAverage >= 3
                                ? 'Good frequency!'
                                : activityInsights.weeklyAverage >= 2
                                ? 'Moderate activity'
                                : 'Needs improvement'}
                            </small>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6} className='mb-4'>
                  <Card style={cardStyle}>
                    <Card.Header
                      style={{
                        backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
                        borderBottom: `2px solid ${
                          isDarkMode ? '#111111' : '#e5e7eb'
                        }`,
                        padding: '1.5rem',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                      }}
                    >
                      <h5
                        className='m-0 d-flex align-items-center'
                        style={{ color: amoledColors.text, fontWeight: '600' }}
                      >
                        <div
                          style={{
                            background:
                              'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                            borderRadius: '8px',
                            padding: '8px',
                            marginRight: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)',
                          }}
                        >
                          <FaClock style={{ color: '#ffffff' }} size={16} />
                        </div>
                        Activity Summary
                      </h5>
                    </Card.Header>
                    <Card.Body style={{ padding: '1.5rem' }}>
                      <Row>
                        <Col xs={6} className='mb-3'>
                          <div
                            style={{
                              color: amoledColors.textMuted,
                              fontSize: '0.875rem',
                              marginBottom: '0.25rem',
                            }}
                          >
                            First Workout
                          </div>
                          <div
                            style={{
                              color: amoledColors.text,
                              fontWeight: '600',
                              fontSize: '0.95rem',
                            }}
                          >
                            {coachingInsights.firstWorkout || 'N/A'}
                          </div>
                        </Col>
                        <Col xs={6} className='mb-3'>
                          <div
                            style={{
                              color: amoledColors.textMuted,
                              fontSize: '0.875rem',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Most Recent
                          </div>
                          <div
                            style={{
                              color: amoledColors.text,
                              fontWeight: '600',
                              fontSize: '0.95rem',
                            }}
                          >
                            {coachingInsights.mostRecent || 'N/A'}
                          </div>
                        </Col>
                        <Col xs={6} className='mb-3'>
                          <div
                            style={{
                              color: amoledColors.textMuted,
                              fontSize: '0.875rem',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Avg Weight/Workout
                          </div>
                          <div
                            style={{
                              color: amoledColors.text,
                              fontWeight: '600',
                              fontSize: '0.95rem',
                            }}
                          >
                            {coachingInsights.avgWeightPerSet} kg
                          </div>
                        </Col>
                        <Col xs={6} className='mb-3'>
                          <div
                            style={{
                              color: amoledColors.textMuted,
                              fontSize: '0.875rem',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Avg Reps/Set
                          </div>
                          <div
                            style={{
                              color: amoledColors.text,
                              fontWeight: '600',
                              fontSize: '0.95rem',
                            }}
                          >
                            {coachingInsights.avgRepsPerSet}
                          </div>
                        </Col>
                        <Col xs={12}>
                          <div
                            style={{
                              color: amoledColors.textMuted,
                              fontSize: '0.875rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            Exercise Variety
                          </div>
                          <div className='d-flex align-items-center'>
                            <div
                              style={{
                                color: amoledColors.text,
                                fontWeight: '700',
                                fontSize: '1.25rem',
                                marginRight: '8px',
                              }}
                            >
                              {coachingInsights.exerciseVariety}
                            </div>
                            <div
                              style={{ fontSize: '1rem', marginRight: '8px' }}
                            >
                              🎯
                            </div>
                            <small
                              style={{ color: amoledColors.textSecondary }}
                            >
                              {coachingInsights.exerciseVariety >= 10
                                ? 'Excellent variety!'
                                : coachingInsights.exerciseVariety >= 6
                                ? 'Good variety'
                                : coachingInsights.exerciseVariety >= 3
                                ? 'Limited variety'
                                : 'Very limited'}
                            </small>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Coaching Recommendations */}
              {coachingInsights.recommendations.length > 0 && (
                <Row className='mb-5'>
                  <Col xs={12}>
                    <Card style={cardStyle}>
                      <Card.Header
                        style={{
                          backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
                          borderBottom: `2px solid ${
                            isDarkMode ? '#111111' : '#e5e7eb'
                          }`,
                          padding: '1.5rem',
                          borderTopLeftRadius: '16px',
                          borderTopRightRadius: '16px',
                        }}
                      >
                        <h5
                          className='m-0 d-flex align-items-center'
                          style={{
                            color: amoledColors.text,
                            fontWeight: '600',
                          }}
                        >
                          <div
                            style={{
                              background:
                                'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              borderRadius: '8px',
                              padding: '8px',
                              marginRight: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                            }}
                          >
                            <FaBullseye
                              style={{ color: '#ffffff' }}
                              size={16}
                            />
                          </div>
                          Coaching Recommendations
                        </h5>
                      </Card.Header>
                      <Card.Body style={{ padding: '1.5rem' }}>
                        <Row>
                          {coachingInsights.recommendations.map(
                            (rec, index) => (
                              <Col md={6} className='mb-3' key={index}>
                                <div
                                  style={{
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    backgroundColor: isDarkMode
                                      ? '#1a1a1a'
                                      : '#f8fafc',
                                    border: `1px solid ${
                                      rec.priority === 'urgent'
                                        ? '#ef4444'
                                        : rec.priority === 'high'
                                        ? '#f59e0b'
                                        : rec.priority === 'medium'
                                        ? '#3b82f6'
                                        : '#6b7280'
                                    }`,
                                    borderLeft: `4px solid ${
                                      rec.priority === 'urgent'
                                        ? '#ef4444'
                                        : rec.priority === 'high'
                                        ? '#f59e0b'
                                        : rec.priority === 'medium'
                                        ? '#3b82f6'
                                        : '#6b7280'
                                    }`,
                                  }}
                                >
                                  <div className='d-flex align-items-start'>
                                    <div
                                      style={{
                                        fontSize: '1.5rem',
                                        marginRight: '12px',
                                      }}
                                    >
                                      {rec.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div
                                        style={{
                                          color: amoledColors.text,
                                          fontWeight: '600',
                                          fontSize: '0.95rem',
                                          marginBottom: '0.25rem',
                                        }}
                                      >
                                        {rec.title}
                                      </div>
                                      <div
                                        style={{
                                          color: amoledColors.textSecondary,
                                          fontSize: '0.875rem',
                                          lineHeight: '1.4',
                                        }}
                                      >
                                        {rec.message}
                                      </div>
                                      <Badge
                                        bg={
                                          rec.priority === 'urgent'
                                            ? 'danger'
                                            : rec.priority === 'high'
                                            ? 'warning'
                                            : rec.priority === 'medium'
                                            ? 'primary'
                                            : 'secondary'
                                        }
                                        style={{
                                          fontSize: '0.65rem',
                                          padding: '2px 6px',
                                          marginTop: '0.5rem',
                                        }}
                                      >
                                        {rec.priority.toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </Col>
                            )
                          )}
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Exercise Comparison */}
              <Row className="mt-4 mb-5">
                <Col xs={12}>
                  <Card style={cardStyle}>
                    <Card.Header
                      style={{
                        backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
                        borderBottom: `2px solid ${
                          isDarkMode ? '#111111' : '#e5e7eb'
                        }`,
                        padding: '1.5rem',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                      }}
                    >
                      <h5
                        className="m-0 d-flex align-items-center"
                        style={{ color: amoledColors.text, fontWeight: '600' }}
                      >
                        <div
                          style={{
                            background:
                              'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                            borderRadius: '8px',
                            padding: '8px',
                            marginRight: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                          }}
                        >
                          <FaChartLine style={{ color: '#ffffff' }} size={16} />
                        </div>
                        Exercise Comparison
                      </h5>
                    </Card.Header>
                    <Card.Body style={{ padding: '1.5rem' }}>
                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group controlId="selectExercises">
                            <Form.Label
                              style={{
                                color: amoledColors.text,
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                              }}
                            >
                              Select Exercises
                            </Form.Label>
                            <Select
                              isMulti
                              options={exerciseOptions}
                              value={exerciseOptions.filter((option) =>
                                selectedExercises.includes(option.value)
                              )}
                              onChange={(selected) =>
                                setSelectedExercises(
                                  selected.map((option) => option.value)
                                )
                              }
                              styles={customSelectStyles}
                              placeholder="Choose exercises to compare..."
                              noOptionsMessage={() => 'No exercises found'}
                              isSearchable={true}
                              isClearable={true}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group controlId="selectMetric">
                            <Form.Label
                              style={{
                                color: amoledColors.text,
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                              }}
                            >
                              Select Metric
                            </Form.Label>
                            <Form.Control
                              as="select"
                              value={comparisonMetric}
                              onChange={(e) =>
                                setComparisonMetric(e.target.value)
                              }
                              style={{
                                backgroundColor: amoledColors.cardBg,
                                borderColor: amoledColors.border,
                                color: amoledColors.text,
                                borderRadius: '8px',
                                padding: '10px 12px',
                                minHeight: '42px',
                                fontSize: '0.95rem',
                              }}
                            >
                              <option value="maxWeight">Max Weight</option>
                              <option value="totalReps">Total Reps</option>
                              <option value="frequency">Frequency</option>
                            </Form.Control>
                          </Form.Group>
                        </Col>
                      </Row>
                      <div style={{ height: '300px' }}>
                        <Line
                          data={exerciseComparisonData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: {
                              mode: 'index',
                              intersect: false,
                            },
                            plugins: {
                              tooltip: {
                                mode: 'index',
                                intersect: false,
                              },
                            },
                            scales: {
                              y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                              },
                              y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                grid: {
                                  drawOnChartArea: false,
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default AdminUserWorkoutDashboard;
