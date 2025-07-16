import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Modal,
    Form,
    Badge,
    Row,
    Col,
    Dropdown,
    OverlayTrigger,
    Tooltip,
    Spinner
} from 'react-bootstrap';
import {
    FaHistory,
    FaEdit,
    FaTrash,
    FaPhoneAlt,
    FaEnvelope,
    FaComments,
    FaUser,
    FaCalendarAlt,
    FaTag,
    FaEye,
    FaEyeSlash,
    FaCheckCircle,
    FaTimes,
    FaFilter,
    FaEraser
} from 'react-icons/fa';
import { format } from 'date-fns';
import {
    useGetUserContactHistoryQuery,
    useUpdateContactEntryMutation,
    useDeleteContactEntryMutation,
    useClearContactNotesMutation
} from '../slices/usersApiSlice';
import { showSuccessToast, showErrorToast } from '../utils/toastConfig';

const ContactHistory = ({
    userId,
    isDarkMode = false,
    showHeader = true,
    maxHeight = '400px',
    limit = 20,
    refreshTrigger = 0
}) => {
    // State management
    const [showModal, setShowModal] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showInactive, setShowInactive] = useState(true);
    const [selectedTagFilter, setSelectedTagFilter] = useState(null);
    const [expandedContact, setExpandedContact] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        notes: '',
        contactType: 'other',
        status: 'completed',
        outcome: '',
        followUpDate: '',
        tags: ''
    });

    // API hooks
    const [forceRefresh, setForceRefresh] = useState(0);

    const queryParams = {
        userId,
        limit,
        contactType: filterType !== 'all' ? filterType : null,
        status: filterStatus !== 'all' ? filterStatus : null,
        includeInactive: showInactive,
        _refresh: forceRefresh
    };

    const {
        data: contactData,
        isLoading,
        error,
        refetch
    } = useGetUserContactHistoryQuery(queryParams);



    const [updateContactEntry, { isLoading: isUpdating }] = useUpdateContactEntryMutation();
    const [deleteContactEntry, { isLoading: isDeleting }] = useDeleteContactEntryMutation();
    const [clearContactNotes, { isLoading: isClearing }] = useClearContactNotesMutation();

    // Enhanced AMOLED dark theme colors
    const colors = {
        // Pure black backgrounds for AMOLED efficiency
        cardBg: isDarkMode ? '#000000' : '#ffffff',
        cardHeaderBg: isDarkMode ? '#0a0a0a' : '#f8f9fa',

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
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 2px 15px rgba(0, 0, 0, 0.1)',
        shadowLarge: isDarkMode
            ? '0 8px 30px rgba(0, 0, 0, 0.4)'
            : '0 4px 25px rgba(0, 0, 0, 0.15)'
    };

    // Contact type icons and colors
    const contactTypeConfig = {
        phone: { icon: FaPhoneAlt, color: '#10b981', label: 'Phone' },
        email: { icon: FaEnvelope, color: '#3b82f6', label: 'Email' },
        whatsapp: { icon: FaComments, color: '#25d366', label: 'WhatsApp' },
        'in-person': { icon: FaUser, color: '#8b5cf6', label: 'In Person' },
        other: { icon: FaComments, color: '#6b7280', label: 'Other' }
    };

    // Status colors and labels
    const statusConfig = {
        completed: { color: colors.success, label: 'Completed' },
        'follow-up-needed': { color: colors.warning, label: 'Follow-up Needed' },
        'no-response': { color: colors.danger, label: 'No Response' },
        resolved: { color: colors.accent, label: 'Resolved' }
    };

    // Reset form when modal closes
    useEffect(() => {
        if (!showModal) {
            setEditingContact(null);
            setFormData({
                notes: '',
                contactType: 'other',
                status: 'completed',
                outcome: '',
                followUpDate: '',
                tags: ''
            });
        }
    }, [showModal]);

    // Populate form when editing
    useEffect(() => {
        if (editingContact) {
            setFormData({
                notes: editingContact.notes || '',
                contactType: editingContact.contactType || 'other',
                status: editingContact.status || 'completed',
                outcome: editingContact.outcome || '',
                followUpDate: editingContact.followUpDate ?
                    new Date(editingContact.followUpDate).toISOString().split('T')[0] : '',
                tags: editingContact.tags ? editingContact.tags.join(', ') : ''
            });
        }
    }, [editingContact]);

    // Refetch data when refreshTrigger changes (for external refresh requests)
    useEffect(() => {
        if (refreshTrigger > 0) {
            setForceRefresh(Date.now()); // Force cache busting
            refetch();
        }
    }, [refreshTrigger, refetch]);

    // Handlers
    const handleEditContact = (contact) => {
        setEditingContact(contact);
        setShowModal(true);
    };

    const handleSaveContact = async () => {
        try {
            const updateData = {
                userId,
                contactId: editingContact._id,
                ...formData,
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
            };

            await updateContactEntry(updateData).unwrap();
            showSuccessToast('Contact updated successfully');
            setShowModal(false);
            refetch();
        } catch (error) {
            showErrorToast(error?.data?.message || 'Failed to update contact');
        }
    };

    const handleDeleteContact = async (contactId) => {
        if (window.confirm('Are you sure you want to delete this contact entry?')) {
            try {
                await deleteContactEntry({ userId, contactId }).unwrap();
                showSuccessToast('Contact deleted successfully');
                refetch();
            } catch (error) {
                showErrorToast(error?.data?.message || 'Failed to delete contact');
            }
        }
    };

    const handleClearNotes = async () => {
        if (window.confirm('Are you sure you want to clear all contact notes?')) {
            try {
                await clearContactNotes(userId).unwrap();
                showSuccessToast('Contact notes cleared successfully');
                refetch();
            } catch (error) {
                showErrorToast(error?.data?.message || 'Failed to clear contact notes');
            }
        }
    };

    const handleTagClick = (tag) => {
        if (selectedTagFilter === tag) {
            setSelectedTagFilter(null); // Clear filter if same tag is clicked
        } else {
            setSelectedTagFilter(tag);
        }
    };

    const toggleContactExpansion = (contactId) => {
        setExpandedContact(expandedContact === contactId ? null : contactId);
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const contactDate = new Date(date);
        const diffInHours = Math.floor((now - contactDate) / (1000 * 60 * 60));

        if (diffInHours < 24) {
            return diffInHours === 0 ? 'Just now' : `${diffInHours}h ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    };

    const renderContactTypeIcon = (type) => {
        const config = contactTypeConfig[type] || contactTypeConfig.other;
        const IconComponent = config.icon;
        return <IconComponent style={{ color: config.color }} />;
    };

    const renderStatusBadge = (status) => {
        const config = statusConfig[status] || statusConfig.completed;
        return (
            <Badge
                style={{
                    backgroundColor: config.color,
                    color: 'white',
                    fontSize: '0.75rem'
                }}
            >
                {config.label}
            </Badge>
        );
    };

    const filteredContacts = (contactData?.contactHistory || []).filter(contact => {
        // Filter by tag if selected
        if (selectedTagFilter && (!contact.tags || !contact.tags.includes(selectedTagFilter))) {
            return false;
        }
        return true;
    });

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center p-4">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                Error loading contact history: {error?.data?.message || 'Unknown error'}
            </div>
        );
    }

    return (
        <>
            <Card style={{
                background: colors.gradientCard,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                boxShadow: colors.shadowLarge,
                overflow: 'hidden',
                transition: 'all 0.3s ease'
            }}>
                {showHeader && (
                    <Card.Header style={{
                        background: colors.gradientPrimary,
                        borderBottom: `1px solid ${colors.border}`,
                        padding: '20px',
                        position: 'relative'
                    }}>
                        {/* Mobile-first responsive header */}
                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
                            <h5 style={{
                                margin: 0,
                                color: '#ffffff',
                                fontWeight: '700',
                                fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    padding: '8px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FaHistory style={{ color: '#ffffff', fontSize: '1.1rem' }} />
                                </div>
                                Contact History
                                {contactData?.totalContacts > 0 && (
                                    <Badge
                                        style={{
                                            fontSize: '0.75rem',
                                            background: 'rgba(255,255,255,0.25)',
                                            color: '#ffffff',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                    >
                                        {contactData.totalContacts}
                                    </Badge>
                                )}
                            </h5>
                            {/* Mobile-responsive action buttons */}
                            <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-lg-auto">
                                {selectedTagFilter && (
                                    <Button
                                        size="sm"
                                        onClick={() => setSelectedTagFilter(null)}
                                        style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            color: '#ffffff',
                                            fontSize: '0.75rem',
                                            borderRadius: '20px',
                                            padding: '6px 12px',
                                            backdropFilter: 'blur(10px)',
                                            transition: 'all 0.2s ease',
                                            whiteSpace: 'nowrap'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'rgba(255,255,255,0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'rgba(255,255,255,0.2)';
                                        }}
                                    >
                                        <FaTimes size={10} /> Clear Tag: "{selectedTagFilter}"
                                    </Button>
                                )}

                                <Dropdown>
                                    <Dropdown.Toggle
                                        size="sm"
                                        style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            color: '#ffffff',
                                            borderRadius: '20px',
                                            padding: '6px 16px',
                                            fontSize: '0.8rem',
                                            backdropFilter: 'blur(10px)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <FaFilter size={12} /> Filter
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Header>Contact Type</Dropdown.Header>
                                        <Dropdown.Item onClick={() => setFilterType('all')}>All Types</Dropdown.Item>
                                        {Object.entries(contactTypeConfig).map(([type, config]) => (
                                            <Dropdown.Item key={type} onClick={() => setFilterType(type)}>
                                                {renderContactTypeIcon(type)} {config.label}
                                            </Dropdown.Item>
                                        ))}
                                        <Dropdown.Divider />
                                        <Dropdown.Header>Status</Dropdown.Header>
                                        <Dropdown.Item onClick={() => setFilterStatus('all')}>All Statuses</Dropdown.Item>
                                        {Object.entries(statusConfig).map(([status, config]) => (
                                            <Dropdown.Item key={status} onClick={() => setFilterStatus(status)}>
                                                {config.label}
                                            </Dropdown.Item>
                                        ))}
                                        <Dropdown.Divider />
                                        <Dropdown.Item onClick={() => setShowInactive(!showInactive)}>
                                            {showInactive ? <FaEyeSlash /> : <FaEye />}
                                            {showInactive ? ' Hide' : ' Show'} Inactive/Deleted
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>

                                <Button
                                    size="sm"
                                    onClick={handleClearNotes}
                                    disabled={isClearing}
                                    style={{
                                        background: isClearing ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)',
                                        border: '1px solid rgba(239,68,68,0.4)',
                                        color: '#ffffff',
                                        borderRadius: '20px',
                                        padding: '6px 16px',
                                        fontSize: '0.8rem',
                                        backdropFilter: 'blur(10px)',
                                        transition: 'all 0.2s ease',
                                        opacity: isClearing ? 0.7 : 1
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isClearing) {
                                            e.target.style.background = 'rgba(239,68,68,0.3)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isClearing) {
                                            e.target.style.background = 'rgba(239,68,68,0.2)';
                                        }
                                    }}
                                >
                                    {isClearing ?
                                        <Spinner animation="border" size="sm" style={{ width: '12px', height: '12px' }} />
                                        : <FaEraser size={12} />
                                    }
                                    <span className="ms-1">Clear Notes</span>
                                </Button>
                            </div>
                        </div>
                    </Card.Header>
                )}

                <Card.Body style={{ padding: '0' }}>
                    {/* Enhanced Mobile-Responsive Stats Summary */}
                    {contactData?.contactStats && (
                        <div style={{
                            padding: '20px',
                            background: isDarkMode
                                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
                            borderBottom: `1px solid ${colors.divider}`,
                            backdropFilter: 'blur(10px)'
                        }}>
                            <Row className="g-3">
                                <Col xs={6} lg={3}>
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '16px 12px',
                                        background: colors.cardBg,
                                        borderRadius: '16px',
                                        border: `1px solid ${colors.border}`,
                                        boxShadow: colors.shadow,
                                        transition: 'transform 0.2s ease'
                                    }}
                                        className="stat-card"
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}>
                                        <div style={{
                                            fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                                            fontWeight: '800',
                                            color: colors.accent,
                                            textShadow: isDarkMode ? '0 0 10px rgba(139, 92, 246, 0.3)' : 'none'
                                        }}>
                                            {contactData.contactStats.totalContacts}
                                        </div>
                                        <div style={{
                                            fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                                            color: colors.mutedText,
                                            fontWeight: '500',
                                            marginTop: '4px'
                                        }}>
                                            Total Contacts
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={6} lg={3}>
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '16px 12px',
                                        background: colors.cardBg,
                                        borderRadius: '16px',
                                        border: `1px solid ${colors.border}`,
                                        boxShadow: colors.shadow,
                                        transition: 'transform 0.2s ease'
                                    }}
                                        className="stat-card"
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}>
                                        <div style={{
                                            fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                                            fontWeight: '800',
                                            color: colors.warning,
                                            textShadow: isDarkMode ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none'
                                        }}>
                                            {contactData.contactStats.needsFollowUp || 0}
                                        </div>
                                        <div style={{
                                            fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                                            color: colors.mutedText,
                                            fontWeight: '500',
                                            marginTop: '4px'
                                        }}>
                                            Need Follow-up
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={6} lg={3}>
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '16px 12px',
                                        background: colors.cardBg,
                                        borderRadius: '16px',
                                        border: `1px solid ${colors.border}`,
                                        boxShadow: colors.shadow,
                                        transition: 'transform 0.2s ease'
                                    }}
                                        className="stat-card"
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}>
                                        <div style={{
                                            fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                                            fontWeight: '800',
                                            color: colors.success,
                                            textShadow: isDarkMode ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none'
                                        }}>
                                            {filteredContacts.length}
                                        </div>
                                        <div style={{
                                            fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                                            color: colors.mutedText,
                                            fontWeight: '500',
                                            marginTop: '4px'
                                        }}>
                                            Showing
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={6} lg={3}>
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '16px 12px',
                                        background: colors.cardBg,
                                        borderRadius: '16px',
                                        border: `1px solid ${colors.border}`,
                                        boxShadow: colors.shadow,
                                        transition: 'transform 0.2s ease'
                                    }}
                                        className="stat-card"
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}>
                                        <div style={{
                                            fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                                            fontWeight: '800',
                                            color: colors.info,
                                            textShadow: isDarkMode ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none'
                                        }}>
                                            {contactData.contactStats.lastContactDate ?
                                                formatTimeAgo(contactData.contactStats.lastContactDate) : 'Never'
                                            }
                                        </div>
                                        <div style={{
                                            fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                                            color: colors.mutedText,
                                            fontWeight: '500',
                                            marginTop: '4px'
                                        }}>
                                            Last Contact
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    )}

                    {/* Contact History List */}
                    <div style={{ maxHeight, overflowY: 'auto' }}>
                        {filteredContacts.length === 0 ? (
                            <div style={{
                                padding: '40px 20px',
                                textAlign: 'center',
                                color: colors.mutedText
                            }}>
                                <FaHistory style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }} />
                                <div>No contact history found</div>
                                <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                                    Contact entries will appear here once they are recorded
                                </div>
                            </div>
                        ) : (
                            <div>
                                {filteredContacts.map((contact, index) => (
                                    <div
                                        key={contact._id}
                                        style={{
                                            padding: '16px 20px',
                                            borderBottom: index < filteredContacts.length - 1 ? `1px solid ${colors.border}` : 'none',
                                            backgroundColor: contact.isActive === false ?
                                                (isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)') : 'transparent'
                                        }}
                                    >
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    {renderContactTypeIcon(contact.contactType)}
                                                    <strong style={{ color: colors.text }}>
                                                        {contactTypeConfig[contact.contactType]?.label || 'Other'}
                                                    </strong>
                                                    {renderStatusBadge(contact.status)}
                                                    <span style={{ color: colors.mutedText, fontSize: '0.85rem' }}>
                                                        {format(new Date(contact.contactedAt), 'MMM dd, yyyy - HH:mm')}
                                                    </span>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() => toggleContactExpansion(contact._id)}
                                                        style={{
                                                            color: colors.accent,
                                                            textDecoration: 'none',
                                                            fontSize: '0.75rem',
                                                            padding: '2px 6px'
                                                        }}
                                                    >
                                                        {expandedContact === contact._id ? (
                                                            <>
                                                                <FaEyeSlash size={10} /> Less
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaEye size={10} /> Details
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                {contact.notes && (
                                                    <div style={{
                                                        color: colors.text,
                                                        marginBottom: '12px',
                                                        fontSize: '0.9rem',
                                                        lineHeight: '1.5',
                                                        backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.03)',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)'}`
                                                    }}>
                                                        <strong style={{ color: colors.accent, fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                                                            <FaComments size={12} /> Contact Notes
                                                        </strong>
                                                        {contact.notes}
                                                    </div>
                                                )}

                                                {/* Basic Info - Always Visible */}
                                                <div style={{ marginBottom: '12px' }}>
                                                    <Row className="g-2">
                                                        <Col xs={6}>
                                                            <div style={{
                                                                fontSize: '0.8rem',
                                                                color: colors.mutedText,
                                                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                                padding: '6px 10px',
                                                                borderRadius: '6px'
                                                            }}>
                                                                <strong>Contact By:</strong><br />
                                                                {typeof contact.contactedBy === 'object' && contact.contactedBy?.name
                                                                    ? contact.contactedBy.name
                                                                    : contact.contactedBy || 'System'}
                                                            </div>
                                                        </Col>
                                                        <Col xs={6}>
                                                            <div style={{
                                                                fontSize: '0.8rem',
                                                                color: colors.mutedText,
                                                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                                padding: '6px 10px',
                                                                borderRadius: '6px'
                                                            }}>
                                                                <strong>Time Ago:</strong><br />
                                                                {formatTimeAgo(contact.contactedAt)}
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </div>

                                                {/* Expanded Details */}
                                                {expandedContact === contact._id && (
                                                    <div style={{
                                                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        marginBottom: '12px',
                                                        border: `1px solid ${colors.border}`
                                                    }}>
                                                        <Row className="g-2 mb-3">
                                                            {contact.outcome && (
                                                                <Col md={6}>
                                                                    <div style={{
                                                                        fontSize: '0.85rem',
                                                                        color: colors.text,
                                                                        backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                                                                        padding: '8px 12px',
                                                                        borderRadius: '6px',
                                                                        border: `1px solid rgba(16, 185, 129, 0.2)`
                                                                    }}>
                                                                        <strong style={{ color: colors.success }}>
                                                                            <FaCheckCircle size={12} /> Outcome:
                                                                        </strong><br />
                                                                        {contact.outcome}
                                                                    </div>
                                                                </Col>
                                                            )}

                                                            {contact.followUpDate && (
                                                                <Col md={6}>
                                                                    <div style={{
                                                                        fontSize: '0.85rem',
                                                                        color: colors.text,
                                                                        backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
                                                                        padding: '8px 12px',
                                                                        borderRadius: '6px',
                                                                        border: `1px solid rgba(245, 158, 11, 0.2)`
                                                                    }}>
                                                                        <strong style={{ color: colors.warning }}>
                                                                            <FaCalendarAlt size={12} /> Follow-up:
                                                                        </strong><br />
                                                                        {format(new Date(contact.followUpDate), 'MMM dd, yyyy')}
                                                                    </div>
                                                                </Col>
                                                            )}
                                                        </Row>

                                                        {/* Additional Contact Details */}
                                                        <Row className="g-2">
                                                            <Col md={4}>
                                                                <div style={{
                                                                    fontSize: '0.8rem',
                                                                    color: colors.mutedText,
                                                                    textAlign: 'center',
                                                                    padding: '8px'
                                                                }}>
                                                                    <strong>Contact ID:</strong><br />
                                                                    <code style={{ fontSize: '0.7rem', color: colors.accent }}>
                                                                        {contact._id.slice(-8)}
                                                                    </code>
                                                                </div>
                                                            </Col>
                                                            <Col md={4}>
                                                                <div style={{
                                                                    fontSize: '0.8rem',
                                                                    color: colors.mutedText,
                                                                    textAlign: 'center',
                                                                    padding: '8px'
                                                                }}>
                                                                    <strong>Created:</strong><br />
                                                                    {format(new Date(contact.createdAt || contact.contactedAt), 'MMM dd, HH:mm')}
                                                                </div>
                                                            </Col>
                                                            <Col md={4}>
                                                                <div style={{
                                                                    fontSize: '0.8rem',
                                                                    color: colors.mutedText,
                                                                    textAlign: 'center',
                                                                    padding: '8px'
                                                                }}>
                                                                    <strong>Active:</strong><br />
                                                                    <span style={{
                                                                        color: contact.isActive !== false ? colors.success : colors.danger,
                                                                        fontWeight: 'bold'
                                                                    }}>
                                                                        {contact.isActive !== false ? '✓ Yes' : '✗ No'}
                                                                    </span>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                )}

                                                {/* Clickable Tags */}
                                                {contact.tags && contact.tags.length > 0 && (
                                                    <div className="mt-2">
                                                        <div style={{
                                                            fontSize: '0.75rem',
                                                            color: colors.mutedText,
                                                            marginBottom: '6px',
                                                            fontWeight: '500'
                                                        }}>
                                                            Tags {selectedTagFilter && (
                                                                <span style={{ color: colors.accent }}>
                                                                    (filtered by: {selectedTagFilter})
                                                                </span>
                                                            )}:
                                                        </div>
                                                        {contact.tags.map((tag, tagIndex) => (
                                                            <Button
                                                                key={tagIndex}
                                                                variant="outline-primary"
                                                                size="sm"
                                                                className="me-1 mb-1"
                                                                onClick={() => handleTagClick(tag)}
                                                                style={{
                                                                    fontSize: '0.7rem',
                                                                    padding: '4px 8px',
                                                                    border: `1px solid ${selectedTagFilter === tag ? colors.accent : colors.border}`,
                                                                    backgroundColor: selectedTagFilter === tag
                                                                        ? colors.accent
                                                                        : (isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)'),
                                                                    color: selectedTagFilter === tag
                                                                        ? 'white'
                                                                        : colors.accent,
                                                                    borderRadius: '12px',
                                                                    transition: 'all 0.2s ease',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (selectedTagFilter !== tag) {
                                                                        e.target.style.backgroundColor = isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)';
                                                                        e.target.style.borderColor = colors.accent;
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (selectedTagFilter !== tag) {
                                                                        e.target.style.backgroundColor = isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)';
                                                                        e.target.style.borderColor = colors.border;
                                                                    }
                                                                }}
                                                            >
                                                                <FaTag size={8} /> {tag}
                                                                {selectedTagFilter === tag && (
                                                                    <span style={{ marginLeft: '4px' }}>×</span>
                                                                )}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="d-flex gap-1 ms-3">
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={<Tooltip>Edit Contact</Tooltip>}
                                                >
                                                    <Button
                                                        variant="light"
                                                        size="sm"
                                                        onClick={() => handleEditContact(contact)}
                                                        style={{
                                                            color: colors.accent,
                                                            border: 'none'
                                                        }}
                                                    >
                                                        <FaEdit size={12} />
                                                    </Button>
                                                </OverlayTrigger>

                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={<Tooltip>Delete Contact</Tooltip>}
                                                >
                                                    <Button
                                                        variant="light"
                                                        size="sm"
                                                        onClick={() => handleDeleteContact(contact._id)}
                                                        disabled={isDeleting}
                                                        style={{
                                                            color: colors.danger,
                                                            border: 'none'
                                                        }}
                                                    >
                                                        {isDeleting ? (
                                                            <Spinner animation="border" size="sm" />
                                                        ) : (
                                                            <FaTrash size={12} />
                                                        )}
                                                    </Button>
                                                </OverlayTrigger>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card.Body>
            </Card>

            {/* Edit Contact Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton style={{ backgroundColor: colors.cardHeaderBg }}>
                    <Modal.Title style={{ color: colors.text }}>
                        <FaEdit /> Edit Contact Entry
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: colors.cardBg }}>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: colors.text }}>Contact Type</Form.Label>
                                    <Form.Select
                                        value={formData.contactType}
                                        onChange={(e) => setFormData({ ...formData, contactType: e.target.value })}
                                        style={{
                                            backgroundColor: colors.inputBg,
                                            color: colors.text,
                                            border: `1px solid ${colors.border}`
                                        }}
                                    >
                                        {Object.entries(contactTypeConfig).map(([type, config]) => (
                                            <option key={type} value={type}>{config.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: colors.text }}>Status</Form.Label>
                                    <Form.Select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        style={{
                                            backgroundColor: colors.inputBg,
                                            color: colors.text,
                                            border: `1px solid ${colors.border}`
                                        }}
                                    >
                                        {Object.entries(statusConfig).map(([status, config]) => (
                                            <option key={status} value={status}>{config.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: colors.text }}>Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Add notes about this contact..."
                                style={{
                                    backgroundColor: colors.inputBg,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`
                                }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: colors.text }}>Follow-up Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={formData.followUpDate}
                                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                style={{
                                    backgroundColor: colors.inputBg,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`
                                }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: colors.text }}>Outcome</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.outcome}
                                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                                placeholder="What was the outcome of this contact?"
                                style={{
                                    backgroundColor: colors.inputBg,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`
                                }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: colors.text }}>Tags (comma separated)</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="e.g. urgent, billing, support"
                                style={{
                                    backgroundColor: colors.inputBg,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`
                                }}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: colors.cardHeaderBg }}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                        style={{ color: colors.text }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSaveContact}
                        disabled={isUpdating}
                        style={{
                            backgroundColor: colors.accent,
                            borderColor: colors.accent
                        }}
                    >
                        {isUpdating ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <FaCheckCircle className="me-2" />
                                Update Contact
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ContactHistory; 