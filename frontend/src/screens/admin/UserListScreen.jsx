import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Badge,
  Row,
  Col,
  Form,
  InputGroup,
  Card,
  Container,
} from 'react-bootstrap';
import {
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaKey,
  FaUser,
  FaUserShield,
  FaUsers,
  FaSearch,
  FaFilter,
  FaUserCog,
  FaUserPlus,
  FaEnvelope,
  FaMoon,
  FaDumbbell,
  FaUtensils,
  FaWeight,
} from 'react-icons/fa';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import UserPaginate from '../../components/UserPaginate';
import PageTransition from '../../components/animations/PageTransition';
import ContentLoader from '../../components/animations/ContentLoader';
import {
  useDeleteUserMutation,
  useGetUsersQuery,
  useGetUserStatsQuery,
} from '../../slices/usersApiSlice';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../../assets/styles/admin.css';

const UserListScreen = () => {
  const navigate = useNavigate();
  const { pageNumber = 1 } = useParams();
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Get query params from URL if they exist
  const searchParams = new URLSearchParams(window.location.search);
  const keywordParam = searchParams.get('keyword') || '';
  const roleParam = searchParams.get('role') || 'all';
  const codeAccessParam = searchParams.get('codeAccess') || 'all';

  // State for filters with URL params as initial values
  const [searchTerm, setSearchTerm] = useState(keywordParam);
  const [filterAdmin, setFilterAdmin] = useState(roleParam);
  const [filterCodeAccess, setFilterCodeAccess] = useState(codeAccessParam);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Use a debounce mechanism for search to avoid too many API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Effect for debouncing search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Determine if any filters are active
  const filtersActive =
    debouncedSearchTerm || filterAdmin !== 'all' || filterCodeAccess !== 'all';

  // Get users with filter parameters - only skip pagination for filters with small result sets
  const { data, refetch, isLoading, error } = useGetUsersQuery({
    pageNumber: Number(pageNumber),
    keyword: debouncedSearchTerm,
    role: filterAdmin,
    codeAccess: filterCodeAccess,
    // Don't skip pagination for large filtered results
    skipPagination: false,
  });

  // Get global user statistics (not affected by pagination or filters)
  const { data: statsData, isLoading: statsLoading } = useGetUserStatsQuery();

  // Add effect to set page as loaded after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    // Build query params
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set('keyword', debouncedSearchTerm);
    if (filterAdmin !== 'all') params.set('role', filterAdmin);
    if (filterCodeAccess !== 'all') params.set('codeAccess', filterCodeAccess);

    // If there are filters active, reset to page 1
    const newPageNumber = filtersActive ? 1 : pageNumber;

    // Update URL with params
    const newUrl = `/admin/userlist/${newPageNumber}${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    navigate(newUrl, { replace: true });
  }, [debouncedSearchTerm, filterAdmin, filterCodeAccess, navigate]);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        refetch();
        showSuccessToast('User deleted successfully');
      } catch (err) {
        showErrorToast(err?.data?.message || err.error);
      }
    }
  };

  // Get counts for stats from API data directly
  const getUserStats = () => {
    // If we have global stats data, use it
    if (statsData) {
      return {
        total: statsData.totalUsers || 0,
        admins: statsData.adminUsers || 0,
        withCodes: statsData.usersWithCodeAccess || 0,
      };
    }

    // Fallback to pagination data if global stats aren't available
    if (!data?.users) return { total: 0, admins: 0, withCodes: 0 };

    return {
      total: data.userCount || data.users.length,
      admins: data.users.filter((user) => user.isAdmin).length,
      withCodes: data.users.filter((user) =>
        user.accessedCollections?.some(
          (collection) => collection.accessedWithCode
        )
      ).length,
    };
  };

  const stats = getUserStats();

  // Render user as card (for mobile)
  const renderUserCard = (user) => (
    <div className='admin-mobile-card' key={user._id}>
      <div className='d-flex align-items-center mb-3'>
        <div
          className='me-3 d-flex align-items-center justify-content-center rounded-circle'
          style={{
            width: '50px',
            height: '50px',
            backgroundColor: user.isAdmin
              ? 'rgba(110, 68, 178, 0.1)'
              : 'rgba(140, 140, 140, 0.1)',
            flexShrink: 0,
          }}
        >
          {user.isAdmin ? (
            <FaUserShield size={24} className='text-primary' />
          ) : (
            <FaUser size={24} className='text-secondary' />
          )}
        </div>
        <div className='card-title'>{user.name}</div>
      </div>

      <div className='card-row'>
        <div className='card-label'>
          <FaEnvelope className='me-2' /> EMAIL
        </div>
        <div className='card-value'>
          <a href={`mailto:${user.email}`} className='text-primary'>
            {user.email}
          </a>
        </div>
      </div>

      <div className='card-row'>
        <div className='card-label'>
          <FaUserCog className='me-2' /> ROLE
        </div>
        <div className='card-value'>
          {user.isAdmin ? (
            <Badge bg='primary' pill className='admin-badge'>
              <FaUserShield className='me-1' /> Administrator
            </Badge>
          ) : (
            <Badge bg='secondary' pill className='admin-badge'>
              <FaUser className='me-1' /> Regular User
            </Badge>
          )}
        </div>
      </div>

      <div className='card-row'>
        <div className='card-label'>
          <FaKey className='me-2' /> CODE ACCESS
        </div>
        <div className='card-value'>
          {user.accessedCollections?.some(
            (collection) => collection.accessedWithCode
          ) ? (
            <Badge bg='warning' text='dark' pill className='admin-badge'>
              <FaKey className='me-1' /> Used Access Codes
            </Badge>
          ) : (
            <Badge bg='light' text='dark' pill className='admin-badge'>
              No Code Access
            </Badge>
          )}
        </div>
      </div>

      <div className='card-row'>
        <div className='card-label'>USER ID</div>
        <div className='card-value'>
          <small className='text-muted'>{user._id}</small>
        </div>
      </div>

      <div className='card-actions'>
        <Button
          as={Link}
          to={`/admin/user/${user._id}/edit`}
          variant='primary'
          className='admin-btn admin-btn-sm'
        >
          <FaEdit className='me-1' /> {isMobile ? null : 'Edit User'}
        </Button>
        <Button
          as={Link}
          to={`/admin/user-sleep-dashboard/${user._id}`}
          variant='info'
          className='admin-btn admin-btn-sm'
        >
          <FaMoon />
        </Button>
        <Button
          as={Link}
          to={`/admin/user-workout-dashboard/${user._id}`}
          variant='success'
          className='admin-btn admin-btn-sm'
        >
          <FaDumbbell />
        </Button>
        <Button
          as={Link}
          to={`/admin/user-diet-dashboard/${user._id}`}
          variant='warning'
          className='admin-btn admin-btn-sm'
        >
          <FaUtensils />
        </Button>
        <Button
          as={Link}
          to={`/admin/user-weight-dashboard/${user._id}`}
          variant='info'
          className='admin-btn admin-btn-sm'
        >
          <FaWeight className='me-1' />
        </Button>
        {!user.isAdmin && (
          <Button
            variant='danger'
            className='admin-btn admin-btn-sm'
            onClick={() => deleteHandler(user._id)}
          >
            <FaTrash className='me-1' /> {isMobile ? null : 'Delete User'}
          </Button>
        )}
      </div>
    </div>
  );

  // Display a result summary when filters are active
  const renderFilterSummary = () => {
    if (!filtersActive || !data) return null;

    return (
      <div className='mb-3 text-muted'>
        <small>
          Showing {data.users.length}{' '}
          {data.users.length === 1 ? 'user' : 'users'}
          {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
          {filterAdmin !== 'all' &&
            ` with role: ${filterAdmin === 'admin' ? 'Admin' : 'Regular User'}`}
          {filterCodeAccess !== 'all' &&
            ` ${
              filterCodeAccess === 'with-codes' ? 'with' : 'without'
            } code access`}
        </small>
      </div>
    );
  };

  return (
    <PageTransition>
      <Container fluid className='px-1'>
        <div className='admin-header'>
          <h1 className='fade-in'>
            <FaUsers className='me-2' />
            User Management
          </h1>
        </div>

        {/* Quick Stats */}
        <Row className='mb-4'>
          <Col md={4} className='fade-in delay-100'>
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
                  <FaUsers size={24} className='text-primary' />
                </div>
                <div>
                  <h6 className='mb-0 text-muted'>Total Users</h6>
                  <h3 className='mb-0'>{stats.total}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className='mt-3 mt-md-0 fade-in delay-200'>
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
                  <FaUserShield size={24} className='text-success' />
                </div>
                <div>
                  <h6 className='mb-0 text-muted'>Administrators</h6>
                  <h3 className='mb-0'>{stats.admins}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className='mt-3 mt-md-0 fade-in delay-300'>
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
                  <FaKey size={24} className='text-warning' />
                </div>
                <div>
                  <h6 className='mb-0 text-muted'>Users With Code Access</h6>
                  <h3 className='mb-0'>{stats.withCodes}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className='admin-filters mb-4 fade-in delay-400'>
          <Row>
            <Col md={6} lg={4}>
              <InputGroup>
                <InputGroup.Text className='admin-input-addon'>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder='Search users...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='admin-form-control'
                />
              </InputGroup>
            </Col>
            <Col md={3} lg={2} className='mt-3 mt-md-0'>
              <InputGroup>
                <InputGroup.Text className='admin-input-addon'>
                  <FaUserShield />
                </InputGroup.Text>
                <Form.Select
                  value={filterAdmin}
                  onChange={(e) => setFilterAdmin(e.target.value)}
                  className='admin-form-control admin-select'
                >
                  <option value='all'>All Roles</option>
                  <option value='admin'>Admins</option>
                  <option value='regular'>Regular Users</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3} lg={3} className='mt-3 mt-md-0'>
              <InputGroup>
                <InputGroup.Text className='admin-input-addon'>
                  <FaKey />
                </InputGroup.Text>
                <Form.Select
                  value={filterCodeAccess}
                  onChange={(e) => setFilterCodeAccess(e.target.value)}
                  className='admin-form-control admin-select'
                >
                  <option value='all'>All Access Types</option>
                  <option value='with-codes'>With Code Access</option>
                  <option value='no-codes'>No Code Access</option>
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>
        </Card>

        {/* Filter Summary */}
        {renderFilterSummary()}

        {isLoading || !isPageLoaded ? (
          <div className='fade-in delay-500'>
            <ContentLoader
              type={isMobile ? 'card' : 'table'}
              rows={6}
              columns={5}
              cardCount={3}
            />
          </div>
        ) : error ? (
          <Message variant='danger'>
            {error?.data?.message || error.error}
          </Message>
        ) : (
          <>
            {data?.users?.length === 0 ? (
              <Message>
                No users found.{' '}
                {filtersActive && 'Try adjusting your filter criteria.'}
              </Message>
            ) : !isMobile ? (
              // Desktop view
              <div className='admin-table-responsive fade-in-up delay-500'>
                <Table hover responsive className='admin-table'>
                  <thead>
                    <tr className='slide-in-right delay-100'>
                      <th style={{ width: '30%' }}>USER</th>
                      <th style={{ width: '20%' }}>EMAIL</th>
                      <th style={{ width: '15%' }}>ROLE</th>
                      <th style={{ width: '15%' }}>CODE ACCESS</th>
                      <th style={{ width: '20%' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.users?.map((user, index) => (
                      <tr
                        key={user._id}
                        className={`fade-in-up stagger-item-${
                          index < 10 ? index + 1 : 10
                        }`}
                      >
                        <td className='align-middle'>
                          <div className='d-flex align-items-center'>
                            <div
                              className='me-3 d-flex align-items-center justify-content-center rounded-circle'
                              style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: user.isAdmin
                                  ? 'rgba(110, 68, 178, 0.1)'
                                  : 'rgba(140, 140, 140, 0.1)',
                              }}
                            >
                              {user.isAdmin ? (
                                <FaUserShield
                                  size={20}
                                  className='text-primary'
                                />
                              ) : (
                                <FaUser size={20} className='text-secondary' />
                              )}
                            </div>
                            <div>
                              <strong>{user.name}</strong>
                              <div className='text-muted small'>{user._id}</div>
                            </div>
                          </div>
                        </td>
                        <td className='align-middle'>
                          <a
                            href={`mailto:${user.email}`}
                            className='text-primary d-flex align-items-center'
                          >
                            <FaEnvelope className='me-2' /> {user.email}
                          </a>
                        </td>
                        <td className='align-middle'>
                          {user.isAdmin ? (
                            <Badge bg='primary' pill className='admin-badge'>
                              <FaUserShield className='me-1' /> Admin
                            </Badge>
                          ) : (
                            <Badge bg='secondary' pill className='admin-badge'>
                              <FaUser className='me-1' /> User
                            </Badge>
                          )}
                        </td>
                        <td className='align-middle'>
                          {user.accessedCollections?.some(
                            (collection) => collection.accessedWithCode
                          ) ? (
                            <Badge
                              bg='warning'
                              text='dark'
                              pill
                              className='admin-badge'
                            >
                              <FaKey className='me-1' /> Has Access
                            </Badge>
                          ) : (
                            <Badge
                              bg='light'
                              text='dark'
                              pill
                              className='admin-badge'
                            >
                              No Code Access
                            </Badge>
                          )}
                        </td>
                        <td className='admin-actions align-middle'>
                          <Button
                            as={Link}
                            to={`/admin/user/${user._id}/edit`}
                            variant='primary'
                            className='admin-btn admin-btn-sm'
                            title='Edit user'
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            as={Link}
                            to={`/admin/user-sleep-dashboard/${user._id}`}
                            variant='info'
                            className='admin-btn admin-btn-sm'
                          >
                            <FaMoon />
                          </Button>
                          <Button
                            as={Link}
                            to={`/admin/user-workout-dashboard/${user._id}`}
                            variant='success'
                            className='admin-btn admin-btn-sm'
                          >
                            <FaDumbbell />
                          </Button>
                          <Button
                            as={Link}
                            to={`/admin/user-diet-dashboard/${user._id}`}
                            variant='warning'
                            className='admin-btn admin-btn-sm'
                          >
                            <FaUtensils />
                          </Button>
                          <Button
                            as={Link}
                            to={`/admin/user-weight-dashboard/${user._id}`}
                            variant='info'
                            className='admin-btn admin-btn-sm'
                          >
                            <FaWeight className='me-1' />
                          </Button>
                          {!user.isAdmin && (
                            <Button
                              variant='danger'
                              className='admin-btn admin-btn-sm'
                              onClick={() => deleteHandler(user._id)}
                              title='Delete user'
                            >
                              <FaTrash />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              // Mobile view
              <div className='admin-table-mobile fade-in delay-500'>
                {data?.users?.map((user, index) => (
                  <div
                    key={user._id}
                    className={`fade-in-up stagger-item-${
                      index < 10 ? index + 1 : 10
                    }`}
                  >
                    {renderUserCard(user)}
                  </div>
                ))}
              </div>
            )}

            {/* Show pagination when server indicates we should use it (more than 10 results) */}
            {data?.pages > 1 && (
              <div className='d-flex justify-content-center mt-4 fade-in delay-800'>
                <UserPaginate
                  pages={data?.pages}
                  page={data?.page}
                  keyword={debouncedSearchTerm}
                  role={filterAdmin}
                  codeAccess={filterCodeAccess}
                />
              </div>
            )}
          </>
        )}
      </Container>
    </PageTransition>
  );
};

export default UserListScreen;
