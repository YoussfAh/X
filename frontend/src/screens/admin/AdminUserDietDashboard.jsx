import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  ProgressBar,
  ButtonGroup,
  ToggleButton,
  Collapse,
} from 'react-bootstrap';
import {
  FaUtensils,
  FaChartLine,
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
  FaArrowLeft,
  FaUser,
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
import { useGetAdminUserDietEntriesQuery } from '../../slices/dietApiSlice';
import { useGetUserDetailsQuery } from '../../slices/usersApiSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import Meta from '../../components/Meta';
import MealTimelineCard from '../../components/MealTimelineCard';
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
// Import animation components
import AnimatedScreenWrapper from '../../components/animations/AnimatedScreenWrapper';
import FadeIn from '../../components/animations/FadeIn';
import StaggeredList from '../../components/animations/StaggeredList';

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

const AdminUserDietDashboard = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // View mode state
  const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'
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

  // Fetch user details
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useGetUserDetailsQuery(userId);

  // Fetch diet entries
  const {
    data: dietData,
    isLoading,
    error,
    refetch,
  } = useGetAdminUserDietEntriesQuery({
    userId,
    startDate,
    endDate,
    limit: 500,
  });

  const dietEntries = dietData?.dietEntries || [];

  // Reset monthsToLoad when switching view modes
  useEffect(() => {
    if (viewMode !== 'monthly') {
      setMonthsToLoad(1);
    }
  }, [viewMode]);

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
    marginBottom: '1.5rem',
  };

  const headerCardStyle = {
    ...cardStyle,
    background: isDarkMode
      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    border: isDarkMode
      ? `2px solid ${amoledColors.chartColors.blue}`
      : '2px solid #3b82f6',
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

  // Calculate today's progress
  const todaysProgress = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysEntries = dietEntries.filter(
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

  // Calculate nutrition streak
  const calculateNutritionStreak = useMemo(() => {
    if (!dietEntries || dietEntries.length === 0) return 0;

    // Sort entries by date (newest first)
    const sortedEntries = [...dietEntries].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // Group by date and check if each day meets minimum meal requirement (2 meals)
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

  // Nutrition goals (admin can view but not edit)
  const nutritionGoals = {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    fiber: 25,
  };

  // Weekly nutrition data for chart
  const weeklyNutritionData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayEntries = dietEntries.filter(
        (entry) => format(new Date(entry.date), 'yyyy-MM-dd') === dateKey
      );

      const totals = dayEntries.reduce(
        (acc, entry) => {
          acc.calories += entry.calories || 0;
          acc.protein += entry.protein || 0;
          acc.carbs += entry.carbs || 0;
          acc.fat += entry.fat || 0;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      days.push({
        day: format(date, 'EEE'),
        date: dateKey,
        ...totals,
      });
    }

    return {
      labels: days.map((d) => d.day),
      datasets: [
        {
          label: 'Calories',
          data: days.map((d) => Math.round(d.calories)),
          backgroundColor: amoledColors.chartColors.orange,
          borderColor: amoledColors.chartColors.orange,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Protein (g)',
          data: days.map((d) => Math.round(d.protein)),
          backgroundColor: amoledColors.chartColors.green,
          borderColor: amoledColors.chartColors.green,
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };
  }, [dietEntries, amoledColors]);

  // Meal type distribution
  const mealTypeDistribution = useMemo(() => {
    const mealTypes = {};
    dietEntries.forEach((entry) => {
      const type = entry.mealType || 'other';
      mealTypes[type] = (mealTypes[type] || 0) + 1;
    });

    return {
      labels: Object.keys(mealTypes).map(
        (type) => type.charAt(0).toUpperCase() + type.slice(1)
      ),
      datasets: [
        {
          data: Object.values(mealTypes),
          backgroundColor: [
            amoledColors.chartColors.orange,
            amoledColors.chartColors.green,
            amoledColors.chartColors.blue,
            amoledColors.chartColors.purple,
            amoledColors.chartColors.cyan,
          ],
        },
      ],
    };
  }, [dietEntries, amoledColors]);

  // Get goal percentage
  const getGoalPercentage = (current, goal) => {
    return Math.min((current / goal) * 100, 100);
  };

  // Toggle day expansion
  const toggleDayExpansion = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDays(newExpanded);
  };

  // Handle date navigation
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

  // Get date range label
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
    if (!dietEntries) return {};

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

    dietEntries.forEach((entry) => {
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

  if (userLoading || isLoading) return <Loader />;
  if (userError || error)
    return <Message variant='danger'>Error loading data</Message>;

  return (
    <AnimatedScreenWrapper>
      <Meta title={`Diet Dashboard - ${user?.name}`} />
      <Container className={isMobile ? 'px-1' : 'px-2'}>
        {/* Header Section */}
        <FadeIn delay={0.1}>
          <Card style={headerCardStyle} className='mb-4'>
            <Card.Body className='text-center py-4 position-relative'>
              <div className='d-flex align-items-center justify-content-center mb-3'>
                <FaUser
                  size={isMobile ? 32 : 40}
                  style={{
                    color: amoledColors.chartColors.blue,
                    marginRight: '1rem',
                  }}
                />
                <div>
                  <h1
                    className='mb-0'
                    style={{
                      fontSize: isMobile ? '1.8rem' : '2.5rem',
                      fontWeight: '700',
                      color: amoledColors.text,
                    }}
                  >
                    {user?.name}'s Diet Dashboard
                  </h1>
                  <p
                    className='mb-0'
                    style={{
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      color: amoledColors.textSecondary,
                    }}
                  >
                    Admin View • {user?.email}
                  </p>
                </div>
              </div>
              <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                <Button
                  variant='outline-light'
                  size='sm'
                  onClick={() => navigate('/admin/userlist')}
                  style={{
                    borderColor: amoledColors.text,
                    color: amoledColors.text,
                  }}
                  title='Back to Users'
                >
                  <FaArrowLeft size={12} />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </FadeIn>

        {/* View Mode and Date Selector */}
        <FadeIn delay={0.2}>
          <Card style={cardStyle} className='mb-4'>
            <Card.Body className='py-3'>
              <Row className='align-items-center'>
                <Col md={4}>
                  <ButtonGroup className='w-100'>
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
                        }}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </ToggleButton>
                    ))}
                  </ButtonGroup>
                </Col>
                <Col
                  md={8}
                  className='d-flex justify-content-between align-items-center mt-3 mt-md-0'
                >
                  <Button
                    variant='outline-secondary'
                    onClick={() => handleDateChange(-1)}
                    style={{
                      borderColor: amoledColors.textMuted,
                      color: amoledColors.textMuted,
                    }}
                  >
                    <FaChevronLeft />
                  </Button>
                  <div className='text-center mx-3'>
                    <h5 className='mb-0' style={{ color: amoledColors.text }}>
                      {getDateRangeLabel()}
                    </h5>
                  </div>
                  <Button
                    variant='outline-secondary'
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
                    <FaChevronRight />
                  </Button>
                  <Button
                    variant='outline-info'
                    size='sm'
                    onClick={() => setSelectedDate(new Date())}
                    className='ms-3'
                  >
                    Today
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </FadeIn>

        {/* Top Row - Quick Stats */}
        <Row className='mb-4'>
          <Col lg={12}>
            <FadeIn delay={0.3}>
              <Card style={cardStyle} className='mb-4'>
                <Card.Header
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '1.5rem 1.5rem 0',
                  }}
                >
                  <h5 style={{ color: amoledColors.text, margin: 0 }}>
                    <FaBolt className='me-2' />
                    Today's Nutrition Overview
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row className='g-3'>
                    <Col xs={6} md={3}>
                      <div
                        className='text-center p-3 rounded'
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(255,255,255,0.05)'
                            : '#f8f9fa',
                        }}
                      >
                        <FaFire
                          size={24}
                          style={{
                            color: amoledColors.chartColors.orange,
                            marginBottom: '0.5rem',
                          }}
                        />
                        <div
                          style={{
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            color: amoledColors.text,
                            margin: '0.5rem 0',
                          }}
                        >
                          {Math.round(todaysProgress.calories)}
                        </div>
                        <small
                          style={{
                            color: amoledColors.textMuted,
                            fontSize: '0.8rem',
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
                        className='text-center p-3 rounded'
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(255,255,255,0.05)'
                            : '#f8f9fa',
                        }}
                      >
                        <FaEgg
                          size={24}
                          style={{
                            color: amoledColors.chartColors.green,
                            marginBottom: '0.5rem',
                          }}
                        />
                        <div
                          style={{
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            color: amoledColors.text,
                            margin: '0.5rem 0',
                          }}
                        >
                          {Math.round(todaysProgress.protein)}g
                        </div>
                        <small
                          style={{
                            color: amoledColors.textMuted,
                            fontSize: '0.8rem',
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
                        className='text-center p-3 rounded'
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(255,255,255,0.05)'
                            : '#f8f9fa',
                        }}
                      >
                        <FaCarrot
                          size={24}
                          style={{
                            color: amoledColors.chartColors.blue,
                            marginBottom: '0.5rem',
                          }}
                        />
                        <div
                          style={{
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            color: amoledColors.text,
                            margin: '0.5rem 0',
                          }}
                        >
                          {Math.round(todaysProgress.carbs)}g
                        </div>
                        <small
                          style={{
                            color: amoledColors.textMuted,
                            fontSize: '0.8rem',
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
                        className='text-center p-3 rounded'
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(255,255,255,0.05)'
                            : '#f8f9fa',
                        }}
                      >
                        <FaTrophy
                          size={24}
                          style={{
                            color: amoledColors.chartColors.purple,
                            marginBottom: '0.5rem',
                          }}
                        />
                        <div
                          style={{
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            color: amoledColors.text,
                            margin: '0.5rem 0',
                          }}
                        >
                          {calculateNutritionStreak}
                        </div>
                        <small
                          style={{
                            color: amoledColors.textMuted,
                            fontSize: '0.8rem',
                          }}
                        >
                          Day Streak
                        </small>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </FadeIn>
          </Col>
        </Row>

        {/* Charts Row */}
        <Row className='mb-4'>
          {/* Weekly Trends */}
          <Col md={8}>
            <FadeIn delay={0.4}>
              <Card style={cardStyle} className='mb-4'>
                <Card.Header
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '1.5rem 1.5rem 0',
                  }}
                >
                  <h5 style={{ color: amoledColors.text, margin: 0 }}>
                    <FaChartBar className='me-2' />
                    Weekly Nutrition Trends
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
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
                              font: { size: 12 },
                            },
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: {
                              color: amoledColors.textMuted,
                              font: { size: 12 },
                            },
                          },
                          x: {
                            grid: { color: amoledColors.border },
                            ticks: {
                              color: amoledColors.textMuted,
                              font: { size: 12 },
                            },
                          },
                        },
                        plugins: {
                          legend: {
                            labels: {
                              color: amoledColors.text,
                              font: { size: 14 },
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

          {/* Meal Distribution */}
          <Col md={4}>
            <FadeIn delay={0.5}>
              <Card style={cardStyle} className='mb-4'>
                <Card.Header
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '1.5rem 1.5rem 0',
                  }}
                >
                  <h5 style={{ color: amoledColors.text, margin: 0 }}>
                    <FaAppleAlt className='me-2' />
                    Meal Distribution
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '250px' }}>
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
                              font: { size: 10 },
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

        {/* Meal Timeline */}
        <Row className='mb-4'>
          <Col lg={12}>
            <FadeIn delay={0.6}>
              <Card style={cardStyle} className='mb-4'>
                <Card.Header
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '1.5rem 1.5rem 0',
                  }}
                >
                  <h5 style={{ color: amoledColors.text, margin: 0 }}>
                    <FaClock className='me-2' />
                    Meal Timeline
                  </h5>
                </Card.Header>
                <Card.Body>
                  {Object.keys(mealsByDay).length > 0 ? (
                    Object.entries(mealsByDay)
                      .sort(([a], [b]) => new Date(b) - new Date(a))
                      .map(([dateKey, dayData]) => {
                        const isExpanded = expandedDays.has(dateKey);
                        const hasMeals = dayData.meals.length > 0;
                        const dayLabel = getDayLabel(dayData.date);

                        return (
                          <div key={dateKey} style={{ marginBottom: '1rem' }}>
                            <div
                              className='p-3 rounded'
                              style={{
                                backgroundColor: isDarkMode
                                  ? 'rgba(255,255,255,0.03)'
                                  : 'rgba(0,0,0,0.03)',
                                border: `1px solid ${amoledColors.border}`,
                                cursor: 'pointer',
                              }}
                              onClick={() => toggleDayExpansion(dayData.date)}
                            >
                              <Row className='align-items-center'>
                                <Col>
                                  <div className='d-flex align-items-center'>
                                    <div className='me-3'>
                                      {isExpanded ? (
                                        <FaChevronUp size={14} />
                                      ) : (
                                        <FaChevronDown size={14} />
                                      )}
                                    </div>
                                    <div>
                                      <h6
                                        style={{
                                          color: amoledColors.text,
                                          margin: 0,
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        {dayLabel}
                                        {isToday(dayData.date) && (
                                          <Badge bg='success' className='ms-2'>
                                            Live
                                          </Badge>
                                        )}
                                      </h6>
                                      <small
                                        style={{
                                          color: amoledColors.textMuted,
                                        }}
                                      >
                                        {format(
                                          dayData.date,
                                          'EEEE, MMMM d, yyyy'
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
                                          fontSize: '0.9rem',
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
                                          fontSize: '0.7rem',
                                        }}
                                      >
                                        cal
                                      </small>
                                    </Col>
                                    <Col>
                                      <div
                                        style={{
                                          fontSize: '0.9rem',
                                          fontWeight: 'bold',
                                          color: amoledColors.chartColors.green,
                                        }}
                                      >
                                        {Math.round(dayData.totals.protein)}g
                                      </div>
                                      <small
                                        style={{
                                          color: amoledColors.textMuted,
                                          fontSize: '0.7rem',
                                        }}
                                      >
                                        protein
                                      </small>
                                    </Col>
                                    <Col>
                                      <div
                                        style={{
                                          fontSize: '0.9rem',
                                          fontWeight: 'bold',
                                          color: amoledColors.chartColors.blue,
                                        }}
                                      >
                                        {dayData.meals.length}
                                      </div>
                                      <small
                                        style={{
                                          color: amoledColors.textMuted,
                                          fontSize: '0.7rem',
                                        }}
                                      >
                                        meals
                                      </small>
                                    </Col>
                                  </Row>
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
                                      padding: '2rem',
                                      textAlign: 'center',
                                      color: amoledColors.textMuted,
                                      marginLeft: isMobile ? '0' : '2rem',
                                    }}
                                  >
                                    <FaUtensils
                                      size={24}
                                      style={{
                                        marginBottom: '0.5rem',
                                        opacity: 0.5,
                                      }}
                                    />
                                    <p
                                      style={{ margin: 0, fontSize: '0.9rem' }}
                                    >
                                      No meals logged this day
                                    </p>
                                  </div>
                                )}
                              </div>
                            </Collapse>
                          </div>
                        );
                      })
                  ) : (
                    <div className='text-center py-5'>
                      <FaUtensils size={40} className='mb-3 text-muted' />
                      <h4>No Meals Logged</h4>
                      <p className='text-muted'>
                        This user has no meal entries for this period.
                      </p>
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
                          onClick={() => setMonthsToLoad((prev) => prev + 1)}
                          style={{
                            borderColor: amoledColors.accent,
                            color: amoledColors.accent,
                            backgroundColor: 'transparent',
                          }}
                        >
                          <FaChevronDown className='me-2' />
                          Load Previous Month
                        </Button>
                        <div className='mt-2'>
                          <small style={{ color: amoledColors.textMuted }}>
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
      </Container>
    </AnimatedScreenWrapper>
  );
};

export default AdminUserDietDashboard;
