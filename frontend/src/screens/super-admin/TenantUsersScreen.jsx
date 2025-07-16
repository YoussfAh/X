import React, { useState } from 'react';
import { Container, Row, Col, Table, Button, Alert, Spinner, Badge, Card } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useGetTenantDetailsQuery, useGetTenantUsersQuery } from '../../slices/tenantApiSlice';
import { FaArrowLeft, FaUsers } from 'react-icons/fa';

const TenantUsersScreen = () => {
    const { id } = useParams();
    const [page, setPage] = useState(1);
    
    const { data: tenant } = useGetTenantDetailsQuery(id);
    const { data: usersData, isLoading, error } = useGetTenantUsersQuery({
        tenantId: id,
        page
    });

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
                    Error loading users: {error?.data?.message || 'Unknown error'}
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
                                to={`/super-admin/tenants/${id}`}
                                className="me-3"
                            >
                                <FaArrowLeft /> Back
                            </Button>
                            <div>
                                <h2 className="mb-1">Users: {tenant?.name}</h2>
                                <p className="text-muted mb-0">Manage users for this tenant</p>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Users Table */}
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <FaUsers className="me-2" />
                        Users ({usersData?.total || 0})
                    </h5>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table striped hover responsive className="mb-0">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Last Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersData?.users?.length > 0 ? (
                                usersData.users.map((user) => (
                                    <tr key={user._id}>
                                        <td>
                                            <div>
                                                <strong>{user.name}</strong>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            {user.isSuperAdmin ? (
                                                <Badge bg="danger">Super Admin</Badge>
                                            ) : user.isAdmin ? (
                                                <Badge bg="warning">Admin</Badge>
                                            ) : (
                                                <Badge bg="secondary">User</Badge>
                                            )}
                                        </td>
                                        <td>
                                            <Badge bg={user.isActive ? 'success' : 'secondary'}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {user.lastLogin 
                                                ? new Date(user.lastLogin).toLocaleDateString()
                                                : 'Never'
                                            }
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-4">
                                        <div className="text-muted">
                                            No users found for this tenant
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Pagination */}
            {usersData?.pages > 1 && (
                <div className="mt-4 text-center">
                    <p className="text-muted">
                        Page {usersData.page} of {usersData.pages} (Total: {usersData.total} users)
                    </p>
                    <div className="d-flex justify-content-center gap-2">
                        {page > 1 && (
                            <Button 
                                variant="outline-secondary" 
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                        )}
                        {page < usersData.pages && (
                            <Button 
                                variant="outline-secondary" 
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Container>
    );
};

export default TenantUsersScreen; 