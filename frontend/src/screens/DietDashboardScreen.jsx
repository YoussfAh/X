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
  Form,
  Modal,
  Collapse,
  ButtonGroup,
  ToggleButton,
  Accordion,
} from 'react-bootstrap';
import {
  FaUtensils,
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
  FaAppleAlt,
  FaCarrot,
  FaBreadSlice,
  FaEgg,
  FaTint,
  FaCamera,
  FaBullseye as FaTarget,
  FaChevronDown,
  FaChevronUp,
  FaPlus,
  FaMinus,
  FaEye,
  FaRegCalendarAlt,
  FaStreak,
  FaBars,
  FaChevronLeft,
  FaBolt,
} from 'react-icons/fa';
import {
  format,
  parseISO,
  differenceInDays,
  subDays,
  getDay,
  startOfWeek,

  isSameDay,
  isWithinInterval,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  isToday,
  isYesterday,
  addDays,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  addWeeks,
  addMonths,
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
  useGetMyDietEntriesQuery,
  useGetDietAnalyticsQuery,
} from '../slices/dietApiSlice';
import {
  useGetTodaysWaterTrackingQuery,
  useAddWaterIntakeMutation,
  useRemoveWaterIntakeMutation,
  useResetWaterIntakeMutation,
} from '../slices/waterTrackingSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import MealTimelineCard from '../components/MealTimelineCard';
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

const DietDashboardScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Register Chart.js components only when this component mounts
  useEffect(() => {
    // Check if Chart.js is already registered to avoid conflicts
    if (!ChartJS.registry.plugins.get('tooltip')) {
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
    }
  }, []);

  // View mode state
  const [viewMode, setViewMode] = useState('weekly'); // 'daily', 'weekly', 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedDays, setExpandedDays] = useState(
    new Set([format(new Date(), 'yyyy-MM-dd')])
  );
  const [monthsToLoad, setMonthsToLoad] = useState(1); // For monthly view pagination

  const { startDate, endDate } = useMemo(() => {
    let start, end;
    const today = new Date();

    if (viewMode === 'daily') {
      start = startOfDay(selectedDate);
      end = endOfDay(selectedDate);
    } else if (viewMode === 'weekly') {
      // Show last 7 days ending with selectedDate
      end = endOfDay(selectedDate);
      start = startOfDay(subDays(selectedDate, 6));
    } else {
      // monthly
      // For monthly view with pagination
      start = startOfMonth(subMonths(selectedDate, monthsToLoad - 1));
      end = endOfMonth(selectedDate);
    }

    // Ensure we don't go beyond today
    const actualEnd = end > today ? today : end;

    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(actualEnd, 'yyyy-MM-dd'),
    };
  }, [selectedDate, viewMode, monthsToLoad]);

  // Additional tracking states
  const [showInsights, setShowInsights] = useState(false);

  const {
    data: dietEntries,
    isLoading,
    error,
    refetch,
  } = useGetMyDietEntriesQuery({
    startDate,
    endDate,
    limit: 500, // Increased limit to ensure all entries are fetched
  });

  const { data: analytics } = useGetDietAnalyticsQuery({
    startDate,
    endDate,
  });

  // Water tracking API calls
  const { data: waterTracking, refetch: refetchWater } =
    useGetTodaysWaterTrackingQuery();
  const [addWaterIntake] = useAddWaterIntakeMutation();
  const [removeWaterIntake] = useRemoveWaterIntakeMutation();
  const [resetWaterIntake] = useResetWaterIntakeMutation();

  // Reset monthsToLoad when switching view modes
  useEffect(() => {
    if (viewMode !== 'monthly') {
      setMonthsToLoad(1);
    }
  }, [viewMode]);

  // Debug: Log fetched entries
  useEffect(() => {
    if (dietEntries) {
      console.log('Fetched diet entries:', dietEntries);
      console.log('Date range:', { startDate, endDate });
    }
  }, [dietEntries, startDate, endDate]);

  // State for meal history modal
  const [showMealHistoryModal, setShowMealHistoryModal] = useState(false);
  const [mealHistoryFilter, setMealHistoryFilter] = useState('all');
  const [selectedMealFilter, setSelectedMealFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);

  // State for nutrition goals
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    fiber: 25,
  });
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Define AMOLED theme colors
  const amoledColors = {
    background: isDarkMode ? '#000000' : '#ffffff',
    cardBg: isDarkMode ? '#0D0D0D' : '#ffffff',
    text: isDarkMode ? '#E2E8F0' : '#1A202C',
    textSecondary: isDarkMode ? '#94A3B8' : '#4A5568',
    textMuted: isDarkMode ? '#64748B' : '#6B7280',
    accent: isDarkMode ? '#A855F7' : '#6E44B2',
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
      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    border: isDarkMode
      ? `2px solid ${amoledColors.chartColors.green}`
      : '2px solid #10b981',
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

  // Calculate nutrition streak
  const calculateNutritionStreak = useMemo(() => {
    if (!dietEntries?.dietEntries || dietEntries.dietEntries.length === 0)
      return 0;

    // Sort entries by date (newest first)
    const sortedEntries = [...dietEntries.dietEntries].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // Group by date and check if each day meets minimum meal requirement (3 meals)
    const dailyMeals = {};
    sortedEntries.forEach((entry) => {
      const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
      dailyMeals[dateKey] = (dailyMeals[dateKey] || 0) + 1;
    });

    const sortedDates = Object.keys(dailyMeals).sort(
      (a, b) => new Date(b) - new Date(a)
    );
    if (sortedDates.length === 0) return 0;

    const today = format(new Date(), 'yyyy-MM-dd');
    const mostRecentDate = sortedDates[0];

    // Check if streak is broken (no meals today or yesterday)
    if (differenceInDays(new Date(today), new Date(mostRecentDate)) > 1) {
      return 0;
    }

    let streak = 0;
    let currentDate = new Date();

    for (let i = 0; i < sortedDates.length; i++) {
      const dateKey = sortedDates[i];
      const checkDate = new Date(dateKey);

      if (dailyMeals[dateKey] >= 2) {
        // At least 2 meals per day
        if (i === 0 || differenceInDays(currentDate, checkDate) <= 1) {
          streak++;
          currentDate = checkDate;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return streak;
  }, [dietEntries]);

  // Achievements data
  const achievements = useMemo(
    () => [
      {
        title: 'First Entry',
        description: 'Log your first meal',
        achieved: dietEntries?.dietEntries?.length > 0,
        icon: '🍽️',
      },
      {
        title: 'Streak Master',
        description: '7 days in a row',
        achieved: calculateNutritionStreak >= 7,
        icon: '🔥',
      },
      {
        title: 'Protein Pro',
        description: 'Hit protein goal 5 times',
        achieved:
          dietEntries?.dietEntries?.filter(
            (entry) => entry.protein >= nutritionGoals.protein
          ).length >= 5,
        icon: '💪',
      },
      {
        title: 'Hydration Hero',
        description: 'Hit water goal',
        achieved:
          (waterTracking?.data?.glasses || 0) >=
          (waterTracking?.data?.goal || 8),
        icon: '💧',
      },
      {
        title: 'Calorie Counter',
        description: 'Track 30 meals',
        achieved: dietEntries?.dietEntries?.length >= 30,
        icon: '📊',
      },
      {
        title: 'Consistency King',
        description: '15 day streak',
        achieved: calculateNutritionStreak >= 15,
        icon: '👑',
      },
      {
        title: 'Balanced Eater',
        description: 'Hit all macros in one day',
        achieved: false, // Will be calculated properly when needed
        icon: '⚖️',
      },
      {
        title: 'Week Warrior',
        description: 'Complete a full week',
        achieved: calculateNutritionStreak >= 7,
        icon: '🗓️',
      },
    ],
    [dietEntries, calculateNutritionStreak, nutritionGoals, waterTracking]
  );

  // Generate weekly nutrition data
  const weeklyNutritionData = useMemo(() => {
    if (!dietEntries?.dietEntries || dietEntries.dietEntries.length === 0)
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [],
      };

    // Get the last 7 days
    const today = new Date();
    const lastWeek = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      return {
        date,
        day: format(date, 'EEE'),
        calories: 0,
        protein: 0,
        meals: 0,
      };
    });

    // Aggregate nutrition data by day
    dietEntries.dietEntries.forEach((entry) => {
      const entryDate = new Date(entry.date);
      lastWeek.forEach((day) => {
        if (isSameDay(entryDate, day.date)) {
          day.calories += entry.calories || 0;
          day.protein += entry.protein || 0;
          day.meals += 1;
        }
      });
    });

    return {
      labels: lastWeek.map((day) => day.day),
      datasets: [
        {
          label: 'Calories',
          data: lastWeek.map((day) => day.calories),
          backgroundColor: amoledColors.chartColors.orange,
          borderColor: amoledColors.chartColors.orange,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Protein (g)',
          data: lastWeek.map((day) => day.protein),
          backgroundColor: amoledColors.chartColors.green,
          borderColor: amoledColors.chartColors.green,
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };
  }, [dietEntries, amoledColors]);

  // Generate meal type distribution
  const mealTypeDistribution = useMemo(() => {
    if (!dietEntries?.dietEntries || dietEntries.dietEntries.length === 0)
      return {
        labels: [],
        datasets: [],
      };

    const mealCounts = {};
    dietEntries.dietEntries.forEach((entry) => {
      const mealType = entry.mealType || 'other';
      mealCounts[mealType] = (mealCounts[mealType] || 0) + 1;
    });

    const mealColors = {
      breakfast: amoledColors.chartColors.orange,
      lunch: amoledColors.chartColors.green,
      dinner: amoledColors.chartColors.blue,
      snack: amoledColors.chartColors.purple,
      other: amoledColors.chartColors.cyan,
    };

    return {
      labels: Object.keys(mealCounts).map(
        (key) => key.charAt(0).toUpperCase() + key.slice(1)
      ),
      datasets: [
        {
          data: Object.values(mealCounts),
          backgroundColor: Object.keys(mealCounts).map(
            (key) => mealColors[key] || amoledColors.chartColors.red
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [dietEntries, amoledColors]);

  // Calculate today's nutrition progress
  const todaysProgress = useMemo(() => {
    if (!dietEntries?.dietEntries)
      return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysEntries = dietEntries.dietEntries.filter(
      (entry) => format(new Date(entry.date), 'yyyy-MM-dd') === today
    );

    return todaysEntries.reduce(
      (acc, entry) => {
        acc.calories += entry.calories || 0;
        acc.protein += entry.protein || 0;
        acc.carbs += entry.carbs || 0;
        acc.fat += entry.fat || 0;
        acc.fiber += entry.fiber || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [dietEntries]);

  // Get feeling badge variant
  const getFeelingVariant = (feeling) => {
    switch (feeling) {
      case 'very-satisfied':
        return 'success';
      case 'satisfied':
        return 'info';
      case 'neutral':
        return 'secondary';
      case 'hungry':
        return 'warning';
      case 'very-hungry':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Format date
  const formatEntryDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy - h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Calculate nutrition goal percentages
  const getGoalPercentage = (current, goal) => {
    return Math.min(100, Math.round((current / goal) * 100));
  };

  // Toggle day expansion
  const toggleDayExpansion = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dateStr)) {
      newExpanded.delete(dateStr);
    } else {
      newExpanded.add(dateStr);
    }
    setExpandedDays(newExpanded);
  };

  const handleDateChange = (direction) => {
    const today = new Date();

    if (viewMode === 'daily') {
      const newDate = addDays(selectedDate, direction);
      // Don't allow going to future dates
      if (newDate <= today) {
        setSelectedDate(newDate);
      }
    } else if (viewMode === 'weekly') {
      const newDate = addDays(selectedDate, direction * 7);
      // Don't allow going to future dates
      if (newDate <= today) {
        setSelectedDate(newDate);
      }
    } else {
      // monthly
      const newDate = addMonths(selectedDate, direction);
      // Don't allow going to future dates
      if (newDate <= today) {
        setSelectedDate(newDate);
        // Reset months to load when changing months
        setMonthsToLoad(1);
      }
    }
  };

  const getDateRangeLabel = () => {
    if (viewMode === 'daily') {
      return format(selectedDate, 'EEEE, MMM d, yyyy');
    }
    if (viewMode === 'weekly') {
      const end = selectedDate;
      const start = subDays(selectedDate, 6);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    if (viewMode === 'monthly') {
      if (monthsToLoad === 1) {
        return format(selectedDate, 'MMMM yyyy');
      } else {
        const startMonth = subMonths(selectedDate, monthsToLoad - 1);
        return `${format(startMonth, 'MMM yyyy')} - ${format(
          selectedDate,
          'MMM yyyy'
        )}`;
      }
    }
  };

  // Get days to display based on view mode
  const getDaysToDisplay = useMemo(() => {
    const today = new Date();

    if (viewMode === 'daily') {
      return [selectedDate].filter((date) => date <= today);
    }

    let start, end;
    if (viewMode === 'weekly') {
      // Show last 7 days ending with selectedDate
      end = selectedDate;
      start = subDays(selectedDate, 6);
    } else {
      // monthly
      start = startOfMonth(subMonths(selectedDate, monthsToLoad - 1));
      end = endOfMonth(selectedDate);
    }

    // Only include dates up to today
    const actualEnd = end > today ? today : end;
    return eachDayOfInterval({ start, end: actualEnd });
  }, [viewMode, selectedDate, monthsToLoad]);

  // Organize meals by day
  const mealsByDay = useMemo(() => {
    if (!dietEntries?.dietEntries) return {};

    const organized = {};

    getDaysToDisplay.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      organized[dateKey] = {
        date: day,
        meals: [],
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
        mealCounts: { breakfast: 0, lunch: 0, dinner: 0, snack: 0 },
      };
    });

    dietEntries.dietEntries.forEach((entry) => {
      const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
      if (organized[dateKey]) {
        organized[dateKey].meals.push(entry);
        organized[dateKey].totals.calories += entry.calories || 0;
        organized[dateKey].totals.protein += entry.protein || 0;
        organized[dateKey].totals.carbs += entry.carbs || 0;
        organized[dateKey].totals.fat += entry.fat || 0;
        organized[dateKey].totals.fiber += entry.fiber || 0;
        organized[dateKey].mealCounts[entry.mealType] =
          (organized[dateKey].mealCounts[entry.mealType] || 0) + 1;
      }
    });

    // Sort meals within each day by time
    Object.values(organized).forEach((day) => {
      day.meals.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return organized;
  }, [dietEntries, getDaysToDisplay]);

  // Get day label
  const getDayLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d');
  };

  // Water intake helpers
  // Water tracking functions
  const waterIntake = waterTracking?.data?.glasses || 0;
  const dailyWaterGoal = waterTracking?.data?.goal || 8;

  // Water tracking state for optimistic updates
  const [localWaterIntake, setLocalWaterIntake] = useState(null);

  // Initialize and sync local water intake when data loads
  useEffect(() => {
    if (waterTracking?.data?.glasses !== undefined) {
      setLocalWaterIntake(waterTracking.data.glasses);
    }
  }, [waterTracking?.data?.glasses]);

  // Use local state if available, otherwise use server data
  const displayedWaterIntake = localWaterIntake !== null ? localWaterIntake : waterIntake;

  const handleAddWater = async (amount = 1) => {
    // Calculate new value
    const newValue = Math.min((displayedWaterIntake || 0) + amount, dailyWaterGoal);
    
    // Update local state immediately
    setLocalWaterIntake(newValue);
    
    try {
      // Make API call in background
      await addWaterIntake({ amount }).unwrap();
    } catch (error) {
      console.error('Failed to add water:', error);
      // No need to revert - we'll sync with server data on next refetch
    }
  };

  const handleRemoveWater = async (amount = 1) => {
    // Calculate new value
    const newValue = Math.max((displayedWaterIntake || 0) - amount, 0);
    
    // Update local state immediately
    setLocalWaterIntake(newValue);
    
    try {
      // Make API call in background
      await removeWaterIntake({ amount }).unwrap();
    } catch (error) {
      console.error('Failed to remove water:', error);
      // No need to revert - we'll sync with server data on next refetch
    }
  };

  const handleResetWater = async () => {
    // Update local state immediately
    setLocalWaterIntake(0);
    
    try {
      // Make API call in background
      await resetWaterIntake().unwrap();
    } catch (error) {
      console.error('Failed to reset water:', error);
      // No need to revert - we'll sync with server data on next refetch
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <Message variant='danger'>Error loading diet data</Message>;

  return (
    <AnimatedScreenWrapper>
      <Meta title='Diet Dashboard' />
      <Container fluid className='px-1'>
        {/* Header Section */}
        {/* Commented out as requested
        <FadeIn delay={0.1}>
          <Card style={headerCardStyle} className='mb-2'>
            <Card.Body
              className='text-center position-relative'
              style={{ padding: isMobile ? '1rem 0.75rem' : '1.5rem 1rem' }}
            >
              <div className='d-flex align-items-center justify-content-center mb-3'>
                <FaUtensils
                  size={isMobile ? 28 : 40}
                  style={{
                    color: amoledColors.chartColors.green,
                    marginRight: '1rem',
                  }}
                />
                <h1
                  className='mb-0'
                  style={{
                    fontSize: isMobile ? '1.6rem' : '2.5rem',
                    fontWeight: '700',
                    color: amoledColors.text,
                  }}
                >
                  Diet Dashboard
                </h1>
              </div>
              <p
                className='mb-0'
                style={{
                  fontSize: isMobile ? '0.9rem' : '1.1rem',
                  color: amoledColors.textSecondary,
                }}
              >
                Track your nutrition, monitor your goals, and optimize your diet
              </p>
              <div
                style={{
                  position: 'absolute',
                  top: isMobile ? '0.5rem' : '1rem',
                  right: isMobile ? '0.5rem' : '1rem',
                  display: 'flex',
                  gap: '0.5rem',
                }}
              >
                <LinkContainer to='/add-diet-entry'>
                  <Button
                    variant='outline-success'
                    size='sm'
                    style={{
                      borderColor: amoledColors.chartColors.green,
                      color: amoledColors.chartColors.green,
                      padding: isMobile ? '0.3rem 0.6rem' : '0.4rem 0.8rem',
                    }}
                    title='Log Meal'
                  >
                    <FaPlus size={isMobile ? 10 : 12} />
                  </Button>
                </LinkContainer>
              </div>
            </Card.Body>
          </Card>
        </FadeIn>
        */}

        {/* View Mode and Date Selector */}
        <FadeIn delay={0.2}>
          <Card style={cardStyle} className='mb-3'>
            <Card.Body style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
              <Row className='align-items-center g-2'>
                <Col md={4} className='mb-2 mb-md-0'>
                  <ButtonGroup className='w-100' size={isMobile ? 'sm' : 'md'}>
                    {['daily', 'weekly', 'monthly'].map((mode) => (
                      <ToggleButton
                        key={mode}
                        id={`radio-${mode}`}
                        type='radio'
                        variant={
                          viewMode === mode ? 'primary' : 'outline-primary'
                        }
                        name='viewMode'
                        value={mode}
                        checked={viewMode === mode}
                        onChange={(e) => setViewMode(e.currentTarget.value)}
                        style={{
                          backgroundColor:
                            viewMode === mode
                              ? amoledColors.accent
                              : 'transparent',
                          borderColor: amoledColors.accent,
                          color:
                            viewMode === mode ? '#fff' : amoledColors.accent,
                          fontSize: isMobile ? '0.8rem' : '0.9rem',
                          padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.8rem',
                        }}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </ToggleButton>
                    ))}
                  </ButtonGroup>
                </Col>
                <Col
                  md={8}
                  className='d-flex justify-content-between align-items-center'
                >
                  <Button
                    variant='outline-secondary'
                    size={isMobile ? 'sm' : 'md'}
                    onClick={() => handleDateChange(-1)}
                    style={{
                      borderColor: amoledColors.textMuted,
                      color: amoledColors.textMuted,
                      padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.8rem',
                    }}
                  >
                    <FaChevronLeft size={isMobile ? 12 : 14} />
                  </Button>
                  <div className='text-center mx-2 mx-md-3 flex-grow-1'>
                    <h6
                      className='mb-0'
                      style={{
                        color: amoledColors.text,
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '600',
                      }}
                    >
                      {getDateRangeLabel()}
                    </h6>
                  </div>
                  <Button
                    variant='outline-secondary'
                    size={isMobile ? 'sm' : 'md'}
                    onClick={() => handleDateChange(1)}
                    disabled={(() => {
                      const today = new Date();
                      if (viewMode === 'daily') {
                        return selectedDate >= today;
                      } else if (viewMode === 'weekly') {
                        return selectedDate >= today;
                      } else {
                        // monthly
                        return (
                          startOfMonth(selectedDate) >= startOfMonth(today)
                        );
                      }
                    })()}
                    style={{
                      borderColor: amoledColors.textMuted,
                      color: amoledColors.textMuted,
                      padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.8rem',
                      opacity: (() => {
                        const today = new Date();
                        if (viewMode === 'daily') {
                          return selectedDate >= today ? 0.5 : 1;
                        } else if (viewMode === 'weekly') {
                          return selectedDate >= today ? 0.5 : 1;
                        } else {
                          // monthly
                          return startOfMonth(selectedDate) >=
                            startOfMonth(today)
                            ? 0.5
                            : 1;
                        }
                      })(),
                    }}
                  >
                    <FaChevronRight size={isMobile ? 12 : 14} />
                  </Button>
                  <Button
                    variant='outline-info'
                    size={isMobile ? 'sm' : 'md'}
                    onClick={() => setSelectedDate(new Date())}
                    className='ms-2'
                    style={{
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.8rem',
                      height: '100%',
                    }}
                  >
                    Today
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </FadeIn>

        {/* Top Row - Quick Stats */}
        <Row className='mb-3'>
          <Col lg={12}>
            <FadeIn delay={0.3}>
              <Card style={cardStyle} className='mb-3'>
                <Card.Header
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: isMobile ? '1rem 1rem 0' : '1.5rem 1.5rem 0',
                  }}
                >
                  <h5
                    style={{
                      color: amoledColors.text,
                      margin: 0,
                      fontSize: isMobile ? '1rem' : '1.1rem',
                    }}
                  >
                    <FaBolt className='me-2' />
                    Quick Stats & Overview
                  </h5>
                </Card.Header>
                <Card.Body style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
                  {/* Check if we have any data */}
                  {dietEntries?.dietEntries?.length > 0 ? (
                    <Row className='g-2'>
                      <Col xs={6} md={3}>
                        <div
                          className='text-center rounded'
                          style={{
                            backgroundColor: isDarkMode
                              ? 'rgba(255,255,255,0.05)'
                              : '#f8f9fa',
                            padding: isMobile ? '0.75rem' : '1rem',
                          }}
                        >
                          <FaFire
                            size={isMobile ? 20 : 24}
                            style={{
                              color: amoledColors.chartColors.orange,
                              marginBottom: '0.5rem',
                            }}
                          />
                          <div
                            style={{
                              fontSize: isMobile ? '1.1rem' : '1.4rem',
                              fontWeight: 'bold',
                              color: amoledColors.text,
                              margin: '0.25rem 0',
                            }}
                          >
                            {todaysProgress.calories}
                          </div>
                          <small
                            style={{
                              color: amoledColors.textMuted,
                              fontSize: isMobile ? '0.7rem' : '0.8rem',
                            }}
                          >
                            Calories Today
                          </small>
                          <ProgressBar
                            now={getGoalPercentage(
                              todaysProgress.calories,
                              nutritionGoals.calories
                            )}
                            style={{ height: '4px', marginTop: '0.5rem' }}
                            variant='warning'
                          />
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div
                          className='text-center rounded'
                          style={{
                            backgroundColor: isDarkMode
                              ? 'rgba(255,255,255,0.05)'
                              : '#f8f9fa',
                            padding: isMobile ? '0.75rem' : '1rem',
                          }}
                        >
                          <FaEgg
                            size={isMobile ? 20 : 24}
                            style={{
                              color: amoledColors.chartColors.green,
                              marginBottom: '0.5rem',
                            }}
                          />
                          <div
                            style={{
                              fontSize: isMobile ? '1.1rem' : '1.4rem',
                              fontWeight: 'bold',
                              color: amoledColors.text,
                              margin: '0.25rem 0',
                            }}
                          >
                            {Math.round(todaysProgress.protein)}g
                          </div>
                          <small
                            style={{
                              color: amoledColors.textMuted,
                              fontSize: isMobile ? '0.7rem' : '0.8rem',
                            }}
                          >
                            Protein
                          </small>
                          <ProgressBar
                            now={getGoalPercentage(
                              todaysProgress.protein,
                              nutritionGoals.protein
                            )}
                            style={{ height: '4px', marginTop: '0.5rem' }}
                            variant='success'
                          />
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div
                          className='text-center rounded'
                          style={{
                            backgroundColor: isDarkMode
                              ? 'rgba(255,255,255,0.05)'
                              : '#f8f9fa',
                            padding: isMobile ? '0.75rem' : '1rem',
                          }}
                        >
                          <FaCarrot
                            size={isMobile ? 20 : 24}
                            style={{
                              color: amoledColors.chartColors.blue,
                              marginBottom: '0.5rem',
                            }}
                          />
                          <div
                            style={{
                              fontSize: isMobile ? '1.1rem' : '1.4rem',
                              fontWeight: 'bold',
                              color: amoledColors.text,
                              margin: '0.25rem 0',
                            }}
                          >
                            {Math.round(todaysProgress.carbs)}g
                          </div>
                          <small
                            style={{
                              color: amoledColors.textMuted,
                              fontSize: isMobile ? '0.7rem' : '0.8rem',
                            }}
                          >
                            Carbs
                          </small>
                          <ProgressBar
                            now={getGoalPercentage(
                              todaysProgress.carbs,
                              nutritionGoals.carbs
                            )}
                            style={{ height: '4px', marginTop: '0.5rem' }}
                            variant='primary'
                          />
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div
                          className='text-center rounded'
                          style={{
                            backgroundColor: isDarkMode
                              ? 'rgba(255,255,255,0.05)'
                              : '#f8f9fa',
                            padding: isMobile ? '0.75rem' : '1rem',
                          }}
                        >
                          <FaTrophy
                            size={isMobile ? 20 : 24}
                            style={{
                              color: amoledColors.chartColors.purple,
                              marginBottom: '0.5rem',
                            }}
                          />
                          <div
                            style={{
                              fontSize: isMobile ? '1.1rem' : '1.4rem',
                              fontWeight: 'bold',
                              color: amoledColors.text,
                              margin: '0.25rem 0',
                            }}
                          >
                            {calculateNutritionStreak}
                          </div>
                          <small
                            style={{
                              color: amoledColors.textMuted,
                              fontSize: isMobile ? '0.7rem' : '0.8rem',
                            }}
                          >
                            Day Streak
                          </small>
                        </div>
                      </Col>
                    </Row>
                  ) : (
                    /* Empty State for Quick Stats */
                    <div className='text-center py-4'>
                      <FaUtensils
                        size={32}
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
                        }}
                      >
                        Start Your Nutrition Journey
                      </h6>
                      <p
                        style={{
                          color: amoledColors.textMuted,
                          fontSize: '0.9rem',
                          marginBottom: '1rem',
                        }}
                      >
                        Log your first meal to see your daily stats and track
                        your progress
                      </p>
                      <LinkContainer to='/add-diet-entry'>
                        <Button
                          variant='primary'
                          size='sm'
                          style={{
                            backgroundColor: amoledColors.accent,
                            borderColor: amoledColors.accent,
                            padding: '0.5rem 1.5rem',
                          }}
                        >
                          <FaPlus className='me-2' />
                          Log Your First Meal
                        </Button>
                      </LinkContainer>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </FadeIn>
          </Col>
        </Row>

        {/* Water Tracking & Achievements Row */}
        <Row className='mb-3'>
          {/* Dedicated Water Tracking Section */}
          <Col md={6} lg={4}>
            <FadeIn delay={0.4}>
              <Card style={{ ...cardStyle, height: '100%' }} className='mb-3'>
                <Card.Header
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: isMobile ? '1rem 1rem 0' : '1.25rem 1.25rem 0',
                  }}
                >
                  <h5
                    style={{
                      color: amoledColors.text,
                      margin: 0,
                      fontSize: isMobile ? '1rem' : '1.1rem',
                    }}
                  >
                    <FaTint className='me-2' />
                    Water Intake
                  </h5>
                </Card.Header>
                <Card.Body
                  style={{
                    padding: isMobile ? '1rem' : '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: isMobile ? '250px' : '280px',
                  }}
                >
                  {/* Water Display Section */}
                  <div className='text-center'>
                    {/* Water Intake Display */}
                    <div className='text-center mb-3'>
                      <div
                        style={{
                          fontSize: isMobile ? '2.5rem' : '3rem',
                          fontWeight: '700',
                          color: amoledColors.chartColors.blue,
                          lineHeight: '1',
                          margin: '0.5rem 0',
                        }}
                      >
                        {displayedWaterIntake}
                      </div>
                      <div
                        style={{
                          fontSize: isMobile ? '0.8rem' : '0.9rem',
                          color: amoledColors.textSecondary,
                          marginBottom: '0.5rem',
                        }}
                      >
                        out of {dailyWaterGoal} glasses
                      </div>
                      <div
                        style={{
                          fontSize: isMobile ? '0.7rem' : '0.8rem',
                          color: amoledColors.textMuted,
                        }}
                      >
                        {Math.round(((displayedWaterIntake || 0) / dailyWaterGoal) * 100)}% of
                        daily goal
                      </div>
                    </div>
                    <ProgressBar
                      now={(waterIntake / dailyWaterGoal) * 100}
                      style={{ height: '6px', marginBottom: '0.5rem' }}
                      variant='info'
                    />
                    <div
                      style={{
                        fontSize: isMobile ? '0.7rem' : '0.8rem',
                        color: amoledColors.textMuted,
                        marginBottom: '0.8rem',
                      }}
                    >
                      {Math.round((waterIntake / dailyWaterGoal) * 100)}% of
                      daily goal
                    </div>
                  </div>

                  {/* Action Buttons Section */}
                  <div>
                    {/* Quick Add Buttons */}
                    <Row className='g-2 mb-2'>
                      <Col xs={6}>
                        <Button
                          variant='outline-primary'
                          className='w-100'
                          size='sm'
                          onClick={() => handleAddWater(1)}
                          style={{
                            borderColor: amoledColors.chartColors.blue,
                            color: amoledColors.chartColors.blue,
                            padding: isMobile ? '0.3rem' : '0.4rem',
                            fontSize: isMobile ? '0.7rem' : '0.8rem',
                          }}
                        >
                          <FaTint className='me-1' />
                          +1 Glass
                        </Button>
                      </Col>
                      <Col xs={6}>
                        <Button
                          variant='outline-success'
                          className='w-100'
                          size='sm'
                          onClick={() => handleAddWater(2)}
                          style={{
                            borderColor: amoledColors.chartColors.green,
                            color: amoledColors.chartColors.green,
                            padding: isMobile ? '0.3rem' : '0.4rem',
                            fontSize: isMobile ? '0.7rem' : '0.8rem',
                          }}
                        >
                          <FaTint className='me-1' />
                          +2 Glasses
                        </Button>
                      </Col>
                    </Row>

                    {/* Quick Reset/Undo */}
                    <Row className='g-2'>
                      <Col xs={6}>
                        <Button
                          variant='outline-warning'
                          size='sm'
                          className='w-100'
                          onClick={() => handleRemoveWater(1)}
                          style={{
                            borderColor: amoledColors.chartColors.orange,
                            color: amoledColors.chartColors.orange,
                            padding: isMobile ? '0.3rem' : '0.35rem',
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                          }}
                        >
                          <FaMinus className='me-1' /> Undo
                        </Button>
                      </Col>
                      <Col xs={6}>
                        <Button
                          variant='outline-secondary'
                          size='sm'
                          className='w-100'
                          onClick={handleResetWater}
                          style={{
                            borderColor: amoledColors.textMuted,
                            color: amoledColors.textMuted,
                            padding: isMobile ? '0.3rem' : '0.35rem',
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                          }}
                        >
                          Reset
                        </Button>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            </FadeIn>
          </Col>

          {/* Achievements */}
          <Col md={6} lg={8}>
            <FadeIn delay={0.5}>
              <Card style={{ ...cardStyle, height: '100%' }} className='mb-3'>
                <Card.Header
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: isMobile ? '1rem 1rem 0' : '1.25rem 1.25rem 0',
                  }}
                >
                  <h5
                    style={{
                      color: amoledColors.text,
                      margin: 0,
                      fontSize: isMobile ? '1rem' : '1.1rem',
                    }}
                  >
                    <FaTrophy className='me-2' />
                    Achievements
                  </h5>
                </Card.Header>
                <Card.Body
                  style={{
                    padding: isMobile ? '1rem' : '1.25rem',
                    minHeight: isMobile ? '250px' : '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  {dietEntries?.dietEntries?.length > 0 ? (
                    <Row className='g-2'>
                      {achievements.slice(0, 6).map((achievement, index) => (
                        <Col xs={6} md={4} key={index}>
                          <div
                            className='text-center rounded'
                            style={{
                              backgroundColor: achievement.achieved
                                ? isDarkMode
                                  ? 'rgba(255,215,0,0.1)'
                                  : '#fff3cd'
                                : isDarkMode
                                ? 'rgba(255,255,255,0.05)'
                                : '#f8f9fa',
                              height: isMobile ? '80px' : '90px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              padding: isMobile ? '0.5rem' : '0.75rem',
                            }}
                          >
                            <div
                              style={{
                                fontSize: isMobile ? '1.2rem' : '1.5rem',
                                marginBottom: '0.25rem',
                              }}
                            >
                              {achievement.achieved ? '🏆' : '🔒'}
                            </div>
                            <small
                              style={{
                                color: achievement.achieved
                                  ? amoledColors.accent
                                  : amoledColors.textMuted,
                                fontSize: isMobile ? '0.65rem' : '0.75rem',
                                display: 'block',
                                fontWeight: 'bold',
                                lineHeight: '1.2',
                                marginBottom: '0.25rem',
                              }}
                            >
                              {achievement.title}
                            </small>
                            <small
                              style={{
                                color: amoledColors.textMuted,
                                fontSize: isMobile ? '0.6rem' : '0.65rem',
                                lineHeight: '1.1',
                                textAlign: 'center',
                              }}
                            >
                              {achievement.description}
                            </small>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    /* Empty State for Achievements */
                    <div className='text-center'>
                      <FaTrophy
                        size={28}
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
                          fontSize: isMobile ? '0.9rem' : '1rem',
                        }}
                      >
                        Unlock Your First Achievement
                      </h6>
                      <p
                        style={{
                          color: amoledColors.textMuted,
                          fontSize: isMobile ? '0.8rem' : '0.9rem',
                          marginBottom: '1rem',
                          lineHeight: '1.4',
                        }}
                      >
                        Start logging meals to earn achievements and track your
                        progress
                      </p>
                      <div className='text-center'>
                        <small
                          style={{
                            color: amoledColors.textMuted,
                            fontSize: isMobile ? '0.7rem' : '0.8rem',
                          }}
                        >
                          🍽️ First Entry • 🔥 7-Day Streak • 💪 Protein Pro
                        </small>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </FadeIn>
          </Col>
        </Row>

        {/* Charts Row - Conditional Display */}
        {dietEntries?.dietEntries?.length > 0 ? (
          <>
            {/* Full Width Weekly Trends */}
            <Row className='mb-3'>
              <Col xs={12}>
                <FadeIn delay={0.6}>
                  <Card style={cardStyle} className='mb-3'>
                    <Card.Header
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: isMobile ? '1rem 1rem 0' : '1.5rem 1.5rem 0',
                      }}
                    >
                      <h5
                        style={{
                          color: amoledColors.text,
                          margin: 0,
                          fontSize: isMobile ? '1rem' : '1.1rem',
                        }}
                      >
                        <FaChartBar className='me-2' />
                        Weekly Nutrition Trends
                      </h5>
                    </Card.Header>
                    <Card.Body
                      style={{ padding: isMobile ? '1rem' : '1.5rem' }}
                    >
                      <div style={{ height: isMobile ? '250px' : '300px' }}>
                        <Bar
                          data={weeklyNutritionData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                grid: { color: amoledColors.border },
                                ticks: {
                                  color: amoledColors.textMuted,
                                  font: { size: isMobile ? 10 : 12 },
                                },
                              },
                              y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                grid: { drawOnChartArea: false },
                                ticks: {
                                  color: amoledColors.textMuted,
                                  font: { size: isMobile ? 10 : 12 },
                                },
                              },
                              x: {
                                grid: { color: amoledColors.border },
                                ticks: {
                                  color: amoledColors.textMuted,
                                  font: { size: isMobile ? 10 : 12 },
                                },
                              },
                            },
                            plugins: {
                              legend: {
                                labels: {
                                  color: amoledColors.text,
                                  font: { size: isMobile ? 12 : 14 },
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </Card.Body>
                  </Card>
                </FadeIn>
              </Col>
            </Row>

            {/* Analytics Row */}
            <Row className='mb-3'>
              <Col md={6}>
                <FadeIn delay={0.7}>
                  <Card
                    style={{ ...cardStyle, height: '100%' }}
                    className='mb-3'
                  >
                    <Card.Header
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: isMobile ? '1rem 1rem 0' : '1.25rem 1.25rem 0',
                      }}
                    >
                      <h5
                        style={{
                          color: amoledColors.text,
                          margin: 0,
                          fontSize: isMobile ? '1rem' : '1.1rem',
                        }}
                      >
                        <FaAppleAlt className='me-2' />
                        Meal Distribution
                      </h5>
                    </Card.Header>
                    <Card.Body
                      style={{ padding: isMobile ? '1rem' : '1.25rem' }}
                    >
                      <div style={{ height: isMobile ? '180px' : '220px' }}>
                        <Doughnut
                          data={mealTypeDistribution}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: {
                                  color: amoledColors.text,
                                  font: { size: isMobile ? 9 : 10 },
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </Card.Body>
                  </Card>
                </FadeIn>
              </Col>
              <Col md={6}>
                <FadeIn delay={0.8}>
                  <Card
                    style={{ ...cardStyle, height: '100%' }}
                    className='mb-3'
                  >
                    <Card.Header
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: isMobile ? '1rem 1rem 0' : '1.25rem 1.25rem 0',
                      }}
                    >
                      <h5
                        style={{
                          color: amoledColors.text,
                          margin: 0,
                          fontSize: isMobile ? '1rem' : '1.1rem',
                        }}
                      >
                        <FaTarget className='me-2' />
                        Today's Goals
                      </h5>
                    </Card.Header>
                    <Card.Body
                      style={{ padding: isMobile ? '1rem' : '1.25rem' }}
                    >
                      <div className='mb-3'>
                        <div className='d-flex justify-content-between align-items-center mb-2'>
                          <span
                            style={{
                              color: amoledColors.text,
                              fontSize: isMobile ? '0.8rem' : '0.9rem',
                            }}
                          >
                            Calories
                          </span>
                          <span
                            style={{
                              color: amoledColors.textMuted,
                              fontSize: isMobile ? '0.8rem' : '0.9rem',
                            }}
                          >
                            {todaysProgress.calories} /{' '}
                            {nutritionGoals.calories}
                          </span>
                        </div>
                        <ProgressBar
                          now={getGoalPercentage(
                            todaysProgress.calories,
                            nutritionGoals.calories
                          )}
                          variant='warning'
                          style={{ height: '6px' }}
                        />
                      </div>
                      <div className='mb-3'>
                        <div className='d-flex justify-content-between align-items-center mb-2'>
                          <span
                            style={{
                              color: amoledColors.text,
                              fontSize: isMobile ? '0.8rem' : '0.9rem',
                            }}
                          >
                            Protein
                          </span>
                          <span
                            style={{
                              color: amoledColors.textMuted,
                              fontSize: isMobile ? '0.8rem' : '0.9rem',
                            }}
                          >
                            {Math.round(todaysProgress.protein)}g /{' '}
                            {nutritionGoals.protein}g
                          </span>
                        </div>
                        <ProgressBar
                          now={getGoalPercentage(
                            todaysProgress.protein,
                            nutritionGoals.protein
                          )}
                          variant='success'
                          style={{ height: '6px' }}
                        />
                      </div>
                      <Row>
                        <Col xs={6}>
                          <div className='mb-3'>
                            <div className='d-flex justify-content-between align-items-center mb-2'>
                              <span
                                style={{
                                  color: amoledColors.text,
                                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                                }}
                              >
                                Carbs
                              </span>
                              <span
                                style={{
                                  color: amoledColors.textMuted,
                                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                                }}
                              >
                                {Math.round(todaysProgress.carbs)}g
                              </span>
                            </div>
                            <ProgressBar
                              now={getGoalPercentage(
                                todaysProgress.carbs,
                                nutritionGoals.carbs
                              )}
                              variant='primary'
                              style={{ height: '4px' }}
                            />
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className='mb-3'>
                            <div className='d-flex justify-content-between align-items-center mb-2'>
                              <span
                                style={{
                                  color: amoledColors.text,
                                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                                }}
                              >
                                Fat
                              </span>
                              <span
                                style={{
                                  color: amoledColors.textMuted,
                                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                                }}
                              >
                                {Math.round(todaysProgress.fat)}g
                              </span>
                            </div>
                            <ProgressBar
                              now={getGoalPercentage(
                                todaysProgress.fat,
                                nutritionGoals.fat
                              )}
                              variant='secondary'
                              style={{ height: '4px' }}
                            />
                          </div>
                        </Col>
                      </Row>
                      <div className='d-flex justify-content-center mt-2'>
                        <Button
                          variant='outline-primary'
                          size='sm'
                          onClick={() => setShowGoalModal(true)}
                          style={{
                            borderColor: amoledColors.accent,
                            color: amoledColors.accent,
                            padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                            fontSize: isMobile ? '0.8rem' : '0.85rem',
                          }}
                        >
                          <FaTarget className='me-1' /> Edit Goals
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </FadeIn>
              </Col>
            </Row>
          </>
        ) : (
          /* Empty State for Charts */
          <Row className='mb-3'>
            <Col xs={12}>
              <FadeIn delay={0.6}>
                <Card style={cardStyle} className='mb-3'>
                  <Card.Body
                    style={{
                      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
                      textAlign: 'center',
                    }}
                  >
                    <FaChartLine
                      size={48}
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
                        fontSize: isMobile ? '1.3rem' : '1.5rem',
                      }}
                    >
                      Analytics Coming Soon
                    </h4>
                    <p
                      style={{
                        color: amoledColors.textMuted,
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        marginBottom: '2rem',
                        lineHeight: '1.5',
                        maxWidth: '500px',
                        margin: '0 auto 2rem',
                      }}
                    >
                      Start logging your meals to see detailed analytics, weekly
                      trends, and goal progress. Your nutrition journey begins
                      with your first meal entry!
                    </p>
                    <div className='d-flex flex-column flex-sm-row gap-3 justify-content-center align-items-center'>
                      <LinkContainer to='/add-diet-entry'>
                        <Button
                          variant='primary'
                          size={isMobile ? 'sm' : 'md'}
                          style={{
                            backgroundColor: amoledColors.accent,
                            borderColor: amoledColors.accent,
                            padding: isMobile
                              ? '0.6rem 1.5rem'
                              : '0.75rem 2rem',
                          }}
                        >
                          <FaPlus className='me-2' />
                          Start Tracking
                        </Button>
                      </LinkContainer>
                      <Button
                        variant='outline-primary'
                        size={isMobile ? 'sm' : 'md'}
                        onClick={() => setShowGoalModal(true)}
                        style={{
                          borderColor: amoledColors.accent,
                          color: amoledColors.accent,
                          padding: isMobile ? '0.6rem 1.5rem' : '0.75rem 2rem',
                        }}
                      >
                        <FaTarget className='me-2' />
                        Set Goals
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </FadeIn>
            </Col>
          </Row>
        )}

        {/* Full Width Meal Timeline at Bottom */}
        <Row>
          <Col xs={12}>
            <FadeIn delay={0.8}>
              <Card style={cardStyle} className='mb-3'>
                <Card.Header
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: isMobile ? '1rem 1rem 0' : '1.5rem 1.5rem 0',
                  }}
                >
                  <div className='d-flex justify-content-between align-items-center'>
                    <h5
                      style={{
                        color: amoledColors.text,
                        margin: 0,
                        fontSize: isMobile ? '1rem' : '1.1rem',
                      }}
                    >
                      <FaBars className='me-2' />
                      Meal Timeline
                    </h5>
                    <LinkContainer to='/add-diet-entry'>
                      <Button
                        variant='primary'
                        size='sm'
                        style={{
                          backgroundColor: amoledColors.accent,
                          borderColor: amoledColors.accent,
                          padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                          fontSize: isMobile ? '0.8rem' : '0.9rem',
                        }}
                      >
                        <FaPlus className='me-1' /> Log Meal
                      </Button>
                    </LinkContainer>
                  </div>
                </Card.Header>
                <Card.Body style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
                  {Object.entries(mealsByDay).length > 0 ? (
                    Object.entries(mealsByDay)
                      .sort((a, b) => new Date(b[0]) - new Date(a[0])) // Sort by date descending
                      .map(([dateKey, dayData]) => {
                        const isExpanded = expandedDays.has(dateKey);
                        const dayLabel = getDayLabel(dayData.date);
                        const hasMeals = dayData.meals.length > 0;

                        return (
                          <div key={dateKey} className='mb-3'>
                            {/* Day Header */}
                            <div
                              onClick={() => toggleDayExpansion(dayData.date)}
                              style={{
                                padding: isMobile ? '0.75rem' : '1rem',
                                borderRadius: '12px',
                                background: isDarkMode
                                  ? isToday(dayData.date)
                                    ? 'linear-gradient(135deg, #1a3a1a 0%, #2d5a2d 100%)'
                                    : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
                                  : isToday(dayData.date)
                                  ? 'linear-gradient(135deg, #f0f9ff 0%, #dcfce7 100%)'
                                  : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                border: `1px solid ${
                                  isToday(dayData.date)
                                    ? amoledColors.chartColors.green
                                    : amoledColors.border
                                }`,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                marginBottom: isExpanded ? '0.75rem' : '0',
                              }}
                            >
                              <Row className='align-items-center'>
                                <Col>
                                  <div className='d-flex align-items-center'>
                                    <div className='me-2'>
                                      {isExpanded ? (
                                        <FaChevronUp size={12} />
                                      ) : (
                                        <FaChevronDown size={12} />
                                      )}
                                    </div>
                                    <div>
                                      <h6
                                        style={{
                                          color: amoledColors.text,
                                          margin: 0,
                                          fontWeight: 'bold',
                                          fontSize: isMobile
                                            ? '0.9rem'
                                            : '1rem',
                                        }}
                                      >
                                        {dayLabel}
                                        {isToday(dayData.date) && (
                                          <Badge
                                            bg='success'
                                            className='ms-2'
                                            style={{
                                              fontSize: isMobile
                                                ? '0.6rem'
                                                : '0.7rem',
                                            }}
                                          >
                                            Live
                                          </Badge>
                                        )}
                                      </h6>
                                      <small
                                        style={{
                                          color: amoledColors.textMuted,
                                          fontSize: isMobile
                                            ? '0.7rem'
                                            : '0.8rem',
                                        }}
                                      >
                                        {format(
                                          dayData.date,
                                          isMobile
                                            ? 'MMM d, yyyy'
                                            : 'EEEE, MMMM d, yyyy'
                                        )}
                                      </small>
                                    </div>
                                  </div>
                                </Col>
                                <Col xs='auto'>
                                  <Row className='g-2 text-center'>
                                    <Col>
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '0.8rem'
                                            : '0.9rem',
                                          fontWeight: 'bold',
                                          color:
                                            amoledColors.chartColors.orange,
                                        }}
                                      >
                                        {Math.round(dayData.totals.calories)}
                                      </div>
                                      <small
                                        style={{
                                          color: amoledColors.textMuted,
                                          fontSize: isMobile
                                            ? '0.6rem'
                                            : '0.7rem',
                                        }}
                                      >
                                        cal
                                      </small>
                                    </Col>
                                    <Col>
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '0.8rem'
                                            : '0.9rem',
                                          fontWeight: 'bold',
                                          color: amoledColors.chartColors.green,
                                        }}
                                      >
                                        {Math.round(dayData.totals.protein)}g
                                      </div>
                                      <small
                                        style={{
                                          color: amoledColors.textMuted,
                                          fontSize: isMobile
                                            ? '0.6rem'
                                            : '0.7rem',
                                        }}
                                      >
                                        protein
                                      </small>
                                    </Col>
                                    <Col>
                                      <div
                                        style={{
                                          fontSize: isMobile
                                            ? '0.8rem'
                                            : '0.9rem',
                                          fontWeight: 'bold',
                                          color: amoledColors.chartColors.blue,
                                        }}
                                      >
                                        {dayData.meals.length}
                                      </div>
                                      <small
                                        style={{
                                          color: amoledColors.textMuted,
                                          fontSize: isMobile
                                            ? '0.6rem'
                                            : '0.7rem',
                                        }}
                                      >
                                        meals
                                      </small>
                                    </Col>
                                  </Row>
                                </Col>
                              </Row>

                              {/* Progress bars for the day */}
                              <Row className='mt-2'>
                                <Col md={6}>
                                  <div className='d-flex justify-content-between align-items-center mb-1'>
                                    <small
                                      style={{
                                        color: amoledColors.textMuted,
                                        fontSize: isMobile
                                          ? '0.6rem'
                                          : '0.7rem',
                                      }}
                                    >
                                      Calories Goal
                                    </small>
                                    <small
                                      style={{
                                        color: amoledColors.textMuted,
                                        fontSize: isMobile
                                          ? '0.6rem'
                                          : '0.7rem',
                                      }}
                                    >
                                      {getGoalPercentage(
                                        dayData.totals.calories,
                                        nutritionGoals.calories
                                      )}
                                      %
                                    </small>
                                  </div>
                                  <ProgressBar
                                    now={getGoalPercentage(
                                      dayData.totals.calories,
                                      nutritionGoals.calories
                                    )}
                                    variant='warning'
                                    style={{ height: '4px' }}
                                  />
                                </Col>
                                <Col md={6}>
                                  <div className='d-flex justify-content-between align-items-center mb-1'>
                                    <small
                                      style={{
                                        color: amoledColors.textMuted,
                                        fontSize: isMobile
                                          ? '0.6rem'
                                          : '0.7rem',
                                      }}
                                    >
                                      Protein Goal
                                    </small>
                                    <small
                                      style={{
                                        color: amoledColors.textMuted,
                                        fontSize: isMobile
                                          ? '0.6rem'
                                          : '0.7rem',
                                      }}
                                    >
                                      {getGoalPercentage(
                                        dayData.totals.protein,
                                        nutritionGoals.protein
                                      )}
                                      %
                                    </small>
                                  </div>
                                  <ProgressBar
                                    now={getGoalPercentage(
                                      dayData.totals.protein,
                                      nutritionGoals.protein
                                    )}
                                    variant='success'
                                    style={{ height: '4px' }}
                                  />
                                </Col>
                              </Row>
                            </div>

                            {/* Expanded Meals */}
                            <Collapse in={isExpanded}>
                              <div>
                                {hasMeals ? (
                                  <div
                                    style={{
                                      paddingLeft: isMobile ? '0' : '1rem',
                                    }}
                                  >
                                    {dayData.meals.map((meal, mealIndex) => (
                                      <MealTimelineCard
                                        key={meal._id}
                                        meal={meal}
                                        amoledColors={amoledColors}
                                        isDarkMode={isDarkMode}
                                        onUpdate={refetch}
                                        onDelete={refetch}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      padding: isMobile
                                        ? '1.5rem 1rem'
                                        : '2rem',
                                      textAlign: 'center',
                                      color: amoledColors.textMuted,
                                      marginLeft: isMobile ? '0' : '2rem',
                                    }}
                                  >
                                    <FaUtensils
                                      size={20}
                                      style={{
                                        marginBottom: '0.5rem',
                                        opacity: 0.5,
                                      }}
                                    />
                                    <p
                                      style={{
                                        margin: '0 0 0.5rem',
                                        fontSize: isMobile
                                          ? '0.8rem'
                                          : '0.9rem',
                                      }}
                                    >
                                      No meals logged this day
                                    </p>
                                    <LinkContainer to='/add-diet-entry'>
                                      <Button
                                        variant='outline-success'
                                        size='sm'
                                        style={{
                                          fontSize: isMobile
                                            ? '0.75rem'
                                            : '0.8rem',
                                        }}
                                      >
                                        Log a Meal
                                      </Button>
                                    </LinkContainer>
                                  </div>
                                )}
                              </div>
                            </Collapse>
                          </div>
                        );
                      })
                  ) : (
                    <div
                      className='text-center'
                      style={{ padding: isMobile ? '2rem 1rem' : '3rem 2rem' }}
                    >
                      <FaUtensils
                        size={isMobile ? 40 : 48}
                        style={{
                          color: amoledColors.textMuted,
                          opacity: 0.5,
                          marginBottom: '1rem',
                        }}
                      />
                      <h4
                        style={{
                          color: amoledColors.text,
                          marginBottom: '1rem',
                          fontSize: isMobile ? '1.3rem' : '1.5rem',
                        }}
                      >
                        No Meals Logged Yet
                      </h4>
                      <p
                        style={{
                          color: amoledColors.textMuted,
                          marginBottom: '1.5rem',
                          fontSize: isMobile ? '0.9rem' : '1rem',
                          lineHeight: '1.5',
                          maxWidth: '400px',
                          margin: '0 auto 1.5rem',
                        }}
                      >
                        Start your nutrition journey by logging your first meal.
                        Track what you eat, monitor your progress, and achieve
                        your health goals.
                      </p>
                      <LinkContainer to='/add-diet-entry'>
                        <Button
                          variant='primary'
                          size={isMobile ? 'md' : 'lg'}
                          style={{
                            backgroundColor: amoledColors.accent,
                            borderColor: amoledColors.accent,
                            padding: isMobile ? '0.75rem 2rem' : '1rem 2.5rem',
                            fontSize: isMobile ? '0.9rem' : '1rem',
                          }}
                        >
                          <FaPlus className='me-2' /> Log Your First Meal
                        </Button>
                      </LinkContainer>
                    </div>
                  )}

                  {/* Load More Button for Monthly View */}
                  {viewMode === 'monthly' &&
                    Object.keys(mealsByDay).length > 0 && (
                      <div
                        className='text-center py-3'
                        style={{
                          borderTop: `1px solid ${amoledColors.border}`,
                        }}
                      >
                        <Button
                          variant='outline-primary'
                          size='sm'
                          onClick={() => setMonthsToLoad((prev) => prev + 1)}
                          style={{
                            borderColor: amoledColors.accent,
                            color: amoledColors.accent,
                            backgroundColor: 'transparent',
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                          }}
                        >
                          <FaChevronDown className='me-2' />
                          Load Previous Month
                        </Button>
                        <div className='mt-2'>
                          <small
                            style={{
                              color: amoledColors.textMuted,
                              fontSize: isMobile ? '0.7rem' : '0.8rem',
                            }}
                          >
                            Showing {monthsToLoad} month
                            {monthsToLoad > 1 ? 's' : ''} of data
                          </small>
                        </div>
                      </div>
                    )}
                </Card.Body>
              </Card>
            </FadeIn>
          </Col>
        </Row>

        {/* Nutrition Goals Modal */}
        <Modal
          show={showGoalModal}
          onHide={() => setShowGoalModal(false)}
          centered
        >
          <Modal.Header
            closeButton
            style={{
              backgroundColor: amoledColors.cardBg,
              color: amoledColors.text,
            }}
          >
            <Modal.Title>Edit Nutrition Goals</Modal.Title>
          </Modal.Header>
          <Modal.Body
            style={{
              backgroundColor: amoledColors.cardBg,
              color: amoledColors.text,
            }}
          >
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className='mb-3'>
                    <Form.Label>Daily Calories</Form.Label>
                    <Form.Control
                      type='number'
                      value={nutritionGoals.calories}
                      onChange={(e) =>
                        setNutritionGoals({
                          ...nutritionGoals,
                          calories: parseInt(e.target.value),
                        })
                      }
                    />
                  </Form.Group>
                  <Form.Group className='mb-3'>
                    <Form.Label>Protein (g)</Form.Label>
                    <Form.Control
                      type='number'
                      value={nutritionGoals.protein}
                      onChange={(e) =>
                        setNutritionGoals({
                          ...nutritionGoals,
                          protein: parseInt(e.target.value),
                        })
                      }
                    />
                  </Form.Group>
                  <Form.Group className='mb-3'>
                    <Form.Label>Fiber (g)</Form.Label>
                    <Form.Control
                      type='number'
                      value={nutritionGoals.fiber}
                      onChange={(e) =>
                        setNutritionGoals({
                          ...nutritionGoals,
                          fiber: parseInt(e.target.value),
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className='mb-3'>
                    <Form.Label>Carbs (g)</Form.Label>
                    <Form.Control
                      type='number'
                      value={nutritionGoals.carbs}
                      onChange={(e) =>
                        setNutritionGoals({
                          ...nutritionGoals,
                          carbs: parseInt(e.target.value),
                        })
                      }
                    />
                  </Form.Group>
                  <Form.Group className='mb-3'>
                    <Form.Label>Fat (g)</Form.Label>
                    <Form.Control
                      type='number'
                      value={nutritionGoals.fat}
                      onChange={(e) =>
                        setNutritionGoals({
                          ...nutritionGoals,
                          fat: parseInt(e.target.value),
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: amoledColors.cardBg }}>
            <Button variant='secondary' onClick={() => setShowGoalModal(false)}>
              Cancel
            </Button>
            <Button
              variant='primary'
              onClick={() => setShowGoalModal(false)}
              style={{
                backgroundColor: amoledColors.accent,
                borderColor: amoledColors.accent,
              }}
            >
              Save Goals
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </AnimatedScreenWrapper>
  );
};

export default DietDashboardScreen;
