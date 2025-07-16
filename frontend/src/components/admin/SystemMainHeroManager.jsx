import React, { useState, useEffect } from 'react';
import { 
    Row, 
    Col, 
    Card, 
    Form, 
    Button, 
    Alert, 
    Badge, 
    Modal,
    Table,
    Accordion,
    Tabs,
    Tab
} from 'react-bootstrap';
import { 
    FaSave, 
    FaEye, 
    FaEyeSlash, 
    FaPlus, 
    FaEdit, 
    FaTrash,
    FaImage,
    FaLink,
    FaToggleOn,
    FaToggleOff,
    FaStar,
    FaCheck,
    FaExternalLinkAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';

import { 
    useGetMainHeroSettingsQuery,
    useUpdateMainHeroSettingsMutation,
    useUpdateHeroTemplateMutation 
} from '../../slices/systemApiSlice';
import { useStaticAppSettings } from '../../hooks/useStaticAppSettings';
import Loader from '../Loader';

const SystemMainHeroManager = ({ liveHeroSettings, onSettingsChange }) => {
    const { colorScheme } = useStaticAppSettings();

    // Safe colorScheme with defaults to prevent null reference errors
    const safeColorScheme = colorScheme || {
        primaryColor: '#4F46E5',
        secondaryColor: '#7C3AED'
    };

    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    // API hooks
    const { 
        data: heroSettings, 
        isLoading: isLoadingSettings, 
        error: settingsError,
        refetch: refetchSettings
    } = useGetMainHeroSettingsQuery();
    
    const [updateHeroSettings] = useUpdateMainHeroSettingsMutation();
    const [updateTemplate] = useUpdateHeroTemplateMutation();

    // Local state
    const [isSaving, setIsSaving] = useState(false);
    const [showTemplateEditor, setShowTemplateEditor] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    // Theme observer
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setIsDarkMode(
                        document.documentElement.getAttribute('data-theme') === 'dark'
                    );
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    // Initialize local settings when data loads
    useEffect(() => {
        if (heroSettings) {
            onSettingsChange(heroSettings);
        }
    }, [heroSettings]);

    const handleSaveSettings = async () => {
        if (!liveHeroSettings) return;

        setIsSaving(true);
        try {
            // Only save the essential settings, don't overwrite templates
            const settingsToSave = {
                enabled: liveHeroSettings.enabled,
                selectedTemplate: liveHeroSettings.selectedTemplate
            };
            
            console.log('Saving main hero settings:', settingsToSave);
            
            await updateHeroSettings(settingsToSave).unwrap();
            toast.success('Main hero settings saved successfully!');
            refetchSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error(error.data?.message || 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTemplateChange = (templateCode) => {
        onSettingsChange(prev => ({
            ...prev,
            selectedTemplate: templateCode
        }));
    };

    const handleToggleEnabled = () => {
        onSettingsChange(prev => ({
            ...prev,
            enabled: !prev.enabled
        }));
    };

    const handleEditTemplate = async (templateCode) => {
        if (liveHeroSettings?.templates?.[templateCode]) {
            const templateToEdit = {
                code: templateCode,
                ...liveHeroSettings.templates[templateCode]
            };
            setEditingTemplate(templateToEdit);
            setShowTemplateEditor(true);
        } else {
            toast.error('Template not found');
        }
    };

    const handleSaveTemplate = async () => {
        if (!editingTemplate) return;

        setIsSaving(true);
        try {
            const { code, ...templateData } = editingTemplate;
            
            // Debug logging
            console.log('=== FRONTEND SAVING TEMPLATE ===');
            console.log('Template Code:', code);
            console.log('Template Data to Save:', JSON.stringify(templateData, null, 2));
            
            const result = await updateTemplate({ templateCode: code, ...templateData }).unwrap();
            
            console.log('Template save result:', result);
            
            toast.success(`${editingTemplate.name} template updated successfully!`);
            setShowTemplateEditor(false);
            setEditingTemplate(null);
            
            // Update local settings immediately with the new template data
            onSettingsChange(prev => ({
                ...prev,
                templates: {
                    ...prev.templates,
                    [code]: result
                }
            }));
            
            // Single refetch after save - RTK Query will handle cache invalidation
            refetchSettings();
            
        } catch (error) {
            console.error('Error saving template:', error);
            console.error('Full error details:', error);
            toast.error(error.data?.message || 'Failed to save template');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTemplateFieldChange = (field, value) => {
        if (field.includes('.')) {
            const parts = field.split('.');
            if (parts.length === 2) {
                const [parent, child] = parts;
                setEditingTemplate(prev => ({
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: value
                    }
                }));
            } else if (parts.length === 3) {
                // Handle nested objects like content.primaryButton.text
                const [parent, child, grandchild] = parts;
                setEditingTemplate(prev => ({
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: {
                            ...prev[parent][child],
                            [grandchild]: value
                        }
                    }
                }));
            }
        } else {
            setEditingTemplate(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleStatChange = (index, field, value) => {
        setEditingTemplate(prev => ({
            ...prev,
            content: {
                ...prev.content,
                stats: prev.content.stats.map((stat, i) => 
                    i === index ? { ...stat, [field]: value } : stat
                )
            }
        }));
    };

    const addStat = () => {
        setEditingTemplate(prev => ({
            ...prev,
            content: {
                ...prev.content,
                stats: [
                    ...prev.content.stats,
                    { label: 'New Stat', value: '0', icon: 'trophy' }
                ]
            }
        }));
    };

    const removeStat = (index) => {
        setEditingTemplate(prev => ({
            ...prev,
            content: {
                ...prev.content,
                stats: prev.content.stats.filter((_, i) => i !== index)
            }
        }));
    };

    // Theme-aware styles
    const cardStyle = {
        background: isDarkMode ? '#121212' : '#ffffff',
        border: `1px solid ${isDarkMode ? '#333' : '#dee2e6'}`,
        color: isDarkMode ? '#FFFFFF' : '#333333',
    };

    const headerStyle = {
        background: isDarkMode ? '#1a1a1a' : '#f8f9fa',
        borderBottom: `1px solid ${isDarkMode ? '#333' : '#dee2e6'}`,
    };

    const formControlStyle = {
        background: isDarkMode ? '#222222' : '#ffffff',
        borderColor: isDarkMode ? '#444444' : '#ced4da',
        color: isDarkMode ? '#ffffff' : '#000000'
    };

    const formLabelStyle = {
        color: isDarkMode ? '#ffffff' : '#000000'
    };

    const modalBodyStyle = {
        maxHeight: '60vh',
        overflowY: 'auto',
        padding: '0 1rem'
    };

    if (isLoadingSettings) {
        return <Loader />;
    }

    if (settingsError) {
        return <Alert variant="danger">Error loading system settings.</Alert>;
    }

    if (!liveHeroSettings) {
        return <Loader />; // Or some placeholder
    }

    return (
        <div className="system-main-hero-manager">
            <Card style={cardStyle}>
                <Card.Header className="d-flex justify-content-between align-items-center" style={headerStyle}>
                            <h5 className="mb-0">
                        <FaStar className="me-2" /> Main Hero Configuration
                            </h5>
                    <div className="d-flex align-items-center">
                                <Button
                            variant={liveHeroSettings.enabled ? 'outline-danger' : 'outline-success'}
                                    size="sm"
                            onClick={handleToggleEnabled}
                            className="me-2 d-flex align-items-center"
                                >
                            {liveHeroSettings.enabled ? <FaToggleOff className="me-1" /> : <FaToggleOn className="me-1" />}
                            {liveHeroSettings.enabled ? 'Disable' : 'Enable'}
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                            className="d-flex align-items-center"
                                >
                                    <FaSave className="me-1" />
                            {isSaving ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body>
                     <Alert variant={liveHeroSettings.enabled ? 'success' : 'warning'} className="d-flex align-items-center">
                        {liveHeroSettings.enabled ? <FaEye className="me-2" /> : <FaEyeSlash className="me-2" />}
                        <div>
                            The Main Hero section is currently <strong>{liveHeroSettings.enabled ? 'ENABLED' : 'DISABLED'}</strong>.
                        </div>
                    </Alert>
                    
                    <h6 className="mt-4">Select Hero Template</h6>
                    <p className="text-muted small">Choose the look and feel of your hero section.</p>

                    <Row xs={1} sm={2} lg={3} className="g-3">
                        {Object.entries(liveHeroSettings.templates || {}).map(([code, template]) => (
                            <Col key={code}>
                                <Card 
                                    className={`template-card h-100 ${liveHeroSettings.selectedTemplate === code ? 'selected' : ''}`}
                                    onClick={() => handleTemplateChange(code)}
                                    style={{
                                        cursor: 'pointer',
                                        background: isDarkMode ? (liveHeroSettings.selectedTemplate === code ? '#2a2a2a' : '#1a1a1a') : (liveHeroSettings.selectedTemplate === code ? '#e9ecef' : '#f8f9fa'),
                                        borderColor: liveHeroSettings.selectedTemplate === code ? safeColorScheme.primaryColor : (isDarkMode ? '#333' : '#dee2e6')
                                    }}
                                >
                                    <Card.Body className="d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <h6 className="fw-bold">{template.name}</h6>
                                            {liveHeroSettings.selectedTemplate === code && (
                                                <Badge pill bg="success" className="d-flex align-items-center">
                                                    <FaCheck className="me-1" /> Active
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-muted small mb-3">{template.description}</p>
                                        <div className="mt-auto">
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                className="w-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditTemplate(code);
                                                }}
                                            >
                                                <FaEdit /> Edit Content
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card.Body>
            </Card>

            {editingTemplate && (
            <Modal 
                show={showTemplateEditor} 
                onHide={() => setShowTemplateEditor(false)}
                    size="xl"
                    dialogClassName={isDarkMode ? 'modal-dark' : ''}
            >
                <Modal.Header closeButton style={cardStyle}>
                    <Modal.Title style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                        Edit Template: {editingTemplate?.name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={cardStyle}>
                    {editingTemplate && (
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={formLabelStyle}>Template Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingTemplate.name}
                                            onChange={(e) => handleTemplateFieldChange('name', e.target.value)}
                                            style={formControlStyle}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={formLabelStyle}>Description</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingTemplate.description}
                                            onChange={(e) => handleTemplateFieldChange('description', e.target.value)}
                                            style={formControlStyle}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <h6 className="mb-3">Content Settings</h6>
                            
                            {editingTemplate.code !== 'corporate-tech' && (
                                <Form.Group className="mb-3">
                                    <Form.Label style={formLabelStyle}>Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editingTemplate.content.title || ''}
                                        onChange={(e) => handleTemplateFieldChange('content.title', e.target.value)}
                                        style={formControlStyle}
                                    />
                                </Form.Group>
                            )}

                            {editingTemplate.code === 'modern-tech' && (
                                <Form.Group className="mb-3">
                                    <Form.Label style={formLabelStyle}>Top Text</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter top text"
                                        value={editingTemplate.content.topText || ''}
                                        onChange={(e) => handleTemplateFieldChange('content.topText', e.target.value)}
                                        style={formControlStyle}
                                    />
                                </Form.Group>
                            )}

                            {editingTemplate.code === 'corporate-tech' && (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={formLabelStyle}>Top Tagline</Form.Label>
                                        <Form.Control type="text" placeholder="Enter top tagline" value={editingTemplate.content.topTagline || ''} onChange={(e) => handleTemplateFieldChange('content.topTagline', e.target.value)} style={formControlStyle} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={formLabelStyle}>Title Line 1</Form.Label>
                                        <Form.Control type="text" placeholder="Enter first line of title" value={editingTemplate.content.titleLine1 || ''} onChange={(e) => handleTemplateFieldChange('content.titleLine1', e.target.value)} style={formControlStyle} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={formLabelStyle}>Title Line 2 (Highlighted)</Form.Label>
                                        <Form.Control type="text" placeholder="Enter highlighted part of title" value={editingTemplate.content.titleLine2Highlighted || ''} onChange={(e) => handleTemplateFieldChange('content.titleLine2Highlighted', e.target.value)} style={formControlStyle} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={formLabelStyle}>Title Line 3</Form.Label>
                                        <Form.Control type="text" placeholder="Enter third line of title" value={editingTemplate.content.titleLine3 || ''} onChange={(e) => handleTemplateFieldChange('content.titleLine3', e.target.value)} style={formControlStyle} />
                                    </Form.Group>
                                </>
                            )}

                            <Form.Group className="mb-3">
                                <Form.Label style={formLabelStyle}>Subtitle</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={editingTemplate.content.subtitle}
                                    onChange={(e) => handleTemplateFieldChange('content.subtitle', e.target.value)}
                                    style={formControlStyle}
                                />
                            </Form.Group>

                            {editingTemplate.code === 'corporate-tech' && (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={formLabelStyle}>Social Proof Stat - Value</Form.Label>
                                        <Form.Control type="text" placeholder="e.g., 40,000+" value={editingTemplate.content.socialProofStat?.value || ''} onChange={(e) => handleTemplateFieldChange('content.socialProofStat.value', e.target.value)} style={formControlStyle} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={formLabelStyle}>Social Proof Stat - Label</Form.Label>
                                        <Form.Control type="text" placeholder="e.g., People use us..." value={editingTemplate.content.socialProofStat?.label || ''} onChange={(e) => handleTemplateFieldChange('content.socialProofStat.label', e.target.value)} style={formControlStyle} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={formLabelStyle}>Social Proof Logos (Comma-separated URLs)</Form.Label>
                                        <Form.Control as="textarea" rows={3} placeholder="Enter image URLs, separated by commas" value={(editingTemplate.content.socialProofLogos || []).join(', ')} onChange={(e) => handleTemplateFieldChange('content.socialProofLogos', e.target.value.split(',').map(url => url.trim()))} style={formControlStyle} />
                                    </Form.Group>
                                </>
                            )}

                            {/* Buttons Section - Handle both old and new structure */}
                            {editingTemplate.code === 'custom' || editingTemplate.code === 'modern-tech' ? (
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label style={formLabelStyle}>Primary Button Text</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={editingTemplate.content.primaryButton?.text}
                                                onChange={(e) => handleTemplateFieldChange('content.primaryButton.text', e.target.value)}
                                                style={formControlStyle}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label style={formLabelStyle}>Primary Button Link</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={editingTemplate.content.primaryButton?.link}
                                                onChange={(e) => handleTemplateFieldChange('content.primaryButton.link', e.target.value)}
                                                style={formControlStyle}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label style={formLabelStyle}>Secondary Button Text</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={editingTemplate.content.secondaryButton?.text}
                                                onChange={(e) => handleTemplateFieldChange('content.secondaryButton.text', e.target.value)}
                                                style={formControlStyle}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label style={formLabelStyle}>Secondary Button Link</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={editingTemplate.content.secondaryButton?.link}
                                                onChange={(e) => handleTemplateFieldChange('content.secondaryButton.link', e.target.value)}
                                                style={formControlStyle}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            ) : editingTemplate.code === 'corporate-tech' ? (
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label style={formLabelStyle}>Button Text</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={editingTemplate.content.primaryButton?.text}
                                                onChange={(e) => handleTemplateFieldChange('content.primaryButton.text', e.target.value)}
                                                style={formControlStyle}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label style={formLabelStyle}>Button Link</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={editingTemplate.content.primaryButton?.link}
                                                onChange={(e) => handleTemplateFieldChange('content.primaryButton.link', e.target.value)}
                                                style={formControlStyle}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            ) : (
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label style={formLabelStyle}>Button Text</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={editingTemplate.content.buttonText}
                                                onChange={(e) => handleTemplateFieldChange('content.buttonText', e.target.value)}
                                                style={formControlStyle}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label style={formLabelStyle}>Button Link</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={editingTemplate.content.buttonLink}
                                                onChange={(e) => handleTemplateFieldChange('content.buttonLink', e.target.value)}
                                                style={formControlStyle}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            )}

                            {editingTemplate.code === 'crypto-hero' && (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tagline</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingTemplate.content.tagline || ''}
                                            onChange={(e) => handleTemplateFieldChange('content.tagline', e.target.value)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Title Line 1</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingTemplate.content.titleLine1 || ''}
                                            onChange={(e) => handleTemplateFieldChange('content.titleLine1', e.target.value)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Title Line 2</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingTemplate.content.titleLine2 || ''}
                                            onChange={(e) => handleTemplateFieldChange('content.titleLine2', e.target.value)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Title Line 3 (Highlighted)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingTemplate.content.titleLine3Highlighted || ''}
                                            onChange={(e) => handleTemplateFieldChange('content.titleLine3Highlighted', e.target.value)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Button Text</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingTemplate.content.buttonText || ''}
                                            onChange={(e) => handleTemplateFieldChange('content.buttonText', e.target.value)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Button Link</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingTemplate.content.buttonLink || ''}
                                            onChange={(e) => handleTemplateFieldChange('content.buttonLink', e.target.value)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Graphic URL</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingTemplate.content.graphicUrl || ''}
                                            onChange={(e) => handleTemplateFieldChange('content.graphicUrl', e.target.value)}
                                        />
                                    </Form.Group>
                                </>
                            )}

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="switch"
                                    id="show-stats-switch"
                                    label="Show Stats"
                                    checked={editingTemplate.content.showStats}
                                    onChange={(e) => handleTemplateFieldChange('content.showStats', e.target.checked)}
                                />
                            </Form.Group>

                            {editingTemplate.content.showStats && (
                                <Accordion>
                                    <Accordion.Item eventKey="0" style={cardStyle}>
                                        <Accordion.Header>Manage Stats</Accordion.Header>
                                        <Accordion.Body>
                                            {editingTemplate.content.stats.map((stat, index) => (
                                                <Row key={index} className="mb-3 align-items-center">
                                                    <Col md={3}>
                                                        <Form.Control type="text" placeholder="Label" value={stat.label} onChange={(e) => handleStatChange(index, 'label', e.target.value)} style={formControlStyle} />
                                                    </Col>
                                                    <Col md={3}>
                                                        <Form.Control type="text" placeholder="Value" value={stat.value} onChange={(e) => handleStatChange(index, 'value', e.target.value)} style={formControlStyle} />
                                                    </Col>
                                                    <Col md={3}>
                                                        <Form.Control type="text" placeholder="Icon (e.g., dumbbell)" value={stat.icon} onChange={(e) => handleStatChange(index, 'icon', e.target.value)} style={formControlStyle} />
                                                    </Col>
                                                    <Col md={3}>
                                                        <Button variant="danger" onClick={() => removeStat(index)}>Remove</Button>
                                                    </Col>
                                                </Row>
                                            ))}
                                            <Button variant="primary" onClick={addStat}>Add Stat</Button>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Accordion>
                            )}
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer style={cardStyle}>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowTemplateEditor(false)}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSaveTemplate}
                        disabled={isSaving}
                    >
                        <FaSave className="me-1" />
                        {isSaving ? 'Saving...' : 'Save Template'}
                    </Button>
                </Modal.Footer>
            </Modal>
            )}
        </div>
    );
};

export default SystemMainHeroManager; 