import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Spinner, Card, Tab, Tabs } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetTenantDetailsQuery, useUpdateTenantMutation, useUpdateTenantBrandingMutation } from '../../slices/tenantApiSlice';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';

const TenantEditScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const { data: tenant, isLoading, error } = useGetTenantDetailsQuery(id);
    const [updateTenant, { isLoading: updateLoading }] = useUpdateTenantMutation();
    const [updateBranding, { isLoading: brandingLoading }] = useUpdateTenantBrandingMutation();

    // Basic Info State
    const [basicInfo, setBasicInfo] = useState({
        name: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        notes: ''
    });

    // Branding State
    const [branding, setBranding] = useState({
        appName: '',
        tagline: '',
        primaryColor: '#4F46E5',
        secondaryColor: '#7C3AED',
        pwaName: '',
        pwaShortName: '',
        pwaDescription: '',
        pwaThemeColor: '#4F46E5',
        pwaBackgroundColor: '#ffffff'
    });

    // Initialize form data when tenant loads
    useEffect(() => {
        if (tenant) {
            setBasicInfo({
                name: tenant.name || '',
                description: tenant.description || '',
                contactEmail: tenant.contactEmail || '',
                contactPhone: tenant.contactPhone || '',
                notes: tenant.notes || ''
            });

            setBranding({
                appName: tenant.branding?.appName || '',
                tagline: tenant.branding?.tagline || '',
                primaryColor: tenant.branding?.primaryColor || '#4F46E5',
                secondaryColor: tenant.branding?.secondaryColor || '#7C3AED',
                pwaName: tenant.branding?.pwaName || '',
                pwaShortName: tenant.branding?.pwaShortName || '',
                pwaDescription: tenant.branding?.pwaDescription || '',
                pwaThemeColor: tenant.branding?.pwaThemeColor || '#4F46E5',
                pwaBackgroundColor: tenant.branding?.pwaBackgroundColor || '#ffffff'
            });
        }
    }, [tenant]);

    const handleBasicInfoSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateTenant({
                tenantId: id,
                ...basicInfo
            }).unwrap();
            toast.success('Basic information updated successfully');
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to update basic information');
        }
    };

    const handleBrandingSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateBranding({
                tenantId: id,
                ...branding
            }).unwrap();
            toast.success('Branding updated successfully');
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to update branding');
        }
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
                                to={`/super-admin/tenants/${id}`}
                                className="me-3"
                            >
                                <FaArrowLeft /> Back
                            </Button>
                            <div>
                                <h2 className="mb-1">Edit Tenant: {tenant?.name}</h2>
                                <p className="text-muted mb-0">Manage tenant settings and branding</p>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            <Tabs defaultActiveKey="basic" className="mb-4">
                {/* Basic Information Tab */}
                <Tab eventKey="basic" title="Basic Information">
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Basic Information</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleBasicInfoSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Tenant Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={basicInfo.name}
                                                onChange={(e) => setBasicInfo({...basicInfo, name: e.target.value})}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Contact Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                value={basicInfo.contactEmail}
                                                onChange={(e) => setBasicInfo({...basicInfo, contactEmail: e.target.value})}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Contact Phone</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={basicInfo.contactPhone}
                                                onChange={(e) => setBasicInfo({...basicInfo, contactPhone: e.target.value})}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Subdomain</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={tenant?.subdomain}
                                                readOnly
                                                className="bg-light"
                                            />
                                            <Form.Text className="text-muted">
                                                Subdomains cannot be changed after creation
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={basicInfo.description}
                                        onChange={(e) => setBasicInfo({...basicInfo, description: e.target.value})}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Notes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={basicInfo.notes}
                                        onChange={(e) => setBasicInfo({...basicInfo, notes: e.target.value})}
                                    />
                                </Form.Group>

                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    disabled={updateLoading}
                                >
                                    {updateLoading ? (
                                        <>
                                            <Spinner size="sm" className="me-2" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave className="me-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* Branding Tab */}
                <Tab eventKey="branding" title="Branding">
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Branding & Appearance</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleBrandingSubmit}>
                                <h6 className="mb-3">App Identity</h6>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>App Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={branding.appName}
                                                onChange={(e) => setBranding({...branding, appName: e.target.value})}
                                                placeholder="Your App Name"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Tagline</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={branding.tagline}
                                                onChange={(e) => setBranding({...branding, tagline: e.target.value})}
                                                placeholder="Your app's tagline"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <h6 className="mb-3 mt-4">Colors</h6>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Primary Color</Form.Label>
                                            <div className="d-flex gap-2">
                                                <Form.Control
                                                    type="color"
                                                    value={branding.primaryColor}
                                                    onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                                                    style={{ width: '60px', height: '38px' }}
                                                />
                                                <Form.Control
                                                    type="text"
                                                    value={branding.primaryColor}
                                                    onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Secondary Color</Form.Label>
                                            <div className="d-flex gap-2">
                                                <Form.Control
                                                    type="color"
                                                    value={branding.secondaryColor}
                                                    onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                                                    style={{ width: '60px', height: '38px' }}
                                                />
                                                <Form.Control
                                                    type="text"
                                                    value={branding.secondaryColor}
                                                    onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <h6 className="mb-3 mt-4">PWA Settings</h6>
                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>PWA Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={branding.pwaName}
                                                onChange={(e) => setBranding({...branding, pwaName: e.target.value})}
                                                placeholder="Full PWA name"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>PWA Short Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={branding.pwaShortName}
                                                onChange={(e) => setBranding({...branding, pwaShortName: e.target.value})}
                                                placeholder="Short name"
                                                maxLength={12}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>PWA Theme Color</Form.Label>
                                            <div className="d-flex gap-2">
                                                <Form.Control
                                                    type="color"
                                                    value={branding.pwaThemeColor}
                                                    onChange={(e) => setBranding({...branding, pwaThemeColor: e.target.value})}
                                                    style={{ width: '60px', height: '38px' }}
                                                />
                                                <Form.Control
                                                    type="text"
                                                    value={branding.pwaThemeColor}
                                                    onChange={(e) => setBranding({...branding, pwaThemeColor: e.target.value})}
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>PWA Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={branding.pwaDescription}
                                        onChange={(e) => setBranding({...branding, pwaDescription: e.target.value})}
                                        placeholder="Description for PWA manifest"
                                    />
                                </Form.Group>

                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    disabled={brandingLoading}
                                >
                                    {brandingLoading ? (
                                        <>
                                            <Spinner size="sm" className="me-2" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave className="me-2" />
                                            Save Branding
                                        </>
                                    )}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default TenantEditScreen; 