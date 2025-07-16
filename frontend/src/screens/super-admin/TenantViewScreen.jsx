import React from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetTenantDetailsQuery } from '../../slices/tenantApiSlice';
import { FaEdit, FaArrowLeft, FaUsers, FaChartBar } from 'react-icons/fa';

const TenantViewScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const { data: tenant, isLoading, error } = useGetTenantDetailsQuery(id);

    const getStatusBadge = (status) => {
        const variants = {
            active: 'success',
            suspended: 'danger',
            trial: 'warning',
            expired: 'secondary'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status?.toUpperCase()}</Badge>;
    };

    const getPlanBadge = (plan) => {
        const variants = {
            free: 'light',
            starter: 'info',
            professional: 'primary',
            enterprise: 'warning',
            custom: 'dark'
        };
        return <Badge bg={variants[plan] || 'light'}>{plan?.toUpperCase()}</Badge>;
    };

    if (isLoading) {
        return (
            <Container className="mt-4">
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    Error loading tenant: {error?.data?.message || 'Unknown error'}
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <Button 
                                variant="outline-secondary" 
                                as={Link} 
                                to="/super-admin/tenants"
                                className="me-3"
                            >
                                <FaArrowLeft /> Back
                            </Button>
                            <div>
                                <h2 className="mb-1">{tenant?.name}</h2>
                                <p className="text-muted mb-0">Tenant Details</p>
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <Button 
                                variant="primary" 
                                as={Link} 
                                to={`/super-admin/tenants/${id}/edit`}
                            >
                                <FaEdit className="me-1" /> Edit
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Main Content */}
            <Row>
                <Col lg={8}>
                    {/* Basic Information */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Basic Information</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <p><strong>Name:</strong> {tenant?.name}</p>
                                    <p><strong>Subdomain:</strong> {tenant?.subdomain}</p>
                                    <p><strong>Status:</strong> {getStatusBadge(tenant?.status)}</p>
                                    <p><strong>Plan:</strong> {getPlanBadge(tenant?.plan)}</p>
                                </Col>
                                <Col md={6}>
                                    <p><strong>Contact Email:</strong> {tenant?.contactEmail || 'None'}</p>
                                    <p><strong>Contact Phone:</strong> {tenant?.contactPhone || 'None'}</p>
                                    <p><strong>Created:</strong> {new Date(tenant?.createdAt).toLocaleDateString()}</p>
                                    <p><strong>Updated:</strong> {new Date(tenant?.updatedAt).toLocaleDateString()}</p>
                                </Col>
                            </Row>
                            {tenant?.description && (
                                <div className="mt-3">
                                    <strong>Description:</strong>
                                    <p className="mt-1">{tenant.description}</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Branding */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Branding</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <p><strong>App Name:</strong> {tenant?.branding?.appName || 'Default'}</p>
                                    <p><strong>Tagline:</strong> {tenant?.branding?.tagline || 'Default'}</p>
                                    <p><strong>Primary Color:</strong> 
                                        <span 
                                            className="ms-2 d-inline-block" 
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                backgroundColor: tenant?.branding?.primaryColor || '#4F46E5',
                                                border: '1px solid #ccc',
                                                verticalAlign: 'middle'
                                            }}
                                        ></span>
                                        {tenant?.branding?.primaryColor || '#4F46E5'}
                                    </p>
                                </Col>
                                <Col md={6}>
                                    <p><strong>PWA Name:</strong> {tenant?.branding?.pwaName || 'Default'}</p>
                                    <p><strong>PWA Short Name:</strong> {tenant?.branding?.pwaShortName || 'Default'}</p>
                                    <p><strong>Theme Color:</strong> 
                                        <span 
                                            className="ms-2 d-inline-block" 
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                backgroundColor: tenant?.branding?.pwaThemeColor || '#4F46E5',
                                                border: '1px solid #ccc',
                                                verticalAlign: 'middle'
                                            }}
                                        ></span>
                                        {tenant?.branding?.pwaThemeColor || '#4F46E5'}
                                    </p>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Sidebar */}
                <Col lg={4}>
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Quick Actions</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-grid gap-2">
                                <Button 
                                    variant="outline-primary" 
                                    as={Link}
                                    to={`/super-admin/tenants/${id}/edit`}
                                >
                                    <FaEdit className="me-2" />
                                    Edit Tenant
                                </Button>
                                <Button 
                                    variant="outline-info" 
                                    as={Link}
                                    to={`/super-admin/tenants/${id}/users`}
                                >
                                    <FaUsers className="me-2" />
                                    Manage Users
                                </Button>
                                <Button 
                                    variant="outline-success" 
                                    as={Link}
                                    to={`/super-admin/tenants/${id}/statistics`}
                                >
                                    <FaChartBar className="me-2" />
                                    View Statistics
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Statistics Summary */}
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Statistics</h5>
                        </Card.Header>
                        <Card.Body>
                            <p><strong>Total Users:</strong> {tenant?.statistics?.userCount || 0}</p>
                            <p><strong>Active Users:</strong> {tenant?.statistics?.activeUserCount || 0}</p>
                            <p><strong>Collections:</strong> {tenant?.statistics?.collectionCount || 0}</p>
                            <p><strong>Products:</strong> {tenant?.statistics?.productCount || 0}</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default TenantViewScreen; 