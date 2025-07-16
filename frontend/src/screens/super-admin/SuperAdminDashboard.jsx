import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useGetTenantsQuery } from '../../slices/tenantApiSlice';
import { FaPlus, FaBuilding, FaUsers, FaChartLine, FaCrown } from 'react-icons/fa';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import TenantLinkButton from '../../components/TenantLinkButton';

const SuperAdminDashboard = () => {
  const { data: tenantsData, isLoading, error } = useGetTenantsQuery({
    page: 1,
    limit: 10
  });

  const getQuickStats = () => {
    if (!tenantsData?.tenants) return { total: 0, active: 0, totalUsers: 0 };
    
    const tenants = tenantsData.tenants;
    return {
      total: tenants.length,
      active: tenants.filter(t => t.status === 'active').length,
      totalUsers: tenants.reduce((sum, t) => sum + (t.statistics?.userCount || 0), 0)
    };
  };

  const stats = getQuickStats();

  if (isLoading) return <Loader />;
  if (error) return <Message variant='danger'>{error?.data?.message || 'Error loading dashboard'}</Message>;

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <FaCrown className="text-warning me-3" size={40} />
            <div>
              <h1 className="mb-1">Super Admin Dashboard</h1>
              <p className="text-muted mb-0">Manage all tenants and system-wide settings</p>
            </div>
          </div>
          <TenantLinkButton />
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <FaBuilding size={40} className="text-primary mb-3" />
              <h3 className="mb-1">{stats.total}</h3>
              <p className="text-muted mb-0">Total Tenants</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <FaChartLine size={40} className="text-success mb-3" />
              <h3 className="mb-1">{stats.active}</h3>
              <p className="text-muted mb-0">Active Tenants</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <FaUsers size={40} className="text-info mb-3" />
              <h3 className="mb-1">{stats.totalUsers}</h3>
              <p className="text-muted mb-0">Total Users</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="mb-3">
                  <div className="d-grid">
                    <Button
                      variant="primary"
                      size="lg"
                      as={Link}
                      to="/super-admin/tenants/create"
                    >
                      <FaPlus className="me-2" />
                      Create New Tenant
                    </Button>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-grid">
                    <Button
                      variant="outline-primary"
                      size="lg"
                      as={Link}
                      to="/super-admin/tenants"
                    >
                      <FaBuilding className="me-2" />
                      Manage All Tenants
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Tenants */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Tenants</h5>
              <Button
                variant="outline-primary"
                size="sm"
                as={Link}
                to="/super-admin/tenants"
              >
                View All
              </Button>
            </Card.Header>
            <Card.Body>
              {tenantsData?.tenants?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Subdomain</th>
                        <th>Status</th>
                        <th>Plan</th>
                        <th>Users</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenantsData.tenants.slice(0, 5).map((tenant) => (
                        <tr key={tenant._id}>
                          <td>
                            <strong>{tenant.name}</strong>
                          </td>
                          <td>
                            <code>{tenant.subdomain}</code>
                          </td>
                          <td>
                            <span className={`badge bg-${
                              tenant.status === 'active' ? 'success' : 
                              tenant.status === 'suspended' ? 'danger' : 
                              'warning'
                            }`}>
                              {tenant.status}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {tenant.plan}
                            </span>
                          </td>
                          <td>{tenant.statistics?.userCount || 0}</td>
                          <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              as={Link}
                              to={`/super-admin/tenants/${tenant._id}`}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">No tenants created yet</p>
                  <Button
                    variant="primary"
                    as={Link}
                    to="/super-admin/tenants/create"
                  >
                    <FaPlus className="me-1" /> Create First Tenant
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SuperAdminDashboard; 