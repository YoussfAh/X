import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Modal,
  Form,
  Alert,
  InputGroup,
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import {
  FaDumbbell,
  FaSearch,
  FaFilter,
  FaChartBar,
  FaWeight,
  FaRunning,
  FaAngleDown,
  FaUser,
  FaCalendarAlt,
  FaFire,
  FaTrophy,
  FaExclamationTriangle,
  FaClock,
  FaArrowRight,
  FaEye,
  FaUtensils,
} from 'react-icons/fa';
import { useGetAllWorkoutEntriesQuery } from '../../slices/workoutApiSlice';
import { useGetUsersQuery } from '../../slices/usersApiSlice';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import WorkoutPaginate from '../../components/WorkoutPaginate';
import {
  format,
  subDays,
  differenceInDays,
  isSameDay,
  startOfWeek,

  isWithinInterval,
} from 'date-fns';
// Import animation components
import AnimatedScreenWrapper from '../../components/animations/AnimatedScreenWrapper';
import FadeIn from '../../components/animations/FadeIn';
import StaggeredList from '../../components/animations/StaggeredList';

const WorkoutTrackingScreen = () => {
  const { pageNumber = 1 } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Dark mode state detection
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  // Extract query params from URL
  const queryParams = new URLSearchParams(location.search);
  const keywordParam = queryParams.get('keyword') || '';
  const userParam = queryParams.get('user') || '';
  const productParam = queryParams.get('product') || '';

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState(keywordParam);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(keywordParam);
  const [filterUser, setFilterUser] = useState(userParam);
  const [filterProduct, setFilterProduct] = useState(productParam);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards' view mode
  const [showUserAnalytics, setShowUserAnalytics] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAnalyticsData, setUserAnalyticsData] = useState(null);
  // Add missing state variables
  const [sortBy, setSortBy] = useState('name');
  const [filterLevel, setFilterLevel] = useState('all');

  // User Analytics Pagination
  const [userAnalyticsPage, setUserAnalyticsPage] = useState(1);
  const [usersPerPage] = useState(10); // Fixed to 10, no longer changeable
  const [totalAnalyticsPages, setTotalAnalyticsPages] = useState(1);
  const [filteredAnalyticsData, setFilteredAnalyticsData] = useState([]);
  const [activityFilter, setActivityFilter] = useState('all'); // 'all', 'active', 'inactive', 'very-active'
  const [sortField, setSortField] = useState('lastWorkout'); // 'name', 'lastWorkout', 'totalWorkouts', 'currentStreak'
  const [sortDirection, setSortDirection] = useState('desc');

  // Add search functionality for User Analytics
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');

  // Responsive design state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Get all workout entries with proper error handling
  const { data, isLoading, error, refetch } = useGetAllWorkoutEntriesQuery({
    pageNumber: Number(pageNumber),
    keyword: debouncedSearchTerm,
    user: filterUser,
    product: filterProduct,
  });

  // Get all users for analytics (including admin users)
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useGetUsersQuery({
    pageNumber: 1,
    ...(debouncedUserSearch && { keyword: debouncedUserSearch }), // Only include keyword when searching
    role: 'all', // Ensure we get all roles
    codeAccess: 'all', // Ensure we get all access types
    skipPagination: true, // Skip pagination to get all users
    pageSize: 1000, // Set a high page size as backup
  });

  // Debounce search to prevent API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce user search to prevent API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  // Update URL when filters change
  useEffect(() => {
    // Create query string with active filters
    const params = new URLSearchParams();

    if (debouncedSearchTerm) params.append('keyword', debouncedSearchTerm);
    if (filterUser) params.append('user', filterUser);
    if (filterProduct) params.append('product', filterProduct);

    const queryString = params.toString();
    const newPath = queryString
      ? `/admin/workouts${
          pageNumber > 1 ? `/page/${pageNumber}` : ''
        }?${queryString}`
      : `/admin/workouts${pageNumber > 1 ? `/page/${pageNumber}` : ''}`;

    // Only navigate if the URL would change
    if (location.pathname + location.search !== newPath) {
      navigate(newPath, { replace: true });
      refetch();
    }
  }, [
    debouncedSearchTerm,
    filterUser,
    filterProduct,
    pageNumber,
    navigate,
    location.pathname,
    location.search,
    refetch,
  ]);

  // Calculate user analytics when data changes
  useEffect(() => {
    if (data?.entries && usersData?.users) {
      calculateUserAnalytics();
    }
  }, [data, usersData]);

  // Handle responsive design changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter and sort user analytics data
  useEffect(() => {
    if (userAnalyticsData && userAnalyticsData.length > 0) {
      let filtered = [...userAnalyticsData];

      // Apply search filter first
      if (debouncedUserSearch) {
        const searchLower = debouncedUserSearch.toLowerCase();
        filtered = filtered.filter((user) => {
          const userName = user.user.name?.toLowerCase() || '';
          const userEmail = user.user.email?.toLowerCase() || '';
          const userId = user.user._id?.toLowerCase() || '';

          return (
            userName.includes(searchLower) ||
            userEmail.includes(searchLower) ||
            userId.includes(searchLower)
          );
        });
      }

      // Apply activity filter
      if (activityFilter !== 'all') {
        filtered = filtered.filter((user) => {
          switch (activityFilter) {
            case 'very-active':
              return user.activityLevel === 'Very Active';
            case 'active':
              return user.activityLevel === 'Active';
            case 'inactive':
              return (
                user.activityLevel === 'Inactive' ||
                user.activityLevel === 'Low Activity'
              );
            case 'never-active':
              return user.activityLevel === 'Never Active';
            default:
              return true;
          }
        });
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
          case 'name':
            aValue = a.user.name.toLowerCase();
            bValue = b.user.name.toLowerCase();
            break;
          case 'totalWorkouts':
            aValue = a.totalWorkouts;
            bValue = b.totalWorkouts;
            break;
          case 'currentStreak':
            aValue = a.currentStreak;
            bValue = b.currentStreak;
            break;
          case 'lastWorkout':
            aValue = a.lastWorkout ? new Date(a.lastWorkout).getTime() : 0;
            bValue = b.lastWorkout ? new Date(b.lastWorkout).getTime() : 0;
            break;
          case 'weeklyConsistency':
            aValue = a.weeklyConsistency;
            bValue = b.weeklyConsistency;
            break;
          default:
            aValue = a.daysSinceLastWorkout || 9999;
            bValue = b.daysSinceLastWorkout || 9999;
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      setFilteredAnalyticsData(filtered);
      setTotalAnalyticsPages(Math.ceil(filtered.length / usersPerPage));

      // Reset to page 1 if current page is beyond available pages
      if (userAnalyticsPage > Math.ceil(filtered.length / usersPerPage)) {
        setUserAnalyticsPage(1);
      }
    }
  }, [
    userAnalyticsData,
    activityFilter,
    sortField,
    sortDirection,
    usersPerPage,
    userAnalyticsPage,
    debouncedUserSearch,
  ]);

  // Get paginated analytics data
  const getPaginatedAnalyticsData = () => {
    const startIndex = (userAnalyticsPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredAnalyticsData.slice(startIndex, endIndex);
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Calculate comprehensive user analytics
  const calculateUserAnalytics = () => {
    if (!data?.entries || !usersData?.users) return;

    const userAnalytics = usersData.users.map((user) => {
      const userWorkouts = data.entries.filter(
        (entry) => entry.user?._id === user._id
      );

      // Basic stats
      const totalWorkouts = userWorkouts.length;
      const totalSets = userWorkouts.reduce(
        (sum, workout) => sum + (workout.sets?.length || 0),
        0
      );
      const totalVolume = userWorkouts.reduce(
        (sum, workout) =>
          sum +
          (workout.sets?.reduce(
            (setSum, set) => setSum + (set.weight || 0) * (set.reps || 0),
            0
          ) || 0),
        0
      );

      // Last workout date
      const lastWorkout =
        userWorkouts.length > 0
          ? new Date(Math.max(...userWorkouts.map((w) => new Date(w.date))))
          : null;

      // Days since last workout
      const daysSinceLastWorkout = lastWorkout
        ? differenceInDays(new Date(), lastWorkout)
        : null;

      // Current streak calculation
      let currentStreak = 0;
      if (userWorkouts.length > 0) {
        const sortedWorkouts = [...userWorkouts].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        const mostRecentWorkout = sortedWorkouts[0];
        const mostRecentDate = new Date(mostRecentWorkout.date);
        const today = new Date();

        if (differenceInDays(today, mostRecentDate) <= 1) {
          currentStreak = 1;
          let currentDate = mostRecentDate;

          for (let i = 1; i < sortedWorkouts.length; i++) {
            const workoutDate = new Date(sortedWorkouts[i].date);

            if (isSameDay(workoutDate, currentDate)) {
              continue;
            }

            if (differenceInDays(currentDate, workoutDate) === 1) {
              currentStreak++;
              currentDate = workoutDate;
            } else {
              break;
            }
          }
        }
      }

      // Weekly consistency (last 4 weeks)
      const fourWeeksAgo = subDays(new Date(), 28);
      const recentWorkouts = userWorkouts.filter(
        (workout) => new Date(workout.date) >= fourWeeksAgo
      );
      const weeklyConsistency = recentWorkouts.length / 4; // Average workouts per week

      // Activity level classification
      let activityLevel = 'Inactive';
      let activityColor = isDarkMode ? '#ef4444' : '#dc2626';

      if (daysSinceLastWorkout === null) {
        activityLevel = 'Never Active';
        activityColor = isDarkMode ? '#6b7280' : '#374151';
      } else if (daysSinceLastWorkout <= 2) {
        activityLevel = 'Very Active';
        activityColor = isDarkMode ? '#22c55e' : '#16a34a';
      } else if (daysSinceLastWorkout <= 7) {
        activityLevel = 'Active';
        activityColor = isDarkMode ? '#eab308' : '#ca8a04';
      } else if (daysSinceLastWorkout <= 14) {
        activityLevel = 'Low Activity';
        activityColor = isDarkMode ? '#f97316' : '#ea580c';
      }

      // Progress trend (comparing last 2 weeks to previous 2 weeks)
      const twoWeeksAgo = subDays(new Date(), 14);
      const fourWeeksAgoDate = subDays(new Date(), 28);

      const lastTwoWeeksWorkouts = userWorkouts.filter(
        (workout) => new Date(workout.date) >= twoWeeksAgo
      ).length;

      const previousTwoWeeksWorkouts = userWorkouts.filter((workout) => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= fourWeeksAgoDate && workoutDate < twoWeeksAgo;
      }).length;

      let progressTrend = 'Stable';
      let trendIcon = '→';
      let trendColor = isDarkMode ? '#6b7280' : '#374151';

      if (lastTwoWeeksWorkouts > previousTwoWeeksWorkouts) {
        progressTrend = 'Improving';
        trendIcon = '↗';
        trendColor = isDarkMode ? '#22c55e' : '#16a34a';
      } else if (lastTwoWeeksWorkouts < previousTwoWeeksWorkouts) {
        progressTrend = 'Declining';
        trendIcon = '↘';
        trendColor = isDarkMode ? '#ef4444' : '#dc2626';
      }

      return {
        user,
        totalWorkouts,
        totalSets,
        totalVolume: Math.round(totalVolume),
        lastWorkout,
        daysSinceLastWorkout,
        currentStreak,
        weeklyConsistency: Math.round(weeklyConsistency * 10) / 10,
        activityLevel,
        activityColor,
        progressTrend,
        trendIcon,
        trendColor,
        lastTwoWeeksWorkouts,
        previousTwoWeeksWorkouts,
      };
    });

    // Sort by activity level and last workout date
    userAnalytics.sort((a, b) => {
      if (a.daysSinceLastWorkout === null && b.daysSinceLastWorkout === null)
        return 0;
      if (a.daysSinceLastWorkout === null) return 1;
      if (b.daysSinceLastWorkout === null) return -1;
      return a.daysSinceLastWorkout - b.daysSinceLastWorkout;
    });

    setUserAnalyticsData(userAnalytics);
  };

  // Show user details modal
  const showUserDetails = (userAnalytics) => {
    setSelectedUser(userAnalytics);
    setShowUserAnalytics(true);
  };

  // Extracting entries from the paginated response
  const entries = data?.entries || [];

  // Use global stats from API response or fallback to default values
  const globalStats = data?.globalStats || {
    totalWorkouts: 0,
    totalSets: 0,
    totalWeight: 0,
    avgReps: 0,
  };

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDarkMode(
            document.documentElement.getAttribute('data-theme') === 'dark'
          );
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Use entries directly from the API response
  const filteredEntries = entries;

  // Get unique users and products for the filter dropdowns
  const uniqueUsers = entries
    ? [...new Set(entries.map((entry) => entry.user?.name))].filter(Boolean)
    : [];
  const uniqueProducts = entries
    ? [...new Set(entries.map((entry) => entry.product?.name))].filter(Boolean)
    : [];

  // Enhanced AMOLED theme colors
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

  // Additional style variables for compatibility
  const textColor = amoledColors.text;
  const secondaryTextColor = amoledColors.textSecondary;
  const borderColor = amoledColors.border;
  const accentPurple = amoledColors.accent;
  const tableRowBg = isDarkMode ? '#0D0D0D' : 'transparent';
  const hoverBackground = isDarkMode ? '#1A1A1A' : '#F8FAFC';

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

  // Function to style based on feeling
  const getFeelingStyling = (feeling) => {
    switch (feeling) {
      case 'easy':
        return {
          background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5',
          color: isDarkMode ? '#4ade80' : '#065f46',
          padding: '0.35rem 0.75rem',
          fontWeight: '500',
        };
      case 'moderate':
        return {
          background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe',
          color: isDarkMode ? '#60a5fa' : '#1e40af',
          padding: '0.35rem 0.75rem',
          fontWeight: '500',
        };
      case 'hard':
        return {
          background: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
          color: isDarkMode ? '#fcd34d' : '#92400e',
          padding: '0.35rem 0.75rem',
          fontWeight: '500',
        };
      case 'extreme':
        return {
          background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
          color: isDarkMode ? '#f87171' : '#b91c1c',
          padding: '0.35rem 0.75rem',
          fontWeight: '500',
        };
      default:
        return {
          background: isDarkMode ? 'rgba(107, 114, 128, 0.3)' : '#f3f4f6',
          color: isDarkMode ? '#d1d5db' : '#374151',
          padding: '0.35rem 0.75rem',
          fontWeight: '500',
        };
    }
  };

  const tableStyle = {
    backgroundColor: 'transparent',
    color: amoledColors.text,
    borderColor: amoledColors.border,
  };

  const headerCellStyle = {
    backgroundColor: amoledColors.headerBg,
    color: amoledColors.textSecondary,
    fontWeight: '600',
    borderColor: amoledColors.border,
    fontSize: '0.875rem',
    padding: '1rem 0.75rem',
    letterSpacing: '0.025em',
  };

  const cellStyle = {
    borderColor: amoledColors.border,
    verticalAlign: 'middle',
    padding: '1rem 0.75rem',
    color: amoledColors.text,
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
    border: 'none',
    boxShadow: isDarkMode
      ? '0 4px 12px rgba(124, 77, 255, 0.3)'
      : '0 4px 12px rgba(157, 113, 219, 0.2)',
    transition: 'all 0.2s ease',
    padding: '0.5rem 1rem',
    fontWeight: '500',
  };

  const inputStyle = {
    backgroundColor: amoledColors.cardBg,
    color: amoledColors.text,
    borderColor: amoledColors.border,
    transition: 'all 0.2s ease',
    borderRadius: '0.5rem',
  };

  const statCardStyle = {
    ...cardStyle,
    height: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  // Render user analytics card for mobile
  const renderUserAnalyticsCard = (userStats) => (
    <Card
      key={userStats.user._id}
      style={{
        ...cardStyle,
        marginBottom: '1rem',
        border: `1px solid ${borderColor}`,
        transition: 'all 0.3s ease',
      }}
      className='user-analytics-card'
    >
      <Card.Body className='p-3'>
        <Row>
          <Col xs={12} className='mb-3'>
            <div className='d-flex align-items-center justify-content-between'>
              <div className='d-flex align-items-center'>
                <div
                  className='me-3 rounded-circle d-flex align-items-center justify-content-center'
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: isDarkMode
                      ? 'rgba(124, 77, 255, 0.2)'
                      : 'rgba(124, 77, 255, 0.1)',
                    color: accentPurple,
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                  }}
                >
                  {userStats.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h6
                    style={{ color: textColor, fontWeight: '600', margin: 0 }}
                  >
                    {userStats.user.name}
                    {userStats.user.isAdmin && (
                      <Badge
                        className='ms-2'
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(34, 197, 94, 0.2)'
                            : 'rgba(34, 197, 94, 0.1)',
                          color: '#22c55e',
                          fontSize: '0.65rem',
                          padding: '0.25rem 0.5rem',
                          border: `1px solid #22c55e30`,
                        }}
                      >
                        ADMIN
                      </Badge>
                    )}
                  </h6>
                  <small style={{ color: secondaryTextColor }}>
                    {userStats.totalWorkouts} workouts • {userStats.totalSets}{' '}
                    sets
                  </small>
                  {userStats.user.email && (
                    <div
                      style={{
                        color: secondaryTextColor,
                        fontSize: '0.75rem',
                        marginTop: '2px',
                      }}
                    >
                      {userStats.user.email}
                    </div>
                  )}
                </div>
              </div>
              <Badge
                pill
                style={{
                  backgroundColor: userStats.activityColor + '20',
                  color: userStats.activityColor,
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  border: `1px solid ${userStats.activityColor}30`,
                }}
              >
                {userStats.activityLevel}
              </Badge>
            </div>
          </Col>

          <Col xs={6} sm={4} className='mb-2'>
            <div className='text-center'>
              <div className='d-flex align-items-center justify-content-center mb-1'>
                <FaFire
                  style={{
                    color:
                      userStats.currentStreak > 0
                        ? '#f59e0b'
                        : secondaryTextColor,
                    fontSize: '1rem',
                    marginRight: '5px',
                  }}
                />
                <span
                  style={{
                    color:
                      userStats.currentStreak > 0
                        ? textColor
                        : secondaryTextColor,
                    fontWeight: '600',
                    fontSize: '1.1rem',
                  }}
                >
                  {userStats.currentStreak}
                </span>
              </div>
              <small style={{ color: secondaryTextColor }}>Day Streak</small>
            </div>
          </Col>

          <Col xs={6} sm={4} className='mb-2'>
            <div className='text-center'>
              <div
                style={{
                  color: textColor,
                  fontSize: '1.1rem',
                  fontWeight: '600',
                }}
              >
                {userStats.weeklyConsistency}
              </div>
              <small
                style={{
                  color:
                    userStats.weeklyConsistency >= 3
                      ? '#22c55e'
                      : userStats.weeklyConsistency >= 2
                      ? '#eab308'
                      : '#ef4444',
                }}
              >
                Per Week
              </small>
            </div>
          </Col>

          <Col xs={12} sm={4} className='mb-2'>
            <div className='text-center'>
              <div className='d-flex align-items-center justify-content-center mb-1'>
                <span
                  style={{
                    color: userStats.trendColor,
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    marginRight: '5px',
                  }}
                >
                  {userStats.trendIcon}
                </span>
                <span
                  style={{
                    color: userStats.trendColor,
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  {userStats.progressTrend}
                </span>
              </div>
              <small style={{ color: secondaryTextColor }}>
                {userStats.lastTwoWeeksWorkouts} vs{' '}
                {userStats.previousTwoWeeksWorkouts}
              </small>
            </div>
          </Col>

          <Col xs={12} className='mb-3'>
            <div
              style={{
                color: secondaryTextColor,
                fontSize: '0.85rem',
                textAlign: 'center',
              }}
            >
              Last workout:{' '}
              {userStats.lastWorkout ? (
                <span
                  style={{
                    color:
                      userStats.daysSinceLastWorkout <= 2
                        ? '#22c55e'
                        : userStats.daysSinceLastWorkout <= 7
                        ? '#eab308'
                        : '#ef4444',
                    fontWeight: '500',
                  }}
                >
                  {userStats.daysSinceLastWorkout === 0
                    ? 'Today'
                    : userStats.daysSinceLastWorkout === 1
                    ? 'Yesterday'
                    : `${userStats.daysSinceLastWorkout} days ago`}
                </span>
              ) : (
                <span style={{ fontStyle: 'italic' }}>Never</span>
              )}
            </div>
          </Col>

          <Col xs={12}>
            <div className='d-flex gap-2 justify-content-center'>
              <Button
                size='sm'
                variant='outline-primary'
                onClick={() => showUserDetails(userStats)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.8rem',
                  borderColor: accentPurple,
                  color: accentPurple,
                  backgroundColor: 'transparent',
                  flex: 1,
                }}
              >
                <FaEye className='me-1' />
                Details
              </Button>
              <LinkContainer
                to={`/admin/user-workout-dashboard/${userStats.user._id}`}
              >
                <Button
                  size='sm'
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.8rem',
                    ...buttonStyle,
                    flex: 0.5,
                  }}
                >
                  <FaDumbbell className='me-1' size={12} />
                  Workouts
                </Button>
              </LinkContainer>
              <LinkContainer
                to={`/admin/user-diet-dashboard/${userStats.user._id}`}
              >
                <Button
                  size='sm'
                  variant='outline-success'
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.8rem',
                    borderColor: isDarkMode ? '#34d399' : '#10b981',
                    color: isDarkMode ? '#34d399' : '#10b981',
                    backgroundColor: 'transparent',
                    flex: 0.5,
                  }}
                >
                  <FaUtensils className='me-1' size={12} />
                  Diet
                </Button>
              </LinkContainer>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  // Render pagination component
  const renderPagination = () => {
    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredAnalyticsData.length / usersPerPage);

    // Don't show pagination if there's only one page or no data
    if (totalPages <= 1) return null;

    return (
      <div className='d-flex justify-content-center align-items-center mt-4 mb-3'>
        <div className='d-flex align-items-center gap-2'>
          {/* Previous Button */}
          <Button
            variant='outline-secondary'
            size='sm'
            disabled={userAnalyticsPage === 1}
            onClick={() => setUserAnalyticsPage(userAnalyticsPage - 1)}
            style={{
              borderColor: borderColor,
              color: isDarkMode ? '#fff' : '#333',
              backgroundColor: 'transparent',
              padding: '0.375rem 0.75rem',
            }}
          >
            ← Previous
          </Button>

          {/* Page Info */}
          <span
            style={{
              color: textColor,
              fontSize: '0.9rem',
              margin: '0 1rem',
              fontWeight: '500',
            }}
          >
            Page {userAnalyticsPage} of {totalPages}
          </span>

          {/* Next Button */}
          <Button
            variant='outline-secondary'
            size='sm'
            disabled={userAnalyticsPage === totalPages}
            onClick={() => setUserAnalyticsPage(userAnalyticsPage + 1)}
            style={{
              borderColor: borderColor,
              color: isDarkMode ? '#fff' : '#333',
              backgroundColor: 'transparent',
              padding: '0.375rem 0.75rem',
            }}
          >
            Next →
          </Button>
        </div>
      </div>
    );
  };

  // Error message for the entire page
  if (error) {
    return (
      <Container fluid className='py-3 px-1'>
        <Message variant='danger'>
          {error?.data?.message ||
            error.error ||
            'Failed to load workout entries'}
        </Message>
      </Container>
    );
  }

  return (
    <AnimatedScreenWrapper isLoading={isLoading} error={error}>
      <Container
        fluid
        className='py-4 px-1'
        style={{
          backgroundColor: amoledColors.background,
          minHeight: '100vh',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Enhanced Header Section */}
        <Row className='mb-4'>
          <Col>
            <Card style={headerCardStyle} className='mb-4'>
              <Card.Body className={`${isMobile ? 'p-3' : 'p-4'}`}>
                <div className='text-center'>
                  <h1
                    className='mb-3 d-flex align-items-center justify-content-center'
                    style={{
                      color: amoledColors.text,
                      fontSize: isMobile ? '1.5rem' : '2.5rem',
                      fontWeight: '700',
                      textShadow: isDarkMode
                        ? '0 4px 8px rgba(168, 85, 247, 0.3)'
                        : '0 2px 4px rgba(0,0,0,0.1)',
                      marginBottom: isMobile ? '0.5rem' : '1rem',
                    }}
                  >
                    <FaDumbbell
                      className={`${isMobile ? 'me-2' : 'me-3'}`}
                      style={{ color: amoledColors.chartColors.purple }}
                      size={isMobile ? 20 : 24}
                    />
                    {isMobile ? 'Workout Analytics' : 'Admin Workout Analytics'}
                  </h1>

                  <div className='d-flex align-items-center justify-content-center gap-4 flex-wrap'>
                    <div
                      style={{
                        color: amoledColors.textSecondary,
                        fontSize: isMobile ? '0.85rem' : '1rem',
                        fontWeight: '500',
                        background: isDarkMode
                          ? 'rgba(96, 165, 250, 0.2)'
                          : 'rgba(59, 130, 246, 0.1)',
                        padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                        borderRadius: '15px',
                        border: isDarkMode
                          ? '1px solid rgba(96, 165, 250, 0.3)'
                          : '1px solid rgba(59, 130, 246, 0.3)',
                        textAlign: 'center',
                      }}
                    >
                      {isMobile
                        ? 'Monitor user workout progress'
                        : 'Monitor and analyze workout progress across all users'}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search & Filter Card */}
        <FadeIn>
          <Card style={cardStyle} className='mb-4'>
            <Card.Header
              style={{
                backgroundColor: amoledColors.headerBg,
                borderBottom: `2px solid ${amoledColors.border}`,
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
                      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                    borderRadius: '8px',
                    padding: '8px',
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
                  }}
                >
                  <FaFilter style={{ color: '#ffffff' }} size={16} />
                </div>
                Search & Filter Users
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: '2rem' }}>
              <Row>
                <Col md={6}>
                  <Form.Group controlId='search' className='mb-3'>
                    <Form.Label
                      style={{
                        color: amoledColors.textSecondary,
                        fontWeight: '500',
                      }}
                    >
                      Search Users
                    </Form.Label>
                    <Form.Control
                      type='text'
                      placeholder='Search by name or email...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        backgroundColor: amoledColors.cardBg,
                        borderColor: amoledColors.border,
                        color: amoledColors.text,
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId='sortBy' className='mb-3'>
                    <Form.Label
                      style={{
                        color: amoledColors.textSecondary,
                        fontWeight: '500',
                      }}
                    >
                      Sort By
                    </Form.Label>
                    <Form.Control
                      as='select'
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        backgroundColor: amoledColors.cardBg,
                        borderColor: amoledColors.border,
                        color: amoledColors.text,
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                      }}
                    >
                      <option value='name'>Name</option>
                      <option value='totalWorkouts'>Total Workouts</option>
                      <option value='lastWorkout'>Last Workout</option>
                      <option value='activityLevel'>Activity Level</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId='filterLevel' className='mb-3'>
                    <Form.Label
                      style={{
                        color: amoledColors.textSecondary,
                        fontWeight: '500',
                      }}
                    >
                      Activity Level
                    </Form.Label>
                    <Form.Control
                      as='select'
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value)}
                      style={{
                        backgroundColor: amoledColors.cardBg,
                        borderColor: amoledColors.border,
                        color: amoledColors.text,
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                      }}
                    >
                      <option value='all'>All Users</option>
                      <option value='very-active'>Very Active</option>
                      <option value='active'>Active</option>
                      <option value='low-activity'>Low Activity</option>
                      <option value='inactive'>Inactive</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </FadeIn>

        {/* Stats Cards */}
        <FadeIn delay={150} direction='up'>
          <Row className='g-4 mb-4'>
            <Col xs={12} sm={6} md={3}>
              <Card
                style={{
                  ...statCardStyle,
                  background: isDarkMode
                    ? 'linear-gradient(145deg, #121212, #1a1a1a)'
                    : 'white',
                  border: isDarkMode ? 'none' : `1px solid ${borderColor}`,
                  boxShadow: isDarkMode
                    ? '0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 8px 12px -4px rgba(0, 0, 0, 0.4)'
                    : '0 6px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Card.Body
                  className='d-flex flex-column justify-content-center'
                  style={{ padding: '1.5rem' }}
                >
                  <div
                    className='mb-3'
                    style={{
                      color: accentPurple,
                      background: isDarkMode
                        ? 'rgba(124, 77, 255, 0.15)'
                        : 'rgba(124, 77, 255, 0.1)',
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaChartBar size={22} />
                  </div>
                  <h6
                    className='mb-2'
                    style={{
                      color: secondaryTextColor,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    Total Workouts
                  </h6>
                  <h2
                    className='mb-0'
                    style={{
                      color: isDarkMode ? '#fff' : textColor,
                      fontWeight: '700',
                      fontSize: '1.8rem',
                      textShadow: isDarkMode
                        ? '0 0 10px rgba(124, 77, 255, 0.2)'
                        : 'none',
                    }}
                  >
                    {globalStats.totalWorkouts}
                  </h2>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Card
                style={{
                  ...statCardStyle,
                  background: isDarkMode
                    ? 'linear-gradient(145deg, #121212, #1a1a1a)'
                    : 'white',
                  border: isDarkMode ? 'none' : `1px solid ${borderColor}`,
                  boxShadow: isDarkMode
                    ? '0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 8px 12px -4px rgba(0, 0, 0, 0.4)'
                    : '0 6px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Card.Body
                  className='d-flex flex-column justify-content-center'
                  style={{ padding: '1.5rem' }}
                >
                  <div
                    className='mb-3'
                    style={{
                      color: accentPurple,
                      background: isDarkMode
                        ? 'rgba(124, 77, 255, 0.15)'
                        : 'rgba(124, 77, 255, 0.1)',
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaDumbbell size={22} />
                  </div>
                  <h6
                    className='mb-2'
                    style={{
                      color: secondaryTextColor,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    Total Sets
                  </h6>
                  <h2
                    className='mb-0'
                    style={{
                      color: isDarkMode ? '#fff' : textColor,
                      fontWeight: '700',
                      fontSize: '1.8rem',
                      textShadow: isDarkMode
                        ? '0 0 10px rgba(124, 77, 255, 0.2)'
                        : 'none',
                    }}
                  >
                    {globalStats.totalSets}
                  </h2>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Card
                style={{
                  ...statCardStyle,
                  background: isDarkMode
                    ? 'linear-gradient(145deg, #121212, #1a1a1a)'
                    : 'white',
                  border: isDarkMode ? 'none' : `1px solid ${borderColor}`,
                  boxShadow: isDarkMode
                    ? '0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 8px 12px -4px rgba(0, 0, 0, 0.4)'
                    : '0 6px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Card.Body
                  className='d-flex flex-column justify-content-center'
                  style={{ padding: '1.5rem' }}
                >
                  <div
                    className='mb-3'
                    style={{
                      color: accentPurple,
                      background: isDarkMode
                        ? 'rgba(124, 77, 255, 0.15)'
                        : 'rgba(124, 77, 255, 0.1)',
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaWeight size={22} />
                  </div>
                  <h6
                    className='mb-2'
                    style={{
                      color: secondaryTextColor,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    Total Weight
                  </h6>
                  <h2
                    className='mb-0'
                    style={{
                      color: isDarkMode ? '#fff' : textColor,
                      fontWeight: '700',
                      fontSize: '1.8rem',
                      textShadow: isDarkMode
                        ? '0 0 10px rgba(124, 77, 255, 0.2)'
                        : 'none',
                    }}
                  >
                    {globalStats.totalWeight}
                    <small
                      className='ms-1 fs-6'
                      style={{ color: secondaryTextColor, fontWeight: '500' }}
                    >
                      kg
                    </small>
                  </h2>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Card
                style={{
                  ...statCardStyle,
                  background: isDarkMode
                    ? 'linear-gradient(145deg, #121212, #1a1a1a)'
                    : 'white',
                  border: isDarkMode ? 'none' : `1px solid ${borderColor}`,
                  boxShadow: isDarkMode
                    ? '0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 8px 12px -4px rgba(0, 0, 0, 0.4)'
                    : '0 6px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Card.Body
                  className='d-flex flex-column justify-content-center'
                  style={{ padding: '1.5rem' }}
                >
                  <div
                    className='mb-3'
                    style={{
                      color: accentPurple,
                      background: isDarkMode
                        ? 'rgba(124, 77, 255, 0.15)'
                        : 'rgba(124, 77, 255, 0.1)',
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaRunning size={22} />
                  </div>
                  <h6
                    className='mb-2'
                    style={{
                      color: secondaryTextColor,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    Avg Reps/Set
                  </h6>
                  <h2
                    className='mb-0'
                    style={{
                      color: isDarkMode ? '#fff' : textColor,
                      fontWeight: '700',
                      fontSize: '1.8rem',
                      textShadow: isDarkMode
                        ? '0 0 10px rgba(124, 77, 255, 0.2)'
                        : 'none',
                    }}
                  >
                    {globalStats.avgReps}
                  </h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </FadeIn>

        {/* User Analytics Section */}
        {usersData && usersData.users && (
          <FadeIn delay={200} direction='up'>
            <Card style={cardStyle} className='mb-4'>
              <Card.Header
                style={{
                  backgroundColor: isDarkMode ? '#0d0d0d' : '#f8f9fa',
                  borderBottom: `1px solid ${borderColor}`,
                  padding: '1rem',
                  borderTopLeftRadius: '0.75rem',
                  borderTopRightRadius: '0.75rem',
                }}
              >
                <Row className='align-items-center'>
                  <Col xs={12} lg={6} className='mb-3 mb-lg-0'>
                    <div className='d-flex align-items-center'>
                      <h5
                        className='mb-0 d-flex align-items-center'
                        style={{ color: textColor, fontWeight: '600' }}
                      >
                        <FaUser
                          className='me-2'
                          style={{ color: accentPurple }}
                        />
                        User Activity Analytics
                      </h5>
                      <Badge
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(124, 77, 255, 0.2)'
                            : 'rgba(124, 77, 255, 0.1)',
                          color: isDarkMode ? accentPurple : '#7e3af2',
                          padding: '0.5rem 1rem',
                          fontSize: '0.85rem',
                          marginLeft: '1rem',
                        }}
                      >
                        {filteredAnalyticsData.length} of{' '}
                        {usersData?.totalCount || usersData?.users?.length || 0}{' '}
                        Users
                        {debouncedUserSearch && ` (filtered)`}
                      </Badge>
                    </div>
                  </Col>

                  <Col xs={12} lg={6}>
                    {/* Search Input Row */}
                    <Row className='g-2 mb-2'>
                      <Col xs={12}>
                        <div className='position-relative'>
                          <Form.Control
                            type='text'
                            placeholder='Search users by name, email, or ID...'
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            size='sm'
                            style={{
                              backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                              borderColor: borderColor,
                              color: textColor,
                              fontSize: '0.9rem',
                              paddingLeft: '2.5rem',
                              borderRadius: '8px',
                            }}
                          />
                          <FaSearch
                            style={{
                              position: 'absolute',
                              left: '0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: secondaryTextColor,
                              fontSize: '0.8rem',
                            }}
                          />
                          {userSearchTerm && (
                            <Button
                              variant='link'
                              size='sm'
                              onClick={() => setUserSearchTerm('')}
                              style={{
                                position: 'absolute',
                                right: '0.5rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: secondaryTextColor,
                                padding: '0',
                                fontSize: '1rem',
                              }}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      </Col>
                    </Row>

                    {/* Filter Controls Row */}
                    <Row className='g-2'>
                      <Col xs={6} sm={4}>
                        <Form.Select
                          size='sm'
                          value={activityFilter}
                          onChange={(e) => setActivityFilter(e.target.value)}
                          style={{
                            backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                            borderColor: borderColor,
                            color: textColor,
                            fontSize: '0.8rem',
                          }}
                        >
                          <option value='all'>All Users</option>
                          <option value='very-active'>Very Active</option>
                          <option value='active'>Active</option>
                          <option value='inactive'>Low/Inactive</option>
                          <option value='never-active'>Never Active</option>
                        </Form.Select>
                      </Col>

                      <Col xs={6} sm={4}>
                        <Form.Select
                          size='sm'
                          value={sortField}
                          onChange={(e) => setSortField(e.target.value)}
                          style={{
                            backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                            borderColor: borderColor,
                            color: textColor,
                            fontSize: '0.8rem',
                          }}
                        >
                          <option value='lastWorkout'>Last Workout</option>
                          <option value='name'>Name</option>
                          <option value='totalWorkouts'>Total Workouts</option>
                          <option value='currentStreak'>Current Streak</option>
                          <option value='weeklyConsistency'>
                            Weekly Consistency
                          </option>
                        </Form.Select>
                      </Col>

                      <Col xs={12} sm={4}>
                        <Button
                          size='sm'
                          variant='outline-secondary'
                          onClick={() =>
                            setSortDirection(
                              sortDirection === 'asc' ? 'desc' : 'asc'
                            )
                          }
                          style={{
                            width: '100%',
                            borderColor: borderColor,
                            color: textColor,
                            backgroundColor: 'transparent',
                            fontSize: '0.8rem',
                          }}
                        >
                          {sortDirection === 'asc'
                            ? '↑ Ascending'
                            : '↓ Descending'}
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card.Header>

              <Card.Body style={{ padding: '0' }}>
                {/* Desktop Table View */}
                {!isMobile && (
                  <div>
                    {filteredAnalyticsData.length > 0 ? (
                      <Table hover style={tableStyle} className='mb-0'>
                        <thead
                          style={{ position: 'sticky', top: 0, zIndex: 10 }}
                        >
                          <tr>
                            <th
                              style={{
                                ...headerCellStyle,
                                backgroundColor: isDarkMode
                                  ? '#0d0d0d'
                                  : '#f8f9fa',
                              }}
                            >
                              <Button
                                variant='link'
                                size='sm'
                                onClick={() => handleSortChange('name')}
                                style={{
                                  color: textColor,
                                  textDecoration: 'none',
                                  padding: 0,
                                  fontWeight: '600',
                                }}
                              >
                                USER{' '}
                                {sortField === 'name' &&
                                  (sortDirection === 'asc' ? '↑' : '↓')}
                              </Button>
                            </th>
                            <th
                              style={{
                                ...headerCellStyle,
                                backgroundColor: isDarkMode
                                  ? '#0d0d0d'
                                  : '#f8f9fa',
                              }}
                            >
                              ACTIVITY STATUS
                            </th>
                            <th
                              style={{
                                ...headerCellStyle,
                                backgroundColor: isDarkMode
                                  ? '#0d0d0d'
                                  : '#f8f9fa',
                              }}
                            >
                              <Button
                                variant='link'
                                size='sm'
                                onClick={() =>
                                  handleSortChange('currentStreak')
                                }
                                style={{
                                  color: textColor,
                                  textDecoration: 'none',
                                  padding: 0,
                                  fontWeight: '600',
                                }}
                              >
                                STREAK{' '}
                                {sortField === 'currentStreak' &&
                                  (sortDirection === 'asc' ? '↑' : '↓')}
                              </Button>
                            </th>
                            <th
                              style={{
                                ...headerCellStyle,
                                backgroundColor: isDarkMode
                                  ? '#0d0d0d'
                                  : '#f8f9fa',
                              }}
                            >
                              <Button
                                variant='link'
                                size='sm'
                                onClick={() => handleSortChange('lastWorkout')}
                                style={{
                                  color: textColor,
                                  textDecoration: 'none',
                                  padding: 0,
                                  fontWeight: '600',
                                }}
                              >
                                LAST WORKOUT{' '}
                                {sortField === 'lastWorkout' &&
                                  (sortDirection === 'asc' ? '↑' : '↓')}
                              </Button>
                            </th>
                            <th
                              style={{
                                ...headerCellStyle,
                                backgroundColor: isDarkMode
                                  ? '#0d0d0d'
                                  : '#f8f9fa',
                              }}
                            >
                              <Button
                                variant='link'
                                size='sm'
                                onClick={() =>
                                  handleSortChange('weeklyConsistency')
                                }
                                style={{
                                  color: textColor,
                                  textDecoration: 'none',
                                  padding: 0,
                                  fontWeight: '600',
                                }}
                              >
                                CONSISTENCY{' '}
                                {sortField === 'weeklyConsistency' &&
                                  (sortDirection === 'asc' ? '↑' : '↓')}
                              </Button>
                            </th>
                            <th
                              style={{
                                ...headerCellStyle,
                                backgroundColor: isDarkMode
                                  ? '#0d0d0d'
                                  : '#f8f9fa',
                              }}
                            >
                              PROGRESS
                            </th>
                            <th
                              style={{
                                ...headerCellStyle,
                                backgroundColor: isDarkMode
                                  ? '#0d0d0d'
                                  : '#f8f9fa',
                              }}
                            >
                              ACTIONS
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {getPaginatedAnalyticsData().map((userStats) => (
                            <tr
                              key={userStats.user._id}
                              style={{
                                backgroundColor: isDarkMode
                                  ? tableRowBg
                                  : 'transparent',
                                borderTop: `1px solid ${borderColor}`,
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  hoverBackground)
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  isDarkMode ? tableRowBg : 'transparent')
                              }
                            >
                              <td style={cellStyle}>
                                <div className='d-flex align-items-center'>
                                  <div
                                    className='me-3 rounded-circle d-flex align-items-center justify-content-center'
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      backgroundColor: isDarkMode
                                        ? 'rgba(124, 77, 255, 0.2)'
                                        : 'rgba(124, 77, 255, 0.1)',
                                      color: accentPurple,
                                      fontSize: '1.1rem',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {userStats.user.name
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        color: textColor,
                                        fontWeight: '600',
                                      }}
                                    >
                                      {userStats.user.name}
                                      {userStats.user.isAdmin && (
                                        <Badge
                                          className='ms-2'
                                          style={{
                                            backgroundColor: isDarkMode
                                              ? 'rgba(34, 197, 94, 0.2)'
                                              : 'rgba(34, 197, 94, 0.1)',
                                            color: '#22c55e',
                                            fontSize: '0.65rem',
                                            padding: '0.25rem 0.5rem',
                                            border: `1px solid #22c55e30`,
                                          }}
                                        >
                                          ADMIN
                                        </Badge>
                                      )}
                                    </div>
                                    <div
                                      style={{
                                        color: secondaryTextColor,
                                        fontSize: '0.8rem',
                                      }}
                                    >
                                      {userStats.totalWorkouts} workouts •{' '}
                                      {userStats.totalSets} sets
                                      {userStats.user.email && (
                                        <span
                                          className='d-block'
                                          style={{
                                            fontSize: '0.75rem',
                                            marginTop: '2px',
                                          }}
                                        >
                                          {userStats.user.email}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={cellStyle}>
                                <Badge
                                  pill
                                  style={{
                                    backgroundColor:
                                      userStats.activityColor + '20',
                                    color: userStats.activityColor,
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    border: `1px solid ${userStats.activityColor}30`,
                                  }}
                                >
                                  {userStats.activityLevel}
                                </Badge>
                              </td>
                              <td style={cellStyle}>
                                <div className='d-flex align-items-center'>
                                  <FaFire
                                    className='me-2'
                                    style={{
                                      color:
                                        userStats.currentStreak > 0
                                          ? '#f59e0b'
                                          : secondaryTextColor,
                                      fontSize: '1rem',
                                    }}
                                  />
                                  <span
                                    style={{
                                      color:
                                        userStats.currentStreak > 0
                                          ? textColor
                                          : secondaryTextColor,
                                      fontWeight:
                                        userStats.currentStreak > 0
                                          ? '600'
                                          : '400',
                                    }}
                                  >
                                    {userStats.currentStreak} days
                                  </span>
                                </div>
                              </td>
                              <td style={cellStyle}>
                                {userStats.lastWorkout ? (
                                  <div>
                                    <div
                                      style={{
                                        color: textColor,
                                        fontSize: '0.9rem',
                                      }}
                                    >
                                      {format(
                                        userStats.lastWorkout,
                                        'MMM d, yyyy'
                                      )}
                                    </div>
                                    <div
                                      style={{
                                        color:
                                          userStats.daysSinceLastWorkout <= 2
                                            ? '#22c55e'
                                            : userStats.daysSinceLastWorkout <=
                                              7
                                            ? '#eab308'
                                            : '#ef4444',
                                        fontSize: '0.8rem',
                                        fontWeight: '500',
                                      }}
                                    >
                                      {userStats.daysSinceLastWorkout === 0
                                        ? 'Today'
                                        : userStats.daysSinceLastWorkout === 1
                                        ? 'Yesterday'
                                        : `${userStats.daysSinceLastWorkout} days ago`}
                                    </div>
                                  </div>
                                ) : (
                                  <span
                                    style={{
                                      color: secondaryTextColor,
                                      fontStyle: 'italic',
                                    }}
                                  >
                                    Never
                                  </span>
                                )}
                              </td>
                              <td style={cellStyle}>
                                <div className='d-flex align-items-center'>
                                  <div className='me-2'>
                                    <div
                                      style={{
                                        color: textColor,
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                      }}
                                    >
                                      {userStats.weeklyConsistency}/week
                                    </div>
                                    <div
                                      style={{
                                        color:
                                          userStats.weeklyConsistency >= 3
                                            ? '#22c55e'
                                            : userStats.weeklyConsistency >= 2
                                            ? '#eab308'
                                            : '#ef4444',
                                        fontSize: '0.75rem',
                                        fontWeight: '500',
                                      }}
                                    >
                                      {userStats.weeklyConsistency >= 3
                                        ? 'Great'
                                        : userStats.weeklyConsistency >= 2
                                        ? 'Good'
                                        : userStats.weeklyConsistency >= 1
                                        ? 'Low'
                                        : 'Poor'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={cellStyle}>
                                <div className='d-flex align-items-center'>
                                  <span
                                    className='me-2'
                                    style={{
                                      color: userStats.trendColor,
                                      fontSize: '1.2rem',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {userStats.trendIcon}
                                  </span>
                                  <div>
                                    <div
                                      style={{
                                        color: userStats.trendColor,
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                      }}
                                    >
                                      {userStats.progressTrend}
                                    </div>
                                    <div
                                      style={{
                                        color: secondaryTextColor,
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      {userStats.lastTwoWeeksWorkouts} vs{' '}
                                      {userStats.previousTwoWeeksWorkouts}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={cellStyle}>
                                <div className='d-flex gap-2'>
                                  <Button
                                    size='sm'
                                    variant='outline-primary'
                                    onClick={() => showUserDetails(userStats)}
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '0.25rem 0.5rem',
                                      borderColor: accentPurple,
                                      color: accentPurple,
                                      backgroundColor: 'transparent',
                                    }}
                                  >
                                    <FaEye className='me-1' />
                                    Details
                                  </Button>
                                  <LinkContainer
                                    to={`/admin/user-workout-dashboard/${userStats.user._id}`}
                                  >
                                    <Button
                                      size='sm'
                                      style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.5rem',
                                        ...buttonStyle,
                                      }}
                                    >
                                      <FaDumbbell className='me-1' size={12} />
                                      Workouts
                                    </Button>
                                  </LinkContainer>
                                  <LinkContainer
                                    to={`/admin/user-diet-dashboard/${userStats.user._id}`}
                                  >
                                    <Button
                                      size='sm'
                                      variant='outline-success'
                                      style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.5rem',
                                        borderColor: isDarkMode
                                          ? '#34d399'
                                          : '#10b981',
                                        color: isDarkMode
                                          ? '#34d399'
                                          : '#10b981',
                                        backgroundColor: 'transparent',
                                      }}
                                    >
                                      <FaUtensils className='me-1' size={12} />
                                      Diet
                                    </Button>
                                  </LinkContainer>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div
                        className='text-center py-5'
                        style={{ color: secondaryTextColor }}
                      >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                          👥
                        </div>
                        <h5
                          style={{ color: textColor, marginBottom: '0.5rem' }}
                        >
                          {debouncedUserSearch
                            ? 'No Users Found'
                            : 'No User Data Available'}
                        </h5>
                        <p style={{ fontSize: '0.9rem' }}>
                          {debouncedUserSearch
                            ? `No users match your search "${debouncedUserSearch}". Try a different search term.`
                            : 'No user analytics data is currently available.'}
                        </p>
                        {debouncedUserSearch && (
                          <Button
                            variant='outline-primary'
                            size='sm'
                            onClick={() => setUserSearchTerm('')}
                            style={{
                              borderColor: accentPurple,
                              color: accentPurple,
                              backgroundColor: 'transparent',
                              marginTop: '1rem',
                            }}
                          >
                            Clear Search
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile Card View */}
                {isMobile && (
                  <div style={{ padding: '1rem' }}>
                    {filteredAnalyticsData.length > 0 ? (
                      getPaginatedAnalyticsData().map((userStats) =>
                        renderUserAnalyticsCard(userStats)
                      )
                    ) : (
                      <div
                        className='text-center py-5'
                        style={{ color: secondaryTextColor }}
                      >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                          👥
                        </div>
                        <h5
                          style={{ color: textColor, marginBottom: '0.5rem' }}
                        >
                          {debouncedUserSearch
                            ? 'No Users Found'
                            : 'No User Data Available'}
                        </h5>
                        <p style={{ fontSize: '0.9rem' }}>
                          {debouncedUserSearch
                            ? `No users match your search "${debouncedUserSearch}". Try a different search term.`
                            : 'No user analytics data is currently available.'}
                        </p>
                        {debouncedUserSearch && (
                          <Button
                            variant='outline-primary'
                            size='sm'
                            onClick={() => setUserSearchTerm('')}
                            style={{
                              borderColor: accentPurple,
                              color: accentPurple,
                              backgroundColor: 'transparent',
                              marginTop: '1rem',
                            }}
                          >
                            Clear Search
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Pagination */}
                {filteredAnalyticsData.length > 0 && renderPagination()}

                {/* Results info */}
                {filteredAnalyticsData.length > 0 && (
                  <div
                    className='text-center py-3'
                    style={{ color: secondaryTextColor, fontSize: '0.85rem' }}
                  >
                    {`Showing ${
                      (userAnalyticsPage - 1) * usersPerPage + 1
                    } to ${Math.min(
                      userAnalyticsPage * usersPerPage,
                      filteredAnalyticsData.length
                    )} of ${filteredAnalyticsData.length} users`}
                    {debouncedUserSearch &&
                      ` (filtered from ${
                        usersData?.totalCount || usersData?.users?.length || 0
                      } total)`}
                  </div>
                )}
              </Card.Body>
            </Card>
          </FadeIn>
        )}

        {/* User Details Modal */}
        <Modal
          show={showUserAnalytics}
          onHide={() => setShowUserAnalytics(false)}
          size='lg'
          centered
        >
          <Modal.Header
            closeButton
            style={{
              backgroundColor: isDarkMode ? '#0d0d0d' : '#f8f9fa',
              borderBottom: `1px solid ${borderColor}`,
              color: textColor,
            }}
          >
            <Modal.Title className='d-flex align-items-center'>
              <FaTrophy className='me-2' style={{ color: accentPurple }} />
              {selectedUser?.user.name} - Detailed Analytics
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            style={{
              backgroundColor: isDarkMode ? '#121212' : '#ffffff',
              color: textColor,
            }}
          >
            {selectedUser && (
              <Row>
                <Col md={6}>
                  <Card
                    style={{
                      backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                      border: `1px solid ${borderColor}`,
                      marginBottom: '1rem',
                    }}
                  >
                    <Card.Body>
                      <h6 style={{ color: accentPurple, marginBottom: '1rem' }}>
                        Workout Statistics
                      </h6>
                      <div className='mb-2'>
                        <small style={{ color: secondaryTextColor }}>
                          Total Workouts:
                        </small>
                        <div style={{ color: textColor, fontWeight: '600' }}>
                          {selectedUser.totalWorkouts}
                        </div>
                      </div>
                      <div className='mb-2'>
                        <small style={{ color: secondaryTextColor }}>
                          Total Sets:
                        </small>
                        <div style={{ color: textColor, fontWeight: '600' }}>
                          {selectedUser.totalSets}
                        </div>
                      </div>
                      <div className='mb-2'>
                        <small style={{ color: secondaryTextColor }}>
                          Total Volume:
                        </small>
                        <div style={{ color: textColor, fontWeight: '600' }}>
                          {selectedUser.totalVolume} kg
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card
                    style={{
                      backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                      border: `1px solid ${borderColor}`,
                      marginBottom: '1rem',
                    }}
                  >
                    <Card.Body>
                      <h6 style={{ color: accentPurple, marginBottom: '1rem' }}>
                        Activity Insights
                      </h6>
                      <div className='mb-2'>
                        <small style={{ color: secondaryTextColor }}>
                          Current Streak:
                        </small>
                        <div style={{ color: textColor, fontWeight: '600' }}>
                          <FaFire
                            className='me-2'
                            style={{ color: '#f59e0b' }}
                          />
                          {selectedUser.currentStreak} days
                        </div>
                      </div>
                      <div className='mb-2'>
                        <small style={{ color: secondaryTextColor }}>
                          Weekly Consistency:
                        </small>
                        <div style={{ color: textColor, fontWeight: '600' }}>
                          {selectedUser.weeklyConsistency} workouts/week
                        </div>
                      </div>
                      <div className='mb-2'>
                        <small style={{ color: secondaryTextColor }}>
                          Activity Level:
                        </small>
                        <div>
                          <Badge
                            style={{
                              backgroundColor:
                                selectedUser.activityColor + '20',
                              color: selectedUser.activityColor,
                              padding: '0.3rem 0.6rem',
                            }}
                          >
                            {selectedUser.activityLevel}
                          </Badge>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={12}>
                  <Alert
                    variant={
                      selectedUser.progressTrend === 'Improving'
                        ? 'success'
                        : selectedUser.progressTrend === 'Declining'
                        ? 'danger'
                        : 'info'
                    }
                    style={{
                      backgroundColor: selectedUser.trendColor + '20',
                      borderColor: selectedUser.trendColor + '40',
                      color: selectedUser.trendColor,
                      border: `1px solid ${selectedUser.trendColor}40`,
                    }}
                  >
                    <div className='d-flex align-items-center'>
                      <span className='me-2' style={{ fontSize: '1.2rem' }}>
                        {selectedUser.trendIcon}
                      </span>
                      <div>
                        <strong>
                          Progress Trend: {selectedUser.progressTrend}
                        </strong>
                        <div
                          style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}
                        >
                          Last 2 weeks: {selectedUser.lastTwoWeeksWorkouts}{' '}
                          workouts | Previous 2 weeks:{' '}
                          {selectedUser.previousTwoWeeksWorkouts} workouts
                        </div>
                      </div>
                    </div>
                  </Alert>

                  {selectedUser.daysSinceLastWorkout !== null &&
                    selectedUser.daysSinceLastWorkout > 7 && (
                      <Alert
                        variant='warning'
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(245, 158, 11, 0.1)'
                            : '#fef3c7',
                          borderColor: isDarkMode
                            ? 'rgba(245, 158, 11, 0.3)'
                            : '#f59e0b',
                          color: isDarkMode ? '#fcd34d' : '#92400e',
                        }}
                      >
                        <FaExclamationTriangle className='me-2' />
                        <strong>Attention Needed:</strong> User hasn't worked
                        out in {selectedUser.daysSinceLastWorkout} days.
                        Consider reaching out to encourage them to resume their
                        fitness routine.
                      </Alert>
                    )}
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer
            style={{
              backgroundColor: isDarkMode ? '#0d0d0d' : '#f8f9fa',
              borderTop: `1px solid ${borderColor}`,
            }}
          >
            <Button
              variant='secondary'
              onClick={() => setShowUserAnalytics(false)}
            >
              Close
            </Button>
            {selectedUser && (
              <LinkContainer
                to={`/admin/user-workout-dashboard/${selectedUser.user._id}`}
              >
                <Button style={buttonStyle}>
                  <FaArrowRight className='me-2' />
                  View Full Dashboard
                </Button>
              </LinkContainer>
            )}
          </Modal.Footer>
        </Modal>

        <FadeIn delay={300} direction='up'>
          <Card style={cardStyle} className='mb-4'>
            <Card.Header
              style={{
                backgroundColor: isDarkMode ? '#0d0d0d' : '#f8f9fa',
                borderBottom: `1px solid ${borderColor}`,
                padding: '1rem',
                borderTopLeftRadius: '0.75rem',
                borderTopRightRadius: '0.75rem',
              }}
            >
              <h5
                className='mb-0'
                style={{ color: textColor, fontWeight: '600' }}
              >
                Workout Entries ({filteredEntries.length})
              </h5>
            </Card.Header>

            {/* For larger screens - Table View */}
            <div className='d-none d-lg-block'>
              <div className='table-responsive'>
                <StaggeredList baseDelay={50} staggerDelay={30}>
                  <Table hover style={tableStyle} className='mb-0'>
                    <thead>
                      <tr>
                        <th style={headerCellStyle}>DATE</th>
                        <th style={headerCellStyle}>USER</th>
                        <th style={headerCellStyle}>EXERCISE</th>
                        <th style={headerCellStyle}>COLLECTION</th>
                        <th style={headerCellStyle}>SETS</th>
                        <th style={headerCellStyle}>FEELING</th>
                        <th style={headerCellStyle}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.length > 0 ? (
                        filteredEntries.map((entry) => (
                          <tr
                            key={entry._id}
                            style={{
                              backgroundColor: isDarkMode
                                ? tableRowBg
                                : 'transparent',
                              borderTop: `1px solid ${borderColor}`,
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                hoverBackground)
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                isDarkMode ? tableRowBg : 'transparent')
                            }
                          >
                            <td style={cellStyle}>
                              {format(new Date(entry.date), 'MMM d, yyyy')}
                            </td>
                            <td style={cellStyle}>
                              {entry.user && (
                                <LinkContainer
                                  to={`/admin/user/${entry.user._id}/edit`}
                                >
                                  <Button
                                    variant='link'
                                    size='sm'
                                    className='p-0'
                                    style={{
                                      color: isDarkMode ? '#60a5fa' : '#3b82f6',
                                    }}
                                  >
                                    {entry.user.name}
                                  </Button>
                                </LinkContainer>
                              )}
                            </td>
                            <td style={cellStyle}>{entry.product?.name}</td>
                            <td style={cellStyle}>
                              {entry.parentCollection?.name
                                ? `${entry.parentCollection.name} > ${entry.collectionId?.name}`
                                : entry.collectionId?.name}
                            </td>
                            <td style={cellStyle}>
                              <div className='d-flex align-items-center'>
                                <span className='me-2'>
                                  {entry.sets?.length || 0} sets
                                </span>
                                <Badge
                                  bg='secondary'
                                  className='d-none d-xl-inline-block'
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? 'rgba(124, 77, 255, 0.2)'
                                      : 'rgba(124, 77, 255, 0.1)',
                                    color: isDarkMode
                                      ? accentPurple
                                      : '#7e3af2',
                                  }}
                                  title='Total Weight'
                                >
                                  {entry.sets?.reduce(
                                    (acc, set) => acc + (set.weight || 0),
                                    0
                                  ) || 0}
                                  kg
                                </Badge>
                              </div>
                            </td>
                            <td style={cellStyle}>
                              <Badge
                                pill
                                style={getFeelingStyling(entry.feeling)}
                              >
                                {entry.feeling?.charAt(0).toUpperCase() +
                                  entry.feeling?.slice(1) || 'N/A'}
                              </Badge>
                            </td>
                            <td style={cellStyle}>
                              <LinkContainer to={`/admin/workout/${entry._id}`}>
                                <Button
                                  size='sm'
                                  style={{
                                    ...buttonStyle,
                                    fontSize: '0.8rem',
                                    padding: '0.35rem 0.8rem',
                                  }}
                                >
                                  View Details
                                </Button>
                              </LinkContainer>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan='7'
                            style={{
                              ...cellStyle,
                              textAlign: 'center',
                              padding: '2rem',
                            }}
                          >
                            No exercise entries found matching your search
                            criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </StaggeredList>
              </div>
            </div>

            {/* For smaller screens - Card View */}
            <div className='d-block d-lg-none'>
              <div style={{ padding: '1rem' }}>
                {filteredEntries.length > 0 ? (
                  <StaggeredList baseDelay={50} staggerDelay={50}>
                    {filteredEntries.map((entry) => (
                      <Card
                        key={entry._id}
                        className='mb-3'
                        style={{
                          backgroundColor: isDarkMode ? '#0d0d0d' : '#ffffff',
                          border: isDarkMode
                            ? 'none'
                            : `1px solid ${borderColor}`,
                          borderRadius: '0.75rem',
                          boxShadow: isDarkMode
                            ? '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)'
                            : '0 4px 15px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Card.Header
                          className='d-flex justify-content-between align-items-center flex-wrap'
                          style={{
                            backgroundColor: isDarkMode ? '#121212' : '#f8fafc',
                            borderBottom: `1px solid ${borderColor}`,
                            borderTopLeftRadius: '0.75rem',
                            borderTopRightRadius: '0.75rem',
                            padding: '0.875rem 1rem',
                          }}
                        >
                          <div className='d-flex align-items-center flex-wrap'>
                            <Badge
                              pill
                              style={{
                                ...getFeelingStyling(entry.feeling),
                                marginRight: '0.5rem',
                                marginBottom: '0.25rem',
                              }}
                            >
                              {entry.feeling?.charAt(0).toUpperCase() +
                                entry.feeling?.slice(1) || 'N/A'}
                            </Badge>
                            <strong
                              style={{ color: textColor, fontSize: '0.95rem' }}
                            >
                              {format(new Date(entry.date), 'MMM d, yyyy')}
                            </strong>
                          </div>
                          <LinkContainer to={`/admin/workout/${entry._id}`}>
                            <Button
                              size='sm'
                              style={{
                                ...buttonStyle,
                                fontSize: '0.75rem',
                                padding: '0.4rem 0.8rem',
                                marginTop: '0.25rem',
                              }}
                            >
                              <FaEye className='me-1' />
                              Details
                            </Button>
                          </LinkContainer>
                        </Card.Header>

                        <Card.Body style={{ padding: '1rem' }}>
                          {/* User and Exercise Info */}
                          <Row className='mb-3'>
                            <Col xs={12} className='mb-2'>
                              <div className='d-flex align-items-center'>
                                <div
                                  className='me-2 rounded-circle d-flex align-items-center justify-content-center'
                                  style={{
                                    width: '35px',
                                    height: '35px',
                                    backgroundColor: isDarkMode
                                      ? 'rgba(124, 77, 255, 0.2)'
                                      : 'rgba(124, 77, 255, 0.1)',
                                    color: accentPurple,
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  <FaUser />
                                </div>
                                <div className='flex-grow-1'>
                                  <div
                                    style={{
                                      fontSize: '0.8rem',
                                      color: secondaryTextColor,
                                    }}
                                  >
                                    User
                                  </div>
                                  {entry.user && (
                                    <LinkContainer
                                      to={`/admin/user/${entry.user._id}/edit`}
                                    >
                                      <Button
                                        variant='link'
                                        className='p-0'
                                        style={{
                                          color: isDarkMode
                                            ? '#60a5fa'
                                            : '#3b82f6',
                                          fontSize: '0.9rem',
                                          fontWeight: '600',
                                        }}
                                      >
                                        {entry.user.name}
                                      </Button>
                                    </LinkContainer>
                                  )}
                                </div>
                              </div>
                            </Col>

                            <Col xs={12} className='mb-2'>
                              <div className='d-flex align-items-center'>
                                <div
                                  className='me-2 rounded-circle d-flex align-items-center justify-content-center'
                                  style={{
                                    width: '35px',
                                    height: '35px',
                                    backgroundColor: isDarkMode
                                      ? 'rgba(34, 197, 94, 0.2)'
                                      : 'rgba(34, 197, 94, 0.1)',
                                    color: '#22c55e',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  <FaDumbbell />
                                </div>
                                <div className='flex-grow-1'>
                                  <div
                                    style={{
                                      fontSize: '0.8rem',
                                      color: secondaryTextColor,
                                    }}
                                  >
                                    Exercise
                                  </div>
                                  <div
                                    style={{
                                      color: textColor,
                                      fontWeight: '600',
                                      fontSize: '0.9rem',
                                    }}
                                  >
                                    {entry.product?.name || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </Col>

                            {(entry.parentCollection?.name ||
                              entry.collectionId?.name) && (
                              <Col xs={12} className='mb-2'>
                                <div className='d-flex align-items-center'>
                                  <div
                                    className='me-2 rounded-circle d-flex align-items-center justify-content-center'
                                    style={{
                                      width: '35px',
                                      height: '35px',
                                      backgroundColor: isDarkMode
                                        ? 'rgba(59, 130, 246, 0.2)'
                                        : 'rgba(59, 130, 246, 0.1)',
                                      color: '#3b82f6',
                                      fontSize: '0.8rem',
                                    }}
                                  >
                                    📁
                                  </div>
                                  <div className='flex-grow-1'>
                                    <div
                                      style={{
                                        fontSize: '0.8rem',
                                        color: secondaryTextColor,
                                      }}
                                    >
                                      Collection
                                    </div>
                                    <div
                                      style={{
                                        color: textColor,
                                        fontWeight: '500',
                                        fontSize: '0.85rem',
                                      }}
                                    >
                                      {entry.parentCollection?.name
                                        ? `${entry.parentCollection.name} > ${entry.collectionId?.name}`
                                        : entry.collectionId?.name}
                                    </div>
                                  </div>
                                </div>
                              </Col>
                            )}
                          </Row>

                          {/* Sets Details */}
                          <div className='mt-3'>
                            <div className='d-flex align-items-center justify-content-between mb-3'>
                              <h6
                                className='fw-bold mb-0 d-flex align-items-center'
                                style={{
                                  color: textColor,
                                  fontSize: '0.95rem',
                                }}
                              >
                                <FaDumbbell
                                  className='me-2'
                                  style={{ color: accentPurple }}
                                />
                                Sets Details
                              </h6>
                              <Badge
                                style={{
                                  backgroundColor: isDarkMode
                                    ? 'rgba(124, 77, 255, 0.2)'
                                    : 'rgba(124, 77, 255, 0.1)',
                                  color: isDarkMode ? accentPurple : '#7e3af2',
                                  padding: '0.25rem 0.6rem',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {entry.sets?.length || 0} sets
                              </Badge>
                            </div>

                            <div className='row g-2'>
                              {entry.sets && entry.sets.length > 0 ? (
                                entry.sets.slice(0, 6).map((set, idx) => (
                                  <div key={idx} className='col-6 col-sm-4'>
                                    <div
                                      className='p-2 rounded text-center'
                                      style={{
                                        backgroundColor: isDarkMode
                                          ? '#1a1a1a'
                                          : '#f8fafc',
                                        border: `1px solid ${borderColor}`,
                                        fontSize: '0.8rem',
                                      }}
                                    >
                                      <div
                                        className='fw-bold mb-1 d-flex justify-content-center align-items-center'
                                        style={{
                                          color: textColor,
                                          fontSize: '0.75rem',
                                        }}
                                      >
                                        <Badge
                                          className='rounded-circle me-1'
                                          style={{
                                            width: '16px',
                                            height: '16px',
                                            fontSize: '0.6rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isDarkMode
                                              ? accentPurple
                                              : '#6e44b2',
                                            color: '#ffffff',
                                          }}
                                        >
                                          {idx + 1}
                                        </Badge>
                                      </div>
                                      <div
                                        style={{
                                          color: textColor,
                                          fontSize: '0.8rem',
                                          fontWeight: '600',
                                        }}
                                      >
                                        {set.weight || 0}kg × {set.reps || 0}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className='col-12'>
                                  <div
                                    className='text-center py-3'
                                    style={{
                                      color: secondaryTextColor,
                                      backgroundColor: isDarkMode
                                        ? '#1a1a1a'
                                        : '#f8fafc',
                                      border: `1px solid ${borderColor}`,
                                      borderRadius: '0.5rem',
                                    }}
                                  >
                                    No sets data available
                                  </div>
                                </div>
                              )}

                              {entry.sets && entry.sets.length > 6 && (
                                <div className='col-6 col-sm-4'>
                                  <div
                                    className='p-2 rounded text-center d-flex align-items-center justify-content-center'
                                    style={{
                                      backgroundColor: isDarkMode
                                        ? '#1a1a1a'
                                        : '#f8fafc',
                                      border: `1px solid ${borderColor}`,
                                      fontSize: '0.75rem',
                                      color: secondaryTextColor,
                                      minHeight: '60px',
                                    }}
                                  >
                                    +{entry.sets.length - 6} more
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Summary Stats */}
                          <div
                            className='mt-3 pt-3'
                            style={{
                              borderTop: `1px solid ${borderColor}`,
                            }}
                          >
                            <Row>
                              <Col xs={6}>
                                <div className='d-flex align-items-center'>
                                  <FaWeight
                                    className='me-2'
                                    style={{
                                      color: accentPurple,
                                      fontSize: '1rem',
                                    }}
                                  />
                                  <div>
                                    <small
                                      style={{
                                        color: secondaryTextColor,
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      Total Weight
                                    </small>
                                    <div
                                      style={{
                                        fontWeight: 'bold',
                                        color: textColor,
                                        fontSize: '0.9rem',
                                      }}
                                    >
                                      {entry.sets?.reduce(
                                        (acc, set) => acc + (set.weight || 0),
                                        0
                                      ) || 0}
                                      kg
                                    </div>
                                  </div>
                                </div>
                              </Col>
                              <Col xs={6}>
                                <div className='d-flex align-items-center'>
                                  <FaRunning
                                    className='me-2'
                                    style={{
                                      color: '#22c55e',
                                      fontSize: '1rem',
                                    }}
                                  />
                                  <div>
                                    <small
                                      style={{
                                        color: secondaryTextColor,
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      Total Reps
                                    </small>
                                    <div
                                      style={{
                                        fontWeight: 'bold',
                                        color: textColor,
                                        fontSize: '0.9rem',
                                      }}
                                    >
                                      {entry.sets?.reduce(
                                        (acc, set) => acc + (set.reps || 0),
                                        0
                                      ) || 0}
                                    </div>
                                  </div>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </StaggeredList>
                ) : (
                  <div
                    className='text-center py-5'
                    style={{ color: secondaryTextColor }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                      🏋️‍♂️
                    </div>
                    <h5 style={{ color: textColor, marginBottom: '0.5rem' }}>
                      No Exercise Entries Found
                    </h5>
                    <p style={{ fontSize: '0.9rem' }}>
                      No exercise entries match your current search criteria.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Card.Footer
              style={{
                backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f9fa',
                borderTop: `1px solid ${borderColor}`,
                borderBottomLeftRadius: '0.75rem',
                borderBottomRightRadius: '0.75rem',
                padding: '1rem',
              }}
            >
              <div className='d-flex justify-content-between align-items-center'>
                <div
                  style={{ color: secondaryTextColor, fontSize: '0.875rem' }}
                >
                  Showing {filteredEntries.length} of {data?.totalEntries || 0}{' '}
                  entries
                </div>
                {data && data.pages > 1 && (
                  <WorkoutPaginate
                    pages={data.pages}
                    page={data.page}
                    isAdmin={true}
                  />
                )}
              </div>
            </Card.Footer>
          </Card>
        </FadeIn>
      </Container>
    </AnimatedScreenWrapper>
  );
};

export default WorkoutTrackingScreen;
