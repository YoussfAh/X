import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Spinner, Card } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateTenantMutation } from '../../slices/tenantApiSlice';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const CreateTenantScreen = () => {
    const navigate = useNavigate();
    const [createTenant, { isLoading }] = useCreateTenantMutation();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        subdomain: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
        contactEmail: '',
        contactPhone: '',
        plan: 'free'
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Auto-generate subdomain from name
        if (name === 'name' && !formData.subdomain) {
            const generatedSubdomain = value
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            setFormData(prev => ({
                ...prev,
                subdomain: generatedSubdomain
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tenant name is required';
        }

        if (!formData.subdomain.trim()) {
            newErrors.subdomain = 'Subdomain is required';
        } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
            newErrors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
        }

        if (!formData.ownerName.trim()) {
            newErrors.ownerName = 'Owner name is required';
        }

        if (!formData.ownerEmail.trim()) {
            newErrors.ownerEmail = 'Owner email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
            newErrors.ownerEmail = 'Owner email is invalid';
        }

        if (!formData.ownerPassword) {
            newErrors.ownerPassword = 'Owner password is required';
        } else if (formData.ownerPassword.length < 6) {
            newErrors.ownerPassword = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const result = await createTenant(formData).unwrap();
            toast.success(`Tenant "${result.name}" created successfully!`);
            navigate(`/super-admin/tenants/${result._id}`);
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to create tenant');
        }
    };

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
                                <h2 className="mb-1">Create New Tenant</h2>
                                <p className="text-muted mb-0">Set up a new tenant with basic configuration</p>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            <Row className="justify-content-center">
                <Col lg={8}>
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Tenant Information</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                {/* Basic Information */}
                                <h6 className="mb-3">Basic Information</h6>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Tenant Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                isInvalid={!!errors.name}
                                                placeholder="e.g., Acme Fitness"
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.name}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Subdomain *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="subdomain"
                                                value={formData.subdomain}
                                                onChange={handleChange}
                                                isInvalid={!!errors.subdomain}
                                                placeholder="e.g., acme"
                                            />
                                            <Form.Text className="text-muted">
                                                Will be accessible at: {formData.subdomain || 'subdomain'}.yourdomain.com
                                            </Form.Text>
                                            <Form.Control.Feedback type="invalid">
                                                {errors.subdomain}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Brief description of this tenant"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Plan</Form.Label>
                                    <Form.Select
                                        name="plan"
                                        value={formData.plan}
                                        onChange={handleChange}
                                    >
                                        <option value="free">Free</option>
                                        <option value="starter">Starter</option>
                                        <option value="professional">Professional</option>
                                        <option value="enterprise">Enterprise</option>
                                        <option value="custom">Custom</option>
                                    </Form.Select>
                                </Form.Group>

                                {/* Owner Information */}
                                <h6 className="mb-3 mt-4">Owner Information</h6>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Owner Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="ownerName"
                                                value={formData.ownerName}
                                                onChange={handleChange}
                                                isInvalid={!!errors.ownerName}
                                                placeholder="John Doe"
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.ownerName}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Owner Email *</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="ownerEmail"
                                                value={formData.ownerEmail}
                                                onChange={handleChange}
                                                isInvalid={!!errors.ownerEmail}
                                                placeholder="john@example.com"
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.ownerEmail}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-4">
                                    <Form.Label>Owner Password *</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="ownerPassword"
                                        value={formData.ownerPassword}
                                        onChange={handleChange}
                                        isInvalid={!!errors.ownerPassword}
                                        placeholder="Minimum 6 characters"
                                    />
                                    <Form.Text className="text-muted">
                                        This will be the admin login for the tenant
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.ownerPassword}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                {/* Contact Information */}
                                <h6 className="mb-3 mt-4">Contact Information (Optional)</h6>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Contact Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="contactEmail"
                                                value={formData.contactEmail}
                                                onChange={handleChange}
                                                placeholder="contact@example.com"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Contact Phone</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="contactPhone"
                                                value={formData.contactPhone}
                                                onChange={handleChange}
                                                placeholder="+1 (555) 123-4567"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-flex gap-2 mt-4">
                                    <Button 
                                        type="submit" 
                                        variant="primary" 
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Spinner size="sm" className="me-2" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <FaPlus className="me-2" />
                                                Create Tenant
                                            </>
                                        )}
                                    </Button>
                                    <Button 
                                        variant="outline-secondary" 
                                        as={Link} 
                                        to="/super-admin/tenants"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default CreateTenantScreen; 