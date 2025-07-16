import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  ListGroup,
  Button,
  Tab,
  Tabs,
  ProgressBar,
  Table,
  Image,
  Form,
  Modal,
} from 'react-bootstrap';
import {
  FaDumbbell,
  FaChartLine,
  FaCalendarAlt,
  FaTrophy,
  FaFire,
  FaCalendarCheck,
  FaChartBar,
  FaChevronRight,
  FaBullseye,
  FaCheck,
  FaClock,
  FaWeight,
  FaHistory,
} from 'react-icons/fa';
import {
  format,
  parseISO,
  differenceInDays,
  subDays,
  getDay,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isWithinInterval,
  eachDayOfInterval,
} from 'date-fns';
import { LinkContainer } from 'react-router-bootstrap';
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
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import Select from 'react-select';
import {
  useGetMyWorkoutEntriesQuery,
  useDeleteWorkoutEntryMutation,
} from '../slices/workoutApiSlice';
import {
  useGetActiveSessionQuery,
  useGetWorkoutSessionsQuery,
  useAutoGroupExercisesMutation,
} from '../slices/workoutSessionApiSlice';
import WorkoutSessionDashboard from '../components/WorkoutSessionDashboard';
import ExpandableSessionCard from '../components/ExpandableSessionCard';

import {
  groupWorkoutsIntoSessions,
  groupSessionsByDate,
  calculateSessionStats,
  getMuscleGroupDistribution,
  getTopExercisesByVolume,
} from '../utils/sessionGrouping';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import {
  ResponsiveContainer,
  LineChart,
  Line as RechartsLine,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie as RechartsPie,
  Cell,
  BarChart,
  Bar as RechartsBar,
  Legend as RechartsLegend,
} from 'recharts';
import { Link } from 'react-router-dom';
// Import animation components
import AnimatedScreenWrapper from '../components/animations/AnimatedScreenWrapper';
import FadeIn from '../components/animations/FadeIn';
import StaggeredList from '../components/animations/StaggeredList';

// Register Chart.js components
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

// Add this style block at the top of the file
const mobileButtonStyle = {
  '@media (max-width: 576px)': {
    padding: '0.6rem 1.2rem',
    fontSize: '0.9rem',
    flex: '1 1 45%'
  }
};

const WorkoutDashboardScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const {
    data: workouts,
    isLoading,
    error,
    refetch,
  } = useGetMyWorkoutEntriesQuery();
  const [deleteWorkoutEntry] = useDeleteWorkoutEntryMutation();

  // Force refresh data to clear cache
  const handleForceRefresh = () => {
    refetch();
  };

  // Session-related state and queries
  const { data: activeSession } = useGetActiveSessionQuery();
  const { data: sessionsData } = useGetWorkoutSessionsQuery({ limit: 10 });
  const [autoGroupExercises] = useAutoGroupExercisesMutation();
  const [showSessionView, setShowSessionView] = useState(true); // Default to session view

  // Automatically group workouts into sessions
  const groupedSessions = useMemo(() => {
    if (!workouts) return [];
    return groupWorkoutsIntoSessions(workouts, 60); // 1 hour time window
  }, [workouts]);

  const sessionsByDate = useMemo(() => {
    return groupSessionsByDate(groupedSessions);
  }, [groupedSessions]);

  // State for delete workout confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);

  // State for active charts and data
  const [activeExercise, setActiveExercise] = useState(null);

  // State for workout history modal
  const [showWorkoutHistoryModal, setShowWorkoutHistoryModal] = useState(false);
  const [workoutHistoryFilter, setWorkoutHistoryFilter] = useState('all'); // 'all', 'recent', 'by-exercise'
  const [selectedExerciseFilter, setSelectedExerciseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [workoutsPerPage] = useState(10);

  // State for fitness goals
  const [fitnessGoals, setFitnessGoals] = useState([
    {
      id: 1,
      name: 'Weekly Workouts',
      target: 4,
      current: 0,
      unit: 'workouts',
      icon: 'calendar-check',
    },
    {
      id: 2,
      name: 'Monthly Reps',
      target: 2000,
      current: 0,
      unit: 'reps',
      icon: 'dumbbell',
    },
    {
      id: 3,
      name: 'Workout Streak',
      target: 7,
      current: 0,
      unit: 'days',
      icon: 'fire',
    },
  ]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);

  // State for exercise comparison
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [comparisonMetric, setComparisonMetric] = useState('maxWeight'); // 'maxWeight', 'totalReps', 'frequency'
  const [workoutGoals, setWorkoutGoals] = useState([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
    targetValue: '',
    metricType: 'weight',
    exercise: '',
  });

  // Define AMOLED theme colors
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
    marginBottom: isMobile ? '1rem' : '1.5rem',
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
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: isDarkMode
        ? '0 12px 40px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.7)'
        : '0 12px 40px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.06)',
    },
  };

  // Listen for theme changes
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

  // Handle responsive design changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get recent workouts (last 30 days)
  const getRecentWorkouts = () => {
    if (!workouts) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return workouts
      .filter((workout) => new Date(workout.date) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Group workouts by product
  const getWorkoutsByProduct = () => {
    if (!workouts) return {};

    const grouped = {};
    workouts.forEach((workout) => {
      const productId = workout.product._id;
      if (!grouped[productId]) {
        grouped[productId] = {
          product: workout.product,
          workouts: [],
        };
      }
      grouped[productId].workouts.push(workout);
    });

    // Sort each product's workouts by date (newest first)
    Object.values(grouped).forEach((group) => {
      group.workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return grouped;
  };

  // Get feeling badge variant
  const getFeelingVariant = (feeling) => {
    switch (feeling) {
      case 'easy':
        return 'success';
      case 'moderate':
        return 'info';
      case 'hard':
        return 'warning';
      case 'extreme':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Format workout date
  const formatWorkoutDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy - h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Calculate workout streak
  const calculateWorkoutStreak = useMemo(() => {
    if (!workouts || workouts.length === 0) return 0;

    // Sort workouts by date (newest first)
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // Get the most recent workout
    const mostRecentWorkout = sortedWorkouts[0];
    const mostRecentDate = new Date(mostRecentWorkout.date);
    const today = new Date();

    // Check if the most recent workout is not from today or yesterday, streak is broken
    if (differenceInDays(today, mostRecentDate) > 1) {
      return 0;
    }

    let streak = 1;
    let currentDate = mostRecentDate;

    // Loop through other workouts to find streak
    for (let i = 1; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].date);

      // If dates are the same, continue checking next workout
      if (isSameDay(workoutDate, currentDate)) {
        continue;
      }

      // If this workout was done the day before, continue streak
      if (differenceInDays(currentDate, workoutDate) === 1) {
        streak++;
        currentDate = workoutDate;
      } else {
        // Streak is broken
        break;
      }
    }

    return streak;
  }, [workouts]);

  // Calculate personal records
  const getPersonalRecords = useMemo(() => {
    if (!workouts || workouts.length === 0) return {};

    const records = {};

    workouts.forEach((workout) => {
      const productId = workout.product._id;
      const productName = workout.product.name;

      if (!records[productId]) {
        records[productId] = {
          productName,
          productImage: workout.product.image,
          maxWeight: 0,
          maxReps: 0,
          maxVolume: 0, // weight * reps
          date: null,
        };
      }

      workout.sets?.forEach((set) => {
        // Max weight
        if (set.weight > records[productId].maxWeight) {
          records[productId].maxWeight = set.weight;
          records[productId].maxWeightDate = workout.date;
        }

        // Max reps
        if (set.reps > records[productId].maxReps) {
          records[productId].maxReps = set.reps;
          records[productId].maxRepsDate = workout.date;
        }

        // Max volume (weight * reps)
        const volume = set.weight * set.reps;
        if (volume > records[productId].maxVolume) {
          records[productId].maxVolume = volume;
          records[productId].maxVolumeDate = workout.date;
        }
      });
    });

    // Convert to array and sort by maxWeight
    return Object.values(records).sort((a, b) => b.maxWeight - a.maxWeight);
  }, [workouts]);

  // Generate weekly workout data
  const weeklyWorkoutData = useMemo(() => {
    if (!workouts || workouts.length === 0)
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Workouts',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: amoledColors.chartColors.purple,
            borderColor: amoledColors.accent,
            borderWidth: 1,
          },
        ],
      };

    // Get the last 7 days (including today)
    const today = new Date();
    const lastWeek = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      return {
        date,
        day: format(date, 'EEE'),
        count: 0,
      };
    });

    // Count workouts for each day
    workouts.forEach((workout) => {
      const workoutDate = new Date(workout.date);

      // Check if workout falls within the last week
      lastWeek.forEach((day) => {
        if (isSameDay(workoutDate, day.date)) {
          day.count++;
        }
      });
    });

    // Prepare data for chart
    return {
      labels: lastWeek.map((day) => day.day),
      datasets: [
        {
          label: 'Workouts',
          data: lastWeek.map((day) => day.count),
          backgroundColor: amoledColors.chartColors.purple,
          borderColor: amoledColors.accent,
          borderWidth: 1,
        },
      ],
    };
  }, [workouts]);

  // Generate workout intensity distribution
  const intensityDistribution = useMemo(() => {
    if (!workouts || workouts.length === 0)
      return {
        labels: [],
        datasets: [],
      };

    const feelingCounts = {
      easy: 0,
      moderate: 0,
      hard: 0,
      extreme: 0,
    };

    workouts.forEach((workout) => {
      if (workout.feeling && feelingCounts.hasOwnProperty(workout.feeling)) {
        feelingCounts[workout.feeling]++;
      }
    });

    // Colors for each intensity
    const backgroundColors = {
      easy: amoledColors.chartColors.green,
      moderate: amoledColors.chartColors.blue,
      hard: amoledColors.chartColors.orange,
      extreme: amoledColors.chartColors.red,
    };

    return {
      labels: Object.keys(feelingCounts).map(
        (key) => key.charAt(0).toUpperCase() + key.slice(1)
      ),
      datasets: [
        {
          data: Object.values(feelingCounts),
          backgroundColor: Object.keys(feelingCounts).map(
            (key) => backgroundColors[key]
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [workouts]);

  // Track exercise performance over time for a specific product
  const getExercisePerformanceData = (productId) => {
    if (!workouts || workouts.length === 0)
      return {
        labels: [],
        datasets: [],
      };

    // Filter workouts for this product
    const productWorkouts = workouts
      .filter((workout) => workout.product._id === productId)
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest to newest

    if (productWorkouts.length === 0) return { labels: [], datasets: [] };

    // Extract dates and max weights for each workout
    const dates = productWorkouts.map((workout) =>
      format(new Date(workout.date), 'MMM d')
    );

    // Track max weight and volume for each workout (converted to kg)
    const maxWeights = productWorkouts.map((workout) => {
      const sets = workout.sets || [];
      if (sets.length === 0) return 0;
      return Math.round(
        Math.max(...sets.map((set) => set.weight || 0)) / 2.205
      );
    });

    const totalReps = productWorkouts.map((workout) => {
      const sets = workout.sets || [];
      if (sets.length === 0) return 0;
      return sets.reduce((sum, set) => sum + (set.reps || 0), 0);
    });

    // Prepare data for line chart
    return {
      labels: dates,
      datasets: [
        {
          label: 'Max Weight (kg)',
          data: maxWeights,
          borderColor: amoledColors.chartColors.blue,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          yAxisID: 'y',
        },
        {
          label: 'Total Reps',
          data: totalReps,
          borderColor: amoledColors.chartColors.purple,
          backgroundColor: 'rgba(139, 92, 246, 0.5)',
          yAxisID: 'y1',
        },
      ],
    };
  };

  // Generate calendar heat map data
  const getWorkoutCalendarData = useMemo(() => {
    if (!workouts || workouts.length === 0) return [];

    // Get 90 days back
    const endDate = new Date();
    const startDate = subDays(endDate, 90);

    // Get all dates in range
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    // Map workout counts to dates
    return dateRange.map((date) => {
      // Count workouts on this date
      const workoutsOnDate = workouts.filter((workout) =>
        isSameDay(new Date(workout.date), date)
      );

      return {
        date: format(date, 'yyyy-MM-dd'),
        count: workoutsOnDate.length,
        day: format(date, 'EEE'),
        isToday: isSameDay(date, new Date()),
      };
    });
  }, [workouts]);

  // Update goals based on workout data
  useEffect(() => {
    if (
      workouts &&
      weeklyWorkoutData &&
      weeklyWorkoutData.datasets &&
      weeklyWorkoutData.datasets[0]
    ) {
      // Clone the current goals
      const updatedGoals = [...fitnessGoals];

      // Calculate weekly workout count
      const weeklyWorkoutCount = weeklyWorkoutData.datasets[0].data.reduce(
        (sum, count) => sum + count,
        0
      );
      updatedGoals[0].current = weeklyWorkoutCount;

      // Calculate monthly reps
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyWorkouts = workouts.filter(
        (workout) => new Date(workout.date) >= thirtyDaysAgo
      );
      const monthlyReps = monthlyWorkouts.reduce((total, workout) => {
        const workoutReps =
          workout.sets?.reduce((setTotal, set) => {
            return setTotal + (set.reps || 0);
          }, 0) || 0;
        return total + workoutReps;
      }, 0);
      updatedGoals[1].current = monthlyReps;

      // Set current streak
      updatedGoals[2].current = calculateWorkoutStreak;

      setFitnessGoals(updatedGoals);
    }
  }, [workouts, weeklyWorkoutData, calculateWorkoutStreak]);

  // Handle goal edit
  const handleEditGoal = (goal) => {
    setCurrentGoal({ ...goal });
    setShowGoalModal(true);
  };

  // Save updated goal
  const handleSaveGoal = () => {
    const updatedGoals = fitnessGoals.map((goal) =>
      goal.id === currentGoal.id ? currentGoal : goal
    );
    setFitnessGoals(updatedGoals);
    setShowGoalModal(false);
  };

  // Handle delete workout
  const handleDeleteWorkout = async () => {
    try {
      await deleteWorkoutEntry(workoutToDelete);
      refetch();
      setShowDeleteModal(false);
      setWorkoutToDelete(null);
    } catch (err) {
      console.error('Error deleting workout:', err);
    }
  };

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

  const GoalForm = () => {
    return (
      <Modal show={showGoalForm} onHide={() => setShowGoalForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Set New Fitness Goal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className='mb-3'>
              <Form.Label>Goal Title</Form.Label>
              <Form.Control
                type='text'
                value={newGoal.title}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, title: e.target.value })
                }
                placeholder='e.g., Increase bench press'
              />
            </Form.Group>
            <Form.Group className='mb-3'>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as='textarea'
                rows={2}
                value={newGoal.description}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, description: e.target.value })
                }
                placeholder='Describe your goal...'
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className='mb-3'>
                  <Form.Label>Target Date</Form.Label>
                  <Form.Control
                    type='date'
                    value={newGoal.targetDate}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, targetDate: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className='mb-3'>
                  <Form.Label>Target Value</Form.Label>
                  <Form.Control
                    type='number'
                    value={newGoal.targetValue}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, targetValue: e.target.value })
                    }
                    placeholder='e.g., 225'
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className='mb-3'>
                  <Form.Label>Metric Type</Form.Label>
                  <Form.Select
                    value={newGoal.metricType}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, metricType: e.target.value })
                    }
                  >
                    <option value='weight'>Weight (lbs)</option>
                    <option value='reps'>Repetitions</option>
                    <option value='distance'>Distance (miles)</option>
                    <option value='time'>Time (minutes)</option>
                    <option value='frequency'>Frequency (per week)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className='mb-3'>
                  <Form.Label>Exercise (optional)</Form.Label>
                  <Form.Control
                    type='text'
                    value={newGoal.exercise}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, exercise: e.target.value })
                    }
                    placeholder='e.g., Bench Press'
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShowGoalForm(false)}>
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={() => {
              setWorkoutGoals([
                ...workoutGoals,
                { ...newGoal, id: Date.now(), progress: 0 },
              ]);
              setShowGoalForm(false);
              setNewGoal({
                title: '',
                description: '',
                targetDate: '',
                targetValue: '',
                metricType: 'weight',
                exercise: '',
              });
            }}
          >
            Save Goal
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Define the goal display component
  const GoalCard = ({ goal }) => {
    const calculateDaysLeft = () => {
      const today = new Date();
      const targetDate = new Date(goal.targetDate);
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    };

    const daysLeft = calculateDaysLeft();

    return (
      <Card className='mb-3' style={cardStyle}>
        <Card.Body>
          <Card.Title>{goal.title}</Card.Title>
          <Card.Text>{goal.description}</Card.Text>
          <ProgressBar
            now={goal.progress}
            label={`${goal.progress}%`}
            variant={
              goal.progress < 30
                ? 'danger'
                : goal.progress < 70
                ? 'warning'
                : 'success'
            }
          />
          <div className='d-flex justify-content-between mt-2'>
            <small>
              Target: {goal.targetValue} {goal.metricType}
            </small>
            <small>{daysLeft} days left</small>
          </div>
          <div className='d-flex justify-content-between mt-2'>
            {goal.exercise && <small>Exercise: {goal.exercise}</small>}
            <Button size='sm' variant='outline-secondary'>
              Update Progress
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  // Compute recentWorkouts for rendering
  const recentWorkouts = getRecentWorkouts();

  // Compute workoutCounts for Most Used Products
  const workoutCounts = useMemo(() => {
    if (!workouts) return {};
    const counts = {};
    workouts.forEach((workout) => {
      const product = workout.product;
      if (!counts[product._id]) {
        counts[product._id] = {
          name: product.name,
          image: product.image,
          count: 0,
        };
      }
      counts[product._id].count++;
    });
    return counts;
  }, [workouts]);

  return (
    <>
      <Meta title='My Workout Dashboard' />
      <AnimatedScreenWrapper
        isLoading={isLoading}
        error={error?.data?.message || error?.error}
      >
        {/* Add CSS Animations */}
        <style jsx>{`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(10deg);
            }
          }

          @keyframes pulse {
            0%,
            100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }

          @keyframes glow {
            0% {
              box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
            }
            100% {
              box-shadow: 0 0 30px rgba(168, 85, 247, 0.8),
                0 0 40px rgba(168, 85, 247, 0.4);
            }
          }
        `}</style>

        <Container
          fluid
          className='py-1 px-1 screen-container'
          style={{
            backgroundColor: amoledColors.background,
            minHeight: 'calc(100vh - 70px)', // Subtract header height
            fontFamily: "'Inter', sans-serif",
            paddingTop: '0.5rem', // Small top padding instead of relying on py-1
          }}
        >
          {/* Simplified Header Section */}
          <Row className={isMobile ? 'mb-2' : 'mb-3'}>
            <Col>
              <Card
                className='mb-2'
                style={{
                  ...headerCardStyle,
                  background: isDarkMode ? '#000000' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#1a1a1a' : '#e5e7eb'}`,
                  borderRadius: '12px',
                }}
              >
                <Card.Body
                  style={{ padding: isMobile ? '1rem 0.75rem' : '1.5rem' }}
                >
                  <div className='text-center'>
                    {/* Simple Title */}
                    <h1
                      className="mb-4"
                      style={{
                        color: amoledColors.text,
                        fontWeight: '800',
                        fontSize: isMobile ? '1.8rem' : '2.5rem',
                        letterSpacing: isMobile ? '-0.5px' : '-1px',
                        lineHeight: isMobile ? '1.2' : '1.1',
                      }}
                    >
                      My Workout Dashboard
                    </h1>

                    {/* View Toggle Buttons */}
                    <div
                      className={`d-flex justify-content-center gap-2 mb-4 px-2`}
                    >
                      <Button
                        variant={
                          !showSessionView ? 'primary' : 'outline-primary'
                        }
                        size="sm"
                        onClick={() => setShowSessionView(false)}
                        className='w-100 w-sm-auto'
                        style={mobileButtonStyle}
                      >
                        Traditional
                      </Button>
                      <Button
                        variant={
                          showSessionView ? 'primary' : 'outline-primary'
                        }
                        size="sm"
                        onClick={() => setShowSessionView(true)}
                        className='w-100 w-sm-auto'
                        style={mobileButtonStyle}
                      >
                        Sessions
                      </Button>
                    </div>

                    {/* Key Metrics */}
                    {workouts && workouts.length > 0 ? (
                      <div className="metrics-container py-3" style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, minmax(150px, 1fr))',
                        gap: isMobile ? '1rem' : '2.5rem',
                        maxWidth: '800px',
                        margin: '0 auto',
                        borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      }}>
                        {/* Total Workouts */}
                        <div className="metric-item text-center">
                          <div
                            style={{
                              color: isDarkMode ? '#60A5FA' : '#2563EB',
                              fontSize: isMobile ? '1.8rem' : '3rem',
                              fontWeight: '700',
                              lineHeight: '1.1',
                              marginBottom: isMobile ? '0.25rem' : '0.5rem',
                            }}
                          >
                            {workouts?.length || 0}
                          </div>
                          <div
                            style={{
                              color: isDarkMode ? '#94A3B8' : '#6B7280',
                              fontSize: isMobile ? '0.7rem' : '0.9rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Total Workouts
                          </div>
                        </div>

                        {/* Current Streak */}
                        <div className="metric-item text-center">
                          <div
                            style={{
                              color: isDarkMode ? '#34D399' : '#059669',
                              fontSize: isMobile ? '1.8rem' : '3rem',
                              fontWeight: '700',
                              lineHeight: '1.1',
                              marginBottom: isMobile ? '0.25rem' : '0.5rem',
                            }}
                          >
                            {calculateWorkoutStreak}
                          </div>
                          <div
                            style={{
                              color: isDarkMode ? '#94A3B8' : '#6B7280',
                              fontSize: isMobile ? '0.7rem' : '0.9rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Current Streak
                          </div>
                        </div>

                        {/* Personal Records */}
                        <div className="metric-item text-center">
                          <div
                            style={{
                              color: isDarkMode ? '#FBBF24' : '#D97706',
                              fontSize: isMobile ? '1.8rem' : '3rem',
                              fontWeight: '700',
                              lineHeight: '1.1',
                              marginBottom: isMobile ? '0.25rem' : '0.5rem',
                            }}
                          >
                            {getPersonalRecords.length}
                          </div>
                          <div
                            style={{
                              color: isDarkMode ? '#94A3B8' : '#6B7280',
                              fontSize: isMobile ? '0.7rem' : '0.9rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Personal Records
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Empty State for Header Metrics */
                      <div className='text-center'>
                        <FaDumbbell
                          size={isMobile ? 48 : 64}
                          style={{
                            color: amoledColors.textMuted,
                            opacity: 0.5,
                            marginBottom: '1.5rem',
                          }}
                        />
                        <h4
                          style={{
                            color: amoledColors.text,
                            marginBottom: '1rem',
                            fontSize: isMobile ? '1.3rem' : '1.8rem',
                          }}
                        >
                          Start Your Fitness Journey
                        </h4>
                        <p
                          style={{
                            color: amoledColors.textMuted,
                            marginBottom: '2rem',
                            fontSize: isMobile ? '0.9rem' : '1.1rem',
                            lineHeight: '1.5',
                            maxWidth: '500px',
                            margin: '0 auto 2rem',
                          }}
                        >
                          Track your workouts, monitor your progress, and
                          achieve your fitness goals. Your fitness journey
                          begins with your first workout!
                        </p>
                        <div className='d-flex flex-column flex-sm-row gap-3 justify-content-center align-items-center'>
                          <Button
                            variant='primary'
                            size={isMobile ? 'md' : 'lg'}
                            as={Link}
                            to='/products'
                            style={{
                              backgroundColor: amoledColors.accent,
                              borderColor: amoledColors.accent,
                              padding: isMobile
                                ? '0.75rem 2rem'
                                : '1rem 2.5rem',
                              fontSize: isMobile ? '0.9rem' : '1.1rem',
                            }}
                          >
                            <FaDumbbell className='me-2' />
                            Start Working Out
                          </Button>
                          <Button
                            variant='outline-primary'
                            size={isMobile ? 'md' : 'lg'}
                            onClick={() => setShowGoalModal(true)}
                            style={{
                              borderColor: amoledColors.accent,
                              color: amoledColors.accent,
                              padding: isMobile
                                ? '0.75rem 2rem'
                                : '1rem 2.5rem',
                              fontSize: isMobile ? '0.9rem' : '1.1rem',
                            }}
                          >
                            <FaBullseye className='me-2' />
                            Set Goals
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {!isLoading && !error && (
            <>
              {/* Comprehensive Analytics Section */}
              <Row className='mb-5'>
                <Col>
                  <FadeIn direction='up' delay={200}>
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
                          style={{
                            color: amoledColors.text,
                            fontWeight: '600',
                          }}
                        >
                          <div
                            style={{
                              background:
                                'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                              borderRadius: '8px',
                              padding: '8px',
                              marginRight: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                            }}
                          >
                            <FaChartLine
                              style={{ color: '#ffffff' }}
                              size={16}
                            />
                          </div>
                          Workout Progress & Analytics
                        </h5>
                      </Card.Header>
                      <Card.Body
                        style={{ padding: isMobile ? '1rem' : '2rem' }}
                      >
                        {workouts && workouts.length >= 2 ? (
                          <Row>
                            {/* Progress vs Previous Performance */}
                            <Col lg={6} className='mb-4'>
                              <h6
                                style={{
                                  color: amoledColors.text,
                                  fontWeight: '600',
                                  marginBottom: '1rem',
                                  fontSize: isMobile ? '0.9rem' : '1rem',
                                }}
                              >
                                📊 Performance Improvement Tracking
                              </h6>
                              <div
                                style={{
                                  height: isMobile ? '200px' : '250px',
                                  background: isDarkMode
                                    ? 'rgba(255,255,255,0.02)'
                                    : 'rgba(0,0,0,0.02)',
                                  borderRadius: '12px',
                                  padding: isMobile ? '0.5rem' : '1rem',
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
                                                {
                                                  month: 'short',
                                                  day: 'numeric',
                                                }
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

                                        weeklyData[weekKey].maxWeight =
                                          Math.max(
                                            weeklyData[weekKey].maxWeight,
                                            maxWeight
                                          );
                                        weeklyData[weekKey].totalReps +=
                                          totalReps;
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
                                            ((week.maxWeight -
                                              prevWeek.maxWeight) /
                                              Math.max(prevWeek.maxWeight, 1)) *
                                            100;

                                          // Combined improvement score (50% weight progression, 50% rep volume)
                                          week.improvement =
                                            weightImprovement * 0.5 +
                                            repsImprovement * 0.5;
                                          week.improvementDisplay =
                                            week.improvement > 0
                                              ? `+${week.improvement.toFixed(
                                                  1
                                                )}%`
                                              : `${week.improvement.toFixed(
                                                  1
                                                )}%`;
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
                                        fill: isDarkMode
                                          ? '#9ca3af'
                                          : '#6b7280',
                                      }}
                                      interval='preserveStartEnd'
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
                                      formatter={(value, name) => [
                                        `${value > 0 ? '+' : ''}${value.toFixed(
                                          1
                                        )}%`,
                                        'Improvement vs Previous Week',
                                      ]}
                                      labelFormatter={(label) =>
                                        `Week of ${label}`
                                      }
                                    />
                                    {/* Zero line for reference */}
                                    <RechartsLine
                                      dataKey={() => 0}
                                      stroke={
                                        isDarkMode ? '#6b7280' : '#9ca3af'
                                      }
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

                            {/* Exercise-Specific Progress */}
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
                                <ResponsiveContainer width='100%' height='100%'>
                                  <BarChart
                                    data={(() => {
                                      if (!workouts || workouts.length < 2)
                                        return [];

                                      // Group by exercise and calculate improvements
                                      const exerciseData = {};
                                      workouts.forEach((workout) => {
                                        const exerciseName =
                                          workout.product?.name || 'Unknown';
                                        if (!exerciseData[exerciseName]) {
                                          exerciseData[exerciseName] = {
                                            name: exerciseName,
                                            sessions: [],
                                            latestMaxWeight: 0,
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

                                        exerciseData[
                                          exerciseName
                                        ].sessions.push({
                                          date: new Date(workout.date),
                                          maxWeight,
                                          totalReps,
                                        });
                                      });

                                      // Calculate improvement for each exercise
                                      const improvements = Object.values(
                                        exerciseData
                                      )
                                        .filter((ex) => ex.sessions.length >= 2)
                                        .map((exercise) => {
                                          // Sort sessions by date
                                          exercise.sessions.sort(
                                            (a, b) => a.date - b.date
                                          );

                                          // Compare latest performance vs baseline (first session)
                                          const firstSession =
                                            exercise.sessions[0];
                                          const latestSession =
                                            exercise.sessions[
                                              exercise.sessions.length - 1
                                            ];

                                          // Calculate weight improvement
                                          const weightImprovement =
                                            ((latestSession.maxWeight -
                                              firstSession.maxWeight) /
                                              Math.max(
                                                firstSession.maxWeight,
                                                1
                                              )) *
                                            100;

                                          // Calculate reps improvement
                                          const repsImprovement =
                                            ((latestSession.totalReps -
                                              firstSession.totalReps) /
                                              Math.max(
                                                firstSession.totalReps,
                                                1
                                              )) *
                                            100;

                                          // Combined score (80% weight progression, 20% rep volume for strength focus)
                                          const totalImprovement =
                                            weightImprovement * 0.8 +
                                            repsImprovement * 0.2;

                                          return {
                                            name:
                                              exercise.name.length > 12
                                                ? exercise.name.substring(
                                                    0,
                                                    12
                                                  ) + '...'
                                                : exercise.name,
                                            fullName: exercise.name,
                                            improvement: totalImprovement,
                                            weightImprovement,
                                            repsImprovement,
                                            sessions: exercise.sessions.length,
                                            latestWeight:
                                              latestSession.maxWeight,
                                            firstWeight: firstSession.maxWeight,
                                          };
                                        })
                                        .sort(
                                          (a, b) =>
                                            b.improvement - a.improvement
                                        )
                                        .slice(0, 6); // Top 6 exercises

                                      return improvements;
                                    })()}
                                  >
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
                                      angle={-45}
                                      textAnchor='end'
                                      height={60}
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
                                        'Total Improvement',
                                      ]}
                                      labelFormatter={(label, payload) => {
                                        if (payload && payload[0]) {
                                          const data = payload[0].payload;
                                          return (
                                            <div>
                                              <div
                                                style={{ fontWeight: 'bold' }}
                                              >
                                                {data.fullName}
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: '12px',
                                                  opacity: 0.8,
                                                }}
                                              >
                                                Weight: {data.firstWeight}kg →{' '}
                                                {data.latestWeight}kg (
                                                {data.weightImprovement > 0
                                                  ? '+'
                                                  : ''}
                                                {data.weightImprovement.toFixed(
                                                  1
                                                )}
                                                %)
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: '12px',
                                                  opacity: 0.8,
                                                }}
                                              >
                                                {data.sessions} total sessions
                                              </div>
                                            </div>
                                          );
                                        }
                                        return label;
                                      }}
                                    />
                                    <RechartsBar
                                      dataKey='improvement'
                                      radius={[4, 4, 0, 0]}
                                      fill={(entry) => {
                                        const improvement =
                                          entry?.improvement || 0;
                                        return improvement > 10
                                          ? '#22c55e'
                                          : improvement > 0
                                          ? '#22d3ee'
                                          : improvement > -10
                                          ? '#f59e0b'
                                          : '#ef4444';
                                      }}
                                    >
                                      {(() => {
                                        if (!workouts || workouts.length < 2)
                                          return [];

                                        // This is a hack to get dynamic colors for each bar
                                        const exerciseData = {};
                                        workouts.forEach((workout) => {
                                          const exerciseName =
                                            workout.product?.name || 'Unknown';
                                          if (!exerciseData[exerciseName]) {
                                            exerciseData[exerciseName] = {
                                              name: exerciseName,
                                              sessions: [],
                                              latestMaxWeight: 0,
                                              improvement: 0,
                                            };
                                          }

                                          const maxWeight = Math.max(
                                            ...(workout.sets?.map(
                                              (set) => set.weight || 0
                                            ) || [0])
                                          );
                                          const volume =
                                            workout.sets?.reduce(
                                              (sum, set) =>
                                                sum +
                                                (set.weight || 0) *
                                                  (set.reps || 0),
                                              0
                                            ) || 0;

                                          exerciseData[
                                            exerciseName
                                          ].sessions.push({
                                            date: new Date(workout.date),
                                            maxWeight,
                                            volume,
                                          });
                                        });

                                        const improvements = Object.values(
                                          exerciseData
                                        )
                                          .filter(
                                            (ex) => ex.sessions.length >= 2
                                          )
                                          .map((exercise) => {
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
                                            const volumeImprovement =
                                              ((latestSession.volume -
                                                firstSession.volume) /
                                                Math.max(
                                                  firstSession.volume,
                                                  1
                                                )) *
                                              100;
                                            const totalImprovement =
                                              weightImprovement * 0.7 +
                                              volumeImprovement * 0.3;
                                            return {
                                              improvement: totalImprovement,
                                            };
                                          })
                                          .sort(
                                            (a, b) =>
                                              b.improvement - a.improvement
                                          )
                                          .slice(0, 6);

                                        return improvements.map((_, index) => {
                                          const improvement =
                                            improvements[index]?.improvement ||
                                            0;
                                          const color =
                                            improvement > 10
                                              ? '#22c55e'
                                              : improvement > 0
                                              ? '#22d3ee'
                                              : improvement > -10
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
                              </div>
                            </Col>
                          </Row>
                        ) : (
                          /* Empty State for Analytics */
                          <div className='text-center py-5'>
                            <FaChartBar
                              size={isMobile ? 48 : 64}
                              style={{
                                color: amoledColors.textMuted,
                                opacity: 0.5,
                                marginBottom: '1.5rem',
                              }}
                            />
                            <h4
                              style={{
                                color: amoledColors.text,
                                marginBottom: '1rem',
                                fontSize: isMobile ? '1.3rem' : '1.8rem',
                              }}
                            >
                              Unlock Your Analytics
                            </h4>
                            <p
                              style={{
                                color: amoledColors.textMuted,
                                marginBottom: '2rem',
                                fontSize: isMobile ? '0.9rem' : '1.1rem',
                                lineHeight: '1.5',
                                maxWidth: '600px',
                                margin: '0 auto 2rem',
                              }}
                            >
                              Complete at least 2 workouts to unlock detailed
                              progress tracking, performance analytics, and
                              improvement insights. Track your journey from day
                              one!
                            </p>
                            <div className='d-flex flex-column flex-sm-row gap-3 justify-content-center align-items-center'>
                              <Button
                                variant='primary'
                                size={isMobile ? 'md' : 'lg'}
                                as={Link}
                                to='/products'
                                style={{
                                  backgroundColor: amoledColors.accent,
                                  borderColor: amoledColors.accent,
                                  padding: isMobile
                                    ? '0.75rem 2rem'
                                    : '1rem 2.5rem',
                                  fontSize: isMobile ? '0.9rem' : '1.1rem',
                                }}
                              >
                                <FaDumbbell className='me-2' />
                                {workouts && workouts.length === 1
                                  ? 'Complete 2nd Workout'
                                  : 'Start First Workout'}
                              </Button>
                              {workouts && workouts.length === 1 && (
                                <small
                                  style={{
                                    color: amoledColors.textMuted,
                                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                                  }}
                                >
                                  You're just one workout away from analytics!
                                </small>
                              )}
                            </div>
                          </div>
                        )}

                        {workouts && workouts.length >= 2 && (
                          <Row className='mt-4'>
                            {/* Key Metrics */}
                            <Col lg={3} md={6} className='mb-3'>
                              <div
                                style={{
                                  padding: isMobile ? '1rem' : '1.5rem',
                                  background: isDarkMode
                                    ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
                                    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                  borderRadius: '12px',
                                  border: `1px solid ${
                                    isDarkMode
                                      ? 'rgba(255,255,255,0.1)'
                                      : 'rgba(0,0,0,0.05)'
                                  }`,
                                  textAlign: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: isMobile ? '1.5rem' : '2rem',
                                    marginBottom: '0.5rem',
                                  }}
                                >
                                  💪
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? '1.5rem' : '1.8rem',
                                    fontWeight: '700',
                                    color: amoledColors.chartColors.purple,
                                  }}
                                >
                                  {workouts?.length || 0}
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                                    color: amoledColors.textMuted,
                                    fontWeight: '500',
                                  }}
                                >
                                  Total Workouts
                                </div>
                              </div>
                            </Col>

                            <Col lg={3} md={6} className='mb-3'>
                              <div
                                style={{
                                  padding: isMobile ? '1rem' : '1.5rem',
                                  background: isDarkMode
                                    ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
                                    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                  borderRadius: '12px',
                                  border: `1px solid ${
                                    isDarkMode
                                      ? 'rgba(255,255,255,0.1)'
                                      : 'rgba(0,0,0,0.05)'
                                  }`,
                                  textAlign: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: isMobile ? '1.5rem' : '2rem',
                                    marginBottom: '0.5rem',
                                  }}
                                >
                                  🏋️
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? '1.5rem' : '1.8rem',
                                    fontWeight: '700',
                                    color: amoledColors.chartColors.blue,
                                  }}
                                >
                                  {(
                                    workouts?.reduce(
                                      (sum, w) =>
                                        sum +
                                        (w.sets?.reduce(
                                          (s, set) => s + (set.reps || 0),
                                          0
                                        ) || 0),
                                      0
                                    ) || 0
                                  ).toLocaleString()}
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                                    color: amoledColors.textMuted,
                                    fontWeight: '500',
                                  }}
                                >
                                  Total Reps
                                </div>
                              </div>
                            </Col>

                            <Col lg={3} md={6} className='mb-3'>
                              <div
                                style={{
                                  padding: isMobile ? '1rem' : '1.5rem',
                                  background: isDarkMode
                                    ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
                                    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                  borderRadius: '12px',
                                  border: `1px solid ${
                                    isDarkMode
                                      ? 'rgba(255,255,255,0.1)'
                                      : 'rgba(0,0,0,0.05)'
                                  }`,
                                  textAlign: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: isMobile ? '1.5rem' : '2rem',
                                    marginBottom: '0.5rem',
                                  }}
                                >
                                  📊
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? '1.5rem' : '1.8rem',
                                    fontWeight: '700',
                                    color: amoledColors.chartColors.green,
                                  }}
                                >
                                  {workouts
                                    ? Math.round((workouts.length / 30) * 10) /
                                      10
                                    : 0}
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                                    color: amoledColors.textMuted,
                                    fontWeight: '500',
                                  }}
                                >
                                  Avg/Week
                                </div>
                              </div>
                            </Col>

                            <Col lg={3} md={6} className='mb-3'>
                              <div
                                style={{
                                  padding: isMobile ? '1rem' : '1.5rem',
                                  background: isDarkMode
                                    ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
                                    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                  borderRadius: '12px',
                                  border: `1px solid ${
                                    isDarkMode
                                      ? 'rgba(255,255,255,0.1)'
                                      : 'rgba(0,0,0,0.05)'
                                  }`,
                                  textAlign: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: isMobile ? '1.5rem' : '2rem',
                                    marginBottom: '0.5rem',
                                  }}
                                >
                                  📈
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? '1.5rem' : '1.8rem',
                                    fontWeight: '700',
                                    color: amoledColors.chartColors.orange,
                                  }}
                                >
                                  {(() => {
                                    if (!workouts || workouts.length < 4)
                                      return 'N/A';
                                    // Calculate overall improvement trend
                                    const sortedWorkouts = [...workouts].sort(
                                      (a, b) =>
                                        new Date(a.date) - new Date(b.date)
                                    );
                                    const firstQuarter = sortedWorkouts.slice(
                                      0,
                                      Math.floor(sortedWorkouts.length / 4)
                                    );
                                    const lastQuarter = sortedWorkouts.slice(
                                      -Math.floor(sortedWorkouts.length / 4)
                                    );

                                    const firstAvgReps =
                                      firstQuarter.reduce(
                                        (sum, w) =>
                                          sum +
                                          (w.sets?.reduce(
                                            (s, set) => s + (set.reps || 0),
                                            0
                                          ) || 0),
                                        0
                                      ) / firstQuarter.length;
                                    const lastAvgReps =
                                      lastQuarter.reduce(
                                        (sum, w) =>
                                          sum +
                                          (w.sets?.reduce(
                                            (s, set) => s + (set.reps || 0),
                                            0
                                          ) || 0),
                                        0
                                      ) / lastQuarter.length;

                                    const improvement =
                                      ((lastAvgReps - firstAvgReps) /
                                        firstAvgReps) *
                                      100;
                                    return improvement > 0
                                      ? `+${improvement.toFixed(0)}%`
                                      : `${improvement.toFixed(0)}%`;
                                  })()}
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                                    color: amoledColors.textMuted,
                                    fontWeight: '500',
                                  }}
                                >
                                  Overall Progress
                                </div>
                              </div>
                            </Col>
                          </Row>
                        )}

                        {workouts && workouts.length > 0 && (
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
                                            color:
                                              colors[index % colors.length],
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
                                        fill: isDarkMode
                                          ? '#9ca3af'
                                          : '#6b7280',
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
                                              fill={
                                                colors[index % colors.length]
                                              }
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
                                        color: isDarkMode
                                          ? '#ffffff'
                                          : '#000000',
                                      }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </Col>

                            {/* Workout Performance Trends */}
                            <Col lg={6} className='mb-4'>
                              <h6
                                style={{
                                  color: amoledColors.text,
                                  fontWeight: '600',
                                  marginBottom: '1rem',
                                  fontSize: isMobile ? '1rem' : '1.1rem',
                                }}
                              >
                                📈 Performance Trends
                              </h6>
                              <div
                                style={{
                                  minHeight: isMobile ? '250px' : '250px',
                                  height: isMobile ? '100%' : 'auto',
                                  background: isDarkMode
                                    ? 'rgba(255,255,255,0.02)'
                                    : 'rgba(0,0,0,0.02)',
                                  borderRadius: '12px',
                                  padding: isMobile ? '0.5rem' : '1rem',
                                  border: `1px solid ${
                                    isDarkMode
                                      ? 'rgba(255,255,255,0.05)'
                                      : 'rgba(0,0,0,0.05)'
                                  }`,
                                }}
                              >
                                {/* Performance Summary Cards */}
                                <Row className='h-100 g-2'>
                                  {/* Workouts/Week Card */}
                                  <Col xs={6} md={6} className='mb-2'>
                                    <div
                                      style={{
                                        height: '100%',
                                        minHeight: isMobile ? '90px' : '100px',
                                        background: isDarkMode
                                          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)'
                                          : 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(168, 85, 247, 0.02) 100%)',
                                        borderRadius: '8px',
                                        padding: isMobile
                                          ? '0.5rem'
                                          : '0.75rem',
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
                                        width: '100%',
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '1rem'
                                            : '1.2rem',
                                          marginBottom: '0.25rem',
                                        }}
                                      >
                                        🚀
                                      </div>
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '0.9rem'
                                            : '1.1rem',
                                          fontWeight: '700',
                                          color:
                                            amoledColors.chartColors.purple,
                                          lineHeight: '1.1',
                                          marginBottom: '0.25rem',
                                        }}
                                      >
                                        {workouts
                                          ? (
                                              (workouts.length / 30) *
                                              7
                                            ).toFixed(1)
                                          : 0}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '0.6rem'
                                            : '0.65rem',
                                          color: amoledColors.textMuted,
                                          lineHeight: '1.2',
                                          fontWeight: '500',
                                        }}
                                      >
                                        {isMobile
                                          ? 'Workouts/Wk'
                                          : 'Workouts/Week'}
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Avg Sets/Session Card */}
                                  <Col xs={6} md={6} className='mb-2'>
                                    <div
                                      style={{
                                        height: '100%',
                                        minHeight: isMobile ? '90px' : '100px',
                                        background: isDarkMode
                                          ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%)'
                                          : 'linear-gradient(135deg, rgba(34, 211, 238, 0.05) 0%, rgba(34, 211, 238, 0.02) 100%)',
                                        borderRadius: '8px',
                                        padding: isMobile
                                          ? '0.5rem'
                                          : '0.75rem',
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
                                        width: '100%',
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '1rem'
                                            : '1.2rem',
                                          marginBottom: '0.25rem',
                                        }}
                                      >
                                        ⚡
                                      </div>
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '0.9rem'
                                            : '1.1rem',
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
                                          fontSize: isMobile
                                            ? '0.6rem'
                                            : '0.65rem',
                                          color: amoledColors.textMuted,
                                          lineHeight: '1.2',
                                          fontWeight: '500',
                                        }}
                                      >
                                        {isMobile
                                          ? 'Sets/Session'
                                          : 'Avg Sets/Session'}
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Consistency Card */}
                                  <Col xs={6} md={6}>
                                    <div
                                      style={{
                                        height: '100%',
                                        minHeight: isMobile ? '90px' : '100px',
                                        background: isDarkMode
                                          ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(52, 211, 153, 0.05) 100%)'
                                          : 'linear-gradient(135deg, rgba(52, 211, 153, 0.05) 0%, rgba(52, 211, 153, 0.02) 100%)',
                                        borderRadius: '8px',
                                        padding: isMobile
                                          ? '0.5rem'
                                          : '0.75rem',
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
                                        width: '100%',
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '1rem'
                                            : '1.2rem',
                                          marginBottom: '0.25rem',
                                        }}
                                      >
                                        💯
                                      </div>
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '0.9rem'
                                            : '1.1rem',
                                          fontWeight: '700',
                                          color: amoledColors.chartColors.green,
                                          lineHeight: '1.1',
                                          marginBottom: '0.25rem',
                                        }}
                                      >
                                        {calculateWorkoutStreak > 0 ? '✓' : '○'}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '0.6rem'
                                            : '0.65rem',
                                          color: amoledColors.textMuted,
                                          lineHeight: '1.2',
                                          fontWeight: '500',
                                        }}
                                      >
                                        Consistency
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Avg Volume/Session Card */}
                                  <Col xs={6} md={6}>
                                    <div
                                      style={{
                                        height: '100%',
                                        minHeight: isMobile ? '90px' : '100px',
                                        background: isDarkMode
                                          ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)'
                                          : 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(251, 191, 36, 0.02) 100%)',
                                        borderRadius: '8px',
                                        padding: isMobile
                                          ? '0.5rem'
                                          : '0.75rem',
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
                                        width: '100%',
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '1rem'
                                            : '1.2rem',
                                          marginBottom: '0.25rem',
                                        }}
                                      >
                                        🏆
                                      </div>
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '0.9rem'
                                            : '1.1rem',
                                          fontWeight: '700',
                                          color:
                                            amoledColors.chartColors.orange,
                                          lineHeight: '1.1',
                                          marginBottom: '0.25rem',
                                        }}
                                      >
                                        {workouts && workouts.length > 0
                                          ? Math.round(
                                              workouts.reduce(
                                                (sum, w) =>
                                                  sum +
                                                  (w.sets?.reduce(
                                                    (s, set) =>
                                                      s +
                                                      (set.weight || 0) *
                                                        (set.reps || 0),
                                                    0
                                                  ) || 0),
                                                0
                                              ) /
                                                workouts.length /
                                                2.205
                                            )
                                          : 0}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '0.6rem'
                                            : '0.65rem',
                                          color: amoledColors.textMuted,
                                          lineHeight: '1.2',
                                          fontWeight: '500',
                                        }}
                                      >
                                        {isMobile
                                          ? 'Volume/Session'
                                          : 'Avg Volume/Session'}
                                      </div>
                                    </div>
                                  </Col>
                                </Row>
                              </div>
                            </Col>
                          </Row>
                        )}
                      </Card.Body>
                    </Card>
                  </FadeIn>
                </Col>
              </Row>

              {/* Conditional rendering based on session view toggle */}
              {showSessionView ? (
                <>
                  {/* Session-Based View */}
                  {/* Enhanced Overview Statistics */}
                  <Row className='mb-5'>
                    <Col xs={6} md={3} className='mb-3'>
                      <FadeIn direction='up' delay={100}>
                        <Card
                          className='h-100 text-center'
                          style={metricCardStyle}
                        >
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
                      </FadeIn>
                    </Col>

                    <Col xs={6} md={3} className='mb-3'>
                      <FadeIn direction='up' delay={200}>
                        <Card
                          className='h-100 text-center'
                          style={metricCardStyle}
                        >
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
                                      ...groupedSessions.map(
                                        (s) => s.maxWeight || 0
                                      )
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
                      </FadeIn>
                    </Col>

                    <Col xs={6} md={3} className='mb-3'>
                      <FadeIn direction='up' delay={300}>
                        <Card
                          className='h-100 text-center'
                          style={metricCardStyle}
                        >
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
                      </FadeIn>
                    </Col>

                    <Col xs={6} md={3} className='mb-3'>
                      <FadeIn direction='up' delay={400}>
                        <Card
                          className='h-100 text-center'
                          style={metricCardStyle}
                        >
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
                      </FadeIn>
                    </Col>
                  </Row>

                  {/* Daily Session Groups */}
                  <Row className='mb-5'>
                    <Col>
                      <FadeIn direction='up' delay={300}>
                        <Card style={cardStyle}>
                          <Card.Header
                            style={{
                              backgroundColor: isDarkMode
                                ? '#000000'
                                : '#f8fafc',
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
                              style={{
                                color: amoledColors.text,
                                fontWeight: '600',
                              }}
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
                                  boxShadow:
                                    '0 4px 12px rgba(139, 92, 246, 0.3)',
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
                                        {dayData.totalReps.toLocaleString()}{' '}
                                        reps
                                      </div>
                                      <small
                                        style={{
                                          color: amoledColors.textMuted,
                                        }}
                                      >
                                        total reps
                                      </small>
                                      <div
                                        style={{
                                          color: amoledColors.chartColors.green,
                                          fontWeight: '600',
                                          fontSize: '0.9rem',
                                          marginTop: '2px',
                                        }}
                                      >
                                        ⏱️{' '}
                                        {Math.round(dayData.totalDuration || 0)}
                                        min
                                      </div>
                                    </div>
                                  </div>

                                  <Row>
                                    <Col lg={12}>
                                      {dayData.sessions.map(
                                        (session, index) => (
                                          <ExpandableSessionCard
                                            key={session.id}
                                            session={session}
                                            dayData={dayData}
                                            isDarkMode={isDarkMode}
                                            amoledColors={amoledColors}
                                            onEditSession={(
                                              sessionId,
                                              updates
                                            ) => {
                                              // Handle session editing - you can implement this
                                              console.log(
                                                'Edit session:',
                                                sessionId,
                                                updates
                                              );
                                            }}
                                          />
                                        )
                                      )}
                                    </Col>
                                  </Row>
                                </div>
                              ))}

                            {Object.keys(sessionsByDate).length === 0 && (
                              <div className='text-center py-5'>
                                <div style={{ color: amoledColors.textMuted }}>
                                  <FaDumbbell
                                    size={48}
                                    className='mb-3 opacity-50'
                                  />
                                  <p>No workout sessions found</p>
                                  <small>
                                    Start tracking your workouts to see sessions
                                    grouped by time
                                  </small>
                                </div>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </FadeIn>
                    </Col>
                  </Row>
                </>
              ) : (
                <>
                  {/* Traditional Individual Exercise View */}
                  {/* Enhanced Overview Statistics */}
                  <Row className='mb-5'>
                    <Col xs={6} md={3} className='mb-3'>
                      <FadeIn direction='up' delay={100}>
                        <Card
                          className='h-100 text-center'
                          style={metricCardStyle}
                        >
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
                              {workouts?.length || 0}
                            </h2>
                            <small
                              style={{
                                color: amoledColors.textMuted,
                                fontSize: '0.7rem',
                              }}
                            >
                              lifetime sessions
                            </small>
                          </Card.Body>
                        </Card>
                      </FadeIn>
                    </Col>

                    <Col xs={6} md={3} className='mb-3'>
                      <FadeIn direction='up' delay={200}>
                        <Card
                          className='h-100 text-center'
                          style={metricCardStyle}
                        >
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
                      </FadeIn>
                    </Col>

                    <Col xs={6} md={3} className='mb-3'>
                      <FadeIn direction='up' delay={300}>
                        <Card
                          className='h-100 text-center'
                          style={metricCardStyle}
                        >
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
                              <FaCalendarCheck size={24} />
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
                              {weeklyWorkoutData.datasets[0].data.reduce(
                                (sum, count) => sum + count,
                                0
                              )}
                            </h2>
                            <small
                              style={{
                                color: amoledColors.textMuted,
                                fontSize: '0.7rem',
                              }}
                            >
                              workouts completed
                            </small>
                          </Card.Body>
                        </Card>
                      </FadeIn>
                    </Col>

                    <Col xs={6} md={3} className='mb-3'>
                      <FadeIn direction='up' delay={400}>
                        <Card
                          className='h-100 text-center'
                          style={metricCardStyle}
                        >
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
                              Personal Records
                            </h6>
                            <h2
                              className='mb-1'
                              style={{
                                color: amoledColors.text,
                                fontWeight: '700',
                                fontSize: '1.8rem',
                              }}
                            >
                              {getPersonalRecords.length || 0}
                            </h2>
                            <small
                              style={{
                                color: amoledColors.textMuted,
                                fontSize: '0.7rem',
                              }}
                            >
                              achievements
                            </small>
                          </Card.Body>
                        </Card>
                      </FadeIn>
                    </Col>
                  </Row>

                  {/* Enhanced Weekly Workout Chart */}
                  <Row className='mb-5'>
                    <Col lg={8}>
                      <FadeIn direction='left' delay={200}>
                        <Card style={cardStyle} className='shadow'>
                          <Card.Header
                            style={{
                              backgroundColor: isDarkMode
                                ? '#000000'
                                : '#f8fafc',
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
                              style={{
                                color: amoledColors.text,
                                fontWeight: '600',
                              }}
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
                                  boxShadow:
                                    '0 4px 12px rgba(139, 92, 246, 0.3)',
                                }}
                              >
                                <FaChartLine
                                  style={{ color: '#ffffff' }}
                                  size={16}
                                />
                              </div>
                              Weekly Workout Activity
                            </h5>
                          </Card.Header>
                          <Card.Body
                            style={{ padding: '2rem', height: '400px' }}
                          >
                            {weeklyWorkoutData.labels.length > 0 ? (
                              <Bar
                                data={weeklyWorkoutData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      display: false,
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
                                      boxShadow: isDarkMode
                                        ? '0 4px 12px rgba(0, 0, 0, 0.5)'
                                        : '0 4px 12px rgba(0, 0, 0, 0.1)',
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
                                      beginAtZero: true,
                                      ticks: {
                                        stepSize: 1,
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
                                  },
                                }}
                              />
                            ) : (
                              <div
                                className='text-center d-flex flex-column align-items-center justify-content-center'
                                style={{ height: '100%' }}
                              >
                                <FaChartLine
                                  size={48}
                                  style={{
                                    color: amoledColors.textMuted,
                                    opacity: 0.3,
                                    marginBottom: '1rem',
                                  }}
                                />
                                <h6 style={{ color: amoledColors.text }}>
                                  No Data Available
                                </h6>
                                <p
                                  style={{
                                    color: amoledColors.textMuted,
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  No workout data available for this week
                                </p>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </FadeIn>
                    </Col>

                    <Col lg={4}>
                      <FadeIn direction='right' delay={200}>
                        <Card style={cardStyle} className='shadow h-100'>
                          <Card.Header
                            style={{
                              backgroundColor: isDarkMode
                                ? '#000000'
                                : '#f8fafc',
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
                              style={{
                                color: amoledColors.text,
                                fontWeight: '600',
                              }}
                            >
                              <div
                                style={{
                                  background:
                                    'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                                  borderRadius: '8px',
                                  padding: '8px',
                                  marginRight: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow:
                                    '0 4px 12px rgba(245, 158, 11, 0.3)',
                                }}
                              >
                                <FaChartBar
                                  style={{ color: '#ffffff' }}
                                  size={16}
                                />
                              </div>
                              Workout Intensity
                            </h5>
                          </Card.Header>
                          <Card.Body style={{ padding: '2rem' }}>
                            {intensityDistribution.labels.length > 0 ? (
                              <div
                                style={{
                                  height: '300px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Doughnut
                                  data={intensityDistribution}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        position: 'bottom',
                                        labels: {
                                          color: amoledColors.textSecondary,
                                          font: {
                                            size: 10,
                                            family: "'Inter', sans-serif",
                                          },
                                          usePointStyle: true,
                                          pointStyle: 'circle',
                                          padding: 15,
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
                                        boxShadow: isDarkMode
                                          ? '0 4px 12px rgba(0, 0, 0, 0.5)'
                                          : '0 4px 12px rgba(0, 0, 0, 0.1)',
                                      },
                                    },
                                    cutout: '60%',
                                    elements: {
                                      arc: {
                                        borderWidth: 0,
                                        borderRadius: 8,
                                        hoverBorderColor: isDarkMode
                                          ? '#111111'
                                          : '#ffffff',
                                        hoverBorderWidth: 4,
                                      },
                                    },
                                  }}
                                />
                              </div>
                            ) : (
                              <div
                                className='text-center d-flex flex-column align-items-center justify-content-center'
                                style={{ height: '300px' }}
                              >
                                <FaChartBar
                                  size={48}
                                  style={{
                                    color: amoledColors.textMuted,
                                    opacity: 0.3,
                                    marginBottom: '1rem',
                                  }}
                                />
                                <h6 style={{ color: amoledColors.text }}>
                                  No Intensity Data
                                </h6>
                                <p
                                  style={{
                                    color: amoledColors.textMuted,
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  No intensity data available
                                </p>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </FadeIn>
                    </Col>
                  </Row>

                  {/* Enhanced Personal Records and Progress Tracking */}
                  <Row className='mb-5'>
                    <Col lg={8}>
                      <FadeIn direction='up' delay={300}>
                        <Card style={cardStyle} className='shadow mb-4'>
                          <Card.Header
                            style={{
                              backgroundColor: isDarkMode
                                ? '#000000'
                                : '#f8fafc',
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
                              style={{
                                color: amoledColors.text,
                                fontWeight: '600',
                              }}
                            >
                              <div
                                style={{
                                  background:
                                    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  borderRadius: '8px',
                                  padding: '8px',
                                  marginRight: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow:
                                    '0 4px 12px rgba(16, 185, 129, 0.3)',
                                }}
                              >
                                <FaTrophy
                                  style={{ color: '#ffffff' }}
                                  size={16}
                                />
                              </div>
                              Personal Records & Achievements
                            </h5>
                          </Card.Header>
                          <StaggeredList baseDelay={100} staggerDelay={50}>
                            <ListGroup variant='flush'>
                              {getPersonalRecords.length > 0 ? (
                                getPersonalRecords
                                  .slice(0, 5)
                                  .map((record, index) => (
                                    <ListGroup.Item
                                      key={index}
                                      className='d-flex justify-content-between align-items-center'
                                      action
                                      onClick={() =>
                                        setActiveExercise(record.productName)
                                      }
                                      style={{
                                        backgroundColor: amoledColors.cardBg,
                                        border: `1px solid ${amoledColors.border}`,
                                        borderLeft: 'none',
                                        borderRight: 'none',
                                        borderTop: 'none',
                                        borderBottom: isDarkMode
                                          ? '1px solid #111111'
                                          : '1px solid #e5e7eb',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        padding: '1.5rem',
                                      }}
                                    >
                                      <div className='d-flex align-items-center'>
                                        <div
                                          style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '12px',
                                            background:
                                              'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: '1rem',
                                            boxShadow:
                                              '0 4px 12px rgba(139, 92, 246, 0.3)',
                                          }}
                                        >
                                          <FaDumbbell
                                            style={{ color: '#ffffff' }}
                                            size={20}
                                          />
                                        </div>
                                        <div>
                                          <h6
                                            className='mb-1'
                                            style={{
                                              color: amoledColors.text,
                                              fontWeight: '600',
                                            }}
                                          >
                                            {record.productName}
                                          </h6>
                                          <div
                                            style={{
                                              color: amoledColors.textSecondary,
                                              fontSize: '0.9rem',
                                            }}
                                          >
                                            Max Weight:{' '}
                                            <strong
                                              style={{
                                                color:
                                                  amoledColors.chartColors
                                                    .green,
                                              }}
                                            >
                                              {Math.round(
                                                record.maxWeight / 2.205
                                              )}{' '}
                                              kg
                                            </strong>
                                          </div>
                                          <small
                                            style={{
                                              color: amoledColors.textMuted,
                                            }}
                                          >
                                            {format(
                                              new Date(record.maxWeightDate),
                                              'MMM d, yyyy'
                                            )}
                                          </small>
                                        </div>
                                      </div>
                                      <div className='text-end'>
                                        <Badge
                                          style={{
                                            backgroundColor:
                                              amoledColors.chartColors.purple,
                                            color: '#ffffff',
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            marginBottom: '0.5rem',
                                            boxShadow:
                                              '0 2px 8px rgba(139, 92, 246, 0.3)',
                                          }}
                                        >
                                          {record.maxReps} max reps
                                        </Badge>
                                        <div
                                          style={{
                                            fontSize: '0.8rem',
                                            color: amoledColors.textMuted,
                                          }}
                                        >
                                          <FaChevronRight size={12} />
                                        </div>
                                      </div>
                                    </ListGroup.Item>
                                  ))
                              ) : (
                                <ListGroup.Item
                                  style={{
                                    backgroundColor: amoledColors.cardBg,
                                    textAlign: 'center',
                                    padding: '3rem',
                                    color: amoledColors.textMuted,
                                  }}
                                >
                                  <div>
                                    <div
                                      style={{
                                        background: isDarkMode
                                          ? 'rgba(139, 92, 246, 0.1)'
                                          : 'rgba(139, 92, 246, 0.05)',
                                        borderRadius: '50%',
                                        width: '80px',
                                        height: '80px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 1rem',
                                        border: isDarkMode
                                          ? '2px solid rgba(139, 92, 246, 0.3)'
                                          : '2px solid rgba(139, 92, 246, 0.2)',
                                      }}
                                    >
                                      <FaTrophy
                                        size={32}
                                        style={{
                                          color: '#8b5cf6',
                                          opacity: 0.7,
                                        }}
                                      />
                                    </div>
                                    <h5
                                      style={{
                                        color: amoledColors.text,
                                        marginBottom: '0.5rem',
                                      }}
                                    >
                                      No Records Yet
                                    </h5>
                                    <p
                                      style={{
                                        color: amoledColors.textMuted,
                                        marginBottom: 0,
                                      }}
                                    >
                                      Start working out to set your first
                                      personal records!
                                    </p>
                                  </div>
                                </ListGroup.Item>
                              )}
                            </ListGroup>
                          </StaggeredList>
                        </Card>
                      </FadeIn>
                    </Col>

                    {/* Activity Insights Panel */}
                    <Col lg={4}>
                      <FadeIn direction='right' delay={350}>
                        <Card style={cardStyle} className='h-100'>
                          <Card.Header
                            style={{
                              backgroundColor: isDarkMode
                                ? '#000000'
                                : '#f8fafc',
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
                              style={{
                                color: amoledColors.text,
                                fontWeight: '600',
                              }}
                            >
                              <div
                                style={{
                                  background:
                                    'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                  borderRadius: '8px',
                                  padding: '8px',
                                  marginRight: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow:
                                    '0 4px 12px rgba(6, 182, 212, 0.3)',
                                }}
                              >
                                <FaBullseye
                                  style={{ color: '#ffffff' }}
                                  size={16}
                                />
                              </div>
                              Activity Summary
                            </h5>
                          </Card.Header>
                          <Card.Body style={{ padding: '2rem' }}>
                            <div className='mb-4'>
                              <div className='d-flex justify-content-between align-items-center mb-2'>
                                <span
                                  style={{
                                    fontWeight: '600',
                                    color: amoledColors.text,
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  Weekly Goal Progress
                                </span>
                                <span
                                  style={{
                                    color: amoledColors.chartColors.purple,
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  {Math.min(
                                    Math.round(
                                      (weeklyWorkoutData.datasets[0].data.reduce(
                                        (sum, count) => sum + count,
                                        0
                                      ) /
                                        4) *
                                        100
                                    ),
                                    100
                                  )}
                                  %
                                </span>
                              </div>
                              <div
                                className='progress'
                                style={{
                                  height: '8px',
                                  borderRadius: '4px',
                                  backgroundColor: isDarkMode
                                    ? '#1a1a1a'
                                    : '#f3f4f6',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  className='progress-bar'
                                  style={{
                                    width: `${Math.min(
                                      (weeklyWorkoutData.datasets[0].data.reduce(
                                        (sum, count) => sum + count,
                                        0
                                      ) /
                                        4) *
                                        100,
                                      100
                                    )}%`,
                                    background:
                                      'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
                                    borderRadius: '4px',
                                    transition: 'width 1s ease-in-out',
                                  }}
                                ></div>
                              </div>
                              <small
                                style={{
                                  color: amoledColors.textMuted,
                                  fontSize: '0.8rem',
                                }}
                              >
                                Target: 4 workouts per week
                              </small>
                            </div>

                            <div className='mb-4'>
                              <h6
                                className='mb-3'
                                style={{
                                  fontWeight: '600',
                                  color: amoledColors.text,
                                  fontSize: '0.9rem',
                                }}
                              >
                                Quick Stats
                              </h6>
                              <div className='d-flex justify-content-between mb-2'>
                                <span
                                  style={{
                                    color: amoledColors.textMuted,
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  Avg Workouts/Week:
                                </span>
                                <span
                                  style={{
                                    color: amoledColors.text,
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  {workouts
                                    ? Math.round((workouts.length / 12) * 10) /
                                      10
                                    : 0}
                                </span>
                              </div>
                              <div className='d-flex justify-content-between mb-2'>
                                <span
                                  style={{
                                    color: amoledColors.textMuted,
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  Most Active Day:
                                </span>
                                <span
                                  style={{
                                    color: amoledColors.text,
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  {weeklyWorkoutData.labels[
                                    weeklyWorkoutData.datasets[0].data.indexOf(
                                      Math.max(
                                        ...weeklyWorkoutData.datasets[0].data
                                      )
                                    )
                                  ] || 'N/A'}
                                </span>
                              </div>
                              <div className='d-flex justify-content-between'>
                                <span
                                  style={{
                                    color: amoledColors.textMuted,
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  Last Workout:
                                </span>
                                <span
                                  style={{
                                    color: amoledColors.text,
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  {workouts && workouts.length > 0
                                    ? format(
                                        new Date(
                                          Math.max(
                                            ...workouts.map(
                                              (w) => new Date(w.date)
                                            )
                                          )
                                        ),
                                        'MMM d'
                                      )
                                    : 'Never'}
                                </span>
                              </div>
                            </div>

                            <div>
                              <h6
                                className='mb-3'
                                style={{
                                  fontWeight: '600',
                                  color: amoledColors.text,
                                  fontSize: '0.9rem',
                                }}
                              >
                                Motivation Boost
                              </h6>
                              <div
                                style={{
                                  background: isDarkMode
                                    ? 'rgba(139, 92, 246, 0.1)'
                                    : 'rgba(139, 92, 246, 0.05)',
                                  padding: '1rem',
                                  borderRadius: '8px',
                                  border: isDarkMode
                                    ? '1px solid rgba(139, 92, 246, 0.2)'
                                    : '1px solid rgba(139, 92, 246, 0.1)',
                                  textAlign: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '1.5rem',
                                    marginBottom: '0.5rem',
                                  }}
                                >
                                  {calculateWorkoutStreak >= 7
                                    ? '🔥'
                                    : calculateWorkoutStreak >= 3
                                    ? '💪'
                                    : '🎯'}
                                </div>
                                <div
                                  style={{
                                    color: amoledColors.text,
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    marginBottom: '0.25rem',
                                  }}
                                >
                                  {calculateWorkoutStreak >= 7
                                    ? "You're on fire!"
                                    : calculateWorkoutStreak >= 3
                                    ? 'Great consistency!'
                                    : 'Keep it up!'}
                                </div>
                                <div
                                  style={{
                                    color: amoledColors.textMuted,
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {calculateWorkoutStreak >= 7
                                    ? "Amazing streak! You're unstoppable!"
                                    : calculateWorkoutStreak >= 3
                                    ? "You're building great habits"
                                    : 'Every workout counts'}
                                </div>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </FadeIn>
                    </Col>
                  </Row>

                  {/* Calendar View and Recent Workouts */}
                  <Row>
                    <Col md={6} className={isMobile ? 'mb-3' : 'mb-4'}>
                      <FadeIn direction='left' delay={250}>
                        <Card style={cardStyle} className='shadow'>
                          <Card.Header
                            style={{
                              padding: isMobile ? '0.75rem 1rem' : '1rem',
                            }}
                          >
                            <h5
                              className='m-0 fw-bold'
                              style={{
                                fontSize: isMobile ? '1.1rem' : '1.25rem',
                              }}
                            >
                              Workout Calendar
                            </h5>
                          </Card.Header>
                          <Card.Body
                            style={{ padding: isMobile ? '1rem' : '1.25rem' }}
                          >
                            {getWorkoutCalendarData.length > 0 ? (
                              <div className='workout-calendar'>
                                <div className='d-flex flex-wrap justify-content-center'>
                                  {getWorkoutCalendarData.map((day, index) => (
                                    <div
                                      key={index}
                                      className='calendar-day'
                                      title={`${day.date}: ${day.count} workouts`}
                                      style={{
                                        width: isMobile ? '20px' : '25px',
                                        height: isMobile ? '20px' : '25px',
                                        margin: isMobile ? '1px' : '2px',
                                        borderRadius: '4px',
                                        backgroundColor:
                                          day.count === 0
                                            ? isDarkMode
                                              ? '#1A1A1A'
                                              : '#EDF2F7'
                                            : `rgba(168, 85, 247, ${Math.min(
                                                day.count * 0.25,
                                                1
                                              )})`,
                                        border: day.isToday
                                          ? `2px solid ${amoledColors.accent}`
                                          : 'none',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {day.isToday && (
                                        <span
                                          style={{
                                            fontSize: isMobile ? '8px' : '10px',
                                          }}
                                        ></span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div
                                  className={`d-flex justify-content-between ${
                                    isMobile ? 'mt-2' : 'mt-3'
                                  }`}
                                >
                                  <small
                                    style={{
                                      fontSize: isMobile
                                        ? '0.7rem'
                                        : '0.875rem',
                                    }}
                                  >
                                    Less
                                  </small>
                                  <div className='d-flex'>
                                    {[0, 1, 2, 3, 4].map((level) => (
                                      <div
                                        key={level}
                                        style={{
                                          width: isMobile ? '12px' : '15px',
                                          height: isMobile ? '12px' : '15px',
                                          margin: '0 2px',
                                          borderRadius: '2px',
                                          backgroundColor:
                                            level === 0
                                              ? isDarkMode
                                                ? '#1A1A1A'
                                                : '#EDF2F7'
                                              : `rgba(168, 85, 247, ${
                                                  level * 0.25
                                                })`,
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <small
                                    style={{
                                      fontSize: isMobile
                                        ? '0.7rem'
                                        : '0.875rem',
                                    }}
                                  >
                                    More
                                  </small>
                                </div>
                              </div>
                            ) : (
                              /* Empty State for Calendar */
                              <div className='text-center py-4'>
                                <FaCalendarAlt
                                  size={isMobile ? 32 : 48}
                                  style={{
                                    color: amoledColors.textMuted,
                                    opacity: 0.5,
                                    marginBottom: '1rem',
                                  }}
                                />
                                <h6
                                  style={{
                                    color: amoledColors.text,
                                    marginBottom: '0.5rem',
                                    fontSize: isMobile ? '1rem' : '1.1rem',
                                  }}
                                >
                                  No Activity Yet
                                </h6>
                                <p
                                  style={{
                                    color: amoledColors.textMuted,
                                    marginBottom: '1.5rem',
                                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                                    lineHeight: '1.4',
                                  }}
                                >
                                  Your workout calendar will show your activity
                                  patterns once you start tracking workouts.
                                </p>
                                <Button
                                  variant='outline-primary'
                                  size={isMobile ? 'sm' : 'md'}
                                  as={Link}
                                  to='/products'
                                  style={{
                                    borderColor: amoledColors.accent,
                                    color: amoledColors.accent,
                                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                                  }}
                                >
                                  <FaDumbbell className='me-2' />
                                  Log First Workout
                                </Button>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </FadeIn>
                    </Col>

                    <Col md={6} className={isMobile ? 'mb-3' : 'mb-4'}>
                      <FadeIn direction='right' delay={250}>
                        <Card style={cardStyle} className='shadow h-100'>
                          <Card.Header
                            className='d-flex justify-content-between align-items-center'
                            style={{
                              padding: isMobile ? '0.75rem 1rem' : '1rem',
                            }}
                          >
                            <h5
                              className='m-0 fw-bold'
                              style={{
                                fontSize: isMobile ? '1.1rem' : '1.25rem',
                              }}
                            >
                              Recent Workouts
                            </h5>
                            {recentWorkouts.length > 0 && (
                              <Button
                                variant='outline-primary'
                                size={isMobile ? 'sm' : 'sm'}
                                onClick={refetch}
                                style={{
                                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                                }}
                              >
                                <i className='fas fa-sync'></i>
                                {!isMobile && ' Refresh'}
                              </Button>
                            )}
                          </Card.Header>
                          {recentWorkouts.length > 0 ? (
                            <StaggeredList baseDelay={50} staggerDelay={50}>
                              <ListGroup variant='flush'>
                                {recentWorkouts.slice(0, 5).map((workout) => (
                                  <ListGroup.Item
                                    key={workout._id}
                                    style={{
                                      backgroundColor: amoledColors.cardBg,
                                      padding: isMobile
                                        ? '0.75rem 1rem'
                                        : '1rem',
                                    }}
                                    className='hover-effect'
                                  >
                                    <Row className='align-items-center'>
                                      <Col
                                        xs={isMobile ? 3 : 2}
                                        className='d-flex align-items-center'
                                      >
                                        <Image
                                          src={workout.product.image}
                                          alt={workout.product.name}
                                          height={isMobile ? 40 : 50}
                                          width={isMobile ? 40 : 50}
                                          fluid
                                          rounded
                                        />
                                      </Col>
                                      <Col xs={isMobile ? 6 : 7}>
                                        <div
                                          className='fw-bold'
                                          style={{
                                            fontSize: isMobile
                                              ? '0.9rem'
                                              : '1rem',
                                            lineHeight: '1.2',
                                            marginBottom: '0.25rem',
                                          }}
                                        >
                                          {isMobile
                                            ? workout.product.name.length > 15
                                              ? workout.product.name.slice(
                                                  0,
                                                  15
                                                ) + '...'
                                              : workout.product.name
                                            : workout.product.name}
                                        </div>
                                        <small
                                          style={{
                                            fontSize: isMobile
                                              ? '0.75rem'
                                              : '0.875rem',
                                          }}
                                        >
                                          {workout.sets?.length || 0} sets •{' '}
                                          {formatWorkoutDate(workout.date)}
                                        </small>
                                        {workout.feeling && (
                                          <div className='mt-1'>
                                            <Badge
                                              pill
                                              bg={getFeelingVariant(
                                                workout.feeling
                                              )}
                                              style={{
                                                fontSize: isMobile
                                                  ? '0.65rem'
                                                  : '0.75rem',
                                              }}
                                            >
                                              {workout.feeling}
                                            </Badge>
                                          </div>
                                        )}
                                      </Col>
                                      <Col xs={3} className='text-end'>
                                        <div
                                          className={
                                            isMobile
                                              ? 'd-flex flex-column gap-1'
                                              : 'd-flex gap-2'
                                          }
                                        >
                                          <Link to={`/workout/${workout._id}`}>
                                            <Button
                                              size='sm'
                                              variant='outline-primary'
                                              style={{
                                                fontSize: isMobile
                                                  ? '0.7rem'
                                                  : '0.8rem',
                                                padding: isMobile
                                                  ? '0.25rem 0.5rem'
                                                  : '0.375rem 0.75rem',
                                                width: isMobile
                                                  ? '100%'
                                                  : 'auto',
                                              }}
                                            >
                                              <i className='fas fa-eye'></i>
                                              {!isMobile && ' View'}
                                            </Button>
                                          </Link>
                                          <Button
                                            size='sm'
                                            variant='outline-secondary'
                                            style={{
                                              fontSize: isMobile
                                                ? '0.7rem'
                                                : '0.8rem',
                                              padding: isMobile
                                                ? '0.25rem 0.5rem'
                                                : '0.375rem 0.75rem',
                                              width: isMobile ? '100%' : 'auto',
                                            }}
                                            onClick={() => {
                                              setWorkoutToDelete(workout._id);
                                              setShowDeleteModal(true);
                                            }}
                                          >
                                            <i className='fas fa-trash-alt'></i>
                                            {!isMobile && ' Delete'}
                                          </Button>
                                        </div>
                                      </Col>
                                    </Row>
                                  </ListGroup.Item>
                                ))}
                              </ListGroup>
                            </StaggeredList>
                          ) : (
                            /* Empty State for Recent Workouts */
                            <Card.Body
                              style={{
                                padding: isMobile ? '2rem 1rem' : '3rem 2rem',
                              }}
                            >
                              <div className='text-center'>
                                <FaHistory
                                  size={isMobile ? 32 : 48}
                                  style={{
                                    color: amoledColors.textMuted,
                                    opacity: 0.5,
                                    marginBottom: '1rem',
                                  }}
                                />
                                <h6
                                  style={{
                                    color: amoledColors.text,
                                    marginBottom: '0.5rem',
                                    fontSize: isMobile ? '1rem' : '1.1rem',
                                  }}
                                >
                                  No Recent Workouts
                                </h6>
                                <p
                                  style={{
                                    color: amoledColors.textMuted,
                                    marginBottom: '1.5rem',
                                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                                    lineHeight: '1.4',
                                  }}
                                >
                                  Start your fitness journey! Your recent
                                  workout history will appear here.
                                </p>
                                <Button
                                  variant='primary'
                                  size={isMobile ? 'sm' : 'md'}
                                  as={Link}
                                  to='/products'
                                  style={{
                                    backgroundColor: amoledColors.accent,
                                    borderColor: amoledColors.accent,
                                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                                  }}
                                >
                                  <FaDumbbell className='me-2' />
                                  Browse Workouts
                                </Button>
                              </div>
                            </Card.Body>
                          )}
                        </Card>
                      </FadeIn>
                    </Col>
                  </Row>

                  {/* Most Used Products - changed to Most Used Exercises */}
                  <FadeIn direction='up' delay={300}>
                    <Card className='mb-4' style={cardStyle}>
                      <Card.Header>
                        <h5 className='m-0 fw-bold'>Most Used Exercises</h5>
                      </Card.Header>
                      <Card.Body>
                        <StaggeredList baseDelay={50} staggerDelay={100}>
                          <Row>
                            {Object.entries(workoutCounts)
                              .sort((a, b) => b[1].count - a[1].count)
                              .slice(0, 6)
                              .map(([productId, data]) => (
                                <Col
                                  key={productId}
                                  xs={6}
                                  md={4}
                                  lg={2}
                                  className='mb-3'
                                >
                                  <Card style={cardStyle}>
                                    <Card.Img
                                      variant='top'
                                      src={data.image}
                                      alt={data.name}
                                      style={{
                                        height: '120px',
                                        objectFit: 'cover',
                                      }}
                                    />
                                    <Card.Body className='p-2'>
                                      <div className='text-center'>
                                        <div className='fw-bold small'>
                                          {data.name}
                                        </div>
                                        <Badge bg='primary' pill>
                                          {data.count} workouts
                                        </Badge>
                                      </div>
                                    </Card.Body>
                                  </Card>
                                </Col>
                              ))}
                          </Row>
                        </StaggeredList>
                      </Card.Body>
                    </Card>
                  </FadeIn>

                  {/* Goal Progress */}
                  <FadeIn direction='up' delay={350}>
                    <Card className='mb-4' style={cardStyle}>
                      <Card.Header>
                        <h5 className='m-0 fw-bold'>Goal Progress</h5>
                      </Card.Header>
                      <Card.Body>
                        <StaggeredList baseDelay={50} staggerDelay={150}>
                          <Row>
                            {fitnessGoals.map((goal) => (
                              <Col key={goal.id} md={4} className='mb-3'>
                                <Card style={cardStyle}>
                                  <Card.Body>
                                    <div className='d-flex justify-content-between align-items-center'>
                                      <div>
                                        <div className='fw-bold'>
                                          {goal.name}
                                        </div>
                                        <div className='small text-muted'>
                                          {goal.current} / {goal.target}{' '}
                                          {goal.unit}
                                        </div>
                                      </div>
                                      <Button
                                        variant='outline-primary'
                                        size='sm'
                                        onClick={() => handleEditGoal(goal)}
                                      >
                                        <i className='fas fa-edit'></i>
                                      </Button>
                                    </div>
                                    <ProgressBar
                                      now={(goal.current / goal.target) * 100}
                                      label={`${Math.round(
                                        (goal.current / goal.target) * 100
                                      )}%`}
                                      className='mt-2'
                                    />
                                  </Card.Body>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        </StaggeredList>
                      </Card.Body>
                    </Card>
                  </FadeIn>

                  {/* Exercise Comparison */}
                  <FadeIn direction='up' delay={400}>
                    <Card className='mb-4' style={cardStyle}>
                      <Card.Header>
                        <h5 className='m-0 fw-bold'>Exercise Comparison</h5>
                      </Card.Header>
                      <Card.Body>
                        <Row className='mb-3'>
                          <Col md={6}>
                            <Form.Group controlId='selectExercises'>
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
                                placeholder='Choose exercises to compare...'
                                noOptionsMessage={() => 'No exercises found'}
                                isSearchable={true}
                                isClearable={true}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group controlId='selectMetric'>
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
                                as='select'
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
                                <option value='maxWeight'>Max Weight</option>
                                <option value='totalReps'>Total Reps</option>
                                <option value='frequency'>Frequency</option>
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
                  </FadeIn>

                  {/* Edit Goal Modal */}
                  <Modal
                    show={showGoalModal}
                    onHide={() => setShowGoalModal(false)}
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Edit Goal</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {currentGoal && (
                        <Form>
                          <Form.Group controlId='goalName' className='mb-3'>
                            <Form.Label>Goal Name</Form.Label>
                            <Form.Control
                              type='text'
                              value={currentGoal.name}
                              onChange={(e) =>
                                setCurrentGoal({
                                  ...currentGoal,
                                  name: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                          <Form.Group controlId='goalTarget' className='mb-3'>
                            <Form.Label>Target</Form.Label>
                            <Form.Control
                              type='number'
                              value={currentGoal.target}
                              onChange={(e) =>
                                setCurrentGoal({
                                  ...currentGoal,
                                  target: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                          <Form.Group controlId='goalUnit' className='mb-3'>
                            <Form.Label>Unit</Form.Label>
                            <Form.Control
                              type='text'
                              value={currentGoal.unit}
                              onChange={(e) =>
                                setCurrentGoal({
                                  ...currentGoal,
                                  unit: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                        </Form>
                      )}
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        variant='secondary'
                        onClick={() => setShowGoalModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button variant='primary' onClick={handleSaveGoal}>
                        Save
                      </Button>
                    </Modal.Footer>
                  </Modal>

                  {/* Workout History Modal */}
                  <Modal
                    show={showWorkoutHistoryModal}
                    onHide={() => setShowWorkoutHistoryModal(false)}
                    size='lg'
                    style={{ zIndex: 1050 }}
                  >
                    <Modal.Header
                      closeButton
                      style={{
                        backgroundColor: amoledColors.cardBg,
                        borderBottom: `1px solid ${amoledColors.border}`,
                        color: amoledColors.text,
                      }}
                    >
                      <Modal.Title
                        style={{ color: amoledColors.text, fontWeight: '700' }}
                      >
                        Workout History
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body
                      style={{
                        backgroundColor: amoledColors.cardBg,
                        color: amoledColors.text,
                      }}
                    >
                      <Form.Group
                        controlId='workoutHistoryFilter'
                        className='mb-3'
                      >
                        <Form.Label
                          style={{
                            color: amoledColors.text,
                            fontWeight: '600',
                          }}
                        >
                          Filter Workouts
                        </Form.Label>
                        <Form.Control
                          as='select'
                          value={workoutHistoryFilter}
                          onChange={(e) =>
                            setWorkoutHistoryFilter(e.target.value)
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
                          <option value='all'>All Workouts</option>
                          <option value='recent'>Recent Workouts</option>
                          <option value='by-exercise'>By Exercise</option>
                        </Form.Control>
                      </Form.Group>
                      {workoutHistoryFilter === 'by-exercise' && (
                        <Form.Group
                          controlId='selectedExerciseFilter'
                          className='mb-3'
                        >
                          <Form.Label
                            style={{
                              color: amoledColors.text,
                              fontWeight: '600',
                            }}
                          >
                            Select Exercise
                          </Form.Label>
                          <Select
                            options={exerciseOptions}
                            value={exerciseOptions.find(
                              (option) =>
                                option.value === selectedExerciseFilter
                            )}
                            onChange={(selected) =>
                              setSelectedExerciseFilter(selected.value)
                            }
                            styles={customSelectStyles}
                            placeholder='Choose an exercise...'
                            noOptionsMessage={() => 'No exercises found'}
                            isSearchable={true}
                            isClearable={true}
                          />
                        </Form.Group>
                      )}
                      <Table
                        striped
                        bordered
                        hover
                        style={{
                          backgroundColor: amoledColors.cardBg,
                          color: amoledColors.text,
                          borderColor: amoledColors.border,
                        }}
                      >
                        <thead
                          style={{ backgroundColor: amoledColors.headerBg }}
                        >
                          <tr>
                            <th
                              style={{
                                color: amoledColors.text,
                                borderColor: amoledColors.border,
                              }}
                            >
                              Date
                            </th>
                            <th
                              style={{
                                color: amoledColors.text,
                                borderColor: amoledColors.border,
                              }}
                            >
                              Exercise
                            </th>
                            <th
                              style={{
                                color: amoledColors.text,
                                borderColor: amoledColors.border,
                              }}
                            >
                              Sets
                            </th>
                            <th
                              style={{
                                color: amoledColors.text,
                                borderColor: amoledColors.border,
                              }}
                            >
                              Feeling
                            </th>
                            <th
                              style={{
                                color: amoledColors.text,
                                borderColor: amoledColors.border,
                              }}
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {workouts
                            .filter((workout) => {
                              if (workoutHistoryFilter === 'recent') {
                                return (
                                  new Date(workout.date) >=
                                  subDays(new Date(), 30)
                                );
                              }
                              if (workoutHistoryFilter === 'by-exercise') {
                                return (
                                  workout.product._id === selectedExerciseFilter
                                );
                              }
                              return true;
                            })
                            .slice(
                              (currentPage - 1) * workoutsPerPage,
                              currentPage * workoutsPerPage
                            )
                            .map((workout) => (
                              <tr
                                key={workout._id}
                                style={{
                                  borderColor: amoledColors.border,
                                  backgroundColor: 'transparent',
                                }}
                              >
                                <td
                                  style={{
                                    color: amoledColors.text,
                                    borderColor: amoledColors.border,
                                  }}
                                >
                                  {formatWorkoutDate(workout.date)}
                                </td>
                                <td
                                  style={{
                                    color: amoledColors.text,
                                    borderColor: amoledColors.border,
                                  }}
                                >
                                  {workout.product.name}
                                </td>
                                <td
                                  style={{
                                    color: amoledColors.text,
                                    borderColor: amoledColors.border,
                                  }}
                                >
                                  {workout.sets?.length || 0}
                                </td>
                                <td
                                  style={{ borderColor: amoledColors.border }}
                                >
                                  {workout.feeling && (
                                    <Badge
                                      bg={getFeelingVariant(workout.feeling)}
                                    >
                                      {workout.feeling}
                                    </Badge>
                                  )}
                                </td>
                                <td
                                  style={{ borderColor: amoledColors.border }}
                                >
                                  <Link to={`/workout/${workout._id}`}>
                                    <Button
                                      size='sm'
                                      variant='outline-primary'
                                      style={{
                                        borderColor: amoledColors.accent,
                                        color: amoledColors.accent,
                                        backgroundColor: 'transparent',
                                      }}
                                    >
                                      View
                                    </Button>
                                  </Link>
                                  <Button
                                    size='sm'
                                    variant='outline-secondary'
                                    className='ms-2'
                                    onClick={() => {
                                      setWorkoutToDelete(workout._id);
                                      setShowDeleteModal(true);
                                    }}
                                    style={{
                                      borderColor: amoledColors.textSecondary,
                                      color: amoledColors.textSecondary,
                                      backgroundColor: 'transparent',
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                      <div className='d-flex justify-content-between align-items-center mt-3'>
                        <Button
                          variant='outline-secondary'
                          size='sm'
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          Previous
                        </Button>
                        <span>Page {currentPage}</span>
                        <Button
                          variant='outline-secondary'
                          size='sm'
                          disabled={
                            currentPage * workoutsPerPage >= workouts.length
                          }
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        variant='secondary'
                        onClick={() => setShowWorkoutHistoryModal(false)}
                      >
                        Close
                      </Button>
                    </Modal.Footer>
                  </Modal>

                  {/* Delete Workout Modal */}
                  <Modal
                    show={showDeleteModal}
                    onHide={() => setShowDeleteModal(false)}
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Confirm Delete</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      Are you sure you want to delete this workout?
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        variant='secondary'
                        onClick={() => setShowDeleteModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button variant='danger' onClick={handleDeleteWorkout}>
                        Delete
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </>
              )}
            </>
          )}
        </Container>
      </AnimatedScreenWrapper>
    </>
  );
};

export default WorkoutDashboardScreen;
