import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Card,
  Alert
} from 'react-bootstrap';
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaEye
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { useGetTenantsQuery } from '../../slices/tenantApiSlice';

const TenantListScreen = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [planFilter, setPlanFilter] = useState(searchParams.get('plan') || 'all');
  
  const page = searchParams.get('page') || 1;

  const { userInfo } = useSelector((state) => state.auth);

  const {
    data,
    isLoading,
    error,
    refetch
  } = useGetTenantsQuery({
    page,
    search,
    status: statusFilter,
    plan: planFilter
  });

  // Check super admin access
  useEffect(() => {
    if (!userInfo?.isSuperAdmin) {
      navigate('/');
      toast.error('Access denied. Super admin privileges required.');
    }
  }, [userInfo, navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search, status: statusFilter, plan: planFilter, page: 1 });
  };

  const handleFilterChange = (filterType, value) => {
    const newParams = { search };
    
    if (filterType === 'status') {
      setStatusFilter(value);
      if (value !== 'all') newParams.status = value;
    }
    
    if (filterType === 'plan') {
      setPlanFilter(value);
      if (value !== 'all') newParams.plan = value;
    }
    
    newParams.page = 1;
    setSearchParams(newParams);
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      suspended: 'danger',
      trial: 'warning',
      expired: 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPlanBadge = (plan) => {
    const variants = {
      free: 'secondary',
      starter: 'info',
      professional: 'primary',
      enterprise: 'success',
      custom: 'warning'
    };
    return <Badge bg={variants[plan] || 'secondary'}>{plan}</Badge>;
  };

  if (isLoading) return <Loader />;
  if (error) return <Message variant='danger'>{error?.data?.message || 'Error loading tenants'}</Message>;

  return (
    <Container className='py-4'>
      <Row className='align-items-center mb-4'>
        <Col>
          <h1>Tenant Management</h1>
          <p className="text-muted">Manage all tenants and their configurations</p>
        </Col>
        <Col className='text-end'>
          <Button
            as={Link}
            to='/super-admin/tenants/create'
            variant='primary'
          >
            <FaPlus className='me-2' /> Create Tenant
          </Button>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card className='mb-4'>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={4}>
                <InputGroup>
                  <Form.Control
                    type='text'
                    placeholder='Search tenants...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button type='submit' variant='outline-secondary'>
                    <FaSearch />
                  </Button>
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value='all'>All Status</option>
                  <option value='active'>Active</option>
                  <option value='suspended'>Suspended</option>
                  <option value='trial'>Trial</option>
                  <option value='expired'>Expired</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={planFilter}
                  onChange={(e) => handleFilterChange('plan', e.target.value)}
                >
                  <option value='all'>All Plans</option>
                  <option value='free'>Free</option>
                  <option value='starter'>Starter</option>
                  <option value='professional'>Professional</option>
                  <option value='enterprise'>Enterprise</option>
                  <option value='custom'>Custom</option>
                </Form.Select>
              </Col>
              <Col md={2} className='text-end'>
                <Button variant='secondary' onClick={() => refetch()}>
                  Refresh
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Results Summary */}
      {data && (
        <Alert variant="info" className="mb-3">
          Showing {data.tenants?.length || 0} of {data.total || 0} tenants
          {search && ` matching "${search}"`}
          {statusFilter !== 'all' && ` with status "${statusFilter}"`}
          {planFilter !== 'all' && ` on "${planFilter}" plan`}
        </Alert>
      )}

      {/* Tenants Table */}
      <Card>
        <Card.Body className='p-0'>
          <Table striped hover responsive className='mb-0'>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Subdomain</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Users</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.tenants?.length > 0 ? (
                data.tenants.map((tenant) => (
                  <tr key={tenant._id}>
                    <td>
                      <div>
                        <strong>{tenant.name}</strong>
                        {tenant.description && (
                          <div className="text-muted small">{tenant.description}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <code>{tenant.subdomain}</code>
                    </td>
                    <td>
                      <div>
                        <div>{tenant.ownerId?.name || 'N/A'}</div>
                        <div className="text-muted small">{tenant.ownerId?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td>{getStatusBadge(tenant.status)}</td>
                    <td>{getPlanBadge(tenant.plan)}</td>
                    <td>
                      <span className="badge bg-light text-dark">
                        {tenant.statistics?.userCount || 0}
                      </span>
                    </td>
                    <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          as={Link}
                          to={`/super-admin/tenants/${tenant._id}`}
                          title="View Details"
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          as={Link}
                          to={`/super-admin/tenants/${tenant._id}/edit`}
                          title="Edit Tenant"
                        >
                          <FaEdit />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="text-muted">
                      {search || statusFilter !== 'all' || planFilter !== 'all' 
                        ? 'No tenants found matching your criteria' 
                        : 'No tenants created yet'}
                    </div>
                    {!search && statusFilter === 'all' && planFilter === 'all' && (
                      <Button
                        variant="primary"
                        as={Link}
                        to="/super-admin/tenants/create"
                        className="mt-2"
                      >
                        <FaPlus className="me-1" /> Create First Tenant
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Pagination would go here if implemented */}
      {data?.pages > 1 && (
        <div className="mt-4 text-center">
          <p className="text-muted">
            Page {data.page} of {data.pages} (Total: {data.total} tenants)
          </p>
          {/* Add pagination component here if needed */}
        </div>
      )}
    </Container>
  );
};

export default TenantListScreen; 