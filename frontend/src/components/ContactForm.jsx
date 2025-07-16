import React, { useState } from 'react';
import {
    Card,
    Button,
    Form,
    Row,
    Col,
    Badge,
    Modal,
    Spinner
} from 'react-bootstrap';
import {
    FaHeadset,
    FaPhoneAlt,
    FaEnvelope,
    FaComments,
    FaUser,
    FaCalendarAlt,
    FaTag,
    FaCheckCircle,
    FaTimes,
    FaInfoCircle
} from 'react-icons/fa';
import { useTrackUserContactMutation } from '../slices/usersApiSlice';
import { showSuccessToast, showErrorToast } from '../utils/toastConfig';

const ContactForm = ({
    userId,
    isDarkMode = false,
    onContactAdded,
    showAsModal = false,
    showModal = false,
    onCloseModal = () => { }
}) => {
    // Form state
    const [formData, setFormData] = useState({
        contactNotes: '',
        contactType: 'other',
        status: 'completed',
        outcome: '',
        followUpDate: '',
        tags: ''
    });

    // API hooks
    const [trackUserContact, { isLoading }] = useTrackUserContactMutation();

    // Theme colors
    const colors = {
        // Pure black backgrounds for AMOLED efficiency
        background: isDarkMode ? '#000000' : '#f8f9fa',
        cardBg: isDarkMode ? '#000000' : '#ffffff',
        cardHeaderBg: isDarkMode ? '#0a0a0a' : '#f1f3f4',

        // Enhanced contrast for better readability
        text: isDarkMode ? '#ffffff' : '#1a1a1a',
        mutedText: isDarkMode ? '#b3b3b3' : '#666666',

        // Subtle borders for depth
        border: isDarkMode ? '#1a1a1a' : '#e5e5e5',
        divider: isDarkMode ? '#1f1f1f' : '#f0f0f0',

        // Vibrant accent colors
        accent: '#8b5cf6',
        accentLight: isDarkMode ? '#a78bfa' : '#7c3aed',

        // Status colors optimized for dark theme
        success: isDarkMode ? '#10b981' : '#059669',
        warning: isDarkMode ? '#f59e0b' : '#d97706',
        danger: isDarkMode ? '#ef4444' : '#dc2626',
        info: isDarkMode ? '#3b82f6' : '#2563eb',

        // Input and interactive elements
        inputBg: isDarkMode ? '#0f0f0f' : '#ffffff',
        hoverBg: isDarkMode ? '#1a1a1a' : '#f9f9f9',

        // Gradients for visual appeal
        gradientPrimary: isDarkMode
            ? 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
            : 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
        gradientCard: isDarkMode
            ? 'linear-gradient(145deg, #000000 0%, #0a0a0a 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',

        // Shadows for depth
        shadow: isDarkMode
            ? '0 4px 20px rgba(0, 0, 0, 0.4)'
            : '0 2px 15px rgba(0, 0, 0, 0.1)',
        shadowLarge: isDarkMode
            ? '0 8px 30px rgba(0, 0, 0, 0.5)'
            : '0 4px 25px rgba(0, 0, 0, 0.15)'
    };

    // Contact type configuration
    const contactTypeConfig = {
        phone: { icon: FaPhoneAlt, color: '#10b981', label: 'Phone Call' },
        email: { icon: FaEnvelope, color: '#3b82f6', label: 'Email' },
        whatsapp: { icon: FaComments, color: '#25d366', label: 'WhatsApp' },
        'in-person': { icon: FaUser, color: '#8b5cf6', label: 'In Person' },
        other: { icon: FaComments, color: '#6b7280', label: 'Other' }
    };

    // Status configuration
    const statusConfig = {
        completed: { color: colors.success, label: 'Completed' },
        'follow-up-needed': { color: colors.warning, label: 'Follow-up Needed' },
        'no-response': { color: colors.danger, label: 'No Response' },
        resolved: { color: colors.accent, label: 'Resolved' }
    };

    // Handlers
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleClear = () => {
        setFormData({
            contactNotes: '',
            contactType: 'other',
            status: 'completed',
            outcome: '',
            followUpDate: '',
            tags: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const contactData = {
                userId,
                ...formData,
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
            };

            const result = await trackUserContact(contactData).unwrap();

            showSuccessToast('Contact recorded successfully');
            handleClear();

            if (onContactAdded) {
                onContactAdded();
            }

            if (showAsModal) {
                onCloseModal();
            }
        } catch (error) {
            showErrorToast(error?.data?.message || 'Failed to record contact');
        }
    };

    const renderContactTypeIcon = (type) => {
        const config = contactTypeConfig[type] || contactTypeConfig.other;
        const IconComponent = config.icon;
        return <IconComponent style={{ color: config.color }} size={16} />;
    };

    const formContent = (
        <Form onSubmit={handleSubmit}>
            {/* Contact Type and Status Row */}
            <Row className="mb-3">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label style={{ color: colors.text, fontWeight: '500' }}>
                            {renderContactTypeIcon(formData.contactType)} Contact Type
                        </Form.Label>
                        <Form.Select
                            value={formData.contactType}
                            onChange={(e) => handleInputChange('contactType', e.target.value)}
                            style={{
                                backgroundColor: colors.inputBg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '8px'
                            }}
                        >
                            {Object.entries(contactTypeConfig).map(([type, config]) => (
                                <option key={type} value={type}>{config.label}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label style={{ color: colors.text, fontWeight: '500' }}>
                            <FaCheckCircle style={{ color: colors.success, marginRight: '8px' }} />
                            Status
                        </Form.Label>
                        <Form.Select
                            value={formData.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                            style={{
                                backgroundColor: colors.inputBg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '12px',
                                padding: '12px 16px',
                                fontSize: '1rem',
                                transition: 'all 0.2s ease',
                                boxShadow: isDarkMode
                                    ? 'inset 0 2px 8px rgba(0,0,0,0.3)'
                                    : 'inset 0 2px 6px rgba(0,0,0,0.05)'
                            }}
                        >
                            {Object.entries(statusConfig).map(([status, config]) => (
                                <option key={status} value={status}>{config.label}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            {/* Contact Notes */}
            <Form.Group className="mb-3">
                <Form.Label style={{
                    color: colors.text,
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                }}>
                    <FaComments style={{ color: colors.accent }} />
                    Contact Notes
                </Form.Label>
                <Form.Control
                    as="textarea"
                    rows={4}
                    value={formData.contactNotes}
                    onChange={(e) => handleInputChange('contactNotes', e.target.value)}
                    placeholder="Describe the contact interaction, what was discussed, any decisions made..."
                    style={{
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        border: `2px solid ${colors.border}`,
                        borderRadius: '16px',
                        padding: '16px 20px',
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        minHeight: '120px',
                        transition: 'all 0.3s ease',
                        boxShadow: isDarkMode
                            ? 'inset 0 2px 8px rgba(0,0,0,0.3)'
                            : 'inset 0 2px 6px rgba(0,0,0,0.05)',
                        fontWeight: '500'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = colors.accent;
                        e.target.style.boxShadow = isDarkMode
                            ? `0 0 0 3px rgba(139, 92, 246, 0.1), inset 0 2px 8px rgba(0,0,0,0.3)`
                            : `0 0 0 3px rgba(139, 92, 246, 0.1), inset 0 2px 6px rgba(0,0,0,0.05)`;
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = colors.border;
                        e.target.style.boxShadow = isDarkMode
                            ? 'inset 0 2px 8px rgba(0,0,0,0.3)'
                            : 'inset 0 2px 6px rgba(0,0,0,0.05)';
                    }}
                />
                <Form.Text style={{
                    color: colors.mutedText,
                    fontSize: '0.9rem',
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>Provide detailed notes about the interaction</span>
                    <span style={{
                        fontWeight: '500',
                        color: formData.contactNotes.length > 800 ? colors.warning : colors.mutedText
                    }}>
                        {formData.contactNotes.length}/1000 characters
                    </span>
                </Form.Text>
            </Form.Group>

            {/* Follow-up Date and Outcome Row */}
            <Row className="mb-3">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label style={{
                            color: colors.text,
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '10px'
                        }}>
                            <FaCalendarAlt style={{ color: colors.info }} />
                            Follow-up Date
                        </Form.Label>
                        <Form.Control
                            type="date"
                            value={formData.followUpDate}
                            onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                            style={{
                                backgroundColor: colors.inputBg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '12px',
                                padding: '12px 16px',
                                fontSize: '1rem',
                                transition: 'all 0.2s ease',
                                boxShadow: isDarkMode
                                    ? 'inset 0 2px 8px rgba(0,0,0,0.3)'
                                    : 'inset 0 2px 6px rgba(0,0,0,0.05)'
                            }}
                            onFocus={(e) => e.target.style.borderColor = colors.accent}
                            onBlur={(e) => e.target.style.borderColor = colors.border}
                        />
                        <Form.Text style={{ color: colors.mutedText, fontSize: '0.85rem', marginTop: '4px' }}>
                            Optional: When should this be followed up?
                        </Form.Text>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label style={{
                            color: colors.text,
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '10px'
                        }}>
                            <FaCheckCircle style={{ color: colors.success }} />
                            Outcome
                        </Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.outcome}
                            onChange={(e) => handleInputChange('outcome', e.target.value)}
                            placeholder="What was the result or outcome of this contact?"
                            style={{
                                backgroundColor: colors.inputBg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '12px',
                                padding: '12px 16px',
                                fontSize: '1rem',
                                transition: 'all 0.2s ease',
                                boxShadow: isDarkMode
                                    ? 'inset 0 2px 8px rgba(0,0,0,0.3)'
                                    : 'inset 0 2px 6px rgba(0,0,0,0.05)'
                            }}
                            onFocus={(e) => e.target.style.borderColor = colors.accent}
                            onBlur={(e) => e.target.style.borderColor = colors.border}
                        />
                        <Form.Text style={{ color: colors.mutedText, fontSize: '0.85rem', marginTop: '4px' }}>
                            Optional: Summarize the main outcome or result
                        </Form.Text>
                    </Form.Group>
                </Col>
            </Row>

            {/* Tags */}
            <Form.Group className="mb-4">
                <Form.Label style={{
                    color: colors.text,
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px'
                }}>
                    <FaTag style={{ color: colors.warning }} />
                    Tags
                </Form.Label>
                <Form.Control
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="e.g. urgent, billing, support, follow-up"
                    style={{
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease',
                        boxShadow: isDarkMode
                            ? 'inset 0 2px 8px rgba(0,0,0,0.3)'
                            : 'inset 0 2px 6px rgba(0,0,0,0.05)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = colors.accent}
                    onBlur={(e) => e.target.style.borderColor = colors.border}
                />
                <Form.Text style={{ color: colors.mutedText, fontSize: '0.85rem', marginTop: '4px' }}>
                    Optional: Comma-separated tags for easier filtering
                </Form.Text>
            </Form.Group>

            {/* Action Buttons */}
            <div className="d-flex justify-content-between" style={{ marginTop: '30px' }}>
                <Button
                    variant="outline-secondary"
                    onClick={handleClear}
                    disabled={isLoading}
                    style={{
                        borderColor: colors.border,
                        color: colors.text,
                        borderRadius: '16px',
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: '140px',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = colors.hoverBg;
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = colors.shadow;
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    <FaTimes />
                    Clear Form
                </Button>

                <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading || !formData.contactNotes.trim()}
                    style={{
                        background: colors.gradientPrimary,
                        border: 'none',
                        borderRadius: '16px',
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        minWidth: '160px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        boxShadow: colors.shadow
                    }}
                    onMouseEnter={(e) => {
                        if (!e.target.disabled) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = colors.shadowLarge;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!e.target.disabled) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = colors.shadow;
                        }
                    }}
                >
                    {isLoading ? (
                        <>
                            <Spinner animation="border" size="sm" />
                            Recording...
                        </>
                    ) : (
                        <>
                            <FaHeadset />
                            Record Contact
                        </>
                    )}
                </Button>
            </div>
        </Form>
    );

    if (showAsModal) {
        return (
            <Modal show={showModal} onHide={onCloseModal} size="lg">
                <Modal.Header
                    closeButton
                    style={{
                        background: colors.gradientCard,
                        borderBottom: `2px solid ${colors.border}`,
                        padding: '20px 25px'
                    }}
                >
                    <Modal.Title style={{
                        color: colors.text,
                        fontSize: '1.4rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            background: colors.gradientPrimary,
                            padding: '8px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FaHeadset style={{ color: '#ffffff', fontSize: '1.2rem' }} />
                        </div>
                        Record New Contact
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{
                    background: colors.gradientCard,
                    padding: '30px'
                }}>
                    {formContent}
                </Modal.Body>
            </Modal>
        );
    }

    return (
        <Card style={{
            background: colors.gradientCard,
            border: `1px solid ${colors.border}`,
            borderRadius: '20px',
            boxShadow: colors.shadowLarge,
            overflow: 'hidden'
        }}>
            <Card.Header style={{
                background: colors.gradientPrimary,
                borderBottom: `2px solid ${colors.accentLight}`,
                padding: '25px'
            }}>
                <div className="d-flex align-items-center gap-3">
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '12px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                        <FaHeadset style={{ color: '#ffffff', fontSize: '1.5rem' }} />
                    </div>
                    <div>
                        <h5 style={{
                            margin: 0,
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '1.4rem',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                            Record New Contact
                        </h5>
                        <div style={{
                            marginTop: '8px',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            background: 'rgba(255,255,255,0.15)',
                            fontSize: '0.9rem',
                            color: 'rgba(255,255,255,0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <FaInfoCircle />
                            Track your communication with this user for better follow-up management
                        </div>
                    </div>
                </div>
            </Card.Header>
            <Card.Body style={{ padding: '30px' }}>
                {formContent}
            </Card.Body>
        </Card>
    );
};

export default ContactForm; 