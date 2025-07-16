import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Badge,
  Row,
  Col,
  Form,
  InputGroup,
  Container,
} from 'react-bootstrap';
import {
  FaTimes,
  FaCheck,
  FaSearch,
  FaShoppingCart,
  FaMoneyBillWave,
  FaBox,
  FaTruck,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
} from 'react-icons/fa';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { useGetOrdersQuery } from '../../slices/ordersApiSlice';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/animations/PageTransition';
import ContentLoader from '../../components/animations/ContentLoader';
import '../../assets/styles/admin.css';

const OrderListScreen = () => {
  const { data: orders, isLoading, error } = useGetOrdersQuery();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterPaid, setFilterPaid] = useState('all');
  const [filterDelivered, setFilterDelivered] = useState('all');

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add effect to set page as loaded after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Filter and sort orders
  useEffect(() => {
    if (orders) {
      let result = [...orders];

      // Apply search filter
      if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        result = result.filter((order) => {
          return (
            order._id.toLowerCase().includes(lowercasedFilter) ||
            (order.user &&
              order.user.name.toLowerCase().includes(lowercasedFilter)) ||
            (order.user &&
              order.user.email.toLowerCase().includes(lowercasedFilter))
          );
        });
      }

      // Apply paid filter
      if (filterPaid !== 'all') {
        result = result.filter((order) => {
          return filterPaid === 'paid' ? order.isPaid : !order.isPaid;
        });
      }

      // Apply delivered filter
      if (filterDelivered !== 'all') {
        result = result.filter((order) => {
          return filterDelivered === 'delivered'
            ? order.isDelivered
            : !order.isDelivered;
        });
      }

      // Apply sorting
      result.sort((a, b) => {
        let aValue, bValue;

        if (sortField === 'createdAt') {
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
        } else if (sortField === 'totalPrice') {
          aValue = a.totalPrice;
          bValue = b.totalPrice;
        } else if (sortField === 'user') {
          aValue = a.user?.name || '';
          bValue = b.user?.name || '';
        } else {
          aValue = a[sortField];
          bValue = b[sortField];
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      setFilteredOrders(result);
    }
  }, [
    orders,
    searchTerm,
    sortField,
    sortDirection,
    filterPaid,
    filterDelivered,
  ]);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) return <FaSort className='ms-1 text-muted' />;
    return sortDirection === 'asc' ? (
      <FaSortUp className='ms-1 text-primary' />
    ) : (
      <FaSortDown className='ms-1 text-primary' />
    );
  };

  // Get order statistics
  const getOrderStats = () => {
    if (!orders) return { total: 0, paid: 0, delivered: 0, revenue: 0 };

    const paid = orders.filter((order) => order.isPaid).length;
    const delivered = orders.filter((order) => order.isDelivered).length;
    const revenue = orders
      .filter((order) => order.isPaid)
      .reduce((total, order) => total + order.totalPrice, 0);

    return {
      total: orders.length,
      paid,
      delivered,
      revenue: revenue.toFixed(2),
    };
  };

  const stats = getOrderStats();

  // Render order card for mobile view
  const renderOrderCard = (order) => (
    <Card className='mb-3 admin-card card-hover'>
      <Card.Header className='d-flex justify-content-between align-items-center'>
        <div>
          <span className='text-muted'>ID: </span>
          <small>{order._id}</small>
        </div>
        <div>
          {order.isPaid ? (
            <Badge bg='success' pill>
              Paid
            </Badge>
          ) : (
            <Badge bg='danger' pill>
              Unpaid
            </Badge>
          )}{' '}
          {order.isDelivered ? (
            <Badge bg='info' pill>
              Delivered
            </Badge>
          ) : (
            <Badge bg='warning' text='dark' pill>
              Pending
            </Badge>
          )}
        </div>
      </Card.Header>
      <Card.Body>
        <div className='mb-2'>
          <strong>Customer:</strong> {order.user ? order.user.name : 'N/A'}
        </div>
        <div className='mb-2'>
          <strong>Date:</strong>{' '}
          {new Date(order.createdAt).toLocaleDateString()}
        </div>
        <div className='mb-2'>
          <strong>Total:</strong> ${order.totalPrice}
        </div>
        <div className='mb-2'>
          <strong>Payment Status:</strong>{' '}
          {order.isPaid ? (
            <span className='text-success'>
              <FaCheck className='me-1' /> Paid on{' '}
              {new Date(order.paidAt).toLocaleDateString()}
            </span>
          ) : (
            <span className='text-danger'>
              <FaTimes className='me-1' /> Not Paid
            </span>
          )}
        </div>
        <div className='mb-3'>
          <strong>Delivery Status:</strong>{' '}
          {order.isDelivered ? (
            <span className='text-success'>
              <FaCheck className='me-1' /> Delivered on{' '}
              {new Date(order.deliveredAt).toLocaleDateString()}
            </span>
          ) : (
            <span className='text-warning'>
              <FaTimes className='me-1' /> Not Delivered
            </span>
          )}
        </div>
        <Button
          as={Link}
          to={`/order/${order._id}`}
          variant='primary'
          className='w-100 btn-animated'
        >
          View Details
        </Button>
      </Card.Body>
    </Card>
  );

  return (
    <PageTransition>
      <Container fluid className='px-1'>
        <div className='admin-header fade-in'>
          <h1>
            <FaShoppingCart className='me-2' />
            Order Management
          </h1>
        </div>

        {/* Quick Stats */}
        <Row className='mb-4'>
          <Col md={3} className='fade-in delay-100'>
            <Card className='admin-card h-100 card-hover'>
              <Card.Body className='d-flex align-items-center'>
                <div
                  className='rounded-circle me-3 d-flex align-items-center justify-content-center'
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: 'rgba(110, 68, 178, 0.1)',
                  }}
                >
                  <FaShoppingCart size={24} className='text-primary' />
                </div>
                <div>
                  <h6 className='mb-0 text-muted'>Total Orders</h6>
                  <h3 className='mb-0'>{stats.total}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className='mt-3 mt-md-0 fade-in delay-200'>
            <Card className='admin-card h-100 card-hover'>
              <Card.Body className='d-flex align-items-center'>
                <div
                  className='rounded-circle me-3 d-flex align-items-center justify-content-center'
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                  }}
                >
                  <FaMoneyBillWave size={24} className='text-success' />
                </div>
                <div>
                  <h6 className='mb-0 text-muted'>Paid Orders</h6>
                  <h3 className='mb-0'>{stats.paid}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className='mt-3 mt-md-0 fade-in delay-300'>
            <Card className='admin-card h-100 card-hover'>
              <Card.Body className='d-flex align-items-center'>
                <div
                  className='rounded-circle me-3 d-flex align-items-center justify-content-center'
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: 'rgba(23, 162, 184, 0.1)',
                  }}
                >
                  <FaBox size={24} className='text-info' />
                </div>
                <div>
                  <h6 className='mb-0 text-muted'>Delivered Orders</h6>
                  <h3 className='mb-0'>{stats.delivered}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className='mt-3 mt-md-0 fade-in delay-400'>
            <Card className='admin-card h-100 card-hover'>
              <Card.Body className='d-flex align-items-center'>
                <div
                  className='rounded-circle me-3 d-flex align-items-center justify-content-center'
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  }}
                >
                  <FaTruck size={24} className='text-warning' />
                </div>
                <div>
                  <h6 className='mb-0 text-muted'>Total Revenue</h6>
                  <h3 className='mb-0'>${stats.revenue}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className='admin-filters mb-4 fade-in delay-500'>
          <Row>
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text className='bg-light'>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder='Search orders by ID or customer...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='admin-form-control'
                />
              </InputGroup>
            </Col>
            <Col md={3} className='mt-3 mt-md-0'>
              <InputGroup>
                <InputGroup.Text className='bg-light'>
                  <FaMoneyBillWave />
                </InputGroup.Text>
                <Form.Select
                  value={filterPaid}
                  onChange={(e) => setFilterPaid(e.target.value)}
                  className='admin-form-control admin-select'
                >
                  <option value='all'>All Payment Status</option>
                  <option value='paid'>Paid Only</option>
                  <option value='unpaid'>Unpaid Only</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3} className='mt-3 mt-md-0'>
              <InputGroup>
                <InputGroup.Text className='bg-light'>
                  <FaTruck />
                </InputGroup.Text>
                <Form.Select
                  value={filterDelivered}
                  onChange={(e) => setFilterDelivered(e.target.value)}
                  className='admin-form-control admin-select'
                >
                  <option value='all'>All Delivery Status</option>
                  <option value='delivered'>Delivered Only</option>
                  <option value='undelivered'>Undelivered Only</option>
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>
        </Card>

        {isLoading || !isPageLoaded ? (
          <div className='fade-in delay-600'>
            <ContentLoader
              type={isMobile ? 'card' : 'table'}
              rows={5}
              columns={7}
              cardCount={4}
            />
          </div>
        ) : error ? (
          <Message variant='danger'>
            {error?.data?.message || error.error}
          </Message>
        ) : (
          <>
            {filteredOrders.length === 0 ? (
              <Message>
                No orders found. Try adjusting your filter criteria.
              </Message>
            ) : !isMobile ? (
              <div className='admin-table-responsive fade-in-up delay-600'>
                <Table hover responsive className='admin-table'>
                  <thead>
                    <tr className='slide-in-right delay-100'>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('_id')}
                      >
                        ORDER ID {renderSortIcon('_id')}
                      </th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('user')}
                      >
                        CUSTOMER {renderSortIcon('user')}
                      </th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('createdAt')}
                      >
                        DATE {renderSortIcon('createdAt')}
                      </th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('totalPrice')}
                      >
                        TOTAL {renderSortIcon('totalPrice')}
                      </th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('isPaid')}
                      >
                        PAID {renderSortIcon('isPaid')}
                      </th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('isDelivered')}
                      >
                        DELIVERED {renderSortIcon('isDelivered')}
                      </th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => (
                      <tr
                        key={order._id}
                        className={`fade-in-up stagger-item-${
                          index < 10 ? index + 1 : 10
                        }`}
                      >
                        <td>{order._id}</td>
                        <td>{order.user && order.user.name}</td>
                        <td>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td>${order.totalPrice}</td>
                        <td>
                          {order.isPaid ? (
                            <Badge bg='success' pill>
                              <FaCheck className='me-1' />
                              {new Date(order.paidAt).toLocaleDateString()}
                            </Badge>
                          ) : (
                            <Badge bg='danger' pill>
                              <FaTimes className='me-1' /> Not Paid
                            </Badge>
                          )}
                        </td>
                        <td>
                          {order.isDelivered ? (
                            <Badge bg='info' pill>
                              <FaCheck className='me-1' />
                              {new Date(order.deliveredAt).toLocaleDateString()}
                            </Badge>
                          ) : (
                            <Badge bg='warning' text='dark' pill>
                              <FaTimes className='me-1' /> Pending
                            </Badge>
                          )}
                        </td>
                        <td>
                          <Button
                            as={Link}
                            to={`/order/${order._id}`}
                            variant='primary'
                            className='admin-btn admin-btn-sm btn-animated'
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className='admin-mobile-cards fade-in-up delay-600'>
                <Row>
                  {filteredOrders.map((order, index) => (
                    <Col
                      xs={12}
                      key={order._id}
                      className={`stagger-item-${index < 10 ? index + 1 : 10}`}
                    >
                      {renderOrderCard(order)}
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </>
        )}
      </Container>
    </PageTransition>
  );
};

export default OrderListScreen;
