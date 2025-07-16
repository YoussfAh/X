import React from 'react';
import {
  Table,
  Button,
  Card,
  Row,
  Col,
  Container,
  Badge,
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useSelector } from 'react-redux';
import {
  FaEye,
  FaInfoCircle,
  FaShoppingBag,
  FaCheckCircle,
  FaTimesCircle,
  FaCreditCard,
  FaTruck,
  FaBox,
} from 'react-icons/fa';
import { format } from 'date-fns';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { useGetMyOrdersQuery } from '../slices/ordersApiSlice';
import Meta from '../components/Meta';

const MyOrdersScreen = () => {
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();
  const { userInfo } = useSelector((state) => state.auth);

  // Check if dark mode is enabled
  const isDarkMode =
    document.documentElement.getAttribute('data-theme') === 'dark';

  // Modern color scheme with gradients
  const primaryColor = '#6e44b2'; // Purple
  const secondaryColor = '#4a90e2'; // Blue
  const accentColor = '#6e44b2';
  const accentGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

  // Style objects for consistent UI design
  const pageStyle = {
    background: isDarkMode
      ? 'linear-gradient(135deg, #1a1f2c 0%, #2d3748 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
    borderRadius: '20px',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: isDarkMode
      ? '0 10px 25px rgba(0, 0, 0, 0.2)'
      : '0 10px 25px rgba(0, 0, 0, 0.05)',
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? '#1e2a38' : '#fff',
    color: isDarkMode ? '#fff' : 'inherit',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: isDarkMode
      ? '0 8px 30px rgba(0, 0, 0, 0.5)'
      : '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: 'none',
    transition: 'all 0.3s ease',
    height: '100%',
  };

  const tableHeadStyle = {
    backgroundColor: isDarkMode
      ? 'rgba(110, 68, 178, 0.15)'
      : 'rgba(110, 68, 178, 0.05)',
    color: isDarkMode ? '#fff' : '#333',
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: '0.8rem',
    letterSpacing: '0.05em',
    padding: '15px',
  };

  const tableCellStyle = {
    padding: '15px',
    verticalAlign: 'middle',
    color: isDarkMode ? '#fff' : 'inherit',
  };

  const tableStyle = {
    borderCollapse: 'separate',
    borderSpacing: '0 8px',
  };

  const headerStyle = {
    fontWeight: '700',
    letterSpacing: '-0.02em',
    fontSize: '1.75rem',
    color: isDarkMode ? '#fff' : '#333',
    display: 'flex',
    alignItems: 'center',
    textTransform: 'uppercase',
    marginBottom: '1.5rem',
  };

  const buttonStyle = {
    backgroundImage: accentGradient,
    border: 'none',
    borderRadius: '12px',
    padding: '0.5rem 1rem',
    fontWeight: '600',
    boxShadow: isDarkMode
      ? '0 8px 15px rgba(110, 68, 178, 0.3)'
      : '0 8px 15px rgba(110, 68, 178, 0.2)',
    transition: 'all 0.3s ease',
  };

  // Status badge styling
  const getStatusBadge = (isPaid, isDelivered) => {
    if (!isPaid) {
      return (
        <Badge
          bg='warning'
          text='dark'
          className='d-flex align-items-center'
          style={{
            padding: '0.5em 0.75em',
            width: 'fit-content',
          }}
        >
          <FaCreditCard style={{ marginRight: '5px' }} /> Awaiting Payment
        </Badge>
      );
    } else if (isPaid && !isDelivered) {
      return (
        <Badge
          bg='info'
          className='d-flex align-items-center'
          style={{
            padding: '0.5em 0.75em',
            width: 'fit-content',
          }}
        >
          <FaTruck style={{ marginRight: '5px' }} /> Processing
        </Badge>
      );
    } else {
      return (
        <Badge
          bg='success'
          className='d-flex align-items-center'
          style={{
            padding: '0.5em 0.75em',
            width: 'fit-content',
          }}
        >
          <FaCheckCircle style={{ marginRight: '5px' }} /> Completed
        </Badge>
      );
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
    <Container fluid className='py-4 px-1'>
      <Meta title='My Orders | PRO Training' />
      <div style={pageStyle}>
        <div className='d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4'>
          <h1 style={headerStyle}>
            <FaShoppingBag className='me-3' style={{ color: accentColor }} />
            My Orders
          </h1>
          <div>
            <h4
              style={{
                color: isDarkMode ? '#f0f0f0' : '#333',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: 0,
              }}
            >
              Welcome back, {userInfo.name.split(' ')[0]}
            </h4>
            <p
              style={{
                color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                fontSize: '0.9rem',
                margin: 0,
              }}
            >
              Track all your purchases and order statuses
            </p>
          </div>
        </div>

        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>
            {error?.data?.message || error.error}
          </Message>
        ) : orders?.length === 0 ? (
          <Card style={cardStyle}>
            <Card.Body className='text-center py-5'>
              <FaInfoCircle
                size={40}
                style={{
                  color: accentColor,
                  marginBottom: '1rem',
                  opacity: 0.8,
                }}
              />
              <h4 style={{ fontWeight: '600', marginBottom: '1rem' }}>
                No Orders Yet
              </h4>
              <p
                style={{
                  color: isDarkMode
                    ? 'rgba(255,255,255,0.7)'
                    : 'rgba(0,0,0,0.7)',
                  marginBottom: '1.5rem',
                }}
              >
                You haven't placed any orders yet. Check out our products and
                start shopping!
              </p>
              <LinkContainer to='/products'>
                <Button
                  style={buttonStyle}
                  size='lg'
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = isDarkMode
                      ? '0 12px 20px rgba(110, 68, 178, 0.4)'
                      : '0 12px 20px rgba(110, 68, 178, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isDarkMode
                      ? '0 8px 15px rgba(110, 68, 178, 0.3)'
                      : '0 8px 15px rgba(110, 68, 178, 0.2)';
                  }}
                >
                  <FaShoppingBag className='me-2' /> Browse Exercises
                </Button>
              </LinkContainer>
            </Card.Body>
          </Card>
        ) : (
          <Card style={cardStyle}>
            <Card.Body>
              <div className='table-responsive'>
                <Table hover style={tableStyle} className='mb-0'>
                  <thead>
                    <tr>
                      <th style={tableHeadStyle}>ID</th>
                      <th style={tableHeadStyle}>DATE</th>
                      <th style={tableHeadStyle}>TOTAL</th>
                      <th style={tableHeadStyle}>STATUS</th>
                      <th style={tableHeadStyle} className='text-end'>
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order._id}
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(30, 41, 59, 0.5)'
                            : 'rgba(255, 255, 255, 0.8)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode
                            ? 'rgba(30, 41, 59, 0.8)'
                            : '#ffffff';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = isDarkMode
                            ? '0 4px 12px rgba(0, 0, 0, 0.2)'
                            : '0 4px 12px rgba(0, 0, 0, 0.05)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode
                            ? 'rgba(30, 41, 59, 0.5)'
                            : 'rgba(255, 255, 255, 0.8)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <td style={tableCellStyle}>
                          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                            #{order._id.substring(order._id.length - 8)}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          {formatDate(order.createdAt)}
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{ fontWeight: '600' }}>
                            ${order.totalPrice.toFixed(2)}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          {getStatusBadge(order.isPaid, order.isDelivered)}
                        </td>
                        <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                          <LinkContainer to={`/order/${order._id}`}>
                            <Button
                              className='btn-sm'
                              style={{
                                backgroundImage: accentGradient,
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.5rem 1rem',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                            >
                              <FaEye style={{ marginRight: '5px' }} /> Details
                            </Button>
                          </LinkContainer>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </Container>
  );
};

export default MyOrdersScreen;
