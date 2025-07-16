import React from 'react';
import { Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useGetTenantDetailsQuery, useGetTenantStatisticsQuery } from '../../slices/tenantApiSlice';
import { FaArrowLeft, FaUsers, FaLayerGroup, FaBox, FaChartLine } from 'react-icons/fa';

const TenantStatisticsScreen = () => {
    const { id } = useParams();
    
    const { data: tenant } = useGetTenantDetailsQuery(id);
    const { data: stats, isLoading, error } = useGetTenantStatisticsQuery(id);

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
                    Error loading statistics: {error?.data?.message || 'Unknown error'}
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
                            <Link 
                                to={`/super-admin/tenants/${id}`}
                                className="me-3"
                            >
                                <FaArrowLeft /> Back
                            </Link>
                            <div>
                                <h2 className="mb-1">Statistics: {tenant?.name}</h2>
                                <p className="text-muted mb-0">Usage statistics and analytics</p>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Statistics Cards */}
            <Row>
                <Col md={3} className="mb-4">
                    <Card className="h-100">
                        <Card.Body className="text-center">
                            <FaUsers size={40} className="text-primary mb-3" />
                            <h3 className="mb-1">{stats?.userCount || 0}</h3>
                            <p className="text-muted mb-0">Total Users</p>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={3} className="mb-4">
                    <Card className="h-100">
                        <Card.Body className="text-center">
                            <FaUsers size={40} className="text-success mb-3" />
                            <h3 className="mb-1">{stats?.activeUserCount || 0}</h3>
                            <p className="text-muted mb-0">Active Users</p>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={3} className="mb-4">
                    <Card className="h-100">
                        <Card.Body className="text-center">
                            <FaLayerGroup size={40} className="text-info mb-3" />
                            <h3 className="mb-1">{stats?.collectionCount || 0}</h3>
                            <p className="text-muted mb-0">Collections</p>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={3} className="mb-4">
                    <Card className="h-100">
                        <Card.Body className="text-center">
                            <FaBox size={40} className="text-warning mb-3" />
                            <h3 className="mb-1">{stats?.productCount || 0}</h3>
                            <p className="text-muted mb-0">Products</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Detailed Statistics */}
            <Row>
                <Col lg={6} className="mb-4">
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Usage Overview</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                <strong>Total Storage Used:</strong>
                                <div className="text-muted">
                                    {stats?.totalStorageUsedMB ? 
                                        `${(stats.totalStorageUsedMB / 1024).toFixed(2)} GB` : 
                                        '0 GB'
                                    }
                                </div>
                            </div>
                            
                            <div className="mb-3">
                                <strong>AI Requests This Month:</strong>
                                <div className="text-muted">{stats?.aiRequestsThisMonth || 0}</div>
                            </div>
                            
                            <div className="mb-3">
                                <strong>Last Activity:</strong>
                                <div className="text-muted">
                                    {stats?.lastActivityAt ? 
                                        new Date(stats.lastActivityAt).toLocaleString() : 
                                        'No activity recorded'
                                    }
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col lg={6} className="mb-4">
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Tenant Information</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                <strong>Plan:</strong>
                                <div className="text-muted">{tenant?.plan || 'N/A'}</div>
                            </div>
                            
                            <div className="mb-3">
                                <strong>Status:</strong>
                                <div className="text-muted">{tenant?.status || 'N/A'}</div>
                            </div>
                            
                            <div className="mb-3">
                                <strong>Created:</strong>
                                <div className="text-muted">
                                    {tenant?.createdAt ? 
                                        new Date(tenant.createdAt).toLocaleString() : 
                                        'N/A'
                                    }
                                </div>
                            </div>
                            
                            <div className="mb-3">
                                <strong>Last Updated:</strong>
                                <div className="text-muted">
                                    {tenant?.updatedAt ? 
                                        new Date(tenant.updatedAt).toLocaleString() : 
                                        'N/A'
                                    }
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default TenantStatisticsScreen; 