import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Row, Col } from 'react-bootstrap';
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
import { useGetUserDetailsQuery } from '../../slices/usersApiSlice';
import { useGetWeightEntriesQuery } from '../../slices/weightApiSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';

const AdminUserWeightDashboard = () => {
  const { id: userId } = useParams();
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useGetUserDetailsQuery(userId);
  const {
    data: weightData,
    isLoading: weightLoading,
    error: weightError,
  } = useGetWeightEntriesQuery({ userId });

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

  // AMOLED Styles
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
    boxShadow: isDarkMode
      ? '0 4px 20px rgba(0, 0, 0, 0.5)'
      : '0 4px 15px rgba(0,0,0,0.1)',
  };

  if (userLoading || weightLoading) return <Loader />;
  if (userError)
    return (
      <Message variant='danger'>
        {userError?.data?.message || userError.error}
      </Message>
    );
  if (weightError)
    return (
      <Message variant='danger'>
        {weightError?.data?.message || weightError.error}
      </Message>
    );

  const chartData = weightData?.weightEntries
    ?.map((entry) => ({
      date: new Date(entry.date).toLocaleDateString(),
      weight: entry.weight,
      unit: entry.unit,
    }))
    .reverse();

  return (
    <Container
      fluid
      className='px-1'
      style={{
        backgroundColor: isDarkMode ? amoledColors.background : '#f8f9fa',
        color: isDarkMode ? amoledColors.text : '#000000',
      }}
    >
      <h1 className='my-4'>Weight History - {userData.name}</h1>

      {weightData?.weightEntries?.length > 0 ? (
        <>
          <Card className='mb-4' style={cardStyle}>
            <Card.Body>
              <ResponsiveContainer width='100%' height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke={isDarkMode ? '#2D3748' : '#E2E8F0'}
                  />
                  <XAxis
                    dataKey='date'
                    stroke={isDarkMode ? amoledColors.text : '#4A5568'}
                    tick={{ fill: isDarkMode ? amoledColors.text : '#4A5568' }}
                  />
                  <YAxis
                    stroke={isDarkMode ? amoledColors.text : '#4A5568'}
                    tick={{ fill: isDarkMode ? amoledColors.text : '#4A5568' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode
                        ? amoledColors.cardBg
                        : '#ffffff',
                      border: `1px solid ${
                        isDarkMode ? amoledColors.border : '#e2e8f0'
                      }`,
                      color: isDarkMode ? amoledColors.text : '#000000',
                    }}
                  />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='weight'
                    stroke='#5865F2'
                    strokeWidth={2}
                    dot={{ fill: '#5865F2', strokeWidth: 2 }}
                    name='Weight'
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>

          <Row>
            {weightData.weightEntries.map((entry) => (
              <Col md={6} lg={4} key={entry._id} className='mb-3'>
                <Card style={cardStyle}>
                  <Card.Body>
                    <Card.Title>
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Card.Title>
                    <div className='d-flex justify-content-between align-items-center mt-3'>
                      <div>
                        <strong>
                          {entry.weight} {entry.unit}
                        </strong>
                      </div>
                      <div className='text-muted'>
                        {new Date(entry.date).toLocaleTimeString()}
                      </div>
                    </div>
                    {entry.notes && (
                      <Card.Text className='mt-2 text-muted'>
                        {entry.notes}
                      </Card.Text>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      ) : (
        <Message>No weight entries found for this user.</Message>
      )}
    </Container>
  );
};

export default AdminUserWeightDashboard;
