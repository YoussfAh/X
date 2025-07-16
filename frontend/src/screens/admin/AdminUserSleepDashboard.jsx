import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Form,
  Button,
  Row,
  Col,
  Container,
  Card,
  ListGroup,
} from 'react-bootstrap';
import { useGetAdminUserSleepEntriesQuery } from '../../slices/sleepApiSlice';
import { useGetUserDetailsQuery } from '../../slices/usersApiSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
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

const timeToHours = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const hours = date.getHours() + date.getMinutes() / 60;
  return hours;
};

const AdminUserSleepDashboard = () => {
  const { id: userId } = useParams();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

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

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useGetUserDetailsQuery(userId);

  const { data, isLoading, error, refetch } = useGetAdminUserSleepEntriesQuery({
    userId,
    startDate,
    endDate,
  });

  const chartData = data?.sleepEntries
    ?.map((entry) => {
      const sleepTime = timeToHours(entry.sleepTime);
      let wakeUpTime = timeToHours(entry.wakeUpTime);

      if (wakeUpTime !== null && sleepTime !== null && wakeUpTime < sleepTime) {
        wakeUpTime += 24;
      }

      return {
        date: new Date(entry.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        duration: entry.duration / 60, // in hours
        sleepTime,
        wakeUpTime,
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

  const amoledColors = {
    background: '#000000',
    cardBg: '#0D0D0D',
    text: '#E2E8F0',
    textSecondary: '#94A3B8',
    border: '#1E1E1E',
    accent: '#A855F7',
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? amoledColors.cardBg : '#ffffff',
    color: isDarkMode ? amoledColors.text : '#000000',
    border: `1px solid ${isDarkMode ? amoledColors.border : '#e2e8f0'}`,
  };

  const submitHandler = (e) => {
    e.preventDefault();
    refetch();
  };

  return (
    <Container
      fluid
      className='px-1'
      style={{
        backgroundColor: isDarkMode ? amoledColors.background : '#f8f9fa',
        color: isDarkMode ? amoledColors.text : '#000000',
      }}
    >
      <Link
        to='/admin/userlist'
        className={`btn ${isDarkMode ? 'btn-dark' : 'btn-light'} my-3`}
      >
        Go Back
      </Link>
      <h1>
        Sleep Dashboard for{' '}
        {userLoading ? <Loader /> : userError ? 'User' : user?.name}
      </h1>

      <Card className='my-3' style={cardStyle}>
        <Card.Body>
          <Form onSubmit={submitHandler}>
            <Row>
              <Col md={5}>
                <Form.Group controlId='startDate'>
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type='date'
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={
                      isDarkMode
                        ? {
                            backgroundColor: '#2a2a2a',
                            color: amoledColors.text,
                            border: `1px solid ${amoledColors.border}`,
                          }
                        : {}
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group controlId='endDate'>
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type='date'
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={
                      isDarkMode
                        ? {
                            backgroundColor: '#2a2a2a',
                            color: amoledColors.text,
                            border: `1px solid ${amoledColors.border}`,
                          }
                        : {}
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={2} className='d-flex align-items-end'>
                <Button type='submit' variant='primary' className='w-100'>
                  Filter
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          <h2 className='mt-5'>Sleep Analysis</h2>
          <Card style={cardStyle}>
            <Card.Body>
              <ResponsiveContainer width='100%' height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke={isDarkMode ? amoledColors.border : '#ccc'}
                  />
                  <XAxis
                    dataKey='date'
                    stroke={isDarkMode ? amoledColors.textSecondary : '#666'}
                  />
                  <YAxis
                    yAxisId='left'
                    label={{
                      value: 'Duration (hrs)',
                      angle: -90,
                      position: 'insideLeft',
                      fill: isDarkMode ? amoledColors.text : '#333',
                    }}
                    stroke={isDarkMode ? amoledColors.textSecondary : '#666'}
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
                    stroke={isDarkMode ? amoledColors.textSecondary : '#666'}
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
            </Card.Body>
          </Card>

          <h2 className='mt-5'>Raw Sleep Entries</h2>
          <ListGroup variant='flush'>
            {data.sleepEntries.map((entry) => (
              <ListGroup.Item
                key={entry._id}
                style={{
                  backgroundColor: isDarkMode ? amoledColors.cardBg : 'white',
                  color: isDarkMode ? amoledColors.text : 'black',
                  borderBottom: `1px solid ${
                    isDarkMode ? amoledColors.border : '#dee2e6'
                  }`,
                }}
              >
                <Row>
                  <Col md={3}>
                    <strong>Date:</strong>{' '}
                    {new Date(entry.date).toLocaleDateString()}
                  </Col>
                  <Col md={3}>
                    <strong>Sleep Time:</strong>{' '}
                    {new Date(entry.sleepTime).toLocaleString()}
                  </Col>
                  <Col md={3}>
                    <strong>Wake Up Time:</strong>{' '}
                    {new Date(entry.wakeUpTime).toLocaleString()}
                  </Col>
                  <Col md={3}>
                    <strong>Duration:</strong>{' '}
                    {(entry.duration / 60).toFixed(2)} hours
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </>
      )}
    </Container>
  );
};

export default AdminUserSleepDashboard;
