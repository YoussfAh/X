import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Table,
  Badge,
  Button,
  Row,
  Col,
  Spinner,
  Alert,
  Form,
} from 'react-bootstrap';
import {
  FaCalendarAlt,
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaComments,
  FaExclamationTriangle,
  FaEye,
  FaEdit,
  FaFilter,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { useGetContactFollowUpsQuery } from '../../slices/usersApiSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';

const ContactFollowUpsScreen = () => {
  const [sortBy, setSortBy] = useState('daysOverdue');
  const [filterPriority, setFilterPriority] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { userInfo } = useSelector((state) => state.auth);
  const isDarkMode = userInfo?.preferredTheme === 'dark';

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    data: followUpData,
    isLoading,
    error,
    refetch,
  } = useGetContactFollowUpsQuery();

  // Theme colors
  const colors = {
    cardBg: isDarkMode ? '#1a202c' : '#ffffff',
    cardHeaderBg: isDarkMode ? '#2d3748' : '#f8f9fa',
    text: isDarkMode ? '#e2e8f0' : '#2d3748',
    mutedText: isDarkMode ? '#a0aec0' : '#6b7280',
    border: isDarkMode ? '#4a5568' : '#e2e8f0',
    accent: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    inputBg: isDarkMode ? '#2d3748' : '#ffffff',
  };

  // Contact type configuration
  const contactTypeConfig = {
    phone: { icon: FaPhoneAlt, color: '#10b981', label: 'Phone' },
    email: { icon: FaEnvelope, color: '#3b82f6', label: 'Email' },
    whatsapp: { icon: FaComments, color: '#25d366', label: 'WhatsApp' },
    'in-person': { icon: FaUser, color: '#8b5cf6', label: 'In Person' },
    other: { icon: FaComments, color: '#6b7280', label: 'Other' },
  };

  const renderContactTypeIcon = (type) => {
    const config = contactTypeConfig[type] || contactTypeConfig.other;
    const IconComponent = config.icon;
    return <IconComponent style={{ color: config.color }} size={14} />;
  };

  const getPriorityLevel = (daysOverdue) => {
    if (daysOverdue >= 7) return 'critical';
    if (daysOverdue >= 3) return 'high';
    if (daysOverdue >= 1) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return colors.danger;
      case 'high':
        return '#ff6b35';
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.mutedText;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'critical':
        return 'Critical';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  // Filter and sort follow-ups
  const processedFollowUps =
    followUpData?.followUps
      ?.map((followUp) => ({
        ...followUp,
        priority: getPriorityLevel(followUp.daysOverdue),
      }))
      ?.filter((followUp) => {
        if (filterPriority === 'all') return true;
        return followUp.priority === filterPriority;
      })
      ?.sort((a, b) => {
        switch (sortBy) {
          case 'daysOverdue':
            return b.daysOverdue - a.daysOverdue;
          case 'userName':
            return a.user.name.localeCompare(b.user.name);
          case 'followUpDate':
            return (
              new Date(a.contact.followUpDate) -
              new Date(b.contact.followUpDate)
            );
          case 'priority':
            const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          default:
            return 0;
        }
      }) || [];

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant='danger'>
        Error: {error?.data?.message || error.error}
      </Message>
    );

  return (
    <Container fluid className='px-1'>
      <Card
        style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          boxShadow: isDarkMode
            ? '0 4px 6px rgba(0, 0, 0, 0.3)'
            : '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Card.Header
          style={{
            backgroundColor: colors.cardHeaderBg,
            borderBottom: `1px solid ${colors.border}`,
            padding: '20px',
          }}
        >
          <Row className='align-items-center'>
            <Col>
              <h2
                style={{
                  margin: 0,
                  color: colors.text,
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <FaExclamationTriangle style={{ color: colors.warning }} />
                Contact Follow-ups
                {followUpData?.totalFollowUps > 0 && (
                  <Badge
                    bg='warning'
                    style={{
                      fontSize: '0.8rem',
                      padding: '6px 12px',
                    }}
                  >
                    {followUpData.totalFollowUps} pending
                  </Badge>
                )}
              </h2>
              <p
                style={{
                  margin: '8px 0 0 0',
                  color: colors.mutedText,
                  fontSize: '0.9rem',
                }}
              >
                Users that require follow-up contact based on scheduled dates
              </p>
            </Col>
            <Col xs='auto'>
              <Button
                variant='outline-primary'
                onClick={refetch}
                style={{
                  borderColor: colors.accent,
                  color: colors.accent,
                }}
              >
                <FaCalendarAlt className='me-2' />
                Refresh
              </Button>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body style={{ padding: '0' }}>
          {/* Filters and Controls */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: isDarkMode
                ? 'rgba(139, 92, 246, 0.08)'
                : 'rgba(139, 92, 246, 0.05)',
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <Row className='align-items-center'>
              <Col md={4}>
                <Form.Group>
                  <Form.Label
                    style={{
                      color: colors.text,
                      fontSize: '0.85rem',
                      fontWeight: '500',
                    }}
                  >
                    Sort by
                  </Form.Label>
                  <Form.Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    size='sm'
                    style={{
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <option value='daysOverdue'>Days Overdue</option>
                    <option value='priority'>Priority Level</option>
                    <option value='userName'>User Name</option>
                    <option value='followUpDate'>Follow-up Date</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label
                    style={{
                      color: colors.text,
                      fontSize: '0.85rem',
                      fontWeight: '500',
                    }}
                  >
                    Filter by Priority
                  </Form.Label>
                  <Form.Select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    size='sm'
                    style={{
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <option value='all'>All Priorities</option>
                    <option value='critical'>Critical (7+ days)</option>
                    <option value='high'>High (3-6 days)</option>
                    <option value='medium'>Medium (1-2 days)</option>
                    <option value='low'>Low (today)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4} className='text-end'>
                <div style={{ fontSize: '0.85rem', color: colors.mutedText }}>
                  Showing {processedFollowUps.length} of{' '}
                  {followUpData?.totalFollowUps || 0} follow-ups
                </div>
              </Col>
            </Row>
          </div>

          {/* Follow-ups List */}
          {processedFollowUps.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: colors.mutedText,
              }}
            >
              <FaCalendarAlt
                style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}
              />
              <h4 style={{ color: colors.text, marginBottom: '8px' }}>
                No Follow-ups Needed
              </h4>
              <p>Great! All contacts are up to date.</p>
            </div>
          ) : (
            <div style={{ padding: '20px' }}>
              <Table responsive hover style={{ marginBottom: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: colors.cardHeaderBg }}>
                    <th
                      style={{
                        color: colors.text,
                        border: 'none',
                        padding: '12px',
                      }}
                    >
                      Priority
                    </th>
                    <th
                      style={{
                        color: colors.text,
                        border: 'none',
                        padding: '12px',
                      }}
                    >
                      User
                    </th>
                    <th
                      style={{
                        color: colors.text,
                        border: 'none',
                        padding: '12px',
                      }}
                    >
                      Contact Type
                    </th>
                    <th
                      style={{
                        color: colors.text,
                        border: 'none',
                        padding: '12px',
                      }}
                    >
                      Follow-up Date
                    </th>
                    <th
                      style={{
                        color: colors.text,
                        border: 'none',
                        padding: '12px',
                      }}
                    >
                      Days Overdue
                    </th>
                    <th
                      style={{
                        color: colors.text,
                        border: 'none',
                        padding: '12px',
                      }}
                    >
                      Last Notes
                    </th>
                    <th
                      style={{
                        color: colors.text,
                        border: 'none',
                        padding: '12px',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processedFollowUps.map((followUp, index) => (
                    <tr
                      key={`${followUp.user._id}-${followUp.contact._id}`}
                      style={{
                        backgroundColor:
                          index % 2 === 0
                            ? 'transparent'
                            : colors.cardHeaderBg + '20',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      <td style={{ padding: '16px 12px', border: 'none' }}>
                        <Badge
                          style={{
                            backgroundColor: getPriorityColor(
                              followUp.priority
                            ),
                            color: 'white',
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                          }}
                        >
                          {getPriorityLabel(followUp.priority)}
                        </Badge>
                      </td>
                      <td style={{ padding: '16px 12px', border: 'none' }}>
                        <div>
                          <div
                            style={{ color: colors.text, fontWeight: '500' }}
                          >
                            {followUp.user.name}
                          </div>
                          <div
                            style={{
                              color: colors.mutedText,
                              fontSize: '0.85rem',
                            }}
                          >
                            {followUp.user.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px', border: 'none' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {renderContactTypeIcon(followUp.contact.contactType)}
                          <span
                            style={{ color: colors.text, fontSize: '0.85rem' }}
                          >
                            {contactTypeConfig[followUp.contact.contactType]
                              ?.label || 'Other'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px', border: 'none' }}>
                        <div
                          style={{ color: colors.text, fontSize: '0.85rem' }}
                        >
                          {format(
                            new Date(followUp.contact.followUpDate),
                            'MMM dd, yyyy'
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px', border: 'none' }}>
                        <Badge
                          style={{
                            backgroundColor:
                              followUp.daysOverdue >= 7
                                ? colors.danger
                                : followUp.daysOverdue >= 3
                                ? colors.warning
                                : colors.success,
                            color: 'white',
                            fontSize: '0.75rem',
                          }}
                        >
                          {followUp.daysOverdue}{' '}
                          {followUp.daysOverdue === 1 ? 'day' : 'days'}
                        </Badge>
                      </td>
                      <td
                        style={{
                          padding: '16px 12px',
                          border: 'none',
                          maxWidth: '200px',
                        }}
                      >
                        <div
                          style={{
                            color: colors.text,
                            fontSize: '0.85rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {followUp.contact.notes || 'No notes'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px', border: 'none' }}>
                        <div className='d-flex gap-2'>
                          <Button
                            as={Link}
                            to={`/admin/user/${followUp.user._id}/edit`}
                            variant='outline-primary'
                            size='sm'
                            style={{
                              borderColor: colors.accent,
                              color: colors.accent,
                              fontSize: '0.75rem',
                            }}
                          >
                            <FaEye size={12} className='me-1' />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ContactFollowUpsScreen;
