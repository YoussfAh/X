import React, { useState, useEffect } from 'react';
import {
  Form,
  Button,
  Row,
  Col,
  Container,
  Card,
  Accordion,
  Spinner,
  Modal,
  Dropdown,
} from 'react-bootstrap';
import {
  useCreateSleepEntryMutation,
  useGetSleepEntriesQuery,
  useStartSleepMutation,
  useEndSleepMutation,
  useGetCurrentSleepQuery,
  useUpdateSleepEntryMutation,
  useDeleteSleepEntryMutation,
  useSkipSleepPhaseMutation,
} from '../slices/sleepApiSlice';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import Message from '../components/Message';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FaBed,
  FaSun,
  FaClock,
  FaEdit,
  FaTrash,
  FaEllipsisV,
  FaForward,
} from 'react-icons/fa';

const timeToHours = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  // If sleep time is before noon, it's likely for the *next* day's wakeup.
  // To show it on a continuous timeline, we can add 24 hours.
  // Example: Sleep at 1 AM (1) vs Wake up at 8 PM (20). A simple plot would be confusing.
  // We'll normalize sleep times to be "later" than wake times for graphing purposes
  const hours = date.getHours() + date.getMinutes() / 60;
  return hours;
};

const SleepTrackerScreen = () => {
  // State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [customTimeType, setCustomTimeType] = useState(''); // 'sleep' or 'wakeup'
  const [customTime, setCustomTime] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editSleepTime, setEditSleepTime] = useState('');
  const [editWakeUpTime, setEditWakeUpTime] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // API Hooks
  const { data, isLoading, error, refetch } = useGetSleepEntriesQuery();
  const {
    data: currentSleep,
    isLoading: isLoadingCurrent,
    refetch: refetchCurrent,
  } = useGetCurrentSleepQuery();
  const [startSleep, { isLoading: isStartingSleep }] = useStartSleepMutation();
  const [endSleep, { isLoading: isEndingSleep }] = useEndSleepMutation();
  const [updateSleepEntry, { isLoading: isUpdating }] =
    useUpdateSleepEntryMutation();
  const [deleteSleepEntry, { isLoading: isDeleting }] =
    useDeleteSleepEntryMutation();
  const [skipSleepPhase, { isLoading: isSkipping }] =
    useSkipSleepPhaseMutation();

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

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handlers
  const handleStartSleep = async (customDateTime) => {
    try {
      await startSleep({ customTime: customDateTime }).unwrap();
      toast.success('Sleep session started!');
      refetch();
      refetchCurrent();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleEndSleep = async (customDateTime) => {
    try {
      await endSleep({ customTime: customDateTime }).unwrap();
      toast.success('Sleep session ended! Good morning!');
      refetch();
      refetchCurrent();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleSkipPhase = async () => {
    try {
      const result = await skipSleepPhase().unwrap();
      if (result.skippedPhase === 'wakeup') {
        toast.info(
          'Wake-up time skipped! Ready to record your next sleep time.'
        );
      } else {
        toast.info('Sleep time skipped! Ready to record your wake-up time.');
      }
      refetch();
      refetchCurrent();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleCustomTimeSubmit = async (e) => {
    e.preventDefault();
    const customDateTime = new Date(customTime).toISOString();

    if (customTimeType === 'sleep') {
      await handleStartSleep(customDateTime);
    } else {
      await handleEndSleep(customDateTime);
    }

    setShowCustomTimeModal(false);
    setCustomTime('');
  };

  const openCustomTimeModal = (type) => {
    setCustomTimeType(type);
    setCustomTime(new Date().toISOString().slice(0, 16));
    setShowCustomTimeModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sleep entry?')) {
      try {
        await deleteSleepEntry(id).unwrap();
        toast.success('Sleep entry deleted.');
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateSleepEntry({
        id: selectedEntry._id,
        sleepTime: editSleepTime,
        wakeUpTime: editWakeUpTime,
        date: editDate,
      }).unwrap();
      toast.success('Sleep entry updated.');
      setShowEditModal(false);
      setSelectedEntry(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const openEditModal = (entry) => {
    setSelectedEntry(entry);
    setEditDate(new Date(entry.date).toISOString().slice(0, 10));
    setEditSleepTime(new Date(entry.sleepTime).toISOString().slice(0, 16));
    setEditWakeUpTime(
      entry.wakeUpTime
        ? new Date(entry.wakeUpTime).toISOString().slice(0, 16)
        : ''
    );
    setShowEditModal(true);
  };

  // Chart Data
  const chartData = data?.sleepEntries
    ?.filter((e) => e.duration)
    .map((entry) => {
      const sleepTime = timeToHours(entry.sleepTime);
      let wakeUpTime = timeToHours(entry.wakeUpTime);

      // If wake up time is "earlier" than sleep time, it's the next day.
      // Add 24 to wake up time for a continuous line, but only for graphing.
      if (wakeUpTime !== null && sleepTime !== null && wakeUpTime < sleepTime) {
        wakeUpTime += 24;
      }

      return {
        date: new Date(entry.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        duration: entry.duration / 60, // in hours
        sleepTime: sleepTime,
        wakeUpTime: wakeUpTime,
        // The actual times for the tooltip
        sleepTimeFormatted: new Date(entry.sleepTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        wakeUpTimeFormatted: entry.wakeUpTime
          ? new Date(entry.wakeUpTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'N/A',
      };
    })
    .reverse();

  // AMOLED Styles
  const amoledColors = {
    background: '#000000',
    cardBg: '#0D0D0D',
    text: '#E2E8F0',
    textSecondary: '#94A3B8',
    border: '#1E1E1E',
    accent: '#A855F7',
    buttonBg: '#1A1A1A',
    accordionBg: '#0D0D0D',
    accordionHoverBg: '#1A1A1A',
    // Primary button colors (for sleep actions)
    primaryButtonBg: '#1E1B4B', // Deep indigo
    primaryButtonBorder: '#818CF8', // Bright indigo
    primaryButtonText: '#A5B4FC', // Light indigo
    primaryButtonHoverBg: '#2E2B5B',
    // Secondary button colors (for custom time actions)
    secondaryButtonBg: '#1B1B1B', // Deep gray
    secondaryButtonBorder: '#6B7280', // Medium gray
    secondaryButtonText: '#9CA3AF', // Light gray
    secondaryButtonHoverBg: '#2B2B2B',
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? amoledColors.cardBg : '#ffffff',
    color: isDarkMode ? amoledColors.text : '#000000',
    border: `1px solid ${isDarkMode ? amoledColors.border : '#e2e8f0'}`,
    boxShadow: isDarkMode
      ? '0 4px 20px rgba(0, 0, 0, 0.5)'
      : '0 4px 15px rgba(0,0,0,0.1)',
  };

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: isDarkMode ? amoledColors.background : '#f8f9fa',
    color: isDarkMode ? amoledColors.text : '#000000',
    padding: '1rem',
  };

  const accordionHeaderStyle = {
    backgroundColor: isDarkMode ? amoledColors.cardBg : '#ffffff',
    color: isDarkMode ? amoledColors.text : '#000000',
    border: 'none',
    padding: '1rem',
  };

  const accordionButtonStyle = {
    backgroundColor: isDarkMode ? amoledColors.buttonBg : '#ffffff',
    color: isDarkMode ? amoledColors.text : '#000000',
    border: `1px solid ${isDarkMode ? amoledColors.border : '#e2e8f0'}`,
    borderRadius: '0.375rem',
    padding: '1rem',
    width: '100%',
    textAlign: 'left',
    '&:not(.collapsed)': {
      backgroundColor: isDarkMode ? amoledColors.buttonBg : '#ffffff',
      color: isDarkMode ? amoledColors.text : '#000000',
    },
    '&:focus': {
      backgroundColor: isDarkMode ? amoledColors.buttonBg : '#ffffff',
      color: isDarkMode ? amoledColors.text : '#000000',
    },
    '&:hover': {
      backgroundColor: isDarkMode ? amoledColors.buttonBg : '#ffffff',
      color: isDarkMode ? amoledColors.text : '#000000',
    },
  };

  const baseButtonStyle = {
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    minWidth: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
  };

  const primaryButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: isDarkMode ? amoledColors.primaryButtonBg : '#ffffff',
    border: `2px solid ${
      isDarkMode ? amoledColors.primaryButtonBorder : '#0d6efd'
    }`,
    color: isDarkMode ? amoledColors.primaryButtonText : '#0d6efd',
    '&:hover': {
      backgroundColor: isDarkMode
        ? amoledColors.primaryButtonHoverBg
        : '#f8f9fa',
      transform: 'translateY(-2px)',
      boxShadow: isDarkMode
        ? '0 4px 12px rgba(129, 140, 248, 0.2)'
        : '0 4px 12px rgba(13, 110, 253, 0.2)',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
    },
  };

  const secondaryButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: isDarkMode ? amoledColors.secondaryButtonBg : '#ffffff',
    border: `2px solid ${
      isDarkMode ? amoledColors.secondaryButtonBorder : '#6c757d'
    }`,
    color: isDarkMode ? amoledColors.secondaryButtonText : '#6c757d',
    '&:hover': {
      backgroundColor: isDarkMode
        ? amoledColors.secondaryButtonHoverBg
        : '#f8f9fa',
      transform: 'translateY(-2px)',
      boxShadow: isDarkMode
        ? '0 4px 12px rgba(107, 114, 128, 0.2)'
        : '0 4px 12px rgba(108, 117, 125, 0.2)',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
    },
  };

  return (
    <Container fluid className='p-0' style={containerStyle}>
      <style>
        {`
          @media (max-width: 576px) {
            .sleep-hero-buttons {
              flex-direction: column !important;
              gap: 0.75rem !important;
            }
            .sleep-hero-buttons .btn {
              width: 100% !important;
              max-width: 300px !important;
            }
          }

          @media (max-width: 380px) {
            .sleep-hero-buttons .btn {
              font-size: 0.9rem !important;
              padding: 0.6rem 1rem !important;
            }
          }

          @media (min-width: 577px) and (max-width: 768px) {
            .sleep-hero-buttons {
              flex-wrap: wrap !important;
            }
            .sleep-hero-buttons .btn {
              min-width: 140px !important;
            }
          }
        `}
      </style>
      <h1
        className='my-4'
        style={{ color: isDarkMode ? amoledColors.text : '#000000' }}
      >
        Sleep Tracker
      </h1>
      <Card
        className='mb-4'
        style={{
          ...cardStyle,
          padding: '2rem',
          borderRadius: '20px',
          boxShadow: isDarkMode
            ? '0 4px 20px rgba(0, 0, 0, 0.5)'
            : '0 4px 15px rgba(0,0,0,0.1)',
        }}
      >
        <Card.Body
          style={{
            backgroundColor: isDarkMode ? amoledColors.cardBg : '#ffffff',
            textAlign: 'center',
          }}
        >
          {isLoadingCurrent ? (
            <Loader />
          ) : currentSleep ? (
            <div className='d-flex flex-column align-items-center'>
              <Card.Text
                style={{
                  color: isDarkMode ? amoledColors.text : '#000000',
                  fontSize: '1.25rem',
                  marginBottom: '2rem',
                }}
              >
                You went to sleep at{' '}
                <span
                  style={{
                    color: isDarkMode
                      ? amoledColors.primaryButtonText
                      : '#0d6efd',
                    fontWeight: '600',
                  }}
                >
                  {new Date(currentSleep.sleepTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </Card.Text>
              <div
                className='d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 sleep-hero-buttons'
                style={{ width: '100%', maxWidth: '700px' }}
              >
                <Button
                  variant={isDarkMode ? 'outline-primary' : 'primary'}
                  onClick={() => handleEndSleep()}
                  disabled={isEndingSleep || isSkipping}
                  size='lg'
                  style={{
                    ...primaryButtonStyle,
                    minWidth: isMobile ? '280px' : '200px',
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
                  }}
                >
                  {isEndingSleep ? (
                    <Spinner as='span' animation='border' size='sm' />
                  ) : (
                    <FaSun size={20} />
                  )}{' '}
                  I Just Woke Up
                </Button>
                <Button
                  variant={
                    isDarkMode ? 'outline-secondary' : 'outline-secondary'
                  }
                  onClick={() => openCustomTimeModal('wakeup')}
                  disabled={isEndingSleep || isSkipping}
                  size={isMobile ? 'md' : 'lg'}
                  style={{
                    ...secondaryButtonStyle,
                    minWidth: isMobile ? '160px' : '180px',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                  }}
                >
                  <FaClock size={16} /> Custom Time
                </Button>
                <Button
                  variant={isDarkMode ? 'outline-warning' : 'outline-warning'}
                  onClick={handleSkipPhase}
                  disabled={isEndingSleep || isSkipping}
                  size={isMobile ? 'md' : 'lg'}
                  style={{
                    ...secondaryButtonStyle,
                    minWidth: isMobile ? '140px' : '160px',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                    borderColor: isDarkMode ? '#F59E0B' : '#ffc107',
                    color: isDarkMode ? '#FCD34D' : '#856404',
                  }}
                >
                  {isSkipping ? (
                    <Spinner as='span' animation='border' size='sm' />
                  ) : (
                    <FaForward size={16} />
                  )}{' '}
                  Skip Wake-up
                </Button>
              </div>
            </div>
          ) : (
            <div className='d-flex flex-column align-items-center'>
              <Card.Text
                style={{
                  color: isDarkMode ? amoledColors.text : '#000000',
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '500',
                  marginBottom: '2rem',
                  textAlign: 'center',
                }}
              >
                Ready for bed?
              </Card.Text>
              <div
                className='d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 sleep-hero-buttons'
                style={{ width: '100%', maxWidth: '700px' }}
              >
                <Button
                  variant={isDarkMode ? 'outline-primary' : 'primary'}
                  onClick={() => handleStartSleep()}
                  disabled={isStartingSleep || isSkipping}
                  size='lg'
                  style={{
                    ...primaryButtonStyle,
                    minWidth: isMobile ? '280px' : '200px',
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
                  }}
                >
                  {isStartingSleep ? (
                    <Spinner as='span' animation='border' size='sm' />
                  ) : (
                    <FaBed size={20} />
                  )}{' '}
                  I'm Going to Sleep
                </Button>
                <Button
                  variant={
                    isDarkMode ? 'outline-secondary' : 'outline-secondary'
                  }
                  onClick={() => openCustomTimeModal('sleep')}
                  disabled={isStartingSleep || isSkipping}
                  size={isMobile ? 'md' : 'lg'}
                  style={{
                    ...secondaryButtonStyle,
                    minWidth: isMobile ? '160px' : '180px',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                  }}
                >
                  <FaClock size={16} /> Custom Time
                </Button>
                <Button
                  variant={isDarkMode ? 'outline-warning' : 'outline-warning'}
                  onClick={handleSkipPhase}
                  disabled={isStartingSleep || isSkipping}
                  size={isMobile ? 'md' : 'lg'}
                  style={{
                    ...secondaryButtonStyle,
                    minWidth: isMobile ? '140px' : '160px',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                    borderColor: isDarkMode ? '#F59E0B' : '#ffc107',
                    color: isDarkMode ? '#FCD34D' : '#856404',
                  }}
                >
                  {isSkipping ? (
                    <Spinner as='span' animation='border' size='sm' />
                  ) : (
                    <FaForward size={16} />
                  )}{' '}
                  Skip Sleep
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <Row>
        <Col md={12}>
          <h2
            className='mt-5'
            style={{ color: isDarkMode ? amoledColors.text : '#000000' }}
          >
            Sleep Progress & History
          </h2>
          {isLoading ? (
            <Loader />
          ) : error ? (
            <Message variant='danger'>
              {error?.data?.message || error.error}
            </Message>
          ) : (
            <>
              <Card className='mb-4' style={cardStyle}>
                <Card.Body
                  style={{
                    backgroundColor: isDarkMode
                      ? amoledColors.cardBg
                      : '#ffffff',
                  }}
                >
                  <h4
                    className='mb-4 text-center'
                    style={{
                      color: isDarkMode ? amoledColors.text : '#000000',
                    }}
                  >
                    Sleep Pattern Analysis
                  </h4>
                  {chartData && chartData.length > 0 ? (
                    <ResponsiveContainer width='100%' height={400}>
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray='3 3'
                          stroke={isDarkMode ? amoledColors.border : '#ccc'}
                        />
                        <XAxis
                          dataKey='date'
                          stroke={
                            isDarkMode ? amoledColors.textSecondary : '#666'
                          }
                        />
                        <YAxis
                          yAxisId='left'
                          label={{
                            value: 'Duration (hrs)',
                            angle: -90,
                            position: 'insideLeft',
                            fill: isDarkMode ? amoledColors.text : '#333',
                          }}
                          stroke={
                            isDarkMode ? amoledColors.textSecondary : '#666'
                          }
                        />
                        <YAxis
                          yAxisId='right'
                          orientation='right'
                          label={{
                            value: 'Time of Day (24h)',
                            angle: 90,
                            position: 'insideRight',
                            fill: isDarkMode ? amoledColors.text : '#333',
                          }}
                          stroke={
                            isDarkMode ? amoledColors.textSecondary : '#666'
                          }
                          domain={[0, 36]}
                          ticks={[0, 6, 12, 18, 24, 30, 36]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDarkMode
                              ? amoledColors.cardBg
                              : 'white',
                            border: `1px solid ${
                              isDarkMode ? amoledColors.border : '#ccc'
                            }`,
                            color: isDarkMode ? amoledColors.text : '#333',
                          }}
                          formatter={(value, name, props) => {
                            if (name === 'Sleep Time')
                              return props.payload.sleepTimeFormatted;
                            if (name === 'Wake Up Time')
                              return props.payload.wakeUpTimeFormatted;
                            if (name === 'Duration')
                              return `${(value || 0).toFixed(1)} hours`;
                            return value;
                          }}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend
                          wrapperStyle={{
                            color: isDarkMode ? amoledColors.text : '#333',
                          }}
                        />
                        <Line
                          yAxisId='left'
                          type='monotone'
                          dataKey='duration'
                          stroke='#A855F7'
                          name='Duration'
                          strokeWidth={2}
                          dot={{ fill: amoledColors.accent }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          yAxisId='right'
                          type='monotone'
                          dataKey='sleepTime'
                          stroke='#34D399'
                          name='Sleep Time'
                          strokeWidth={2}
                          dot={{ fill: '#34D399' }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          yAxisId='right'
                          type='monotone'
                          dataKey='wakeUpTime'
                          stroke='#FBBF24'
                          name='Wake Up Time'
                          strokeWidth={2}
                          dot={{ fill: '#FBBF24' }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Message>
                      Not enough sleep data to show a chart. Start tracking your
                      sleep to see your progress!
                    </Message>
                  )}
                </Card.Body>
              </Card>

              <Accordion className='custom-accordion'>
                {data?.sleepEntries?.map((entry) => (
                  <Accordion.Item
                    key={entry._id}
                    eventKey={entry._id}
                    style={{
                      backgroundColor: isDarkMode
                        ? amoledColors.accordionBg
                        : '#ffffff',
                      border: `1px solid ${
                        isDarkMode ? amoledColors.border : '#e2e8f0'
                      }`,
                      marginBottom: '0.5rem',
                      borderRadius: '0.375rem',
                    }}
                    className='custom-accordion-item'
                  >
                    <style>
                      {`
                                .custom-accordion .accordion-button {
                                    background-color: ${
                                      isDarkMode
                                        ? amoledColors.accordionBg
                                        : '#ffffff'
                                    } !important;
                                    color: ${
                                      isDarkMode ? amoledColors.text : '#000000'
                                    } !important;
                                }
                                .custom-accordion .accordion-button:not(.collapsed) {
                                    background-color: ${
                                      isDarkMode
                                        ? amoledColors.accordionBg
                                        : '#ffffff'
                                    } !important;
                                    color: ${
                                      isDarkMode ? amoledColors.text : '#000000'
                                    } !important;
                                }
                                .custom-accordion .accordion-button:hover {
                                    background-color: ${
                                      isDarkMode
                                        ? amoledColors.accordionHoverBg
                                        : '#f8f9fa'
                                    } !important;
                                }
                                .custom-accordion .accordion-button::after {
                                    filter: ${
                                      isDarkMode ? 'invert(1)' : 'none'
                                    };
                                }
                                .custom-accordion .accordion-body {
                                    background-color: ${
                                      isDarkMode
                                        ? amoledColors.accordionBg
                                        : '#ffffff'
                                    } !important;
                                    color: ${
                                      isDarkMode ? amoledColors.text : '#000000'
                                    } !important;
                                }
                            `}
                    </style>
                    <Accordion.Header
                      style={{
                        backgroundColor: isDarkMode
                          ? amoledColors.accordionBg
                          : '#ffffff',
                        color: isDarkMode ? amoledColors.text : '#000000',
                        border: 'none',
                        padding: '1rem',
                      }}
                      className='custom-accordion-header'
                    >
                      <div className='w-100'>
                        <Row className='align-items-center text-center'>
                          <Col xs={10}>
                            <strong
                              style={{
                                color: isDarkMode ? amoledColors.text : '#000',
                              }}
                            >
                              {new Date(entry.date).toLocaleDateString(
                                'en-US',
                                {
                                  weekday: 'long',
                                  month: 'long',
                                  day: 'numeric',
                                }
                              )}
                            </strong>
                          </Col>
                          <Col xs={2} className='text-end'>
                            <Dropdown onClick={(e) => e.stopPropagation()}>
                              <Dropdown.Toggle
                                as='a'
                                style={{ cursor: 'pointer' }}
                              >
                                <FaEllipsisV
                                  color={
                                    isDarkMode
                                      ? amoledColors.textSecondary
                                      : '#6c757d'
                                  }
                                />
                              </Dropdown.Toggle>
                              <Dropdown.Menu
                                variant={isDarkMode ? 'dark' : 'light'}
                                style={{
                                  backgroundColor: isDarkMode
                                    ? amoledColors.buttonBg
                                    : '#ffffff',
                                }}
                              >
                                <Dropdown.Item
                                  onClick={() => openEditModal(entry)}
                                  style={{
                                    color: isDarkMode
                                      ? amoledColors.text
                                      : '#000',
                                  }}
                                >
                                  <FaEdit className='me-2' /> Edit
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => handleDelete(entry._id)}
                                  className='text-danger'
                                >
                                  <FaTrash className='me-2' /> Delete
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </Col>
                        </Row>
                        <Row
                          className='align-items-center text-center mt-2'
                          style={{
                            color: isDarkMode
                              ? amoledColors.textSecondary
                              : '#6c757d',
                          }}
                        >
                          <Col>
                            <FaBed size={20} className='me-2' color='#5865F2' />
                            <div>Slept At</div>
                            <strong
                              style={{
                                color: isDarkMode ? amoledColors.text : '#000',
                              }}
                            >
                              {entry.skippedSleep ? (
                                <span
                                  style={{ fontStyle: 'italic', opacity: 0.7 }}
                                >
                                  Skipped
                                </span>
                              ) : (
                                new Date(entry.sleepTime).toLocaleTimeString(
                                  [],
                                  { hour: '2-digit', minute: '2-digit' }
                                )
                              )}
                            </strong>
                          </Col>
                          <Col>
                            {entry.wakeUpTime ? (
                              <>
                                <FaSun
                                  size={isMobile ? 16 : 20}
                                  className='me-2'
                                  color='#FEE75C'
                                />
                                <div
                                  style={{
                                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                                  }}
                                >
                                  Woke Up At
                                </div>
                                <strong
                                  style={{
                                    color: isDarkMode
                                      ? amoledColors.text
                                      : '#000',
                                    fontSize: isMobile ? '0.9rem' : '1rem',
                                  }}
                                >
                                  {entry.skippedWakeUp ? (
                                    <span
                                      style={{
                                        fontStyle: 'italic',
                                        opacity: 0.7,
                                      }}
                                    >
                                      Skipped
                                    </span>
                                  ) : (
                                    new Date(
                                      entry.wakeUpTime
                                    ).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  )}
                                </strong>
                              </>
                            ) : (
                              <div
                                style={{
                                  color: isDarkMode
                                    ? amoledColors.textSecondary
                                    : '#6c757d',
                                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                                }}
                              >
                                Currently Sleeping...
                              </div>
                            )}
                          </Col>
                          <Col className={isMobile ? 'mb-2' : ''}>
                            {entry.duration ? (
                              <>
                                <FaClock
                                  size={isMobile ? 16 : 20}
                                  className='me-2'
                                  color='#57F287'
                                />
                                <div
                                  style={{
                                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                                  }}
                                >
                                  Duration
                                </div>
                                <strong
                                  style={{
                                    color: isDarkMode
                                      ? amoledColors.text
                                      : '#000',
                                    fontSize: isMobile ? '0.9rem' : '1rem',
                                  }}
                                >
                                  {(entry.duration / 60).toFixed(1)} hrs
                                </strong>
                              </>
                            ) : (
                              <div
                                style={{
                                  color: isDarkMode
                                    ? amoledColors.textSecondary
                                    : '#6c757d',
                                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                                }}
                              >
                                -
                              </div>
                            )}
                          </Col>
                        </Row>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body
                      style={{
                        backgroundColor: isDarkMode
                          ? amoledColors.accordionBg
                          : '#ffffff',
                        color: isDarkMode ? amoledColors.text : '#000000',
                        borderTop: `1px solid ${
                          isDarkMode ? amoledColors.border : '#e2e8f0'
                        }`,
                      }}
                    >
                      <Row>
                        <Col>
                          <strong
                            style={{
                              color: isDarkMode ? amoledColors.text : '#000',
                            }}
                          >
                            Quality:
                          </strong>{' '}
                          <span
                            style={{
                              color: isDarkMode
                                ? amoledColors.textSecondary
                                : '#6c757d',
                            }}
                          >
                            Not tracked
                          </span>
                        </Col>
                        <Col>
                          <strong
                            style={{
                              color: isDarkMode ? amoledColors.text : '#000',
                            }}
                          >
                            Interruptions:
                          </strong>{' '}
                          <span
                            style={{
                              color: isDarkMode
                                ? amoledColors.textSecondary
                                : '#6c757d',
                            }}
                          >
                            Not tracked
                          </span>
                        </Col>
                      </Row>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </>
          )}
        </Col>
      </Row>

      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        contentClassName={isDarkMode ? 'bg-dark' : ''}
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: isDarkMode ? amoledColors.cardBg : '#ffffff',
            color: isDarkMode ? amoledColors.text : '#000000',
            borderBottom: `1px solid ${
              isDarkMode ? amoledColors.border : '#dee2e6'
            }`,
          }}
        >
          <Modal.Title
            style={{ color: isDarkMode ? amoledColors.text : '#000000' }}
          >
            Edit Sleep Entry
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: isDarkMode ? amoledColors.cardBg : '#ffffff',
          }}
        >
          <Form onSubmit={handleUpdate}>
            <Form.Group className='mb-3' controlId='editDate'>
              <Form.Label
                style={{ color: isDarkMode ? amoledColors.text : '#000000' }}
              >
                Date
              </Form.Label>
              <Form.Control
                type='date'
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                style={{
                  backgroundColor: isDarkMode
                    ? amoledColors.buttonBg
                    : '#ffffff',
                  color: isDarkMode ? amoledColors.text : '#000000',
                  border: `1px solid ${
                    isDarkMode ? amoledColors.border : '#dee2e6'
                  }`,
                }}
              />
            </Form.Group>
            <Form.Group className='mb-3' controlId='editSleepTime'>
              <Form.Label
                style={{ color: isDarkMode ? amoledColors.text : '#000000' }}
              >
                Sleep Time
              </Form.Label>
              <Form.Control
                type='datetime-local'
                value={editSleepTime}
                onChange={(e) => setEditSleepTime(e.target.value)}
                style={{
                  backgroundColor: isDarkMode
                    ? amoledColors.buttonBg
                    : '#ffffff',
                  color: isDarkMode ? amoledColors.text : '#000000',
                  border: `1px solid ${
                    isDarkMode ? amoledColors.border : '#dee2e6'
                  }`,
                }}
              />
            </Form.Group>
            <Form.Group className='mb-3' controlId='editWakeUpTime'>
              <Form.Label
                style={{ color: isDarkMode ? amoledColors.text : '#000000' }}
              >
                Wake Up Time
              </Form.Label>
              <Form.Control
                type='datetime-local'
                value={editWakeUpTime}
                onChange={(e) => setEditWakeUpTime(e.target.value)}
                style={{
                  backgroundColor: isDarkMode
                    ? amoledColors.buttonBg
                    : '#ffffff',
                  color: isDarkMode ? amoledColors.text : '#000000',
                  border: `1px solid ${
                    isDarkMode ? amoledColors.border : '#dee2e6'
                  }`,
                }}
              />
            </Form.Group>
            <Button
              variant={isDarkMode ? 'outline-primary' : 'primary'}
              type='submit'
              disabled={isUpdating}
              style={
                isDarkMode
                  ? {
                      backgroundColor: amoledColors.buttonBg,
                      borderColor: '#0d6efd',
                      color: '#0d6efd',
                    }
                  : {}
              }
            >
              {isUpdating ? (
                <Spinner as='span' animation='border' size='sm' />
              ) : (
                'Save Changes'
              )}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal
        show={showCustomTimeModal}
        onHide={() => setShowCustomTimeModal(false)}
        centered
        contentClassName={isDarkMode ? 'bg-dark' : ''}
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: isDarkMode ? amoledColors.cardBg : '#ffffff',
            color: isDarkMode ? amoledColors.text : '#000000',
            borderBottom: `1px solid ${
              isDarkMode ? amoledColors.border : '#dee2e6'
            }`,
          }}
        >
          <Modal.Title
            style={{ color: isDarkMode ? amoledColors.text : '#000000' }}
          >
            Enter Custom {customTimeType === 'sleep' ? 'Sleep' : 'Wake-up'} Time
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: isDarkMode ? amoledColors.cardBg : '#ffffff',
          }}
        >
          <Form onSubmit={handleCustomTimeSubmit}>
            <Form.Group className='mb-3' controlId='customTime'>
              <Form.Label
                style={{ color: isDarkMode ? amoledColors.text : '#000000' }}
              >
                Time
              </Form.Label>
              <Form.Control
                type='datetime-local'
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                style={{
                  backgroundColor: isDarkMode
                    ? amoledColors.buttonBg
                    : '#ffffff',
                  color: isDarkMode ? amoledColors.text : '#000000',
                  border: `1px solid ${
                    isDarkMode ? amoledColors.border : '#dee2e6'
                  }`,
                }}
              />
            </Form.Group>
            <Button
              variant={isDarkMode ? 'outline-primary' : 'primary'}
              type='submit'
              style={primaryButtonStyle}
            >
              Set Time
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SleepTrackerScreen;
