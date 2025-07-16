import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaCheck, FaTimes, FaImage, FaGlobe, FaPalette, FaRocket } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGetGeneralSettingsQuery, useUpdateGeneralSettingsMutation } from '../../slices/systemApiSlice';
import ImageUploader from './ImageUploader';

const SystemGeneralManager = () => {
    const [formData, setFormData] = useState({
        preserveIconRatio: true,
        pwaIconWithoutBackground: false,
        pwaSplashScreenImage: '',
        ogImage: ''
    });
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    const { 
        data: settings, 
        isLoading: loadingSettings, 
        error: settingsError,
        refetch 
    } = useGetGeneralSettingsQuery();

    const [updateSettings, { isLoading: updatingSettings }] = useUpdateGeneralSettingsMutation();

    // Setup observer to detect theme changes
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

        return () => {
            observer.disconnect();
        };
    }, []);

    // Update form data when settings are loaded
    useEffect(() => {
        if (settings) {
            setFormData({
                preserveIconRatio: settings.preserveIconRatio !== undefined ? settings.preserveIconRatio : true,
                pwaIconWithoutBackground: settings.pwaIconWithoutBackground || false,
                pwaSplashScreenImage: settings.pwaSplashScreenImage || '',
                ogImage: settings.ogImage || ''
            });
        }
    }, [settings]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            console.log('Form data being submitted:', formData);
            await updateSettings(formData).unwrap();
            
            // Force immediate refetch to ensure new data overrides old data
            await refetch();
            
            toast.success('Advanced settings updated successfully!');
        } catch (error) {
            console.error('Failed to update settings:', error);
            toast.error(error?.data?.message || 'Failed to update settings');
        }
    };

    const cardStyle = {
        background: isDarkMode
            ? 'linear-gradient(135deg, #111111 0%, #000000 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        borderColor: isDarkMode ? '#222222' : '#e9ecef',
        boxShadow: isDarkMode
            ? '0 4px 12px rgba(0, 0, 0, 0.4)'
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
    };

    const inputStyle = {
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        borderColor: isDarkMode ? '#333333' : '#ced4da',
        color: isDarkMode ? '#ffffff' : '#212529',
    };

    if (loadingSettings) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status" style={{ color: isDarkMode ? '#9966FF' : '#7952b3' }}>
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-2" style={{ color: isDarkMode ? '#cccccc' : '#6c757d' }}>
                    Loading advanced settings...
                </p>
            </div>
        );
    }

    if (settingsError) {
        return (
            <Alert variant="danger">
                <FaTimes className="me-2" />
                Failed to load advanced settings: {settingsError?.data?.message || 'Unknown error'}
            </Alert>
        );
    }

    return (
        <div>
            <div className="mb-4">
                <h4 className="mb-2" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                    <FaGlobe className="me-2" style={{ color: isDarkMode ? '#9966FF' : '#7952b3' }} />
                    System Settings - Advanced Configuration
                </h4>
                
                {/* INSTANT CONFIG REDIRECT NOTICE */}
                <Alert variant="warning" className="mb-4" style={{ 
                    backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.1)' : '#fff3cd',
                    borderColor: isDarkMode ? 'rgba(255, 193, 7, 0.3)' : '#ffeaa7',
                    color: isDarkMode ? '#ffda6a' : '#856404'
                }}>
                    <div className="d-flex align-items-center">
                        <FaRocket className="me-2" style={{ fontSize: '1.2rem' }} />
                        <div>
                            <strong>⚡ INSTANT UPDATES AVAILABLE!</strong>
                            <p className="mb-2 mt-1">
                                For <strong>instant loading</strong> and <strong>real-time updates</strong> that apply to all users immediately, 
                                use the <strong>Static Config</strong> page instead of this section.
                            </p>
                            <small>
                                <strong>Static Config handles:</strong> Site name, description, keywords, logos, favicons, colors, PWA settings
                                <br/><strong>Benefits:</strong> ⚡ Instant loading • 🔄 Real-time updates • 👥 All users see changes immediately
                            </small>
                        </div>
                    </div>
                </Alert>

                <p className="text-muted mb-2">
                    This section contains legacy settings and advanced configurations that require database updates.
                    Most common branding settings have been moved to Static Config for better performance.
                </p>
            </div>

            <Card style={cardStyle} className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        {/* SECTION: Advanced PWA & Mobile Settings */}
                        <Row>
                            <Col xs={12}>
                                <h5 className="mb-3" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                    <FaImage className="me-2" />
                                    📱 Advanced PWA & Mobile Settings
                                </h5>
                                <p className="text-muted small mb-3">
                                    <strong>Advanced settings that complement the instant Static Config setup.</strong>
                                </p>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529', fontWeight: '500' }}>
                                        <FaImage className="me-2" />
                                        🎯 Preserve Icon Aspect Ratio
                                    </Form.Label>
                                    <Form.Check
                                        type="switch"
                                        id="preserveIconRatio"
                                        name="preserveIconRatio"
                                        checked={formData.preserveIconRatio}
                                        onChange={handleInputChange}
                                        label="Maintain original icon proportions"
                                        style={{ color: isDarkMode ? '#ffffff' : '#212529' }}
                                    />
                                    <Form.Text className="text-muted">
                                        <strong>📍 Effect:</strong> Prevents icon stretching on different screen sizes
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: isDarkMode ? '#ffffff' : '#212529', fontWeight: '500' }}>
                                        <FaImage className="me-2" />
                                        📱 PWA Icon Without Background
                                    </Form.Label>
                                    <Form.Check
                                        type="switch"
                                        id="pwaIconWithoutBackground"
                                        name="pwaIconWithoutBackground"
                                        checked={formData.pwaIconWithoutBackground}
                                        onChange={handleInputChange}
                                        label="Use transparent background for PWA icons"
                                        style={{ color: isDarkMode ? '#ffffff' : '#212529' }}
                                    />
                                    <Form.Text className="text-muted">
                                        <strong>📍 Effect:</strong> Makes PWA home screen icon transparent
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-4">
                                    <ImageUploader
                                        name="pwaSplashScreenImage"
                                        value={formData.pwaSplashScreenImage}
                                        onChange={handleInputChange}
                                        isDarkMode={isDarkMode}
                                        label={
                                            <span>
                                                <FaImage className="me-2" />
                                                🚀 PWA Splash Screen Image (Advanced)
                                            </span>
                                        }
                                        placeholder="Upload PWA splash screen or enter URL"
                                        helpText={
                                            <span>
                                                <strong>📍 Appears:</strong> When users launch your PWA from home screen
                                                <br/><strong>💡 Tip:</strong> Use a vertical image, recommended size 1242x2688px
                                                <br/><strong>🎯 Advanced Feature:</strong> Only needed for premium PWA experience
                                            </span>
                                        }
                                        previewSize={{ width: '100px', height: '180px' }}
                                        maxSizeInMB={3}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr className="my-4" style={{ borderColor: isDarkMode ? '#333' : '#dee2e6' }} />

                        {/* SECTION: Social Media & SEO */}
                        <Row>
                            <Col xs={12}>
                                <h5 className="mb-3" style={{ color: isDarkMode ? '#ffffff' : '#212529' }}>
                                    <FaGlobe className="me-2" />
                                    🌐 Social Media & SEO (Advanced)
                                </h5>
                                <p className="text-muted small mb-3">
                                    <strong>Advanced social sharing and SEO configurations.</strong>
                                </p>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-4">
                                    <ImageUploader
                                        name="ogImage"
                                        value={formData.ogImage}
                                        onChange={handleInputChange}
                                        isDarkMode={isDarkMode}
                                        label={
                                            <span>
                                                <FaGlobe className="me-2" />
                                                📤 Open Graph (Social Share) Image
                                            </span>
                                        }
                                        placeholder="Upload social sharing image or enter URL"
                                        helpText={
                                            <span>
                                                <strong>📍 Appears in:</strong> Facebook, Twitter, LinkedIn, WhatsApp link previews
                                                <br/><strong>💡 Tip:</strong> Use 1200x630px for best results across all platforms
                                                <br/><strong>🎯 Advanced:</strong> Different from favicon - specifically for social sharing
                                            </span>
                                        }
                                        previewSize={{ width: '200px', height: '105px' }}
                                        maxSizeInMB={2}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <small className="text-muted">
                                    <strong>Note:</strong> These are advanced settings. For main branding (site name, logos, colors), 
                                    use the Static Config page for instant updates.
                                </small>
                            </div>
                            <Button
                                type="submit"
                                disabled={updatingSettings}
                                size="lg"
                                style={{
                                    background: isDarkMode 
                                        ? 'linear-gradient(135deg, #9966FF 0%, #7952b3 100%)' 
                                        : 'linear-gradient(135deg, #7952b3 0%, #9966FF 100%)',
                                    border: 'none',
                                    fontWeight: '600',
                                    minWidth: '150px'
                                }}
                            >
                                {updatingSettings ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            className="me-2"
                                        />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FaCheck className="me-2" />
                                        Save Advanced Settings
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default SystemGeneralManager;
