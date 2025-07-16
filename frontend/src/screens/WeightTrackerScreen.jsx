import React, { useState, useEffect } from 'react';
import {
  Form,
  Button,
  Row,
  Col,
  Container,
  Card,
  Spinner,
  Modal,
  Dropdown,
} from 'react-bootstrap';
import {
  useCreateWeightEntryMutation,
  useGetWeightEntriesQuery,
  useGetLatestWeightQuery,
  useUpdateWeightEntryMutation,
  useDeleteWeightEntryMutation,
} from '../slices/weightApiSlice';
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
  FaWeight,
  FaEdit,
  FaTrash,
  FaEllipsisV,
  FaClock,
} from 'react-icons/fa';

const WeightTrackerScreen = () => {
  // State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editUnit, setEditUnit] = useState('kg');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newUnit, setNewUnit] = useState('kg');
  const [customTime, setCustomTime] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // API Hooks
  const { data, isLoading, error, refetch } = useGetWeightEntriesQuery();
  const { data: latestWeight, refetch: refetchLatest } =
    useGetLatestWeightQuery();
  const [createWeightEntry, { isLoading: isCreating }] =
    useCreateWeightEntryMutation();
  const [updateWeightEntry, { isLoading: isUpdating }] =
    useUpdateWeightEntryMutation();
  const [deleteWeightEntry, { isLoading: isDeleting }] =
    useDeleteWeightEntryMutation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

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
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handlers
  const handleAddWeight = async () => {
    try {
      await createWeightEntry({
        weight: Number(newWeight),
        unit: newUnit,
        date: new Date(),
      }).unwrap();
      toast.success('Weight entry added!');
      setNewWeight('');
      refetch();
      refetchLatest();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleCustomTimeSubmit = async (e) => {
    e.preventDefault();
    try {
      await createWeightEntry({
        weight: Number(newWeight),
        unit: newUnit,
        date: new Date(customTime),
      }).unwrap();
      toast.success('Weight entry added!');
      setNewWeight('');
      setShowCustomTimeModal(false);
      refetch();
      refetchLatest();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this weight entry?')) {
      try {
        await deleteWeightEntry(id).unwrap();
        toast.success('Weight entry deleted.');
        refetch();
        refetchLatest();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateWeightEntry({
        id: selectedEntry._id,
        weight: Number(editWeight),
        unit: editUnit,
        date: editDate,
        notes: editNotes,
      }).unwrap();
      toast.success('Weight entry updated.');
      setShowEditModal(false);
      setSelectedEntry(null);
      refetch();
      refetchLatest();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const openEditModal = (entry) => {
    setSelectedEntry(entry);
    setEditWeight(entry.weight.toString());
    setEditUnit(entry.unit);
    setEditDate(new Date(entry.date).toISOString().slice(0, 10));
    setEditNotes(entry.notes || '');
    setShowEditModal(true);
  };

  const openCustomTimeModal = () => {
    setCustomTime(new Date().toISOString().slice(0, 16));
    setShowCustomTimeModal(true);
  };

  // Chart Data - memoize to prevent re-initialization issues
  const chartData = React.useMemo(() => {
    if (!data?.weightEntries) return [];

    return data.weightEntries
      .map((entry) => ({
        date: new Date(entry.date).toLocaleDateString(),
        weight: entry.weight,
        unit: entry.unit,
      }))
      .reverse();
  }, [data?.weightEntries]);

  // Updated AMOLED Styles
  const amoledColors = {
    background: '#000000',
    cardBg: '#121212',
    text: '#F8F9FA',
    textSecondary: '#9CA3AF',
    border: '#222222',
    accent: '#A855F7',
    buttonBg: '#1A1A1A',
    buttonHover: '#2A2A2A',
  };

  const containerStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
    minHeight: '100vh',
    transition: 'background-color 0.3s ease',
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    border: `1px solid ${isDarkMode ? '#222222' : '#e2e8f0'}`,
    transition: 'all 0.3s ease',
  };

  // Add this function to calculate the Y-axis domain
  const calculateYAxisDomain = (data) => {
    if (!data || data.length === 0) return [0, 100];

    const weights = data.map((entry) => entry.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const padding = (maxWeight - minWeight) * 0.1; // Add 10% padding

    return [
      Math.max(0, Math.floor(minWeight - padding)), // Don't go below 0
      Math.ceil(maxWeight + padding),
    ];
  };

  const renderWeightCard = (entry) => (
    <Card className='mb-3' style={cardStyle} key={entry._id}>
      <Card.Body>
        <Row>
          <Col xs={10}>
            <Card.Title>
              {new Date(entry.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Card.Title>
          </Col>
          <Col xs={2} className='text-end'>
            <Dropdown>
              <Dropdown.Toggle as='a' style={{ cursor: 'pointer' }}>
                <FaEllipsisV
                  color={isDarkMode ? amoledColors.textSecondary : '#6c757d'}
                />
              </Dropdown.Toggle>
              <Dropdown.Menu variant={isDarkMode ? 'dark' : 'light'}>
                <Dropdown.Item onClick={() => openEditModal(entry)}>
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
        <Row className='align-items-center text-center mt-2'>
          <Col>
            <FaWeight size={20} className='me-2' color='#5865F2' />
            <div>Weight</div>
            <strong>
              {entry.weight} {entry.unit}
            </strong>
          </Col>
          {entry.notes && (
            <Col>
              <div className='text-muted'>{entry.notes}</div>
            </Col>
          )}
        </Row>
      </Card.Body>
    </Card>
  );

  return (
    <Container
      fluid
      className='px-1'
      style={{
        ...containerStyle,
      }}
    >
      <Row className='g-3'>
        {/* Left Column - Weight Input and Latest Weight */}
        <Col lg={4}>
          {/* Weight Input Card */}
          <Card
            style={{
              ...cardStyle,
              background: isDarkMode
                ? 'linear-gradient(145deg, #121212 0%, #1A1A1A 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              border: 'none',
              borderRadius: '1rem',
              padding: '0',
              overflow: 'hidden',
              height: 'auto',
              boxShadow: isDarkMode
                ? '0 4px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                : '0 4px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            }}
          >
            <Card.Body style={{ padding: '1.5rem' }}>
              <h4
                className='text-center mb-4'
                style={{
                  color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                }}
              >
                Record Weight
              </h4>

              <div className='d-flex flex-column gap-3'>
                <div className='d-flex gap-2'>
                  <Form.Control
                    type='number'
                    step='0.1'
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder='Enter weight'
                    style={{
                      backgroundColor: isDarkMode ? '#1A1A1A' : '#ffffff',
                      border: `1px solid ${isDarkMode ? '#333333' : '#e2e8f0'}`,
                      color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                      transition: 'all 0.3s ease',
                    }}
                  />
                  <Form.Select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    style={{
                      width: 'auto',
                      backgroundColor: isDarkMode ? '#1A1A1A' : '#ffffff',
                      border: `1px solid ${isDarkMode ? '#333333' : '#e2e8f0'}`,
                      color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <option value='kg'>kg</option>
                    <option value='lbs'>lbs</option>
                  </Form.Select>
                </div>

                <Button
                  variant={isDarkMode ? 'outline-light' : 'primary'}
                  onClick={handleAddWeight}
                  disabled={!newWeight || isCreating}
                  className='w-100'
                  style={{
                    backgroundColor: isDarkMode ? '#1A1A1A' : undefined,
                    border: `1px solid ${
                      isDarkMode ? '#333333' : 'transparent'
                    }`,
                    padding: '0.75rem',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {isCreating ? (
                    <Spinner as='span' animation='border' size='sm' />
                  ) : (
                    <>
                      <FaWeight size={16} />
                      <span>Add Weight</span>
                    </>
                  )}
                </Button>

                <Button
                  variant='link'
                  onClick={openCustomTimeModal}
                  className='mt-2'
                  style={{
                    color: isDarkMode ? '#9CA3AF' : '#4B5563',
                    textDecoration: 'none',
                    padding: 0,
                    fontSize: '0.9rem',
                  }}
                >
                  <FaClock size={12} className='me-1' />
                  Set Custom Time
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Latest Weight Card */}
          {latestWeight && (
            <Card
              className='mt-3'
              style={{
                ...cardStyle,
                background: isDarkMode
                  ? 'linear-gradient(145deg, #121212 0%, #1A1A1A 100%)'
                  : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: 'none',
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: isDarkMode
                  ? '0 4px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 4px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              }}
            >
              <Card.Body className='text-center' style={{ padding: '1.5rem' }}>
                <h4
                  style={{
                    color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    marginBottom: '1rem',
                  }}
                >
                  Latest Weight
                </h4>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                    marginBottom: '0.5rem',
                  }}
                >
                  {latestWeight.weight} {latestWeight.unit}
                </div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: isDarkMode ? '#9CA3AF' : '#6B7280',
                  }}
                >
                  Recorded on {new Date(latestWeight.date).toLocaleDateString()}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Right Column - Weight Chart */}
        <Col lg={8}>
          <Card
            style={{
              ...cardStyle,
              background: isDarkMode
                ? 'linear-gradient(145deg, #121212 0%, #1A1A1A 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              border: 'none',
              borderRadius: '1rem',
              padding: '0',
              overflow: 'hidden',
              height: '100%',
              boxShadow: isDarkMode
                ? '0 4px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                : '0 4px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            }}
          >
            <Card.Body
              style={{
                padding: '1.5rem',
                '@media (min-width: 768px)': {
                  padding: '2rem',
                },
              }}
            >
              <h4
                className='mb-4 text-center'
                style={{
                  color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  '@media (min-width: 768px)': {
                    fontSize: '1.5rem',
                  },
                }}
              >
                Weight Progress
              </h4>

              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer
                  width='100%'
                  height={400}
                  key='weight-chart'
                >
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray='3 3'
                      stroke={isDarkMode ? '#222222' : '#e5e7eb'}
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey='date'
                      stroke={isDarkMode ? '#9CA3AF' : '#4B5563'}
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor='end'
                      height={60}
                    />
                    <YAxis
                      stroke={isDarkMode ? '#9CA3AF' : '#4B5563'}
                      domain={calculateYAxisDomain(chartData)}
                      tick={{ fontSize: 12 }}
                      width={40}
                      label={{
                        value: `Weight (${chartData[0]?.unit || 'kg'})`,
                        angle: -90,
                        position: 'insideLeft',
                        fill: isDarkMode ? '#9CA3AF' : '#4B5563',
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#1A1A1A' : '#ffffff',
                        border: `1px solid ${
                          isDarkMode ? '#222222' : '#e5e7eb'
                        }`,
                        color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                        fontSize: '0.9rem',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Line
                      type='monotone'
                      dataKey='weight'
                      stroke='#A855F7'
                      strokeWidth={2}
                      dot={{ fill: '#A855F7', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Message>Not enough weight data to show a chart.</Message>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Weight History Section */}
      <Row className='mt-4'>
        <Col xs={12}>
          <h2
            style={{
              color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
              fontSize: '1.25rem',
              fontWeight: '500',
              marginBottom: '1rem',
              '@media (min-width: 768px)': {
                fontSize: '1.75rem',
                marginBottom: '1.5rem',
              },
            }}
          >
            Weight History
          </h2>
        </Col>
      </Row>

      <Row className='g-3'>
        {data?.weightEntries?.map((entry) => (
          <Col xs={12} md={6} xl={4} key={entry._id}>
            <Card
              style={{
                ...cardStyle,
                background: isDarkMode
                  ? 'linear-gradient(145deg, #121212 0%, #1A1A1A 100%)'
                  : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: 'none',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                boxShadow: isDarkMode
                  ? '0 4px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 4px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              }}
            >
              <Card.Body style={{ padding: '1.25rem' }}>
                <Row className='align-items-center g-0'>
                  <Col xs={10}>
                    <div
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                      }}
                    >
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </Col>
                  <Col xs={2} className='text-end'>
                    <Dropdown onClick={(e) => e.stopPropagation()}>
                      <Dropdown.Toggle as='a' style={{ cursor: 'pointer' }}>
                        <FaEllipsisV
                          size={14}
                          color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                        />
                      </Dropdown.Toggle>
                      <Dropdown.Menu
                        variant={isDarkMode ? 'dark' : 'light'}
                        style={{
                          backgroundColor: isDarkMode ? '#1A1A1A' : '#ffffff',
                          border: `1px solid ${
                            isDarkMode ? '#222222' : '#e5e7eb'
                          }`,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          borderRadius: '0.5rem',
                          padding: '0.5rem',
                        }}
                      >
                        <Dropdown.Item
                          onClick={() => openEditModal(entry)}
                          className='py-2'
                        >
                          <FaEdit size={14} className='me-2' /> Edit
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => handleDelete(entry._id)}
                          className='text-danger py-2'
                        >
                          <FaTrash size={14} className='me-2' /> Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Col>
                </Row>
                <Row className='text-center mt-3'>
                  <Col>
                    <FaWeight size={16} className='mb-2' color='#5865F2' />
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: isDarkMode ? '#9CA3AF' : '#6B7280',
                      }}
                    >
                      Weight
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                      {entry.weight} {entry.unit}
                    </div>
                  </Col>
                  {entry.notes && (
                    <Col>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: isDarkMode ? '#9CA3AF' : '#6B7280',
                          marginTop: '0.5rem',
                        }}
                      >
                        {entry.notes}
                      </div>
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: isDarkMode ? '#1A1A1A' : '#ffffff',
            borderBottom: `1px solid ${isDarkMode ? '#222222' : '#e5e7eb'}`,
            color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
          }}
        >
          <Modal.Title>Edit Weight Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: isDarkMode ? '#1A1A1A' : '#ffffff',
            color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
          }}
        >
          <Form onSubmit={handleUpdate}>
            <Form.Group className='mb-3'>
              <Form.Label>Weight</Form.Label>
              <div className='d-flex gap-2'>
                <Form.Control
                  type='number'
                  step='0.1'
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  style={{
                    backgroundColor: isDarkMode ? '#121212' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#333333' : '#e2e8f0'}`,
                    color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                  }}
                />
                <Form.Select
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  style={{
                    width: 'auto',
                    backgroundColor: isDarkMode ? '#121212' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#333333' : '#e2e8f0'}`,
                    color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                  }}
                >
                  <option value='kg'>kg</option>
                  <option value='lbs'>lbs</option>
                </Form.Select>
              </div>
            </Form.Group>
            <Form.Group className='mb-3'>
              <Form.Label>Date</Form.Label>
              <Form.Control
                type='date'
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                style={{
                  backgroundColor: isDarkMode ? '#121212' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#333333' : '#e2e8f0'}`,
                  color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                }}
              />
            </Form.Group>
            <Form.Group className='mb-3'>
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as='textarea'
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                style={{
                  backgroundColor: isDarkMode ? '#121212' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#333333' : '#e2e8f0'}`,
                  color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer
          style={{
            backgroundColor: isDarkMode ? '#1A1A1A' : '#ffffff',
            borderTop: `1px solid ${isDarkMode ? '#222222' : '#e5e7eb'}`,
          }}
        >
          <Button variant='secondary' onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Spinner as='span' animation='border' size='sm' />
            ) : (
              'Save Changes'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom Time Modal */}
      <Modal
        show={showCustomTimeModal}
        onHide={() => setShowCustomTimeModal(false)}
        centered
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: isDarkMode ? '#1A1A1A' : '#ffffff',
            borderBottom: `1px solid ${isDarkMode ? '#222222' : '#e5e7eb'}`,
            color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
          }}
        >
          <Modal.Title>Set Custom Time</Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: isDarkMode ? '#1A1A1A' : '#ffffff',
            color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
          }}
        >
          <Form onSubmit={handleCustomTimeSubmit}>
            <Form.Group className='mb-3'>
              <Form.Label>Date and Time</Form.Label>
              <Form.Control
                type='datetime-local'
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                style={{
                  backgroundColor: isDarkMode ? '#121212' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#333333' : '#e2e8f0'}`,
                  color: isDarkMode ? '#F8F9FA' : '#1A1A1A',
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer
          style={{
            backgroundColor: isDarkMode ? '#1A1A1A' : '#ffffff',
            borderTop: `1px solid ${isDarkMode ? '#222222' : '#e5e7eb'}`,
          }}
        >
          <Button
            variant='secondary'
            onClick={() => setShowCustomTimeModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleCustomTimeSubmit}
            disabled={isCreating}
          >
            {isCreating ? (
              <Spinner as='span' animation='border' size='sm' />
            ) : (
              'Add Weight'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default WeightTrackerScreen;
